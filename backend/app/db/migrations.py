"""Entrada programática do Alembic para testes e adoção de bancos existentes."""
from pathlib import Path
import os
from alembic.config import Config

from app.core.config import settings

ROOT = Path(__file__).resolve().parents[3]


def migration_database_url(url=None):
    """Migrações podem usar o dono do banco sem ampliar o acesso da API."""
    url = url or os.getenv("MIGRATION_DATABASE_URL") or settings.database_url
    if not url:
        raise RuntimeError("Defina MIGRATION_DATABASE_URL ou DATABASE_URL no .env.")
    for prefix in ("postgres://", "postgresql://"):
        if url.startswith(prefix):
            return "postgresql+psycopg://" + url[len(prefix):]
    return url


def migration_config(*, connection=None, url=None):
    config = Config(str(ROOT / "alembic.ini"))
    if connection is not None:
        config.attributes["connection"] = connection
    if url is not None:
        config.attributes["database_url"] = url
    return config
