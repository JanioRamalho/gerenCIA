"""Integração de arquivos, transações, qualidade e histórico com PostgreSQL."""

import pytest
from sqlalchemy.exc import IntegrityError

from app.pipeline.previa import MAX_BYTES
from app.repositories import uploads as uploads_repo

pytestmark = [pytest.mark.api, pytest.mark.database]
FATURA = b"date,title,amount\n2026-07-01,Netflix.Com,25.00\n2026-02-31,Uber,10.00\n"


@pytest.fixture
def client(auth_client):
    response = auth_client.post("/api/auth/register", json={
        "name": "Alice Teste", "email": "alice@test.invalid", "password": "senha-de-teste-1",
    })
    assert response.status_code == 201, response.text
    return auth_client


def test_importacao_grava_qualidade_e_transacoes_e_alimenta_painel(client, auth_database):
    response = client.post("/api/uploads", params={"nome": "julho.csv"}, content=FATURA)

    assert response.status_code == 201, response.text
    item = response.json()
    assert item["original_filename"] == "julho.csv"
    assert item["linhas_validas"] == item["linhas_rejeitadas"] == 1
    assert item["percentual"] == 50.0
    assert item["total_saidas"] == 25.00
    assert auth_database.sql("SELECT error_code FROM rejected_rows;").stdout.strip() == "invalid_date"
    assert client.get("/api/uploads").json() == [item]
    assert client.get("/api/transactions", params={"arquivo": item["id"]}).json()["total"] == 1
    dashboard = client.get("/api/dashboard", params={"mes": "2026-07"})
    assert dashboard.status_code == 200, dashboard.text
    assert dashboard.json()["resumo"]["total_saidas"] == 25.00
    assert dashboard.json()["por_categoria"][0]["categoria"] == "Assinaturas"


def test_reenvio_com_outro_nome_recusa_o_mesmo_conteudo(client):
    first = client.post("/api/uploads", params={"nome": "julho.csv"}, content=FATURA)
    assert first.status_code == 201, first.text

    duplicate = client.post("/api/uploads", params={"nome": "copia.csv"}, content=FATURA)

    assert duplicate.status_code == 409
    assert "julho.csv" in duplicate.json()["detail"]
    assert client.get("/api/uploads").json() == [first.json()]
    assert client.get("/api/transactions").json()["total"] == 1


@pytest.mark.parametrize("filename, content, status, message", [
    ("julho.pdf", FATURA, 422, "CSV ou XLSX"),
    ("julho.csv", b"date,title,amount\n2026-02-31,Uber,10.00", 422, "Nenhuma linha do arquivo pôde ser lida"),
    ("julho.csv", b"x" * (MAX_BYTES + 1), 413, "5 MB"),
], ids=["extensao-invalida", "todas-as-linhas-invalidas", "arquivo-grande"])
def test_importacao_recusa_arquivo_e_preserva_historico(client, filename, content, status, message):
    response = client.post("/api/uploads", params={"nome": filename}, content=content)

    assert response.status_code == status
    assert message in response.json()["detail"]
    assert client.get("/api/uploads").json() == []
    assert client.get("/api/transactions").json()["total"] == 0


def test_falha_ao_gravar_qualidade_desfaz_o_upload_inteiro(client, auth_database, monkeypatch):
    gravar_qualidade = uploads_repo.add_quality_check

    def gravar_contagem_inconsistente(db, **dados):
        dados["total_rows"] += 1
        return gravar_qualidade(db, **dados)

    monkeypatch.setattr(uploads_repo, "add_quality_check", gravar_contagem_inconsistente)

    with pytest.raises(IntegrityError) as erro:
        client.post("/api/uploads", params={"nome": "julho.csv"}, content=FATURA)

    assert erro.value.orig.diag.constraint_name == "quality_checks_rows_reconcile"
    assert client.get("/api/uploads").json() == []
    assert client.get("/api/transactions").json()["total"] == 0
    assert auth_database.sql("SELECT count(*) FROM rejected_rows;").stdout.strip() == "0"


def test_historico_e_remocao_respeitam_o_dono_do_arquivo(client):
    upload = client.post("/api/uploads", params={"nome": "julho.csv"}, content=FATURA)
    assert upload.status_code == 201, upload.text
    path = f"/api/uploads/{upload.json()['id']}"

    other = client.post("/api/auth/register", json={
        "name": "Bruno Teste", "email": "bruno@test.invalid", "password": "senha-de-teste-2",
    })
    assert other.status_code == 201, other.text
    assert client.get("/api/uploads").json() == []
    assert client.get("/api/dashboard").json() == {"tem_dados": False, "arquivos": 0}
    assert client.delete(path).status_code == 404

    login = client.post("/api/auth/login", json={"email": "alice@test.invalid", "password": "senha-de-teste-1"})
    assert login.status_code == 200, login.text
    assert client.get("/api/uploads").json() == [upload.json()]
    assert client.delete(path).status_code == 204
    assert client.get("/api/uploads").json() == []
    assert client.get("/api/transactions").json()["total"] == 0
    assert client.get("/api/dashboard").json() == {"tem_dados": False, "arquivos": 0}
