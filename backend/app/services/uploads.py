"""Regras de envio de arquivos: validar, processar, gravar e consultar.

As rotas (api/uploads.py e api/dashboard.py) chamam estas funções. A leitura e a
análise dos dados ficam em pipeline/; o acesso ao banco, em repositories/.

O processamento é atômico: ou o arquivo é gravado inteiro (upload, transações,
rejeições e relatório de qualidade) ou nada é gravado.
"""

import hashlib
from datetime import datetime, timezone
from decimal import Decimal
from pathlib import PurePath
from zoneinfo import ZoneInfo

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models import QualityCheck, Upload, User
from app.pipeline.analise import calcular_analise, linhas_para_gravar, processar_arquivo, quadro_de_transacoes
from app.pipeline.previa import ArquivoInvalido
from app.repositories import uploads as uploads_repo
from app.schemas.uploads import UploadResponse

FUSO_BRASIL = ZoneInfo("America/Sao_Paulo")
FORMATOS_LEGADOS = {
    "nubank_invoice": "fatura_nubank",
    "nubank_statement": "extrato_nubank",
    "gerencia_template": "planilha_modelo",
}


class ArquivoJaEnviado(Exception):
    """O mesmo conteúdo já foi enviado por esta pessoa."""

    def __init__(self, upload: Upload):
        super().__init__("Arquivo já enviado.")
        self.upload = upload

    @property
    def mensagem(self) -> str:
        enviado_em = self.upload.created_at.astimezone(FUSO_BRASIL).strftime("%d/%m/%Y")
        return f"Este arquivo já foi enviado em {enviado_em} ({self.upload.original_filename})."


def _agora() -> datetime:
    return datetime.now(timezone.utc)


def _nome_do_arquivo(nome: str) -> str:
    """Só o nome do arquivo, sem pastas, com no máximo 255 caracteres."""
    limpo = PurePath(nome.replace("\\", "/")).name.strip()
    if not limpo:
        raise ArquivoInvalido("O arquivo está sem nome.")
    return limpo[:255]


def _resumo(upload: Upload, check: QualityCheck | None) -> UploadResponse:
    """Junta o upload e o relatório de qualidade no formato da resposta."""
    detalhes = check.details if check else {}
    totais = check.monetary_totals if check else {}
    # Preserva a leitura dos registros importados antes da integração com a main.
    formato = detalhes.get("formato") or FORMATOS_LEGADOS.get(upload.recognized_format)
    return UploadResponse(
        id=upload.id,
        code=upload.code,
        original_filename=upload.original_filename,
        created_at=upload.created_at,
        formato=formato,
        periodo_inicio=detalhes.get("periodo_inicio") or upload.period_start,
        periodo_fim=detalhes.get("periodo_fim") or upload.period_end,
        linhas_validas=check.valid_rows if check else 0,
        linhas_rejeitadas=check.rejected_rows if check else 0,
        linhas_duplicadas=check.duplicate_rows if check else 0,
        percentual=float(check.quality_percentage) if check and check.quality_percentage is not None else None,
        total_saidas=float(totais.get("saidas", totais.get("outgoing", 0))),
        total_entradas=float(totais.get("entradas", totais.get("income", 0))),
    )


def enviar_arquivo(db: Session, user: User, *, nome: str, conteudo: bytes) -> UploadResponse:
    """Processa e grava um arquivo. Levanta ArquivoInvalido ou ArquivoJaEnviado."""
    nome = _nome_do_arquivo(nome)
    extensao = nome.rsplit(".", 1)[-1].lower() if "." in nome else ""
    if extensao not in ("csv", "xlsx"):
        raise ArquivoInvalido("Formato não aceito. Envie um arquivo CSV ou XLSX.")

    sha256 = hashlib.sha256(conteudo).hexdigest()
    existente = uploads_repo.get_by_sha256(db, user_id=user.id, sha256=sha256)
    if existente:
        raise ArquivoJaEnviado(existente)

    iniciado_em = _agora()
    processado = processar_arquivo(conteudo, nome)
    if processado.transacoes.empty:
        # Nada seria gravado: a resposta explica o motivo da primeira rejeição.
        motivo = processado.rejeitadas[0]["mensagem"] if processado.rejeitadas else "Nenhuma linha válida."
        raise ArquivoInvalido(f"Nenhuma linha do arquivo pôde ser lida. Exemplo: {motivo}")

    transacoes = processado.transacoes
    gastos = transacoes[transacoes["eh_gasto"]]
    qualidade = processado.qualidade
    try:
        upload = uploads_repo.create(
            db,
            user_id=user.id,
            original_filename=nome,
            file_extension=extensao,
            file_size_bytes=len(conteudo),
            sha256=sha256,
            started_at=iniciado_em,
            finished_at=_agora(),
        )
        uploads_repo.add_transactions(
            db,
            user_id=user.id,
            upload_id=upload.id,
            linhas=linhas_para_gravar(transacoes),
            category_ids=uploads_repo.system_category_ids(db),
        )
        uploads_repo.add_rejected_rows(db, user_id=user.id, upload_id=upload.id, rejeitadas=processado.rejeitadas)
        check = uploads_repo.add_quality_check(
            db,
            user_id=user.id,
            upload_id=upload.id,
            total_rows=qualidade["linhas_lidas"],
            valid_rows=qualidade["linhas_validas"],
            rejected_rows=qualidade["linhas_rejeitadas"],
            duplicate_rows=qualidade["linhas_duplicadas"],
            quality_percentage=Decimal(str(qualidade["percentual"])),
            monetary_totals={
                "saidas": str((Decimal(int(gastos["valor_abs"].sum())) / 100).quantize(Decimal("0.01"))),
                "entradas": str((Decimal(int(transacoes.loc[~transacoes["eh_gasto"], "valor_abs"].sum())) / 100).quantize(Decimal("0.01"))),
            },
            details={
                "formato": processado.formato,
                "regra_de_sinais": processado.regra,
                "periodo_inicio": transacoes["data"].min().date().isoformat(),
                "periodo_fim": transacoes["data"].max().date().isoformat(),
            },
        )
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        # Dois envios do mesmo arquivo ao mesmo tempo: o índice único do banco aceitou só o primeiro.
        existente = uploads_repo.get_by_sha256(db, user_id=user.id, sha256=sha256)
        if existente:
            raise ArquivoJaEnviado(existente) from exc
        raise
    except Exception:
        db.rollback()
        raise

    return _resumo(upload, check)


def historico(db: Session, user: User) -> list[UploadResponse]:
    """Todos os arquivos processados da pessoa, do mais recente ao mais antigo."""
    return [_resumo(upload, check) for upload, check in uploads_repo.list_with_quality(db, user_id=user.id)]


def remover(db: Session, user: User, upload_id) -> bool:
    """Remove um arquivo e tudo o que veio dele. Devolve False se não for desta pessoa."""
    upload = uploads_repo.get(db, user_id=user.id, upload_id=upload_id)
    if upload is None:
        return False
    uploads_repo.delete(db, upload)
    db.commit()
    return True


def painel(db: Session, user: User, mes: str | None) -> dict:
    """Análise de todas as transações gravadas da pessoa, ou só de um mês (AAAA-MM)."""
    registros = uploads_repo.transactions_for_analysis(db, user_id=user.id)
    if not registros:
        return {"tem_dados": False, "arquivos": 0}
    analise = calcular_analise(quadro_de_transacoes(registros), mes=mes, incluir_lancamentos=True)
    return {
        "tem_dados": True,
        "arquivos": uploads_repo.count(db, user_id=user.id),
        "mes": mes,
        **analise,
    }
