"""Authentication: password hashing, sessions and the /api/auth routes."""

import hashlib

import pytest

from app.core import security

ALICE = {"name": "Alice Souza", "email": "alice@test.invalid", "password": "senha-segura-1"}
BRUNO = {"name": "Bruno Lima", "email": "bruno@test.invalid", "password": "outra-senha-2"}
COOKIE = "gerencia_session"


# --- password hashing and tokens -------------------------------------------------

def test_hash_is_salted_and_never_the_password():
    first, second = security.hash_password("senha-segura-1"), security.hash_password("senha-segura-1")
    assert first != second
    assert "senha-segura-1" not in first
    assert first.startswith("scrypt$")


def test_verify_accepts_right_password_and_rejects_wrong_one():
    stored = security.hash_password("senha-segura-1")
    assert security.verify_password("senha-segura-1", stored)
    assert not security.verify_password("senha-segura-2", stored)


def test_verify_treats_equivalent_unicode_as_equal():
    composed, decomposed = "café-seguro", "café-seguro"
    assert security.verify_password(decomposed, security.hash_password(composed))


@pytest.mark.parametrize("stored", ["", "texto-qualquer", "scrypt$1$2$3", "bcrypt$a$b$c$d$e", "scrypt$x$8$1$!!$!!"])
def test_verify_rejects_malformed_hashes_without_raising(stored):
    assert security.verify_password("senha-segura-1", stored) is False


def test_session_token_digest_is_sha256_hex():
    token = security.new_session_token()
    assert len(token) >= 40
    assert security.hash_session_token(token) == hashlib.sha256(token.encode()).hexdigest()
    assert token != security.new_session_token()


# --- register --------------------------------------------------------------------

def test_register_creates_account_and_logs_in(auth_client, auth_database):
    response = auth_client.post("/api/auth/register", json=ALICE)

    assert response.status_code == 201
    body = response.json()
    assert body["name"] == "Alice Souza" and body["email"] == "alice@test.invalid"
    assert "password" not in body and "password_hash" not in body
    assert response.headers["cache-control"] == "no-store"

    cookie = response.headers["set-cookie"].lower()
    assert f"{COOKIE}=" in cookie and "httponly" in cookie and "samesite=lax" in cookie and "path=/" in cookie

    stored = auth_database.sql("SELECT password_hash FROM users;").stdout.strip()
    assert stored.startswith("scrypt$") and ALICE["password"] not in stored
    assert auth_client.get("/api/auth/me").json()["email"] == "alice@test.invalid"


def test_register_stores_only_the_digest_of_the_session_token(auth_client, auth_database):
    response = auth_client.post("/api/auth/register", json=ALICE)
    raw_token = auth_client.cookies.get(COOKIE)
    assert raw_token and COOKIE in response.headers["set-cookie"]

    stored = auth_database.sql("SELECT token_hash FROM sessions;").stdout.strip()
    assert stored == hashlib.sha256(raw_token.encode()).hexdigest()
    assert raw_token not in stored


def test_register_normalizes_name_and_email(auth_client):
    response = auth_client.post("/api/auth/register", json={
        "name": "  Alice   Souza ", "email": "  ALICE@Test.Invalid ", "password": "senha-segura-1",
    })
    assert response.status_code == 201
    assert response.json()["name"] == "Alice Souza"
    assert response.json()["email"] == "alice@test.invalid"


def test_register_rejects_duplicate_email_ignoring_case(auth_client):
    assert auth_client.post("/api/auth/register", json=ALICE).status_code == 201
    auth_client.cookies.clear()

    response = auth_client.post("/api/auth/register", json={**BRUNO, "email": "ALICE@test.invalid"})
    assert response.status_code == 409
    assert "já tem cadastro" in response.json()["detail"]
    assert COOKIE not in response.headers.get("set-cookie", "")


@pytest.mark.parametrize("payload, field", [
    ({**ALICE, "name": " "}, "name"),
    ({**ALICE, "email": "sem-arroba"}, "email"),
    ({**ALICE, "password": "curta"}, "password"),
    ({**ALICE, "password": "x" * 129}, "password"),
])
def test_register_validation_errors_come_per_field(auth_client, payload, field):
    response = auth_client.post("/api/auth/register", json=payload)

    assert response.status_code == 422
    body = response.json()
    assert body["detail"] == "Revise os campos informados."
    assert list(body["fields"]) == [field]
    assert body["fields"][field].endswith(".")


def test_register_reports_missing_fields(auth_client):
    response = auth_client.post("/api/auth/register", json={"email": "alice@test.invalid"})
    assert response.status_code == 422
    assert response.json()["fields"] == {"name": "Campo obrigatório.", "password": "Campo obrigatório."}


# --- login, me, logout -----------------------------------------------------------

def test_login_with_right_credentials_opens_a_session(auth_client):
    auth_client.post("/api/auth/register", json=ALICE)
    auth_client.cookies.clear()
    assert auth_client.get("/api/auth/me").status_code == 401

    response = auth_client.post("/api/auth/login", json={"email": "Alice@Test.invalid", "password": ALICE["password"]})

    assert response.status_code == 200
    assert response.json()["name"] == "Alice Souza"
    assert auth_client.get("/api/auth/me").status_code == 200


def test_login_gives_the_same_answer_for_wrong_password_and_unknown_email(auth_client):
    auth_client.post("/api/auth/register", json=ALICE)
    auth_client.cookies.clear()

    wrong = auth_client.post("/api/auth/login", json={"email": ALICE["email"], "password": "senha-errada-9"})
    unknown = auth_client.post("/api/auth/login", json={"email": "ninguem@test.invalid", "password": "senha-errada-9"})

    assert wrong.status_code == unknown.status_code == 401
    assert wrong.json() == unknown.json() == {"detail": "E-mail ou senha incorretos."}
    assert COOKIE not in wrong.headers.get("set-cookie", "")


def test_me_requires_a_session(auth_client):
    response = auth_client.get("/api/auth/me")
    assert response.status_code == 401
    assert response.json() == {"detail": "Entre para continuar."}


def test_forged_session_token_is_rejected(auth_client):
    auth_client.cookies.set(COOKIE, "token-inventado")
    assert auth_client.get("/api/auth/me").status_code == 401


def test_logout_revokes_the_session_server_side(auth_client, auth_database):
    auth_client.post("/api/auth/register", json=ALICE)
    token = auth_client.cookies.get(COOKIE)

    response = auth_client.post("/api/auth/logout")
    assert response.status_code == 204

    # Even a client that kept the old cookie can no longer use it.
    auth_client.cookies.set(COOKIE, token)
    assert auth_client.get("/api/auth/me").status_code == 401
    assert auth_database.sql("SELECT count(*) FROM sessions WHERE revoked_at IS NOT NULL;").stdout.strip() == "1"


def test_logout_without_a_session_is_harmless(auth_client):
    assert auth_client.post("/api/auth/logout").status_code == 204


def test_expired_session_is_rejected(auth_client, auth_database):
    auth_client.post("/api/auth/register", json=ALICE)
    auth_database.sql(
        "UPDATE sessions SET created_at = now() - interval '2 days', expires_at = now() - interval '1 day';"
    )
    assert auth_client.get("/api/auth/me").status_code == 401


# --- isolation -------------------------------------------------------------------

def test_each_session_identifies_only_its_own_user(auth_client):
    auth_client.post("/api/auth/register", json=ALICE)
    alice_token = auth_client.cookies.get(COOKIE)
    auth_client.cookies.clear()
    auth_client.post("/api/auth/register", json=BRUNO)
    bruno_token = auth_client.cookies.get(COOKIE)
    assert alice_token != bruno_token

    auth_client.cookies.clear()
    auth_client.cookies.set(COOKIE, alice_token)
    assert auth_client.get("/api/auth/me").json()["email"] == "alice@test.invalid"
    auth_client.cookies.clear()
    auth_client.cookies.set(COOKIE, bruno_token)
    assert auth_client.get("/api/auth/me").json()["email"] == "bruno@test.invalid"


def test_logging_out_one_user_keeps_the_other_logged_in(auth_client):
    auth_client.post("/api/auth/register", json=ALICE)
    alice_token = auth_client.cookies.get(COOKIE)
    auth_client.cookies.clear()
    auth_client.post("/api/auth/register", json=BRUNO)
    bruno_token = auth_client.cookies.get(COOKIE)

    auth_client.post("/api/auth/logout")  # Bruno
    auth_client.cookies.clear()
    auth_client.cookies.set(COOKIE, bruno_token)
    assert auth_client.get("/api/auth/me").status_code == 401
    auth_client.cookies.clear()
    auth_client.cookies.set(COOKIE, alice_token)
    assert auth_client.get("/api/auth/me").status_code == 200


def test_public_categories_still_work_without_a_session(auth_client):
    assert auth_client.get("/api/categories").status_code == 200
