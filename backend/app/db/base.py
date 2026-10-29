"""Classe base dos modelos do SQLAlchemy."""

from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """Base de todos os modelos. Cada modelo descreve uma tabela que o
    scripts/init.sql já criou no PostgreSQL; o código não cria tabelas."""
