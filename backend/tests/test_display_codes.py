import json

import pytest

from conftest import PROJECT_ROOT
from test_database_integrity import SETUP, A, UPLOAD, OWN, BRONZE, transaction, rule


TABLES = (
    "users", "sessions", "uploads", "upload_mappings", "bronze_rows",
    "categories", "transactions", "category_rules", "quality_checks", "rejected_rows",
)

RELATED_ROWS = f"""
    INSERT INTO sessions (user_id, token_hash, expires_at)
        VALUES ('{A}', repeat('c', 64), now() + interval '1 day');
    INSERT INTO upload_mappings (user_id, upload_id, mapping)
        VALUES ('{A}', '{UPLOAD}', '{{}}');
    INSERT INTO bronze_rows (id, user_id, upload_id, row_number, raw_data)
        VALUES ('{BRONZE}', '{A}', '{UPLOAD}', 1, '{{}}');
""" + transaction(category=f"'{OWN}'", bronze=f"'{BRONZE}'") + rule(OWN) + f"""
    INSERT INTO quality_checks (user_id, upload_id, total_rows, valid_rows)
        VALUES ('{A}', '{UPLOAD}', 1, 1);
    INSERT INTO rejected_rows (user_id, upload_id, source_row, raw_data, error_code, error_message)
        VALUES ('{A}', '{UPLOAD}', 2, '{{}}', 'test', 'Teste');
"""


@pytest.mark.parametrize("table", TABLES)
def test_every_table_has_automatic_unique_code(database, table):
    result = database.sql(f"""
        SELECT data_type = 'bigint' AND is_nullable = 'NO'
            AND is_identity = 'YES' AND identity_generation = 'ALWAYS'
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = '{table}' AND column_name = 'code';
        SELECT count(*) FROM pg_constraint
        WHERE conrelid = 'public.{table}'::regclass
            AND contype = 'u' AND conname = '{table}_code_key';
    """)
    assert result.stdout.strip().splitlines() == ["t", "1"]


def test_inserts_generate_codes_across_all_tables(database):
    checks = " UNION ALL ".join(
        f"SELECT '{table}', count(*) > 0 AND bool_and(code > 0) "
        f"AND count(*) = count(DISTINCT code) FROM public.{table}"
        for table in TABLES
    )
    result = database.sql(SETUP + RELATED_ROWS + checks + "; ROLLBACK;")
    assert set(result.stdout.strip().splitlines()) == {f"{table}|t" for table in TABLES}


def test_application_role_can_insert_and_read_generated_code(database):
    result = database.sql("""
        BEGIN;
        CREATE ROLE display_code_test_user;
        GRANT USAGE ON SCHEMA public TO display_code_test_user;
        GRANT SELECT, INSERT ON public.categories TO display_code_test_user;
        SET LOCAL ROLE display_code_test_user;
        INSERT INTO categories (name) VALUES ('Categoria com código automático')
            RETURNING code > 0;
        ROLLBACK;
    """)
    assert result.stdout.strip() == "t"


def test_category_code_is_unique(database):
    result = database.sql("""
        BEGIN;
        INSERT INTO categories (code, name) OVERRIDING SYSTEM VALUE
        SELECT code, 'Código repetido' FROM categories LIMIT 1;
        ROLLBACK;
    """, check=False)
    assert result.returncode != 0
    assert "23505" in result.stderr and "categories_code_key" in result.stderr


def test_explicit_code_is_rejected(database):
    result = database.sql("INSERT INTO categories (code, name) VALUES (999, 'Código manual');", check=False)
    assert result.returncode != 0
    assert "428C9" in result.stderr, result.stderr


def test_category_code_survives_edits(database):
    result = database.sql("""
        BEGIN;
        CREATE TEMP TABLE original_category AS
            SELECT id, code FROM categories ORDER BY code LIMIT 1;
        UPDATE categories SET name = 'Categoria renomeada'
            WHERE id = (SELECT id FROM original_category);
        SELECT c.code = o.code FROM categories c JOIN original_category o USING (id);
        ROLLBACK;
    """)
    assert result.stdout.strip() == "t"


def test_code_migration_preserves_data_and_uuid_relationships(legacy_database):
    db = legacy_database
    db.sql(SETUP + RELATED_ROWS + "COMMIT;")
    db.script(PROJECT_ROOT / "scripts/migrations/001_integrity.sql")

    def snapshot():
        return {
            table: json.loads(db.sql(
                f"SELECT coalesce(jsonb_agg(to_jsonb(t) - 'code' ORDER BY id), '[]') "
                f"FROM public.{table} t;"
            ).stdout)
            for table in TABLES
        }

    original = snapshot()
    db.script(PROJECT_ROOT / "scripts/migrations/002_display_codes.sql")
    assert snapshot() == original
    for table in TABLES:
        result = db.sql(f"SELECT count(*) = count(code) AND count(*) = count(DISTINCT code) FROM public.{table};")
        assert result.stdout.strip() == "t"

    result = db.sql("""
        INSERT INTO users (name, email, password_hash)
        VALUES ('Novo usuário', 'novo@test.invalid', 'test-hash')
        RETURNING code > 2;
    """)
    assert result.stdout.strip() == "t"


def test_orm_generates_codes(postgres_cluster):
    from sqlalchemy import create_mock_engine
    from app.db.base import Base
    from app import models

    postgres_cluster.sql("CREATE DATABASE display_codes_orm;")
    db = type(postgres_cluster)(postgres_cluster.binaries, postgres_cluster.port, "display_codes_orm")
    statements = []
    engine = create_mock_engine("postgresql://", lambda sql, *a, **kw: statements.append(str(sql.compile(dialect=engine.dialect))))
    Base.metadata.create_all(engine)
    db.sql(";\n".join(statements) + ";")
    db.script(PROJECT_ROOT / "scripts/sql/category_integrity.sql")
    test_inserts_generate_codes_across_all_tables(db)
