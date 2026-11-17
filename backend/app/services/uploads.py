"""Regras de envio de arquivos: validar, processar, gravar e consultar.

As rotas (api/uploads.py e api/dashboard.py) chamam estas funções. A leitura e a
análise dos dados ficam em pipeline/; o acesso ao banco, em repositories/.

O processamento é atômico: ou o arquivo é gravado inteiro (upload, transações,
rejeições e relatório de qualidade) ou nada é gravado.
"""

import hashlib
from decimal import Decimal
from pathlib import PurePath

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models import QualityCheck, Upload, User
from app.pipeline.analise import calcular_analise, linhas_para_gravar, processar_arquivo, quadro_de_transacoes
from app.pipeline.previa import ArquivoInvalido
from app.pipeline.duplicatas import ConflitoDuplicata, decidir_duplicatas
from app.repositories import uploads as uploads_repo, users
from app.schemas.uploads import UploadResponse

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
    return UploadResponse(
        id=upload.id,
        code=upload.code,
        original_filename=upload.original_filename,
        created_at=upload.created_at,
        formato=detalhes.get("formato"),
        periodo_inicio=detalhes.get("periodo_inicio"),
        periodo_fim=detalhes.get("periodo_fim"),
        linhas_validas=check.valid_rows if check else 0,
        linhas_rejeitadas=check.rejected_rows if check else 0,
        linhas_duplicadas=check.duplicate_rows if check else 0,
        percentual=float(check.quality_percentage) if check and check.quality_percentage is not None else None,
        total_saidas=float(totais["saidas"]) if "saidas" in totais else None,
        total_entradas=float(totais["entradas"]) if "entradas" in totais else None,
        document_type=upload.document_type,
    )


def enviar_arquivo(db: Session, user: User, *, nome: str, conteudo: bytes, document_type: str | None = None) -> UploadResponse:
    """Processa atomicamente, reutilizando o envio quando o hash já existe."""
    nome = _nome_do_arquivo(nome)
    extensao = nome.rsplit(".", 1)[-1].lower() if "." in nome else ""
    if extensao not in ("csv", "xlsx"):
        raise ArquivoInvalido("Formato não aceito. Envie um arquivo CSV ou XLSX.")

    sha256 = hashlib.sha256(conteudo).hexdigest()
    users.lock(db, user.id)
    existente = uploads_repo.get_by_sha256(db, user_id=user.id, sha256=sha256)
    if existente:
        _, check = uploads_repo.get_with_quality(db, user_id=user.id, upload_id=existente.id)
        return _resumo(existente, check).model_copy(update={"reused": True})

    processado = processar_arquivo(conteudo, nome, document_type=document_type)
    if processado.transacoes.empty:
        # Nada seria gravado: a resposta explica o motivo da primeira rejeição.
        motivo = processado.rejeitadas[0]["mensagem"] if processado.rejeitadas else "Nenhuma linha válida."
        raise ArquivoInvalido(f"Nenhuma linha do arquivo pôde ser lida. Exemplo: {motivo}")

    transacoes = processado.transacoes
    qualidade = processado.qualidade
    if qualidade["linhas_lidas"] != qualidade["linhas_validas"] + qualidade["linhas_rejeitadas"]:
        raise ArquivoInvalido("As contagens do arquivo não conciliam; nenhum dado foi salvo.")
    tipo = processado.document_type
    try:
        upload = uploads_repo.create(
            db,
            user_id=user.id,
            original_filename=nome,
            file_extension=extensao,
            file_size_bytes=len(conteudo),
            sha256=sha256,
            source_format=processado.formato,
            document_type=tipo,
            period_start=transacoes["data"].min().date(),
            period_end=transacoes["data"].max().date(),
        )
        uploads_repo.add_transactions(
            db,
            user_id=user.id,
            upload_id=upload.id,
            linhas=linhas_para_gravar(transacoes),
            category_ids=uploads_repo.system_category_ids(db),
        )
        uploads_repo.add_rejected_rows(db, user_id=user.id, upload_id=upload.id, rejeitadas=processado.rejeitadas)
        reavaliar_duplicatas(db, user)
        from app.pipeline.analise import calcular_analytics
        registros = [r for r in uploads_repo.transactions_for_analysis(db, user_id=user.id) if r["upload_id"] == str(upload.id)]
        calculado = calcular_analytics(quadro_de_transacoes(registros), mes="all")
        resumo = calculado.get("resumo") or {}
        if sum((Decimal(c["total"]) for c in calculado["por_categoria"]), Decimal("0")) != Decimal(resumo["total_saidas"]):
            raise ArquivoInvalido("Os totais por categoria não conciliam; nenhum dado foi salvo.")
        dimensoes = processado.dimensoes
        duplicates = sum(r["is_duplicate"] for r in registros)
        dimensoes["unicidade"] = dict(quantidade=duplicates, total=len(registros),
            percentual=round((len(registros)-duplicates)/len(registros)*100, 1), motivo=None,
            suspeitas=sum(r["is_suspected_duplicate"] for r in registros),
            contexto="Duplicatas confirmadas por identificador; suspeitas permanecem contabilizadas.")
        dimensoes["consistencia"] = {**dimensoes["consistencia"], "linhas_reconciliadas": True,
            "categorias_reconciliadas": True}
        check = uploads_repo.add_quality_check(
            db,
            user_id=user.id,
            upload_id=upload.id,
            total_rows=qualidade["linhas_lidas"],
            valid_rows=qualidade["linhas_validas"],
            rejected_rows=qualidade["linhas_rejeitadas"],
            duplicate_rows=sum(r["is_duplicate"] for r in registros),
            quality_percentage=Decimal(str(qualidade["percentual"])),
            monetary_totals={
                "saidas": resumo["total_saidas"],
                "entradas": resumo["total_entradas"],
                "pagamentos": resumo["total_pagamentos"],
            },
            details={
                "formato": processado.formato,
                "regra_de_sinais": processado.regra,
                "periodo_inicio": transacoes["data"].min().date().isoformat(),
                "periodo_fim": transacoes["data"].max().date().isoformat(),
                "dimensoes": dimensoes,
            },
        )
        from app.services.budgets import evaluate
        evaluate(db, user)
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        # Dois envios do mesmo arquivo ao mesmo tempo: o índice único do banco aceitou só o primeiro.
        existente = uploads_repo.get_by_sha256(db, user_id=user.id, sha256=sha256)
        if existente:
            _, check = uploads_repo.get_with_quality(db, user_id=user.id, upload_id=existente.id)
            return _resumo(existente, check).model_copy(update={"reused": True})
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
    users.lock(db, user.id)
    upload = uploads_repo.get(db, user_id=user.id, upload_id=upload_id)
    if upload is None:
        return False
    uploads_repo.delete(db, upload)
    reavaliar_duplicatas(db, user)
    from app.services.budgets import evaluate
    evaluate(db, user)
    db.commit()
    return True


def reavaliar_duplicatas(db, user):
    registros = uploads_repo.transactions_for_analysis(db, user_id=user.id)
    uploads_repo.set_duplicate_flags(db, user.id, decidir_duplicatas(registros))


def detalhe(db, user, upload_id):
    row = uploads_repo.get_with_quality(db, user_id=user.id, upload_id=upload_id)
    if row is None:
        return None
    upload, check = row
    rejected = uploads_repo.rejected_rows(db, user.id, upload_id)
    return {"arquivo": _resumo(upload, check).model_dump(mode="json"),
        "dimensoes": check.details.get("dimensoes") if check else None,
        "totais": check.monetary_totals if check else None,
        "rejeitadas": [{"linha": r.source_row, "codigo": r.error_code,
            "mensagem": r.error_message, "conteudo": r.raw_data} for r in rejected]}


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
