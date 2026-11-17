"""Percursos reais com banco temporário em head; nenhum DATABASE_URL de uso."""

from uuid import uuid4
from concurrent.futures import ThreadPoolExecutor

import pytest

from conftest import TestDatabase, install_with_alembic


@pytest.fixture(scope="module")
def auth_database(postgres_cluster):
    name = "finance_" + uuid4().hex
    postgres_cluster.sql(f"CREATE DATABASE {name};")
    db = TestDatabase(postgres_cluster.binaries, postgres_cluster.port, name)
    install_with_alembic(db, revision="head")
    return db


def register(client, email="alice@finance.invalid"):
    response = client.post("/api/auth/register", json={"name": "Alice", "email": email, "password": "senha-segura-123"})
    assert response.status_code == 201, response.text
    return response.json()


def send(client, content, name="fatura.csv", document_type=None):
    params = {"nome": name}
    if document_type:
        params["document_type"] = document_type
    return client.post("/api/uploads", params=params, content=content.encode(), headers={"Content-Type": "application/octet-stream"})


def test_filter_precedes_pagination_and_records_after_300_remain_accessible(auth_client):
    register(auth_client)
    lines = [f"2026-10-01,Compra {n},{999 if n == 324 else 1}" for n in range(325)]
    uploaded = send(auth_client, "date,title,amount\n" + "\n".join(lines))
    assert uploaded.status_code == 201, uploaded.text
    page = auth_client.get("/api/transactions", params={"page_size": 25}).json()
    assert page["total"] == 325 and len(page["items"]) == 25
    assert page["aggregates"]["net_spending"] == "1323.00"
    second = auth_client.get("/api/transactions", params={"page": 2}).json()
    assert second["aggregates"] == page["aggregates"]
    assert not {i["id"] for i in page["items"]} & {i["id"] for i in second["items"]}
    found = auth_client.get("/api/transactions", params={"q": "Compra 324"}).json()
    assert found["total"] == 1 and found["items"][0]["amount"] == "999.00"
    assert found["aggregates"]["net_spending"] == "999.00"
    assert auth_client.get("/api/transactions", params={"min_amount": 100, "max_amount": 1}).status_code == 422
    assert auth_client.get("/api/transactions", params={"month": "2026-10", "date_from": "2026-01-01"}).status_code == 422


def test_hash_reuse_bank_duplicates_conflict_and_promotion_are_atomic(auth_client, auth_database):
    register(auth_client)
    csv = "Data,Valor,Identificador,Descrição\n01/10/2026,-100.00,t1,Padaria\n"
    first = send(auth_client, csv, "extrato.csv")
    assert first.status_code == 201, first.text
    reused = send(auth_client, csv, "outro-nome.csv")
    assert reused.status_code == 200 and reused.json()["id"] == first.json()["id"]
    assert reused.json()["reused"] is True
    copy = send(auth_client, csv + "02/10/2026,-20.00,t2,Uber\n", "outubro.csv")
    assert copy.status_code == 201, copy.text
    data = auth_client.get("/api/transactions").json()
    assert data["total"] == 3 and data["aggregates"]["net_spending"] == "120.00"
    assert sum(i["is_duplicate"] for i in data["items"]) == 1
    conflict = send(auth_client, csv.replace("-100.00", "-101.00"), "conflito.csv")
    assert conflict.status_code == 409, conflict.text
    assert auth_database.sql("SELECT count(*) FROM uploads;").stdout.strip() == "2"
    assert auth_client.delete("/api/uploads/" + first.json()["id"]).status_code == 204
    data = auth_client.get("/api/transactions").json()
    assert data["aggregates"]["net_spending"] == "120.00" and not any(i["is_duplicate"] for i in data["items"])


def test_free_comparison_and_category_rule_only_change_selected_item(auth_client):
    register(auth_client)
    uploaded = send(auth_client, "date,title,amount\n2026-08-01,Padaria,100\n2026-08-02,Uber,50\n2026-10-01,Padaria,80\n2026-10-02,Farmacia,30")
    assert uploaded.status_code == 201, uploaded.text
    response = auth_client.get("/api/analytics/summary", params={"month": "2026-10", "reference_month": "2026-08"})
    assert response.status_code == 200, response.text
    comparison = response.json()["comparacao"]
    assert comparison["diferenca"] == "-40.00" and comparison["percentual"] == pytest.approx(-40/150, abs=0.000001)
    assert auth_client.get("/api/analytics/summary", params={"month": "2026-10"}).json()["comparacao"]["mes_referencia"] is None
    assert auth_client.get("/api/analytics/comparison", params={"month": "2026-10", "reference_month": "2026-09"}).status_code == 422
    categories = auth_client.get("/api/categories").json()
    health = next(c["id"] for c in categories if c["name"] == "Saúde")
    rows = auth_client.get("/api/transactions", params={"q": "Padaria", "sort": "date_desc"}).json()["items"]
    result = auth_client.patch(f"/api/transactions/{rows[0]['id']}/category", json={"category_id": health, "save_rule": True})
    assert result.status_code == 200 and result.json()["category_id"] == health
    assert auth_client.get(f"/api/transactions/{rows[1]['id']}").json()["category_id"] != health
    assert send(auth_client, "date,title,amount\n2026-11-01,Padaria,40").status_code == 201
    assert auth_client.get("/api/transactions", params={"month": "2026-11"}).json()["items"][0]["category_source"] == "personal_rule"


def test_limits_threshold_memory_and_account_isolation(auth_client, monkeypatch, auth_database):
    from app.services import budgets
    monkeypatch.setattr(budgets, "current_month", lambda: "2026-10")
    register(auth_client)
    uploaded = send(auth_client, "date,title,amount\n2026-10-01,Padaria,100")
    assert uploaded.status_code == 201, uploaded.text
    row = auth_client.get("/api/transactions").json()["items"][0]
    category = row["category_id"]
    assert auth_client.put(f"/api/budgets/{category}", json={"amount": "100.00"}).status_code == 200
    notes = auth_client.get("/api/notifications").json()
    assert [n["threshold"] for n in notes["items"]] == [80]
    assert auth_client.put(f"/api/budgets/{category}", json={"amount": "90.00"}).status_code == 200
    assert [n["threshold"] for n in auth_client.get("/api/notifications").json()["items"]] == [100, 80]
    assert auth_client.delete(f"/api/budgets/{category}").status_code == 204
    assert auth_client.put(f"/api/budgets/{category}", json={"amount": "80.00"}).status_code == 200
    assert len(auth_client.get("/api/notifications").json()["items"]) == 2
    assert auth_client.post("/api/notifications/read-all").json()["unread_count"] == 0
    first_token = auth_client.cookies.get("gerencia_session")
    auth_client.post("/api/auth/logout")
    register(auth_client, "bruno@finance.invalid")
    assert auth_client.get(f"/api/transactions/{row['id']}").status_code == 404
    assert auth_client.delete("/api/uploads/" + uploaded.json()["id"]).status_code == 404
    assert auth_client.get("/api/notifications").json()["items"] == []
    assert auth_client.delete("/api/auth/me").status_code == 204
    assert auth_client.get("/api/auth/me").status_code == 401
    assert auth_client.get("/api/auth/me", headers={"Cookie": "gerencia_session=" + first_token}).status_code == 401
    assert auth_client.post("/api/auth/login", json={"email": "alice@finance.invalid", "password": "senha-segura-123"}).status_code == 200
    assert auth_client.delete("/api/auth/me").status_code == 204
    assert auth_database.sql("SELECT count(*) FROM users;").stdout.strip() == "0"
    assert auth_database.sql("SELECT count(*) FROM uploads;").stdout.strip() == "0"


def test_quality_rejections_and_suspicions_preserve_data(auth_client):
    register(auth_client)
    uploaded = send(auth_client, "date,title,amount\n2026-10-01,Padaria,10\n2026-10-01,Padaria,10\ninvalid,Erro,12")
    assert uploaded.status_code == 201, uploaded.text
    data = auth_client.get("/api/transactions").json()
    assert data["aggregates"]["net_spending"] == "20.00"
    assert all(i["is_suspected_duplicate"] and not i["is_duplicate"] for i in data["items"])
    detail = auth_client.get("/api/uploads/" + uploaded.json()["id"]).json()
    assert set(detail["dimensoes"]) == {"completude", "validade", "unicidade", "consistencia"}
    assert len(detail["rejeitadas"]) == 1 and detail["rejeitadas"][0]["linha"] == 4
    assert auth_client.get(f"/api/uploads/{uploaded.json()['id']}/rejections.csv").status_code == 200


def test_concurrent_uploads_keep_one_bank_transaction(auth_client):
    register(auth_client)
    first = "Data,Valor,Identificador,Descrição\n01/10/2026,-100.00,shared,Padaria\n"
    # Conteúdos diferentes permitem duas cópias, não dois gastos econômicos.
    second = "Data,Valor,Identificador,Descrição,extra\n01/10/2026,-100.00,shared,Padaria,outra exportação\n"
    with ThreadPoolExecutor(max_workers=2) as pool:
        responses = list(pool.map(lambda content: send(auth_client, content, "extrato.csv"), (first, second)))
    assert [r.status_code for r in responses] == [201, 201]
    data = auth_client.get("/api/transactions").json()
    assert data["total"] == 2 and data["aggregates"]["net_spending"] == "100.00"
    assert sum(i["is_duplicate"] for i in data["items"]) == 1


def test_concurrent_thresholds_and_historical_notifications(auth_client, monkeypatch):
    from app.services import budgets
    monkeypatch.setattr(budgets, "current_month", lambda: "2026-10")
    register(auth_client)
    categories = auth_client.get("/api/categories").json()
    food = next(c["id"] for c in categories if c["name"] == "Alimentação")
    transport = next(c["id"] for c in categories if c["name"] == "Transporte")
    assert auth_client.put(f"/api/budgets/{food}", json={"amount": "100.00"}).status_code == 200
    assert send(auth_client, "date,title,amount\n2026-10-01,Padaria,79").status_code == 201
    assert auth_client.get("/api/notifications").json()["items"] == []
    bodies = ("date,title,amount\n2026-10-02,Padaria,1", "date,title,amount\n2026-10-03,Padaria,21")
    with ThreadPoolExecutor(max_workers=2) as pool:
        responses = list(pool.map(lambda body: send(auth_client, body), bodies))
    assert all(r.status_code == 201 for r in responses)
    notes = auth_client.get("/api/notifications").json()
    assert notes["unread_count"] == 2
    assert [n["threshold"] for n in notes["items"]] == [100, 80]
    assert notes["items"][0]["amount"] == "101.00"
    assert auth_client.post(f"/api/notifications/{notes['items'][0]['id']}/read").json()["unread_count"] == 1
    assert auth_client.delete("/api/uploads/" + responses[1].json()["id"]).status_code == 204
    current = auth_client.get("/api/budgets", params={"month": "2026-10"}).json()
    assert next(b for b in current["items"] if b["category_id"] == food)["spent"] == "80.00"
    # Excluir despesa reduz gasto atual, mas o aviso emitido conserva a evidência histórica.
    assert len(auth_client.get("/api/notifications").json()["items"]) == 2
    assert send(auth_client, "date,title,amount\n2026-09-01,Padaria,500").status_code == 201
    assert len(auth_client.get("/api/notifications").json()["items"]) == 2
    assert auth_client.put(f"/api/budgets/{transport}", json={"amount": "100.00"}).status_code == 200
    assert send(auth_client, "date,title,amount\n2026-10-04,Uber,110").status_code == 201
    transport_notes = [n for n in auth_client.get("/api/notifications").json()["items"] if n["category_id"] == transport]
    assert [n["threshold"] for n in transport_notes] == [100, 80]
    assert auth_client.post("/api/notifications/read-all").json()["unread_count"] == 0


def test_upload_limit_is_four_mb(auth_client):
    from app.pipeline.previa import MAX_BYTES
    register(auth_client)
    response = auth_client.post("/api/uploads?nome=grande.csv", content=b"x"*(MAX_BYTES+1))
    assert response.status_code == 413 and "4 MB" in response.json()["detail"]


def test_uncategorized_filter_and_unknown_historical_totals(auth_client, auth_database):
    register(auth_client)
    uploaded = send(auth_client, "date,title,amount\n2026-10-01,Padaria,10\n2026-10-02,Uber,20")
    assert uploaded.status_code == 201, uploaded.text
    row = auth_client.get("/api/transactions", params={"q": "Padaria"}).json()["items"][0]
    # Representa origem antiga cuja categoria ficou desconhecida, sem imputá-la a Outros global.
    auth_database.sql(f"UPDATE transactions SET category_id=NULL WHERE id='{row['id']}';")
    filtered = auth_client.get("/api/transactions", params={"uncategorized": "true"})
    assert filtered.status_code == 200, filtered.text
    assert filtered.json()["total"] == 1 and filtered.json()["aggregates"]["net_spending"] == "10.00"
    assert filtered.json()["items"][0]["category_id"] is None
    assert auth_client.get("/api/transactions", params={"uncategorized": "true", "category_id": str(uuid4())}).status_code == 422
    auth_database.sql(f"UPDATE quality_checks SET monetary_totals='{{}}'::jsonb, details=details || '{{\"migration_metadata_only\":true}}'::jsonb WHERE upload_id='{uploaded.json()['id']}';")
    historical = auth_client.get("/api/uploads").json()[0]
    assert historical["total_saidas"] is None and historical["total_entradas"] is None
