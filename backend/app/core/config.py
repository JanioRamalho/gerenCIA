"""Configurações da aplicação, lidas das variáveis de ambiente e do arquivo .env."""

import os
from dataclasses import dataclass
from datetime import timedelta
from pathlib import Path

from dotenv import load_dotenv

# Pasta raiz do projeto. Este arquivo fica em backend/app/core/config.py:
# parents[0] é a pasta core, [1] é app, [2] é backend e [3] é a raiz.
PROJECT_ROOT = Path(__file__).resolve().parents[3]

# load_dotenv copia as variáveis do arquivo .env para o ambiente (os.environ).
# Variáveis que já existem no ambiente não são substituídas.
load_dotenv(PROJECT_ROOT / ".env")


# @dataclass cria a classe com __init__ automático. frozen=True impede alterar
# as configurações depois de criadas.
@dataclass(frozen=True)
class Settings:
    """Configurações usadas pela aplicação."""

    app_env: str              # "development" ou "production"
    session_cookie_name: str  # nome do cookie que guarda o token de sessão
    session_ttl: timedelta    # por quanto tempo uma sessão vale
    cookie_secure: bool       # se o cookie só pode viajar por HTTPS


def load_settings() -> Settings:
    """Lê as variáveis de ambiente e monta as configurações, com valores padrão."""
    app_env = os.getenv("APP_ENV", "development")
    session_ttl_days = int(os.getenv("SESSION_TTL_DAYS", "14"))

    # Em produção, o cookie de sessão só viaja por HTTPS. Em desenvolvimento,
    # o servidor local usa HTTP, então o padrão é desligado. A variável
    # SESSION_COOKIE_SECURE permite trocar esse padrão.
    if app_env == "production":
        secure_default = "true"
    else:
        secure_default = "false"
    secure_text = os.getenv("SESSION_COOKIE_SECURE", secure_default)
    cookie_secure = secure_text.lower() in {"1", "true", "yes"}

    return Settings(
        app_env=app_env,
        session_cookie_name="gerencia_session",
        session_ttl=timedelta(days=session_ttl_days),
        cookie_secure=cookie_secure,
    )


# Objeto único com as configurações. Os outros arquivos usam:
# from app.core.config import settings
settings = load_settings()
