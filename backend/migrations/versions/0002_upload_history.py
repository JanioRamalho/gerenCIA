"""Metadados do histórico e suporte à importação de extratos e faturas."""
from alembic import op
import sqlalchemy as sa

revision = "0002_upload_history"
down_revision = "0001_baseline"
branch_labels = None
depends_on = None


def upgrade():
    op.alter_column("uploads", "storage_path", nullable=True)
    op.add_column("uploads", sa.Column("document_type", sa.Text(), nullable=True))
    op.add_column("uploads", sa.Column("recognized_format", sa.Text(), nullable=True))
    op.add_column("uploads", sa.Column("period_start", sa.Date(), nullable=True))
    op.add_column("uploads", sa.Column("period_end", sa.Date(), nullable=True))
    op.create_check_constraint("uploads_document_type_valid", "uploads",
                               "document_type IS NULL OR document_type IN ('bank_statement', 'credit_card_invoice')")
    # NOT VALID preserva arquivos históricos maiores; novas gravações respeitam 5 MiB.
    op.drop_constraint("uploads_file_size_valid", "uploads", type_="check")
    op.execute("ALTER TABLE uploads ADD CONSTRAINT uploads_file_size_valid "
               "CHECK (file_size_bytes > 0 AND file_size_bytes <= 5242880) NOT VALID")
    op.drop_constraint("transactions_type_valid", "transactions", type_="check")
    op.create_check_constraint("transactions_type_valid", "transactions",
                               "transaction_type IN ('purchase', 'fee', 'refund', 'payment', 'income', 'other')")
    op.add_column("transactions", sa.Column("bank_transaction_id", sa.Text(), nullable=True))
    op.create_index("transactions_user_bank_id_idx", "transactions", ["user_id", "bank_transaction_id"])


def downgrade():
    # Não remover colunas com informações de importações já realizadas.
    connection = op.get_bind()
    if connection.execute(sa.text("SELECT EXISTS (SELECT 1 FROM uploads WHERE document_type IS NOT NULL)")).scalar():
        raise RuntimeError("Há importações com dados novos. A reversão apagaria seus metadados.")
    if connection.execute(sa.text("SELECT EXISTS (SELECT 1 FROM transactions WHERE transaction_type = 'income')")).scalar():
        raise RuntimeError("Há receitas cadastradas; a versão anterior não aceita esse tipo.")
    op.drop_index("transactions_user_bank_id_idx", "transactions")
    op.drop_column("transactions", "bank_transaction_id")
    op.drop_constraint("transactions_type_valid", "transactions", type_="check")
    op.create_check_constraint("transactions_type_valid", "transactions",
                               "transaction_type IN ('purchase', 'fee', 'refund', 'payment', 'other')")
    op.drop_constraint("uploads_file_size_valid", "uploads", type_="check")
    op.create_check_constraint("uploads_file_size_valid", "uploads", "file_size_bytes > 0 AND file_size_bytes <= 26214400")
    op.drop_constraint("uploads_document_type_valid", "uploads", type_="check")
    for column in ("period_end", "period_start", "recognized_format", "document_type"):
        op.drop_column("uploads", column)
    # storage_path continua opcional: não se inventa um caminho para registros antigos.
