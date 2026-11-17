"""API de teste em PostgreSQL descartável; nunca usa o DATABASE_URL do .env.

Executar pela raiz. Usa as ferramentas de teste já instaladas. Ctrl+C encerra
a API e o cluster; a rota local de parada permite finalizar o ensaio automatizado.
"""

import os
import sys
import tempfile
from contextlib import contextmanager
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / ".impeccable" / "review"
OUT.mkdir(parents=True, exist_ok=True)
sys.path[:0] = [str(ROOT / "backend"), str(ROOT / "backend/tests")]
from conftest import TestDatabase, install_with_alembic, postgres_cluster


class ReviewPaths:
    def mktemp(self, name):
        return Path(tempfile.mkdtemp(prefix=name + "-", dir=OUT))


with contextmanager(postgres_cluster.__wrapped__)(ReviewPaths()) as cluster:
    cluster.sql("CREATE DATABASE panel_review;")
    database = TestDatabase(cluster.binaries, cluster.port, "panel_review")
    install_with_alembic(database)
    os.environ["DATABASE_URL"] = f"postgresql+psycopg://postgres@127.0.0.1:{cluster.port}/panel_review"
    os.environ["APP_ENV"] = "development"
    os.environ["SESSION_COOKIE_SECURE"] = "false"

    import uvicorn
    from app.api.main import app

    server = uvicorn.Server(uvicorn.Config(app, host="127.0.0.1", port=8011, log_level="warning"))

    @app.get("/api/__review_context")
    def review_context():
        return {"disposable": True, "purpose": "panel-flow", "database": "panel_review"}

    @app.post("/api/__review_stop")
    def review_stop():
        server.should_exit = True
        return {"stopping": True}

    print("API descartável em http://127.0.0.1:8011", flush=True)
    server.run()
