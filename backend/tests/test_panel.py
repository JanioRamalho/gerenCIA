"""Authenticated transaction review, monthly limits, and notifications."""

from datetime import date

from app.services import budgets


def register(client, name):
    response = client.post("/api/auth/register", json={
        "name": name, "email": f"{name.lower()}@test.invalid", "password": "senha-de-teste-1",
    })
    assert response.status_code == 201, response.text


def upload(client, name, rows):
    response = client.post("/api/uploads", params={"nome": name}, content=f"date,title,amount\n{rows}".encode("utf-8"))
    assert response.status_code == 201, response.text
    return response.json()


def test_transactions_filters_and_category_rules(auth_client):
    client = auth_client
    assert client.get("/api/transactions").status_code == 401
    register(client, "Alice")
    source = upload(client, "jul.csv", "2026-07-02,Café da Praça,55.90\n2026-07-04,Spotify,21.90\n")
    query = {"q": "cafe da praca", "mes": "2026-07", "arquivo": source["id"], "minimo": "50", "ordem": "highest"}
    response = client.get("/api/transactions", params=query)
    assert response.status_code == 200, response.text
    assert response.headers["cache-control"] == "no-store"
    entries = response.json()
    assert entries["total"] == 1
    item = entries["items"][0]
    assert (item["file"], item["amount"]) == ("jul.csv", "55.90")

    for month in ("2026-08", "2026-09"):
        upload(client, month + ".csv", "".join(f"{month}-01,Compra {i},{i}.00\n" for i in range(1, 15)))
    assert client.get("/api/transactions").json()["pages"] == 2
    page_two = client.get("/api/transactions", params={"ordem": "lowest", "pagina": 2}).json()
    assert page_two["total"] == 30 and len(page_two["items"]) == 5
    assert page_two["items"][-1]["id"] == item["id"]

    filters = client.get("/api/transactions/filters").json()
    assert filters["months"] == ["2026-09", "2026-08", "2026-07"]
    category = next(value for value in filters["categories"] if value["name"] == "Alimentação")
    path = f"/api/transactions/{item['id']}/category"
    payload = {"category_id": category["id"], "remember_merchant": True}
    assert client.patch(path, json=payload).status_code == 204
    upload(client, "out.csv", "2026-10-02,Café da Praça,40.90\n")
    entries = client.get("/api/transactions", params={"categoria": "Alimentação"}).json()
    assert entries["total"] == 2

    register(client, "Bruno")
    assert client.get("/api/transactions", params=query).json()["total"] == 0
    assert client.patch(path, json=payload).status_code == 404


def test_budgets_use_net_spending_and_notify_once(auth_client, monkeypatch):
    client = auth_client
    monkeypatch.setattr(budgets, "current_month", lambda: date(2026, 11, 1))
    assert client.get("/api/budgets").status_code == 401
    assert client.get("/api/notifications").status_code == 401
    register(client, "Alice")
    category = next(item for item in client.get("/api/budgets").json()["categories"] if item["name"] == "Assinaturas")
    budget_path = f"/api/budgets/{category['id']}"
    assert client.put(budget_path, json={"amount": "0"}).status_code == 422
    assert client.put(budget_path, json={"amount": "100.001"}).status_code == 422
    assert client.put(budget_path, json={"amount": "100.00"}).status_code == 204

    upload(client, "out.csv", "2026-10-01,Netflix.Com,120.00\n")
    assert client.get("/api/notifications").json()["unread"] == 0
    upload(client, "nov.csv", "2026-11-01,Netflix.Com,90.00\n2026-11-01,Netflix.Com,90.00\n2026-11-02,Estorno Netflix.Com,-10.00\n")
    current = client.get("/api/budgets").json()
    current_category = next(item for item in current["categories"] if item["id"] == category["id"])
    assert (current_category["spent"], current_category["remaining"], current_category["status"]) == ("80.00", "20.00", "near")
    read_path = "/api/notifications/read"
    notices = client.get("/api/notifications").json()
    assert notices["unread"] == 1 and notices["items"][0]["threshold"] == 80
    assert client.post(read_path, params={"notification_id": notices["items"][0]["id"]}).status_code == 204
    upload(client, "nov2.csv", "2026-11-03,Netflix.Com,20.00\n")
    assert client.get("/api/notifications").json()["unread"] == 0
    latest = upload(client, "nov3.csv", "2026-11-04,Netflix.Com,1.00\n")
    notices = client.get("/api/notifications").json()
    assert notices["unread"] == 1 and {item["threshold"] for item in notices["items"]} == {80, 100}
    assert client.post(read_path).status_code == 204
    assert client.delete(f"/api/uploads/{latest['id']}").status_code == 204

    def for_month(month):
        view = client.get("/api/budgets", params={"mes": month}).json()
        return next(item for item in view["categories"] if item["id"] == category["id"])

    october = {"mes": "2026-10"}
    assert for_month(october["mes"])["status"] == "unset"
    assert client.put(budget_path, params=october, json={"amount": "110.00"}).status_code == 204
    past = for_month(october["mes"])
    assert (past["status"], past["remaining"]) == ("over", "-10.00")
    assert for_month("2026-11")["amount"] == "100.00"
    assert client.delete(budget_path, params=october).status_code == 204
    assert for_month(october["mes"])["status"] == "unset"
    assert for_month("2026-11")["amount"] == "100.00"

    assert client.delete(budget_path).status_code == 204
    assert client.put(budget_path, json={"amount": "75.00"}).status_code == 204
    assert client.get("/api/notifications").json()["unread"] == 0

    register(client, "Bruno")
    own_category = next(item for item in client.get("/api/budgets").json()["categories"] if item["id"] == category["id"])
    assert own_category["amount"] is None and own_category["spent"] == "0.00"
    assert client.get("/api/notifications").json() == {"unread": 0, "items": []}


def test_dashboard_colors_follow_categories_in_every_month(auth_client):
    client = auth_client
    register(client, "Alice")
    upload(client, "faturas.csv", "2026-06-01,Netflix.Com,90.00\n2026-09-01,Spotify,20.00\n2026-09-02,Uber Trip,40.00\n")
    colors = {item["name"]: item["color"] for item in client.get("/api/categories").json()}
    assert all(colors.values()) and len(set(colors.values())) == len(colors)
    for month in ("2026-06", "2026-09"):
        dashboard = client.get("/api/dashboard", params={"mes": month}).json()
        assert {item["mes"]: item["total"] for item in dashboard["por_mes"]} == {"2026-06": 90, "2026-09": 60}
        for item in dashboard["por_categoria"]:
            assert item["cor"] == colors[item["categoria"]]
