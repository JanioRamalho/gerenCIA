"""Formato das categorias que a API devolve."""

from uuid import UUID

from pydantic import BaseModel, ConfigDict


class CategoryResponse(BaseModel):
    """Uma categoria como a API devolve: sem o dono, que não interessa ao frontend."""

    # from_attributes=True monta a resposta direto do modelo Category do SQLAlchemy.
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    code: int
    name: str
    color: str | None
    is_active: bool
