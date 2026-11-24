"""Verifica o processo Uvicorn e a API por HTTP em uma porta local."""

import os
import socket
import subprocess
import sys
import time
from contextlib import contextmanager

import httpx2
import pytest

from conftest import PROJECT_ROOT

pytestmark = [pytest.mark.api, pytest.mark.server]


@contextmanager
def servidor(tmp_path, database_url):
    with socket.socket() as reservation:
        reservation.bind(("127.0.0.1", 0))
        port = reservation.getsockname()[1]

    env = {
        **os.environ,
        "PYTHON_DOTENV_DISABLED": "1",
        "DATABASE_URL": database_url,
        "APP_ENV": "test",
        "SESSION_COOKIE_SECURE": "false",
        "SESSION_TTL_DAYS": "14",
    }
    args = [
        sys.executable, "-m", "uvicorn", "main:app", "--app-dir", "backend",
        "--host", "127.0.0.1", "--port", str(port),
    ]
    log_path = tmp_path / "uvicorn.log"
    with log_path.open("wb") as log:
        process = subprocess.Popen(
            args, cwd=PROJECT_ROOT, env=env, stdout=log, stderr=subprocess.STDOUT,
            creationflags=subprocess.CREATE_NO_WINDOW if os.name == "nt" else 0,
        )
        try:
            with httpx2.Client(base_url=f"http://127.0.0.1:{port}", timeout=5, trust_env=False) as client:
                deadline = time.monotonic() + 20
                while process.poll() is None and time.monotonic() < deadline:
                    try:
                        client.get("/api/health", timeout=1)
                        break
                    except httpx2.TransportError:
                        pass
                    time.sleep(0.1)
                else:
                    pytest.fail(f"O Uvicorn não respondeu em /api/health.\n{log_path.read_text(errors='replace')}")
                yield client
        finally:
            if process.poll() is None:
                process.terminate()
                try:
                    process.wait(timeout=5)
                except subprocess.TimeoutExpired:
                    process.kill()
                    process.wait(timeout=5)


def test_saude_do_servidor_retorna_ok(tmp_path):
    url = "postgresql+psycopg://unused@127.0.0.1:1/unused"
    with servidor(tmp_path, url) as client:
        response = client.get("/api/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


@pytest.mark.database
def test_servidor_inicia_e_atende_api_com_postgresql(tmp_path, auth_database):
    url = f"postgresql+psycopg://postgres@127.0.0.1:{auth_database.port}/{auth_database.name}"
    with servidor(tmp_path, url) as client:
        database_health = client.get("/api/health/database")
        assert database_health.status_code == 200, database_health.text
        assert database_health.json() == {"status": "ok", "database": "connected"}

        account = client.post("/api/auth/register", json={
            "name": "Conta Local", "email": "local@test.invalid", "password": "senha-de-teste-1",
        })
        assert account.status_code == 201, account.text
        assert client.get("/api/auth/me").json()["id"] == account.json()["id"]
        assert auth_database.sql("SELECT email FROM users;").stdout.strip() == "local@test.invalid"


def test_servidor_informa_indisponibilidade_do_postgresql(tmp_path):
    with socket.socket() as unavailable:
        unavailable.bind(("127.0.0.1", 0))
        port = unavailable.getsockname()[1]
        url = f"postgresql+psycopg://unused@127.0.0.1:{port}/unused?connect_timeout=2"
        with servidor(tmp_path, url) as client:
            assert client.get("/api/health").status_code == 200
            health = client.get("/api/health/database")

    assert health.status_code == 503, health.text
    assert health.json() == {"detail": "Não foi possível conectar ao banco de dados."}
