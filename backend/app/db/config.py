"""Endereço do PostgreSQL compartilhado pela API e pelas migrações."""

import os
from pathlib import Path

from dotenv import load_dotenv

PROJECT_ROOT = Path(__file__).resolve().parents[3]


def get_database_url() -> str:
    """Lê o .env sem substituir o ambiente e seleciona o driver psycopg 3."""
    load_dotenv(PROJECT_ROOT / ".env")
    url = os.getenv("DATABASE_URL")
    if not url:
        raise RuntimeError(
            "DATABASE_URL não foi definida. Configure-a no ambiente ou no .env na raiz do projeto."
        )
    for prefix in ("postgres://", "postgresql://"):
        if url.startswith(prefix):
            return "postgresql+psycopg://" + url[len(prefix):]
    return url
