from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import User


def get_by_email(db: Session, email: str) -> User | None:
    # The unique index is on lower(email), so match the same expression.
    return db.scalar(select(User).where(func.lower(User.email) == email.lower()))


def create(db: Session, *, name: str, email: str, password_hash: str) -> User:
    user = User(name=name, email=email, password_hash=password_hash)
    db.add(user)
    db.flush()
    db.refresh(user)
    return user
