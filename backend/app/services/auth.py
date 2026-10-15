from datetime import datetime, timezone

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core import security
from app.core.config import settings
from app.models import User
from app.repositories import sessions, users


class EmailAlreadyRegistered(Exception):
    pass


class InvalidCredentials(Exception):
    pass


def _now() -> datetime:
    return datetime.now(timezone.utc)


def register(db: Session, *, name: str, email: str, password: str) -> User:
    if users.get_by_email(db, email):
        raise EmailAlreadyRegistered
    try:
        user = users.create(db, name=name, email=email, password_hash=security.hash_password(password))
        db.commit()
    except IntegrityError as exc:
        # Two sign-ups with the same e-mail raced; the unique index decided.
        db.rollback()
        raise EmailAlreadyRegistered from exc
    return user


def authenticate(db: Session, *, email: str, password: str) -> User:
    user = users.get_by_email(db, email)
    # Always verify a hash, so an unknown e-mail costs the same time as a wrong password.
    stored = user.password_hash if user else security.dummy_hash()
    valid = security.verify_password(password, stored)
    if user is None or not valid:
        raise InvalidCredentials
    return user


def open_session(db: Session, user: User) -> str:
    token = security.new_session_token()
    sessions.create(
        db,
        user_id=user.id,
        token_hash=security.hash_session_token(token),
        expires_at=_now() + settings.session_ttl,
    )
    db.commit()
    return token


def user_for_token(db: Session, token: str) -> User | None:
    return sessions.get_active_user(db, token_hash=security.hash_session_token(token), now=_now())


def close_session(db: Session, token: str) -> None:
    sessions.revoke(db, token_hash=security.hash_session_token(token), now=_now())
    db.commit()
