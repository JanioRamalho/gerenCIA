"""Contratos HTTP que podem ser verificados sem conexão ao banco."""

from dataclasses import replace

import pytest

from app.pipeline.previa import MAX_BYTES

pytestmark = pytest.mark.api
PREVIA = "/api/analise/previa"
FATURA = b"date,title,amount\n2026-07-01,Netflix.Com,25.00\n"


def test_api_rejeita_email_sem_arroba_e_senha_curta_no_cadastro(api_client):
    response = api_client.post("/api/auth/register", json={
        "name": "Conta Teste", "email": "conta.exemplo.test", "password": "1234567",
    })

    assert response.status_code == 422
    assert response.json()["fields"] == {
        "email": "Informe um e-mail válido, como nome@exemplo.com.",
        "password": "Use pelo menos 8 caracteres.",
    }


def test_previa_retorna_a_analise_de_uma_fatura(api_client):
    response = api_client.post(PREVIA, params={"nome": "fatura.csv"}, content=FATURA)

    assert response.status_code == 200, response.text
    data = response.json()
    assert data["arquivo"] == {"nome": "fatura.csv", "formato": "fatura_nubank"}
    assert data["qualidade"]["linhas_validas"] == 1
    assert data["resumo"]["total_saidas"] == 25.00


def test_previa_recusa_arquivo_invalido(api_client):
    response = api_client.post(PREVIA, params={"nome": "fatura.pdf"}, content=FATURA)

    assert response.status_code == 422
    assert "CSV ou XLSX" in response.json()["detail"]


def test_previa_limita_tamanho_do_arquivo(api_client):
    response = api_client.post(PREVIA, content=b"x" * (MAX_BYTES + 1))

    assert response.status_code == 413
    assert "5 MB" in response.json()["detail"]


def test_previa_fica_indisponivel_em_producao(api_client, monkeypatch):
    from app.api import analysis

    monkeypatch.setattr(analysis, "settings", replace(analysis.settings, app_env="production"))
    response = api_client.post(PREVIA, content=FATURA)

    assert response.status_code == 404
    assert response.json() == {"detail": "Recurso indisponível."}


ID = "00000000-0000-0000-0000-000000000001"


@pytest.mark.parametrize("method, path, payload", [
    ("GET", "/api/dashboard", {}),
    ("GET", "/api/uploads", {}),
    ("POST", "/api/uploads", {"content": FATURA}),
    ("DELETE", f"/api/uploads/{ID}", {}),
    ("GET", "/api/transactions", {}),
    ("GET", "/api/transactions/filters", {}),
    ("PATCH", f"/api/transactions/{ID}/category", {"json": {"category_id": ID}}),
    ("GET", "/api/budgets", {}),
    ("PUT", f"/api/budgets/{ID}", {"json": {"amount": "100.00"}}),
    ("DELETE", f"/api/budgets/{ID}", {}),
    ("GET", "/api/notifications", {}),
    ("POST", "/api/notifications/read", {}),
    ("PATCH", "/api/auth/me", {"json": {"monthly_income": "5000.00"}}),
    ("GET", "/api/ai/spending-profile", {}),
], ids=[
    "painel", "listar-arquivos", "enviar-arquivo", "remover-arquivo",
    "transacoes", "filtros", "corrigir-categoria", "listar-limites",
    "salvar-limite", "remover-limite", "listar-avisos", "ler-avisos",
    "atualizar-renda", "perfil-ia",
])
def test_rotas_financeiras_recusam_requisicoes_sem_sessao(api_client, method, path, payload):
    response = api_client.request(method, path, **payload)

    assert response.status_code == 401, response.text
