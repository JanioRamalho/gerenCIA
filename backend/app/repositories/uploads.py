"""Consultas ao banco sobre arquivos enviados, transações e relatórios de qualidade.

Toda função recebe o user_id e só enxerga os dados dele. Quem chama decide
quando fazer o commit, para que o arquivo seja gravado inteiro ou não seja
gravado.
"""

from datetime import datetime
from decimal import Decimal
from uuid import UUID

from sqlalchemy import and_, func, select
from sqlalchemy.orm import Session

from app.models import Category, QualityCheck, RejectedRow, Transaction, Upload

def get_by_sha256(db: Session, *, user_id: UUID, sha256: str) -> Upload | None:
    """Procura um arquivo já enviado pelo mesmo usuário com o mesmo conteúdo."""
    statement = select(Upload).where(Upload.user_id == user_id, Upload.sha256 == sha256)
    return db.scalar(statement)


def get(db: Session, *, user_id: UUID, upload_id: UUID) -> Upload | None:
    """Procura um upload do usuário; devolve None se não existir ou for de outra pessoa."""
    statement = select(Upload).where(Upload.id == upload_id, Upload.user_id == user_id)
    return db.scalar(statement)


def create(
    db: Session,
    *,
    user_id: UUID,
    original_filename: str,
    file_extension: str,
    file_size_bytes: int,
    sha256: str,
    started_at: datetime,
    finished_at: datetime,
) -> Upload:
    """Registra o upload já como concluído, porque o processamento é atômico."""
    upload = Upload(
        user_id=user_id,
        original_filename=original_filename,
        file_extension=file_extension,
        file_size_bytes=file_size_bytes,
        sha256=sha256,
        storage_path=None,
        status="completed",
        processing_started_at=started_at,
        processing_finished_at=finished_at,
    )
    db.add(upload)
    db.flush()
    db.refresh(upload)
    return upload


def system_category_ids(db: Session) -> dict[str, UUID]:
    """Mapa nome -> id das categorias iniciais (as globais, sem dono)."""
    statement = select(Category.name, Category.id).where(Category.user_id.is_(None), Category.is_active.is_(True))
    return {name: category_id for name, category_id in db.execute(statement).all()}


def add_transactions(db: Session, *, user_id: UUID, upload_id: UUID, linhas: list[dict], category_ids: dict[str, UUID]) -> None:
    """Grava as transações limpas. `linhas` vem de pipeline.analise.linhas_para_gravar."""
    registros = []
    for linha in linhas:
        category_id = category_ids.get(linha["category_name"])
        registros.append(Transaction(
            user_id=user_id,
            upload_id=upload_id,
            transaction_date=linha["transaction_date"],
            description_raw=linha["description_raw"],
            description_normalized=linha["description_normalized"],
            merchant=linha["merchant"],
            amount=linha["amount"],
            transaction_type=linha["transaction_type"],
            category_id=category_id,
            # Sem a categoria no banco, a transação fica sem categoria, e o motivo é registrado.
            category_source=linha["category_source"] if category_id else "uncategorized",
            installment_current=linha["installment_current"],
            installment_total=linha["installment_total"],
            source_row=linha["source_row"],
            is_duplicate=linha["is_duplicate"],
        ))
    db.add_all(registros)
    db.flush()


def add_rejected_rows(db: Session, *, user_id: UUID, upload_id: UUID, rejeitadas: list[dict]) -> None:
    """Guarda cada linha rejeitada com o motivo; nenhuma linha some em silêncio."""
    db.add_all([
        RejectedRow(
            user_id=user_id,
            upload_id=upload_id,
            source_row=item["linha"],
            raw_data=item["conteudo"],
            error_code=item["codigo"],
            error_message=item["mensagem"],
        )
        for item in rejeitadas
    ])
    db.flush()


def add_quality_check(
    db: Session,
    *,
    user_id: UUID,
    upload_id: UUID,
    total_rows: int,
    valid_rows: int,
    rejected_rows: int,
    duplicate_rows: int,
    quality_percentage: Decimal,
    monetary_totals: dict,
    details: dict,
) -> QualityCheck:
    check = QualityCheck(
        user_id=user_id,
        upload_id=upload_id,
        attempt_number=1,
        total_rows=total_rows,
        valid_rows=valid_rows,
        rejected_rows=rejected_rows,
        duplicate_rows=duplicate_rows,
        quality_percentage=quality_percentage,
        monetary_totals=monetary_totals,
        details=details,
    )
    db.add(check)
    db.flush()
    return check


def list_with_quality(db: Session, *, user_id: UUID) -> list[tuple[Upload, QualityCheck | None]]:
    """Histórico do usuário, do envio mais recente ao mais antigo, com o relatório de qualidade."""
    statement = (
        select(Upload, QualityCheck)
        .outerjoin(QualityCheck, and_(QualityCheck.upload_id == Upload.id, QualityCheck.attempt_number == 1))
        .where(Upload.user_id == user_id)
        .order_by(Upload.created_at.desc())
    )
    return [(upload, check) for upload, check in db.execute(statement).all()]


def get_with_quality(db: Session, *, user_id: UUID, upload_id: UUID) -> tuple[Upload, QualityCheck | None] | None:
    statement = (
        select(Upload, QualityCheck)
        .outerjoin(QualityCheck, and_(QualityCheck.upload_id == Upload.id, QualityCheck.attempt_number == 1))
        .where(Upload.id == upload_id, Upload.user_id == user_id)
    )
    row = db.execute(statement).first()
    return (row[0], row[1]) if row else None


def count(db: Session, *, user_id: UUID) -> int:
    return db.scalar(select(func.count()).select_from(Upload).where(Upload.user_id == user_id)) or 0


def delete(db: Session, upload: Upload) -> None:
    """Remove o upload. O banco apaga em cascata as transações, rejeições e relatórios dele."""
    db.delete(upload)
    db.flush()


def transactions_for_analysis(db: Session, *, user_id: UUID) -> list[dict]:
    """Transações do usuário no formato que pipeline.analise.quadro_de_transacoes espera."""
    statement = (
        select(
            Transaction.transaction_date,
            Transaction.description_raw,
            Transaction.merchant,
            Transaction.amount,
            Transaction.transaction_type,
            Transaction.installment_current,
            Transaction.installment_total,
            Category.name.label("category_name"),
        )
        .outerjoin(Category, Category.id == Transaction.category_id)
        .where(Transaction.user_id == user_id)
    )
    return [
        {
            "data": row.transaction_date,
            "descricao": row.description_raw,
            "estabelecimento": row.merchant or row.description_raw,
            "categoria": row.category_name or "Outros",
            "valor": row.amount,
            "tipo": row.transaction_type,
            "parcela_atual": row.installment_current,
            "parcela_total": row.installment_total,
        }
        for row in db.execute(statement).all()
    ]
