"""Exercita backup/recuperação em PostgreSQL descartável, nunca no .env."""

from pathlib import Path
import sys

import psycopg
import pytest
from alembic import command
from sqlalchemy import create_engine
from sqlalchemy.engine import make_url

ROOT = Path(__file__).resolve().parents[2]
sys.path[:0] = [str(ROOT / "backend"), str(ROOT / "backend/tests"), str(ROOT / "scripts")]
from conftest import postgres_cluster, TestDatabase
from test_alembic import alembic_config
from test_database_integrity import SETUP, transaction, OWN
from backup_banco import capture, connection_info, fingerprint, pg_run, schema_inventory, sequence_states


def test_connection_is_explicit_and_never_falls_back(tmp_path, monkeypatch):
    monkeypatch.setenv("DATABASE_URL", "postgresql://secret@wrong.invalid/wrong")
    path = tmp_path / "connection.env"
    path.write_text("OTHER=value\n", encoding="utf-8")
    with pytest.raises(ValueError, match="sem GERENCIA"):
        connection_info(path, "wrong.invalid")
    for url, host in [
        ("postgresql://u:p@wrong.invalid/db?sslmode=require", "correct.invalid"),
        ("postgresql://u:p@ep-test-pooler.neon.tech/db?sslmode=require", "ep-test-pooler.neon.tech"),
        ("postgresql://u:p@remote.invalid/db", "remote.invalid"),
    ]:
        path.write_text("GERENCIA_PRODUCTION_DATABASE_URL=" + url, encoding="utf-8")
        with pytest.raises(ValueError):
            connection_info(path, host)


def test_backup_restore_upgrade_and_recovery(postgres_cluster, tmp_path):
    cluster = postgres_cluster
    for name in ("backup_source", "backup_rehearsal", "backup_recovery"):
        cluster.sql(f"CREATE DATABASE {name};")
    source = TestDatabase(cluster.binaries, cluster.port, "backup_source")
    source.script(ROOT / "scripts/init.sql")
    source.sql(SETUP + transaction(category=f"'{OWN}'") + "COMMIT;")
    source.sql("ALTER DATABASE backup_source SET timezone='America/Sao_Paulo';")
    url = make_url(f"postgresql+psycopg://postgres@127.0.0.1:{cluster.port}/backup_source")
    report = capture(url, tmp_path / "captured", cluster.binaries)
    archive = tmp_path / "captured/database.dump"
    assert report["tables"]["users"]["rows"] == 2
    assert report["tables"]["transactions"]["rows"] == 1
    assert report["revision"] == [] and not report["restored"]

    def restore(name):
        pg_run(cluster.binaries / "pg_restore", "--no-password", "--exit-on-error",
               "--single-transaction", "--no-owner", "--no-privileges",
               "--host=127.0.0.1", f"--port={cluster.port}", "--username=postgres",
               f"--dbname={name}", archive, env=cluster.env)
        connection = psycopg.connect(host="127.0.0.1", port=cluster.port, user="postgres", dbname=name,
                                     options="-c timezone=Asia/Tokyo")
        try:
            assert fingerprint(connection) == report["tables"]
            assert schema_inventory(connection) == report["schema"]
            assert sequence_states(connection) == report["sequences_observed_before_dump"]
            return sequence_states(connection)
        finally:
            connection.close()

    sequence = restore("backup_rehearsal")
    engine = create_engine(url.set(database="backup_rehearsal"))
    try:
        with engine.begin() as connection:
            before = connection.exec_driver_sql("SELECT id,code,user_id,upload_id,amount,transaction_date,source_row FROM transactions").all()
            from app.db.migration_baseline import adopt_baseline
            adopt_baseline(connection)  # SOMENTE no banco local restaurado.
            command.upgrade(alembic_config(connection), "head")
            assert connection.exec_driver_sql("SELECT id,code,user_id,upload_id,amount,transaction_date,source_row FROM transactions").all() == before
            assert connection.exec_driver_sql("SELECT version_num FROM alembic_version").scalar_one() == "0004_remove_legacy"
            assert connection.exec_driver_sql("SELECT to_regclass('public.bronze_rows')").scalar_one() is None
            command.check(alembic_config(connection))
        # Recuperação independente do mesmo arquivo, sem downgrade destrutivo.
        assert restore("backup_recovery") == sequence
        with psycopg.connect(host="127.0.0.1", port=cluster.port, user="postgres", dbname="backup_source") as connection:
            assert fingerprint(connection) == report["tables"]
            assert connection.execute("SELECT to_regclass('public.alembic_version')").fetchone() == (None,)
    finally:
        engine.dispose()
