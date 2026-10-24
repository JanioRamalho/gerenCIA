"""Entrypoint da Vercel: expõe a aplicação FastAPI definida em app/api/main.py."""

from app.api.main import app

__all__ = ["app"]
