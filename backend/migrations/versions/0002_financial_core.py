"""Metadados de origem e semântica financeira, preservando os registros existentes."""

from alembic import op
import sqlalchemy as sa

revision = "0002_financial_core"
down_revision = "0001_current_schema"
branch_labels = depends_on = None


def upgrade():
    for name, column_type in (("source_format", sa.Text()), ("document_type", sa.Text()),
                              ("period_start", sa.Date()), ("period_end", sa.Date())):
        op.add_column("uploads", sa.Column(name, column_type, nullable=True))
    op.create_check_constraint("uploads_document_type_valid", "uploads", "document_type IS NULL OR document_type IN ('fatura', 'extrato')")
    op.drop_constraint("transactions_type_valid", "transactions", type_="check")
    op.create_check_constraint("transactions_type_valid", "transactions", "transaction_type IN ('purchase', 'fee', 'refund', 'payment', 'income', 'other')")
    op.add_column("transactions", sa.Column("bank_transaction_id", sa.Text(), nullable=True))
    op.add_column("transactions", sa.Column("source_sheet", sa.Text(), nullable=True))
    op.add_column("transactions", sa.Column("balance", sa.Numeric(14, 2), nullable=True))
    op.add_column("transactions", sa.Column("is_suspected_duplicate", sa.Boolean(), nullable=False, server_default=sa.text("false")))
    op.create_index("transactions_user_bank_id_idx", "transactions", ["user_id", "bank_transaction_id"])


def downgrade():
    # Os metadados de origem e naturezas novos não são reconstruíveis após remoção.
    from alembic.util import CommandError
    raise CommandError("Restaure uma cópia de segurança para voltar sem perder metadados financeiros.")
