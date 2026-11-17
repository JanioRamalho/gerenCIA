"""Evolução do banco anterior sem reescrever a revisão histórica."""

import pytest
from alembic import command
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from alembic.util import CommandError

from test_alembic import alembic_config, migration_database, migration_engine
from test_database_integrity import A, B, UPLOAD, BRONZE, OWN, OTHER, SETUP, HEAD_SETUP, TRANSACTION, transaction, head_transaction


def test_financial_upgrade_preserves_values_ids_and_historical_unknowns(migration_engine):
    with migration_engine.begin() as connection:
        config = alembic_config(connection)
        command.upgrade(config, "0001_current_schema")
        connection.exec_driver_sql(SETUP + transaction(category=f"'{OWN}'") + "COMMIT;")
    with migration_engine.begin() as connection:
        before = connection.execute(text("SELECT id,code,amount,source_row,transaction_type FROM transactions")).one()
        command.upgrade(alembic_config(connection), "head")
        assert connection.execute(text("SELECT id,code,amount,source_row,transaction_type FROM transactions")).one() == before
        assert connection.execute(text("SELECT bank_transaction_id,balance,source_sheet FROM transactions")).one() == (None, None, None)
        assert connection.scalar(text("SELECT count(*) FROM users")) == 2
        assert connection.scalar(text("SELECT count(*) FROM category_budgets")) == 0
        command.check(alembic_config(connection))


def test_financial_schema_accepts_income_and_preserves_category_ownership(migration_engine):
    with migration_engine.begin() as connection:
        command.upgrade(alembic_config(connection), "head")
        connection.exec_driver_sql(HEAD_SETUP + head_transaction(category=f"'{OWN}'") + "COMMIT;")
    with migration_engine.begin() as connection:
        connection.execute(text("UPDATE transactions SET transaction_type='income' WHERE id=:id"), {"id": TRANSACTION})
        connection.execute(text("INSERT INTO category_budgets (user_id,category_id,amount) VALUES (:u,:c,100)"), {"u": A, "c": OWN})
    with pytest.raises(IntegrityError):
        with migration_engine.begin() as connection:
            connection.execute(text("INSERT INTO category_budgets (user_id,category_id,amount) VALUES (:u,:c,100)"), {"u": A, "c": OTHER})


def test_notification_memory_survives_budget_removal_and_account_cascades(migration_engine):
    with migration_engine.begin() as connection:
        command.upgrade(alembic_config(connection), "head")
        connection.exec_driver_sql(HEAD_SETUP + "COMMIT;")
    with migration_engine.begin() as connection:
        params = {"u": A, "c": OWN}
        connection.execute(text("INSERT INTO category_budgets (user_id,category_id,amount) VALUES (:u,:c,100)"), params)
        connection.execute(text("INSERT INTO notifications (user_id,category_id,month,threshold,amount,limit_amount) VALUES (:u,:c,'2026-11',80,80,100)"), params)
        connection.execute(text("DELETE FROM category_budgets"))
        assert connection.scalar(text("SELECT count(*) FROM notifications")) == 1
    with pytest.raises(IntegrityError):
        with migration_engine.begin() as connection:
            connection.execute(text("INSERT INTO notifications (user_id,category_id,month,threshold,amount,limit_amount) VALUES (:u,:c,'2026-11',80,90,100)"), params)
    with migration_engine.begin() as connection:
        connection.execute(text("DELETE FROM users WHERE id=:id"), {"id": A})
        assert connection.scalar(text("SELECT count(*) FROM notifications")) == 0
        assert str(connection.scalar(text("SELECT id FROM users"))) == B


def legacy_origin(connection, *, raw="{}", mapping="{}", row=1):
    connection.exec_driver_sql(SETUP + f"""
        INSERT INTO bronze_rows(id,user_id,upload_id,row_number,sheet_name,raw_data,row_hash)
        VALUES('{BRONZE}','{A}','{UPLOAD}',{row},'Folha antiga','{raw}',repeat('d',64));
        INSERT INTO upload_mappings(user_id,upload_id,mapping) VALUES('{A}','{UPLOAD}','{mapping}');
    """ + transaction(category=f"'{OWN}'", bronze=f"'{BRONZE}'") + "COMMIT;")


def test_legacy_removal_preserves_traceability_and_existing_quality_identity(migration_engine):
    with migration_engine.begin() as c:
        command.upgrade(alembic_config(c), "0003_budgets_notifications")
        legacy_origin(c)
    with migration_engine.begin() as c:
        c.execute(text("""INSERT INTO quality_checks(user_id,upload_id,total_rows,valid_rows,quality_percentage,details)
            VALUES(:user,:upload,1,1,100,CAST(:details AS jsonb))"""), dict(user=A,upload=UPLOAD,details='{"original":true}'))
        original = c.execute(text("SELECT id,code,amount,source_row FROM transactions")).one()
        quality = c.execute(text("SELECT id,code,quality_percentage FROM quality_checks")).one()
        bronze = c.execute(text("SELECT id,code,row_hash FROM bronze_rows")).one()
        mapping = c.execute(text("SELECT id,code FROM upload_mappings")).one()
        command.upgrade(alembic_config(c), "head")
        assert c.execute(text("SELECT id,code,amount,source_row FROM transactions")).one() == original
        assert c.execute(text("SELECT id,code,quality_percentage FROM quality_checks")).one() == quality
        assert c.scalar(text("SELECT source_sheet FROM transactions")) == "Folha antiga"
        details = c.scalar(text("SELECT details FROM quality_checks"))
        assert details["original"] is True
        saved = details["legacy_before_0004"]
        assert saved["upload"]["storage_path"] == "test.xlsx"
        assert saved["bronze"][0]["id"] == str(bronze.id) and saved["bronze"][0]["code"] == bronze.code
        assert saved["bronze"][0]["row_hash"] == bronze.row_hash
        assert saved["mappings"][0]["id"] == str(mapping.id) and saved["mappings"][0]["code"] == mapping.code
        assert c.scalar(text("SELECT to_regclass('bronze_rows')")) is None
        assert c.scalar(text("SELECT to_regclass('upload_mappings')")) is None
        removed = c.scalars(text("""SELECT column_name FROM information_schema.columns WHERE table_name='uploads'
            AND column_name IN('storage_path','status','error_message','processing_started_at','processing_finished_at')""")).all()
        assert removed == []
        command.check(alembic_config(c))


@pytest.mark.parametrize("case,reason", [("raw", "bruto"), ("mapping", "mapeamento"), ("row", "diverge"), ("sheet", "diverge")])
def test_legacy_removal_refuses_unpreserved_data_atomically(migration_engine, case, reason):
    with migration_engine.begin() as c:
        command.upgrade(alembic_config(c), "0003_budgets_notifications")
        legacy_origin(c, raw='{"descricao":"conteúdo sem conversão"}' if case == "raw" else "{}",
                      mapping='{"valor":"amount"}' if case == "mapping" else "{}", row=2 if case == "row" else 1)
    if case == "sheet":
        with migration_engine.begin() as c:
            c.execute(text("UPDATE transactions SET source_sheet='Outra folha'"))
    with pytest.raises(CommandError, match=reason):
        with migration_engine.begin() as c:
            command.upgrade(alembic_config(c), "head")
    with migration_engine.connect() as c:
        assert c.scalar(text("SELECT version_num FROM alembic_version")) == "0003_budgets_notifications"
        assert c.scalar(text("SELECT count(*) FROM transactions")) == 1
        assert c.scalar(text("SELECT count(*) FROM bronze_rows")) == 1
        assert c.scalar(text("SELECT count(*) FROM quality_checks")) == 0
        assert c.scalar(text("SELECT storage_path FROM uploads")) == "test.xlsx"


def test_metadata_only_snapshot_does_not_invent_original_quality(migration_engine):
    with migration_engine.begin() as c:
        command.upgrade(alembic_config(c), "0003_budgets_notifications")
        legacy_origin(c)
    with migration_engine.begin() as c:
        command.upgrade(alembic_config(c), "head")
        report = c.execute(text("SELECT valid_rows,total_rows,quality_percentage,details FROM quality_checks")).one()
        assert report.valid_rows == report.total_rows == 1
        assert report.quality_percentage is None
        assert report.details["migration_metadata_only"] is True
        assert report.details["legacy_before_0004"]["bronze"][0]["transaction_id"] == TRANSACTION
