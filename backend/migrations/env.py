"""Migrações usam a mesma configuração e o mesmo driver da aplicação."""
from alembic import context
from sqlalchemy import create_engine, pool

from app.db.base import Base
from app.db.migrations import migration_database_url
from app import models  # noqa: F401: registra os modelos no metadata

config = context.config
target_metadata = Base.metadata


def database_url():
    return migration_database_url(config.attributes.get("database_url"))


def run(connection):
    context.configure(connection=connection, target_metadata=target_metadata, compare_type=True)
    with context.begin_transaction():
        context.run_migrations()


if context.is_offline_mode():
    context.configure(url=database_url(), target_metadata=target_metadata,
                      literal_binds=True, dialect_opts={"paramstyle": "named"})
    with context.begin_transaction():
        context.run_migrations()
elif config.attributes.get("connection") is not None:
    run(config.attributes["connection"])
else:
    engine = create_engine(database_url(), poolclass=pool.NullPool)
    with engine.connect() as connection:
        run(connection)
    engine.dispose()
