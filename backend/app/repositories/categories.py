"""Consultas ao banco sobre categorias."""

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Category


def list_active_system(db: Session) -> list[Category]:
    """Lista as categorias do sistema que estão ativas, em ordem alfabética."""
    # As categorias do sistema são as que não têm dono (user_id nulo) e valem
    # para todos os usuários. As pessoais têm user_id.
    statement = (
        select(Category)
        .where(Category.user_id.is_(None), Category.is_active.is_(True))
        .order_by(Category.name)
    )
    return list(db.scalars(statement).all())
