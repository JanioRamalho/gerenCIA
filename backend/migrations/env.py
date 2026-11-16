"""Ambiente Alembic: usa os mesmos modelos e a mesma URL da API."""

from logging.config import fileConfig

from alembic import context
from sqlalchemy import create_engine, pool

from app import models  # Registra todas as tabelas em Base.metadata.
from app.db.base import Base
from app.db.config import get_database_url

config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name, disable_existing_loggers=False)

target_metadata = Base.metadata


def include_name(name, type_, parent_names):
    # Não proponha apagar tabelas de outros sistemas que compartilhem o banco.
    if type_ == "table":
        return name in target_metadata.tables
    return True


def configure(**kwargs):
    context.configure(
        target_metadata=target_metadata,
        compare_type=True,
        compare_server_default=True,
        include_name=include_name,
        version_table_schema="public",
        **kwargs,
    )


def run_migrations(connection):
    configure(connection=connection)
    with context.begin_transaction():
        context.run_migrations()


if context.is_offline_mode():
    configure(url=get_database_url(), literal_binds=True, dialect_opts={"paramstyle": "named"})
    with context.begin_transaction():
        context.run_migrations()
else:
    connection = config.attributes.get("connection")
    if connection is not None:
        # Testes e adoção usam uma conexão explícita, sem acessar o banco do .env.
        run_migrations(connection)
    else:
        engine = create_engine(get_database_url(), poolclass=pool.NullPool, hide_parameters=True)
        try:
            with engine.connect() as connection:
                run_migrations(connection)
        finally:
            engine.dispose()
