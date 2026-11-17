"""Migrações e adoção do esquema em bancos PostgreSQL descartáveis."""

import io
import os
import subprocess
import sys
from pathlib import Path
from uuid import uuid4

import pytest
from alembic import command
from alembic.config import Config
from alembic.runtime.migration import MigrationContext
from alembic.script import ScriptDirectory
from alembic.util import CommandError
from sqlalchemy import create_engine, text
from sqlalchemy.exc import ProgrammingError

from app.db import config as db_config
from app.db.migration_baseline import (
    BASELINE_REVISION,
    IncompatibleSchema,
    TABLES,
    adopt_baseline,
    validate_baseline,
)
from test_database_integrity import OWN, SETUP, transaction, rule

ROOT = Path(__file__).resolve().parents[2]


def alembic_config(connection=None, output=None):
    config = Config(str(ROOT / "alembic.ini"), output_buffer=output)
    if connection is not None:
        config.attributes["connection"] = connection
    return config


@pytest.fixture
def migration_database(postgres_cluster):
    name = "migration_" + uuid4().hex
    postgres_cluster.sql(f"CREATE DATABASE {name};")
    return type(postgres_cluster)(postgres_cluster.binaries, postgres_cluster.port, name)


@pytest.fixture
def migration_engine(migration_database):
    db = migration_database
    engine = create_engine(f"postgresql+psycopg://postgres@127.0.0.1:{db.port}/{db.name}")
    try:
        yield engine
    finally:
        engine.dispose()


def snapshot_data(connection):
    return {
        table: connection.execute(text(f"SELECT to_jsonb(t) FROM public.{table} t ORDER BY id")).scalars().all()
        for table in TABLES
    }


def test_upgrade_creates_complete_schema_and_has_no_model_drift(migration_engine):
    with migration_engine.begin() as connection:
        config = alembic_config(connection)
        command.upgrade(config, "head")
        assert connection.scalar(text("SELECT count(*) FROM categories WHERE user_id IS NULL")) == 11
        assert MigrationContext.configure(connection).get_current_heads() == (ScriptDirectory.from_config(config).get_current_head(),)
        command.check(config)
        # Uma segunda atualização não recria tabelas nem duplica categorias.
        command.upgrade(config, "head")
        assert connection.scalar(text("SELECT count(*) FROM categories")) == 11
        connection.execute(text("CREATE TABLE unrelated_system (id integer PRIMARY KEY)"))
        command.check(config)  # Não propõe excluir tabelas de outro sistema.


def test_adoption_preserves_data_codes_and_identity_sequence(migration_database, migration_engine):
    migration_database.script(ROOT / "scripts/init.sql")
    migration_database.sql(SETUP + transaction(category=f"'{OWN}'", current="1", total="3") + rule(OWN) + "COMMIT;")
    with migration_engine.begin() as connection:
        before = snapshot_data(connection)
        sequence = connection.scalar(text("SELECT last_value FROM users_code_seq"))
        validate_baseline(connection)
        assert connection.scalar(text("SELECT to_regclass('public.alembic_version')")) is None
        adopt_baseline(connection)
        adopt_baseline(connection)  # Repetir a adoção não altera os registros.
        command.upgrade(alembic_config(connection), BASELINE_REVISION)
        assert snapshot_data(connection) == before
        assert connection.scalar(text("SELECT last_value FROM users_code_seq")) == sequence
        connection.execute(text("INSERT INTO users (name,email,password_hash) VALUES ('Nova','nova@test.invalid','hash')"))
        assert connection.scalar(text("SELECT code FROM users WHERE email='nova@test.invalid'")) > sequence


@pytest.mark.parametrize("change", [
    "ALTER TABLE users DROP COLUMN code",
    "ALTER TABLE transactions DROP CONSTRAINT transactions_installments_valid",
    "DROP INDEX transactions_user_date_idx",
    "DROP TRIGGER transactions_category_owner_guard ON transactions",
    "ALTER TABLE categories DISABLE TRIGGER categories_owner_immutable",
    "ALTER TABLE uploads ALTER COLUMN status SET DEFAULT 'failed'",
    "CREATE OR REPLACE FUNCTION public.enforce_category_owner() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RETURN NEW; END; $$",
])
def test_adoption_rejects_schema_drift_without_stamping(migration_database, migration_engine, change):
    migration_database.script(ROOT / "scripts/init.sql")
    migration_database.sql(change + ";")
    with migration_engine.begin() as connection:
        before = snapshot_data(connection)
        with pytest.raises(IncompatibleSchema, match="esquema difere"):
            adopt_baseline(connection)
        assert connection.scalar(text("SELECT to_regclass('public.alembic_version')")) is None
        assert snapshot_data(connection) == before


def test_adoption_rejects_empty_database(migration_engine):
    with migration_engine.begin() as connection:
        with pytest.raises(IncompatibleSchema, match="tabela users ausente"):
            adopt_baseline(connection)
        assert connection.scalar(text("SELECT to_regclass('public.alembic_version')")) is None


def test_adoption_accepts_manual_sql_upgrade(legacy_database):
    db = legacy_database
    db.sql(SETUP + transaction(category=f"'{OWN}'") + "COMMIT;")
    db.script(ROOT / "scripts/migrations/001_integrity.sql")
    db.script(ROOT / "scripts/migrations/002_display_codes.sql")
    engine = create_engine(f"postgresql+psycopg://postgres@127.0.0.1:{db.port}/{db.name}")
    try:
        with engine.begin() as connection:
            before = snapshot_data(connection)
            adopt_baseline(connection)
            assert snapshot_data(connection) == before
    finally:
        engine.dispose()


def test_adoption_does_not_overwrite_another_revision(migration_database, migration_engine):
    migration_database.script(ROOT / "scripts/init.sql")
    with migration_engine.begin() as connection:
        connection.execute(text("CREATE TABLE alembic_version (version_num varchar(32) PRIMARY KEY)"))
        connection.execute(text("INSERT INTO alembic_version VALUES ('future_revision')"))
        with pytest.raises(IncompatibleSchema, match="outra revisão"):
            adopt_baseline(connection)
        assert connection.scalar(text("SELECT version_num FROM alembic_version")) == "future_revision"


def test_upgrade_on_existing_unversioned_database_rolls_back(migration_database, migration_engine):
    migration_database.script(ROOT / "scripts/init.sql")
    with pytest.raises(ProgrammingError):
        with migration_engine.begin() as connection:
            command.upgrade(alembic_config(connection), "head")
    with migration_engine.connect() as connection:
        validate_baseline(connection)
        assert connection.scalar(text("SELECT to_regclass('public.alembic_version')")) is None


def test_failed_initial_migration_rolls_back_tables_created_before_error(migration_engine):
    with migration_engine.begin() as connection:
        # users é criado depois de várias outras tabelas na cópia SQL.
        connection.execute(text("CREATE TABLE users (id integer PRIMARY KEY)"))
    with pytest.raises(ProgrammingError):
        with migration_engine.begin() as connection:
            command.upgrade(alembic_config(connection), "head")
    with migration_engine.connect() as connection:
        assert connection.scalar(text("SELECT to_regclass('public.users')")) == "users"
        assert connection.scalar(text("SELECT to_regclass('public.bronze_rows')")) is None
        assert connection.scalar(text("SELECT to_regclass('public.alembic_version')")) is None


def test_adoption_cli_checks_then_stamps_using_explicit_environment(migration_database, migration_engine):
    db = migration_database
    db.script(ROOT / "scripts/init.sql")
    env = {**os.environ, "DATABASE_URL": f"postgres://postgres@127.0.0.1:{db.port}/{db.name}"}
    args = [sys.executable, str(ROOT / "scripts/adotar_alembic.py")]
    result = subprocess.run(args, cwd=ROOT / "backend", env=env, capture_output=True, timeout=30)
    assert result.returncode == 0, result.stderr
    with migration_engine.connect() as connection:
        assert connection.scalar(text("SELECT to_regclass('public.alembic_version')")) is None
    result = subprocess.run(args + ["--stamp"], cwd=ROOT / "backend", env=env, capture_output=True, timeout=30)
    assert result.returncode == 0, result.stderr
    with migration_engine.connect() as connection:
        assert MigrationContext.configure(connection).get_current_heads() == (BASELINE_REVISION,)


def test_baseline_downgrade_refuses_to_delete_existing_data(migration_engine):
    with migration_engine.begin() as connection:
        config = alembic_config(connection)
        command.upgrade(config, BASELINE_REVISION)
        with pytest.raises(CommandError, match="apagaria"):
            command.downgrade(config, "base")
        validate_baseline(connection)
        assert MigrationContext.configure(connection).get_current_heads() == (BASELINE_REVISION,)


def test_offline_upgrade_emits_sql_without_a_database(monkeypatch):
    monkeypatch.setenv("DATABASE_URL", "postgresql://offline:secret%25@127.0.0.1:1/unused")
    output = io.StringIO()
    command.upgrade(alembic_config(output=output), BASELINE_REVISION, sql=True)
    sql = output.getvalue()
    assert "CREATE TABLE public.users" in sql
    assert "CREATE TRIGGER transactions_category_owner_guard" in sql
    assert "0001_current_schema" in sql
    assert "OWNER TO" not in sql and "\\ir" not in sql
    assert "secret" not in sql


def test_legacy_removal_requires_online_data_inspection(monkeypatch):
    monkeypatch.setenv("DATABASE_URL", "postgresql://offline:secret@127.0.0.1:1/unused")
    with pytest.raises(CommandError, match="conexão explícita"):
        command.upgrade(alembic_config(output=io.StringIO()), "head", sql=True)


@pytest.mark.parametrize("prefix", ["postgres://", "postgresql://", "postgresql+psycopg://"])
def test_database_url_normalization_preserves_credentials(monkeypatch, prefix):
    monkeypatch.setattr(db_config, "load_dotenv", lambda path: None)
    monkeypatch.setenv("DATABASE_URL", prefix + "user:p%25ss@localhost/db?sslmode=require")
    assert db_config.get_database_url() == "postgresql+psycopg://user:p%25ss@localhost/db?sslmode=require"


def test_database_url_requires_configuration(monkeypatch):
    monkeypatch.setattr(db_config, "load_dotenv", lambda path: None)
    monkeypatch.delenv("DATABASE_URL", raising=False)
    with pytest.raises(RuntimeError, match="DATABASE_URL"):
        db_config.get_database_url()
