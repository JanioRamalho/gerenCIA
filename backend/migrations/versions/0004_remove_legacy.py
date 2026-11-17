"""Retira estruturas sem consumidores, preservando metadados comprováveis.

Bruto ou mapeamento não vazio interrompem a operação. Esta revisão não inventa
uma conversão para conteúdo que o modelo final não sabe representar.
"""

import json

from alembic import op
from alembic.util import CommandError
import sqlalchemy as sa

revision = "0004_remove_legacy"
down_revision = "0003_budgets_notifications"
branch_labels = depends_on = None
SNAPSHOT = "legacy_before_0004"
UPLOAD_FIELDS = ("storage_path", "status", "error_message", "processing_started_at", "processing_finished_at")


def _guard(connection, query, reason):
    if connection.scalar(sa.text(query)):
        raise CommandError("Retirada de legados interrompida: " + reason + " Preserve uma cópia de segurança e resolva a origem antes de tentar novamente.")


def upgrade():
    if op.get_context().as_sql:
        raise CommandError("A retirada de legados exige conexão explícita para conferir os dados; SQL offline não é suficiente.")
    connection = op.get_bind()
    # A conferência e a transferência veem o mesmo conjunto de dados.
    connection.execute(sa.text("LOCK TABLE uploads, transactions, bronze_rows, upload_mappings, quality_checks, rejected_rows IN ACCESS EXCLUSIVE MODE"))
    _guard(connection, "SELECT EXISTS(SELECT 1 FROM bronze_rows WHERE raw_data <> '{}'::jsonb)",
           "há conteúdo bruto não vazio sem representação validada no modelo final.")
    _guard(connection, "SELECT EXISTS(SELECT 1 FROM upload_mappings WHERE mapping <> '{}'::jsonb)",
           "há mapeamento não vazio sem conversão validada.")
    _guard(connection, """SELECT EXISTS(SELECT 1 FROM transactions t JOIN bronze_rows b ON b.id=t.bronze_row_id
        WHERE t.source_row <> b.row_number OR
        (t.source_sheet IS NOT NULL AND b.sheet_name IS NOT NULL AND t.source_sheet <> b.sheet_name))""",
           "a linha ou folha da transação diverge da origem Bronze; não é seguro escolher uma delas automaticamente.")
    _guard(connection, f"SELECT EXISTS(SELECT 1 FROM quality_checks WHERE details ? '{SNAPSHOT}')",
           "já existe um registro de preservação com a mesma chave; ele não será sobrescrito.")

    uploads = connection.execute(sa.text("SELECT id,user_id,storage_path,status,error_message,processing_started_at,processing_finished_at FROM uploads")).mappings().all()
    for upload in uploads:
        params = {"upload": upload["id"]}
        bronze = connection.execute(sa.text("""SELECT b.id,b.code,b.row_number,b.sheet_name,b.row_hash,b.ingested_at,t.id AS transaction_id
            FROM bronze_rows b LEFT JOIN transactions t ON t.bronze_row_id=b.id
            WHERE b.upload_id=:upload ORDER BY b.code"""), params).mappings().all()
        mappings = connection.execute(sa.text("SELECT id,code,confirmed_at,created_at FROM upload_mappings WHERE upload_id=:upload"), params).mappings().all()
        snapshot = dict(upload={field: upload[field] for field in UPLOAD_FIELDS},
                        bronze=[dict(row) for row in bronze], mappings=[dict(row) for row in mappings])
        saved = connection.execute(sa.text("SELECT id,details FROM quality_checks WHERE upload_id=:upload AND attempt_number=1"), params).mappings().first()
        details = dict(saved["details"]) if saved else {}
        details[SNAPSHOT] = snapshot
        # JSONB preserva UUIDs, códigos, tempos e referência de origem; não guarda o bruto.
        encoded = json.dumps(details, default=str, ensure_ascii=False)
        if saved:
            connection.execute(sa.text("UPDATE quality_checks SET details=CAST(:details AS jsonb) WHERE id=:id"),
                               dict(id=saved["id"], details=encoded))
        else:
            valid, duplicates = connection.execute(sa.text("SELECT count(*),count(*) FILTER(WHERE is_duplicate) FROM transactions WHERE upload_id=:upload"), params).one()
            rejected = connection.scalar(sa.text("SELECT count(DISTINCT source_row) FROM rejected_rows WHERE upload_id=:upload"), params)
            details["migration_metadata_only"] = True
            details["contexto"] = "Contagens dos registros persistidos; a qualidade e os totais originais não foram inferidos."
            connection.execute(sa.text("""INSERT INTO quality_checks(user_id,upload_id,total_rows,valid_rows,rejected_rows,duplicate_rows,quality_percentage,details)
                VALUES(:user,:upload,:total,:valid,:rejected,:duplicates,NULL,CAST(:details AS jsonb))"""),
                dict(user=upload["user_id"], upload=upload["id"], total=valid+rejected, valid=valid, rejected=rejected,
                     duplicates=duplicates, details=json.dumps(details, default=str, ensure_ascii=False)))

    connection.execute(sa.text("""UPDATE transactions t SET source_sheet=b.sheet_name
        FROM bronze_rows b WHERE t.bronze_row_id=b.id AND t.source_sheet IS NULL"""))
    op.drop_constraint("transactions_bronze_row_fk", "transactions", type_="foreignkey")
    op.drop_index("transactions_bronze_row_uq", table_name="transactions")
    op.drop_column("transactions", "bronze_row_id")
    op.drop_table("bronze_rows")
    op.drop_table("upload_mappings")
    op.drop_index("uploads_user_status_idx", table_name="uploads")
    op.drop_constraint("uploads_status_valid", "uploads", type_="check")
    for field in UPLOAD_FIELDS:
        op.drop_column("uploads", field)


def downgrade():
    raise CommandError("A restauração do esquema legado exige a cópia de segurança; esta revisão não promete reconstruir bruto ou mapeamentos removidos.")
