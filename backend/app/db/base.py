"""Classe base dos modelos do SQLAlchemy."""

from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """Base de todos os modelos. Cada modelo descreve uma tabela que o
    Alembic cria e atualiza no PostgreSQL; a API não cria tabelas ao iniciar."""
