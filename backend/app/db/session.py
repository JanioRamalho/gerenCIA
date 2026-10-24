import os
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker


PROJECT_ROOT = Path(__file__).resolve().parents[3]
load_dotenv(PROJECT_ROOT / ".env")

database_url = os.getenv("DATABASE_URL")
if not database_url:
    raise RuntimeError(
        "DATABASE_URL não foi definida. Configure-a no arquivo .env na raiz do projeto."
    )

# Provedores como Neon/Vercel entregam "postgres://" ou "postgresql://"; o driver instalado é o psycopg 3.
for prefix in ("postgres://", "postgresql://"):
    if database_url.startswith(prefix):
        database_url = "postgresql+psycopg://" + database_url[len(prefix):]
        break

engine = create_engine(database_url, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


def get_db():
    """Yield one database session per request and always close it."""
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()
