"""Rotas de saúde: a API diz se está no ar e se consegue falar com o banco."""

from sqlalchemy import create_engine
from sqlalchemy.exc import OperationalError


def test_health_answers_without_the_database(auth_client):
    response = auth_client.get("/api/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_database_health_is_ok_when_the_database_answers(auth_client, auth_database, monkeypatch):
    from app.api import main

    # A rota usa o engine direto, sem o get_db; por isso o engine é trocado aqui.
    engine = create_engine(f"postgresql+psycopg://postgres@127.0.0.1:{auth_database.port}/{auth_database.name}")
    monkeypatch.setattr(main, "engine", engine)
    try:
        response = auth_client.get("/api/health/database")
    finally:
        engine.dispose()

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "database": "connected"}


class UnreachableEngine:
    """Engine de mentira cujo banco nunca responde. Uma conexão de verdade a um
    endereço sem banco demora até o sistema desistir (minutos, no Windows)."""

    def connect(self):
        raise OperationalError("SELECT 1", None, ConnectionRefusedError("banco fora do ar"))


def test_database_health_is_503_when_the_database_is_down(auth_client, monkeypatch):
    from app.api import main

    monkeypatch.setattr(main, "engine", UnreachableEngine())
    response = auth_client.get("/api/health/database")

    assert response.status_code == 503
    assert response.json() == {"detail": "Não foi possível conectar ao banco de dados."}
