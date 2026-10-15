from datetime import datetime
from uuid import UUID

from sqlalchemy import select, update
from sqlalchemy.orm import Session

from app.models import SessionRecord, User


def create(db: Session, *, user_id: UUID, token_hash: str, expires_at: datetime) -> SessionRecord:
    record = SessionRecord(user_id=user_id, token_hash=token_hash, expires_at=expires_at)
    db.add(record)
    db.flush()
    return record


def get_active_user(db: Session, *, token_hash: str, now: datetime) -> User | None:
    statement = (
        select(User)
        .join(SessionRecord, SessionRecord.user_id == User.id)
        .where(
            SessionRecord.token_hash == token_hash,
            SessionRecord.revoked_at.is_(None),
            SessionRecord.expires_at > now,
        )
    )
    return db.scalar(statement)


def revoke(db: Session, *, token_hash: str, now: datetime) -> None:
    db.execute(
        update(SessionRecord)
        .where(SessionRecord.token_hash == token_hash, SessionRecord.revoked_at.is_(None))
        .values(revoked_at=now)
    )
