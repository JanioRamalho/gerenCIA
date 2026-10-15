import os
from dataclasses import dataclass
from datetime import timedelta
from pathlib import Path

from dotenv import load_dotenv


PROJECT_ROOT = Path(__file__).resolve().parents[3]
load_dotenv(PROJECT_ROOT / ".env")


@dataclass(frozen=True)
class Settings:
    app_env: str
    session_cookie_name: str
    session_ttl: timedelta
    cookie_secure: bool


def _load_settings() -> Settings:
    app_env = os.getenv("APP_ENV", "development")
    ttl_days = int(os.getenv("SESSION_TTL_DAYS", "14"))
    # The session cookie is only sent over HTTPS outside development.
    secure_default = "true" if app_env == "production" else "false"
    secure = os.getenv("SESSION_COOKIE_SECURE", secure_default).lower() in {"1", "true", "yes"}
    return Settings(
        app_env=app_env,
        session_cookie_name="gerencia_session",
        session_ttl=timedelta(days=ttl_days),
        cookie_secure=secure,
    )


settings = _load_settings()
