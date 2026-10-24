"""Consultas ao banco sobre usuários."""

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import User


def get_by_email(db: Session, email: str) -> User | None:
    """Procura um usuário pelo e-mail, sem diferenciar maiúsculas de minúsculas."""
    # O índice único do banco é sobre lower(email). Comparamos com a mesma
    # expressão para que "Alice@x.com" e "alice@x.com" sejam o mesmo e-mail.
    statement = select(User).where(func.lower(User.email) == email.lower())
    # scalar devolve o primeiro resultado, ou None se não houver nenhum.
    return db.scalar(statement)


def create(db: Session, *, name: str, email: str, password_hash: str) -> User:
    """Insere um usuário novo. Quem chama decide quando fazer o commit."""
    user = User(name=name, email=email, password_hash=password_hash)
    db.add(user)
    # flush envia o INSERT ao banco sem confirmar a transação. Se o e-mail já
    # existir, o erro do índice único aparece aqui.
    db.flush()
    # refresh relê a linha do banco para trazer os valores que o próprio banco
    # preencheu, como code e created_at.
    db.refresh(user)
    return user
