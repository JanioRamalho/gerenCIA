"""Conexão com o PostgreSQL: o engine e uma sessão do banco por requisição."""

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import settings

# Sem o endereço do banco a API não consegue atender nada, então ela nem sobe.
if not settings.database_url:
    raise RuntimeError(
        "DATABASE_URL não foi definida. Configure-a no arquivo .env na raiz do projeto."
    )

database_url = settings.database_url

# Provedores como Neon e Vercel entregam o endereço começando com "postgres://"
# ou "postgresql://". O SQLAlchemy precisa saber qual driver usar, e o
# instalado é o psycopg 3, então o começo vira "postgresql+psycopg://".
for prefix in ("postgres://", "postgresql://"):
    if database_url.startswith(prefix):
        database_url = "postgresql+psycopg://" + database_url[len(prefix):]
        break

# O engine guarda as conexões abertas com o banco e as reaproveita entre as
# requisições. pool_pre_ping testa cada conexão antes de usá-la, porque o
# servidor do banco pode tê-la fechado depois de um tempo parada.
engine = create_engine(database_url, pool_pre_ping=True)

# Cada chamada a SessionLocal() abre uma sessão: a conversa com o banco
# durante uma requisição. Nada é gravado sem um commit explícito.
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


def get_db():
    """Entrega uma sessão do banco para a rota e sempre a fecha no fim, mesmo com erro."""
    db: Session = SessionLocal()
    try:
        # yield entrega a sessão à rota; o finally roda depois que a rota termina.
        yield db
    finally:
        db.close()
