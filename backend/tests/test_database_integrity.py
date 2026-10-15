from pathlib import Path

import pytest
from sqlalchemy import create_mock_engine

from app.db.base import Base
from app import models  # Registers all models in Base.metadata.


ROOT = Path(__file__).resolve().parents[2]
A = "00000000-0000-0000-0000-000000000001"
B = "00000000-0000-0000-0000-000000000002"
UPLOAD = "00000000-0000-0000-0000-000000000010"
OWN = "00000000-0000-0000-0000-000000000020"
OTHER = "00000000-0000-0000-0000-000000000021"
GLOBAL = "00000000-0000-0000-0000-000000000022"
BRONZE = "00000000-0000-0000-0000-000000000030"
TRANSACTION = "00000000-0000-0000-0000-000000000040"

SETUP = f"""
    BEGIN;
    INSERT INTO users (id, name, email, password_hash) VALUES
        ('{A}', 'Alice', 'alice@test.invalid', 'test-hash'),
        ('{B}', 'Bruno', 'bruno@test.invalid', 'test-hash');
    INSERT INTO uploads (id, user_id, original_filename, file_extension,
                         file_size_bytes, sha256, storage_path)
        VALUES ('{UPLOAD}', '{A}', 'test.xlsx', 'xlsx', 100, repeat('a', 64), 'test.xlsx');
    INSERT INTO categories (id, user_id, name) VALUES
        ('{OWN}', '{A}', 'Pessoal A'), ('{OTHER}', '{B}', 'Pessoal B'),
        ('{GLOBAL}', NULL, 'Global teste');
"""


def transaction(category="NULL", current="NULL", total="NULL", bronze="NULL"):
    return f"""
        INSERT INTO transactions (id, user_id, upload_id, transaction_date,
            description_raw, amount, source_row, category_id,
            installment_current, installment_total, bronze_row_id)
        VALUES ('{TRANSACTION}', '{A}', '{UPLOAD}', '2026-10-01', 'Compra',
            10.00, 1, {category}, {current}, {total}, {bronze});
    """


def rule(category):
    return f"""
        INSERT INTO category_rules (user_id, category_id, match_type, match_value)
        VALUES ('{A}', '{category}', 'merchant', 'Loja');
    """


def assert_rejected(db, statements, state):
    result = db.sql(SETUP + statements + "ROLLBACK;", check=False)
    assert result.returncode != 0, "The database accepted an invalid operation."
    assert state in result.stderr, result.stderr


def test_delete_bronze_preserves_transaction_owner(database):
    result = database.sql(SETUP + f"""
        INSERT INTO bronze_rows (id, user_id, upload_id, row_number, raw_data)
            VALUES ('{BRONZE}', '{A}', '{UPLOAD}', 1, '{{}}');
    """ + transaction(bronze=f"'{BRONZE}'") + f"""
        DELETE FROM bronze_rows WHERE id = '{BRONZE}';
        SELECT user_id = '{A}' AND upload_id = '{UPLOAD}' AND bronze_row_id IS NULL
            FROM transactions WHERE id = '{TRANSACTION}';
        ROLLBACK;
    """)
    assert result.stdout.strip() == "t"


@pytest.mark.parametrize("current,total", [("NULL", "3"), ("1", "NULL"), ("0", "3"), ("-1", "3"), ("4", "3"), ("1", "0")])
def test_invalid_installments_rejected(database, current, total):
    assert_rejected(database, transaction(current=current, total=total), "23514")


@pytest.mark.parametrize("current,total", [("NULL", "NULL"), ("1", "3"), ("3", "3")])
def test_valid_installments_accepted(database, current, total):
    database.sql(SETUP + transaction(current=current, total=total) + "ROLLBACK;")


@pytest.mark.parametrize("category", [OWN, GLOBAL])
@pytest.mark.parametrize("kind", ["transaction", "rule"])
def test_allowed_categories(database, category, kind):
    statement = transaction(category=f"'{category}'") if kind == "transaction" else rule(category)
    database.sql(SETUP + statement + "ROLLBACK;")


@pytest.mark.parametrize("kind", ["transaction", "rule"])
def test_foreign_category_rejected_on_insert(database, kind):
    statement = transaction(category=f"'{OTHER}'") if kind == "transaction" else rule(OTHER)
    assert_rejected(database, statement, "23514")


@pytest.mark.parametrize("kind", ["transaction", "rule"])
def test_foreign_category_rejected_on_update(database, kind):
    statement = transaction(category=f"'{OWN}'") if kind == "transaction" else rule(OWN)
    table = "transactions" if kind == "transaction" else "category_rules"
    assert_rejected(database, statement + f"UPDATE {table} SET category_id = '{OTHER}';", "23514")


def test_rule_owner_change_rejected(database):
    assert_rejected(database, rule(OWN) + f"UPDATE category_rules SET user_id = '{B}';", "23514")


@pytest.mark.parametrize("category,new_owner", [(OWN, f"'{B}'"), (GLOBAL, f"'{B}'"), (OWN, "NULL")])
def test_category_owner_is_immutable(database, category, new_owner):
    assert_rejected(database, f"UPDATE categories SET user_id = {new_owner} WHERE id = '{category}';", "23514")


def test_category_details_remain_editable(database):
    database.sql(SETUP + f"UPDATE categories SET name = 'Renomeada', color = '#123456', is_active = false WHERE id = '{OWN}'; ROLLBACK;")


def test_same_row_number_in_different_sheets(database):
    result = database.sql(SETUP + f"""
        INSERT INTO bronze_rows (user_id, upload_id, row_number, sheet_name, raw_data)
        VALUES ('{A}', '{UPLOAD}', 1, 'Junho', '{{}}'),
               ('{A}', '{UPLOAD}', 1, 'Julho', '{{}}');
        SELECT count(*) FROM bronze_rows;
        ROLLBACK;
    """)
    assert result.stdout.strip() == "2"


@pytest.mark.parametrize("sheet", ["'Junho'", "NULL"])
def test_duplicate_row_in_same_sheet_or_csv_rejected(database, sheet):
    assert_rejected(database, f"""
        INSERT INTO bronze_rows (user_id, upload_id, row_number, sheet_name, raw_data)
        VALUES ('{A}', '{UPLOAD}', 1, {sheet}, '{{}}'),
               ('{A}', '{UPLOAD}', 1, {sheet}, '{{}}');
    """, "23505")


def test_seed_categories_are_complete_and_repeatable(database):
    expected = "Alimentação|Assinaturas|Compras|Educação|Lazer|Moradia|Outros|Saúde|Serviços|Transporte|Viagens"
    result = database.sql("""
        SELECT string_agg(name, '|' ORDER BY name COLLATE "C")
            FROM categories WHERE user_id IS NULL;
    """)
    assert result.stdout.strip() == expected
    database.script(ROOT / "scripts/sql/seed_categories.sql")
    assert database.sql("SELECT count(*) FROM categories WHERE user_id IS NULL;").stdout.strip() == "11"


def test_delete_upload_cascades_consistently(database):
    result = database.sql(SETUP + f"""
        INSERT INTO bronze_rows (id, user_id, upload_id, row_number, raw_data)
            VALUES ('{BRONZE}', '{A}', '{UPLOAD}', 1, '{{}}');
    """ + transaction(bronze=f"'{BRONZE}'") + f"""
        DELETE FROM uploads WHERE id = '{UPLOAD}';
        SELECT (SELECT count(*) FROM transactions) + (SELECT count(*) FROM bronze_rows);
        ROLLBACK;
    """)
    assert result.stdout.strip() == "0"


def test_transaction_owner_change_rejected(database):
    assert_rejected(database, transaction(category=f"'{OWN}'") + f"""
        INSERT INTO uploads (id, user_id, original_filename, file_extension,
                             file_size_bytes, sha256, storage_path)
        VALUES ('00000000-0000-0000-0000-000000000011', '{B}', 'b.csv',
            'csv', 100, repeat('b', 64), 'b.csv');
        UPDATE transactions SET user_id = '{B}',
            upload_id = '00000000-0000-0000-0000-000000000011';
    """, "23514")


def test_delete_category_clears_transaction_and_removes_rules(database):
    result = database.sql(SETUP + transaction(category=f"'{OWN}'") + rule(OWN) + f"""
        DELETE FROM categories WHERE id = '{OWN}';
        SELECT (SELECT category_id IS NULL FROM transactions WHERE id = '{TRANSACTION}')
            AND (SELECT count(*) = 0 FROM category_rules);
        ROLLBACK;
    """)
    assert result.stdout.strip() == "t"


@pytest.mark.parametrize("invalid", ["installments", "transaction_category", "rule_category"])
def test_upgrade_rejects_invalid_existing_data_atomically(legacy_database, invalid):
    db = legacy_database
    definition = "SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid = 'transactions'::regclass ORDER BY conname;"
    before = db.sql(definition).stdout
    statement = {
        "installments": transaction(current="NULL", total="3"),
        "transaction_category": transaction(category=f"'{OTHER}'"),
        "rule_category": rule(OTHER),
    }[invalid]
    db.sql(SETUP + statement + "COMMIT;")
    result = db.script(ROOT / "scripts/migrations/001_integrity.sql", check=False)
    assert result.returncode != 0
    assert "23514" in result.stderr, result.stderr
    assert db.sql(definition).stdout == before
    table = "category_rules" if invalid == "rule_category" else "transactions"
    assert db.sql(f"SELECT count(*) FROM {table};").stdout.strip() == "1"


def test_upgrade_preserves_existing_valid_data(legacy_database):
    db = legacy_database
    db.sql(SETUP + transaction(category=f"'{OWN}'", current="1", total="3") + rule(OWN) + "COMMIT;")
    db.script(ROOT / "scripts/migrations/001_integrity.sql")
    result = db.sql(f"""
        SELECT user_id = '{A}' AND category_id = '{OWN}' AND amount = 10.00
            AND installment_current = 1 AND installment_total = 3
        FROM transactions WHERE id = '{TRANSACTION}';
    """)
    assert result.stdout.strip() == "t"
    assert db.sql("SELECT count(*) FROM category_rules;").stdout.strip() == "1"


def test_orm_constraints_work_in_postgresql(postgres_cluster):
    postgres_cluster.sql("CREATE DATABASE integrity_orm;")
    db = type(postgres_cluster)(postgres_cluster.binaries, postgres_cluster.port, "integrity_orm")
    statements = []
    engine = create_mock_engine("postgresql://", lambda sql, *a, **kw: statements.append(str(sql.compile(dialect=engine.dialect))))
    Base.metadata.create_all(engine)
    db.sql(";\n".join(statements) + ";")
    db.script(ROOT / "scripts/sql/category_integrity.sql")
    test_delete_bronze_preserves_transaction_owner(db)
    test_invalid_installments_rejected(db, "NULL", "3")
    test_same_row_number_in_different_sheets(db)
    test_duplicate_row_in_same_sheet_or_csv_rejected(db, "NULL")
    test_foreign_category_rejected_on_insert(db, "transaction")
