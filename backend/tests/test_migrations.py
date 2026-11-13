import importlib.util
from uuid import uuid4

from alembic import command
import pytest
from sqlalchemy import create_engine, text

from app.db.migrations import ROOT, migration_config


def new_database(cluster):
    name = "migration_" + uuid4().hex
    cluster.sql(f"CREATE DATABASE {name};")
    return type(cluster)(cluster.binaries, cluster.port, name)


def connect(db):
    return create_engine(f"postgresql+psycopg://postgres@127.0.0.1:{db.port}/{db.name}")


def adoption_module():
    spec = importlib.util.spec_from_file_location("adopt_alembic", ROOT / "scripts/adopt_alembic.py")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_upgrade_empty_database_and_repeat(postgres_cluster):
    db = new_database(postgres_cluster)
    engine = connect(db)
    with engine.begin() as connection:
        config = migration_config(connection=connection)
        command.upgrade(config, "head")
        command.upgrade(config, "head")
        assert connection.execute(text("SELECT version_num FROM alembic_version")).scalar() == "0002_upload_history"
        assert connection.execute(text("SELECT count(*) FROM categories")).scalar() == 11
        assert connection.execute(text("SELECT count(*) FROM pg_trigger WHERE tgname='transactions_category_owner_guard'")).scalar() == 1
    engine.dispose()


def test_adoption_preserves_existing_users_and_uploads(postgres_cluster):
    db = new_database(postgres_cluster)
    db.script(ROOT / "scripts/init.sql")
    user_id, upload_id = uuid4(), uuid4()
    db.sql(f"INSERT INTO users (id,name,email,password_hash) VALUES ('{user_id}','Pessoa','teste@example.com','hash');"
           f"INSERT INTO uploads (id,user_id,original_filename,file_extension,file_size_bytes,sha256,storage_path) "
           f"VALUES ('{upload_id}','{user_id}','antigo.csv','csv',6000000,repeat('a',64),'antigo.csv');")
    engine = connect(db)
    with engine.begin() as connection:
        module = adoption_module()
        assert "conferida" in module.adopt(connection)
        module.adopt(connection, apply=True)
        assert connection.execute(text("SELECT id FROM users")).scalar() == user_id
        assert connection.execute(text("SELECT id FROM uploads")).scalar() == upload_id
        assert connection.execute(text("SELECT storage_path FROM uploads")).scalar() == "antigo.csv"
        module.adopt(connection, apply=True)
    engine.dispose()


def test_existing_database_is_not_recreated(postgres_cluster):
    db = new_database(postgres_cluster)
    db.script(ROOT / "scripts/init.sql")
    engine = connect(db)
    with pytest.raises(RuntimeError, match="já contém tabelas"):
        with engine.begin() as connection:
            command.upgrade(migration_config(connection=connection), "head")
    engine.dispose()


def test_adoption_rejects_incomplete_legacy_schema(postgres_cluster):
    db = new_database(postgres_cluster)
    db.script(ROOT / "scripts/init.sql")
    db.sql("ALTER TABLE uploads DROP COLUMN code;")
    engine = connect(db)
    with pytest.raises(RuntimeError, match="code"):
        with engine.begin() as connection:
            adoption_module().adopt(connection, apply=True)
    assert db.sql("SELECT count(*) FROM information_schema.tables WHERE table_name='alembic_version';").stdout.strip() == "0"
    engine.dispose()
