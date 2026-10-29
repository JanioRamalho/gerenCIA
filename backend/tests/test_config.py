"""Configurações: os valores padrão, o modo de produção e valores inválidos no ambiente."""

from datetime import timedelta

import pytest

from app.core.config import load_settings

CONFIG_VARIABLES = ["APP_ENV", "DATABASE_URL", "SESSION_TTL_DAYS", "SESSION_COOKIE_SECURE"]


@pytest.fixture(autouse=True)
def clean_environment(monkeypatch):
    """Cada teste começa sem as variáveis que a configuração lê, porque o .env
    de quem roda os testes pode ter algumas delas. O monkeypatch devolve tudo
    como estava no fim do teste."""
    for name in CONFIG_VARIABLES:
        monkeypatch.delenv(name, raising=False)


def test_defaults_are_for_local_development():
    settings = load_settings()

    assert settings.app_env == "development"
    assert settings.database_url is None
    assert settings.session_cookie_name == "gerencia_session"
    assert settings.session_ttl == timedelta(days=14)
    assert settings.cookie_secure is False


def test_production_turns_on_the_secure_cookie(monkeypatch):
    monkeypatch.setenv("APP_ENV", "production")

    assert load_settings().cookie_secure is True


@pytest.mark.parametrize("text, expected", [
    ("true", True), ("1", True), ("YES", True), ("false", False), ("0", False),
])
def test_secure_cookie_can_be_chosen_explicitly(monkeypatch, text, expected):
    monkeypatch.setenv("SESSION_COOKIE_SECURE", text)

    assert load_settings().cookie_secure is expected


def test_production_can_turn_the_secure_cookie_off(monkeypatch):
    # Útil para testar o modo de produção num servidor local, sem HTTPS.
    monkeypatch.setenv("APP_ENV", "production")
    monkeypatch.setenv("SESSION_COOKIE_SECURE", "false")

    assert load_settings().cookie_secure is False


def test_session_lifetime_and_database_come_from_the_environment(monkeypatch):
    monkeypatch.setenv("SESSION_TTL_DAYS", "30")
    monkeypatch.setenv("DATABASE_URL", "postgresql+psycopg://user@host/db")

    settings = load_settings()

    assert settings.session_ttl == timedelta(days=30)
    assert settings.database_url == "postgresql+psycopg://user@host/db"


@pytest.mark.parametrize("text", ["abc", "", "1.5", "0", "-3"])
def test_invalid_session_lifetime_stops_with_a_clear_message(monkeypatch, text):
    monkeypatch.setenv("SESSION_TTL_DAYS", text)

    with pytest.raises(RuntimeError, match="SESSION_TTL_DAYS precisa ser um número inteiro"):
        load_settings()
