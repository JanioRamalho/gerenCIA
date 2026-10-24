"""Consultas ao banco sobre sessões de login."""

from datetime import datetime
from uuid import UUID

from sqlalchemy import select, update
from sqlalchemy.orm import Session

from app.models import SessionRecord, User


def create(db: Session, *, user_id: UUID, token_hash: str, expires_at: datetime) -> SessionRecord:
    """Insere uma sessão nova. Quem chama decide quando fazer o commit."""
    record = SessionRecord(user_id=user_id, token_hash=token_hash, expires_at=expires_at)
    db.add(record)
    db.flush()
    return record


def get_active_user(db: Session, *, token_hash: str, now: datetime) -> User | None:
    """Devolve o usuário de uma sessão ativa, ou None.

    Ativa quer dizer: o hash do token confere, a sessão não foi revogada
    (revoked_at vazio) e a validade ainda não passou.
    """
    # O join junta as tabelas users e sessions para achar o dono da sessão.
    statement = (
        select(User)
        .join(SessionRecord, SessionRecord.user_id == User.id)
        .where(
            SessionRecord.token_hash == token_hash,
            SessionRecord.revoked_at.is_(None),  # is_(None) vira "IS NULL" no SQL
            SessionRecord.expires_at > now,
        )
    )
    return db.scalar(statement)


def revoke(db: Session, *, token_hash: str, now: datetime) -> None:
    """Marca a sessão como revogada, gravando a data atual em revoked_at."""
    # Equivale a:
    # UPDATE sessions SET revoked_at = now
    # WHERE token_hash = ... AND revoked_at IS NULL
    statement = (
        update(SessionRecord)
        .where(
            SessionRecord.token_hash == token_hash,
            SessionRecord.revoked_at.is_(None),
        )
        .values(revoked_at=now)
    )
    db.execute(statement)
