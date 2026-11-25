"""Integração da renda mensal (PATCH /api/auth/me) e da rota de IA (/api/ai/spending-profile)."""

from pathlib import Path

import pytest

pytestmark = [pytest.mark.api, pytest.mark.database]

EXEMPLOS_IA = Path(__file__).resolve().parents[2] / "scripts" / "exemplos" / "ia"


def register(client, name):
    response = client.post("/api/auth/register", json={
        "name": f"{name} Teste",
        "email": f"{name.lower()}@test.invalid",
        "password": "senha-de-teste-1",
    })
    assert response.status_code == 201, response.text
    return response.json()


def upload_bytes(client, name, content):
    response = client.post("/api/uploads", params={"nome": name}, content=content)
    assert response.status_code == 201, response.text
    return response.json()


def test_income_and_ai_routes_require_session(auth_client):
    assert auth_client.patch("/api/auth/me", json={"monthly_income": "5000.00"}).status_code == 401
    assert auth_client.get("/api/ai/spending-profile").status_code == 401


def test_user_can_save_validate_and_clear_monthly_income(auth_client):
    client = auth_client
    account = register(client, "Alice")
    assert account["monthly_income"] is None

    assert client.patch("/api/auth/me", json={"monthly_income": "0"}).status_code == 422
    assert client.patch("/api/auth/me", json={"monthly_income": "-500"}).status_code == 422
    assert client.patch("/api/auth/me", json={"monthly_income": "5000.123"}).status_code == 422

    saved = client.patch("/api/auth/me", json={"monthly_income": "5000.00"})
    assert saved.status_code == 200
    assert saved.headers["cache-control"] == "no-store"
    assert saved.json()["monthly_income"] == "5000.00"
    assert client.get("/api/auth/me").json()["monthly_income"] == "5000.00"

    cleared = client.patch("/api/auth/me", json={"monthly_income": None})
    assert cleared.status_code == 200
    assert cleared.json()["monthly_income"] is None


def test_spending_profile_endpoint_learns_profile_detects_anomaly_and_isolates_users(auth_client):
    client = auth_client
    register(client, "Alice")

    # Sem uploads: ainda não há dados para o modelo.
    empty = client.get("/api/ai/spending-profile")
    assert empty.status_code == 200
    assert empty.headers["cache-control"] == "no-store"
    assert empty.json() == {"tem_dados": False}

    # Define a renda de R$ 5.000 e envia os 11 meses normais do estudo fictício.
    assert client.patch("/api/auth/me", json={"monthly_income": "5000.00"}).status_code == 200
    upload_bytes(client, "historico_11_meses.csv", (EXEMPLOS_IA / "historico_11_meses.csv").read_bytes())

    normal = client.get("/api/ai/spending-profile").json()
    assert normal["tem_dados"] is True
    assert normal["suficiente"] is True
    assert normal["meses_analisados"] == 11
    assert normal["renda_mensal"] == 5000.0
    assert normal["anomalias"] == []

    # Envia a 12ª fatura (nov/2026, ~R$ 10.880): a IA aponta a anomalia.
    upload_bytes(client, "fatura_nov_2026_anomala.csv", (EXEMPLOS_IA / "fatura_nov_2026_anomala.csv").read_bytes())

    with_anomaly = client.get("/api/ai/spending-profile").json()
    assert with_anomaly["meses_analisados"] == 12
    assert with_anomaly["confiabilidade"] == "razoavel"
    assert [item["mes"] for item in with_anomaly["anomalias"]] == ["2026-11"]
    assert with_anomaly["perfil"]["meses_no_treino"] == 11
    assert with_anomaly["perfil"]["comprometimento_da_renda"] > 1.0

    # Isolamento: outro usuário não vê o perfil nem a renda de Alice.
    client.cookies.clear()
    bruno = register(client, "Bruno")
    assert bruno["monthly_income"] is None
    assert client.get("/api/ai/spending-profile").json() == {"tem_dados": False}


def test_twelve_jan_to_dec_invoices_with_two_12k_months_detects_both_anomalies(auth_client):
    client = auth_client
    register(client, "Carla")
    assert client.patch("/api/auth/me", json={"monthly_income": "5000.00"}).status_code == 200

    pasta_2026 = EXEMPLOS_IA / "faturas_2026"
    arquivos = sorted(pasta_2026.glob("*.csv"))
    assert len(arquivos) == 12

    for arquivo in arquivos:
        uploaded = upload_bytes(client, arquivo.name, arquivo.read_bytes())
        assert uploaded["linhas_rejeitadas"] == 0
        assert uploaded["percentual"] == 100.0

    profile = client.get("/api/ai/spending-profile").json()
    assert profile["tem_dados"] is True
    assert profile["suficiente"] is True
    assert profile["meses_analisados"] == 12
    assert profile["renda_mensal"] == 5000.0
    assert [item["mes"] for item in profile["anomalias"]] == ["2026-05", "2026-11"]
    assert all(item["total"] == 12000.0 for item in profile["anomalias"])
    assert profile["perfil"]["meses_no_treino"] == 10
