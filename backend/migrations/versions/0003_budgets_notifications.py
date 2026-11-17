"""Limites mensais e memória das faixas notificadas."""

from alembic import op
import sqlalchemy as sa

revision = "0003_budgets_notifications"
down_revision = "0002_financial_core"
branch_labels = depends_on = None


def upgrade():
    op.create_table("category_budgets",
        sa.Column("id", sa.Uuid(), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("code", sa.BigInteger(), sa.Identity(always=True), nullable=False, unique=True,
                  comment="Código numérico de consulta, único nesta tabela. Os relacionamentos usam o UUID id."),
        sa.Column("user_id", sa.Uuid(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("category_id", sa.Uuid(), sa.ForeignKey("categories.id", ondelete="CASCADE"), nullable=False),
        sa.Column("period", sa.Text(), nullable=False, server_default=sa.text("'monthly'")),
        sa.Column("amount", sa.Numeric(14, 2), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.UniqueConstraint("user_id", "category_id", "period", name="category_budgets_user_category_period_uq"),
        sa.CheckConstraint("period = 'monthly'", name="category_budgets_period_valid"),
        sa.CheckConstraint("amount > 0", name="category_budgets_amount_positive"))
    op.create_table("notifications",
        sa.Column("id", sa.Uuid(), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("code", sa.BigInteger(), sa.Identity(always=True), nullable=False, unique=True,
                  comment="Código numérico de consulta, único nesta tabela. Os relacionamentos usam o UUID id."),
        sa.Column("user_id", sa.Uuid(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("category_id", sa.Uuid(), sa.ForeignKey("categories.id", ondelete="CASCADE"), nullable=False),
        sa.Column("month", sa.CHAR(7), nullable=False),
        sa.Column("threshold", sa.Integer(), nullable=False),
        sa.Column("amount", sa.Numeric(14, 2), nullable=False),
        sa.Column("limit_amount", sa.Numeric(14, 2), nullable=False),
        sa.Column("read_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.UniqueConstraint("user_id", "category_id", "month", "threshold", name="notifications_month_threshold_uq"),
        sa.CheckConstraint("month ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'", name="notifications_month_valid"),
        sa.CheckConstraint("threshold IN (80, 100)", name="notifications_threshold_valid"))
    op.create_index("notifications_user_created_at_idx", "notifications", ["user_id", sa.text("created_at DESC")])
    for table in ("category_budgets", "notifications"):
        op.execute(f"CREATE TRIGGER {table}_category_owner_guard BEFORE INSERT OR UPDATE OF category_id,user_id ON {table} FOR EACH ROW EXECUTE FUNCTION public.enforce_category_owner()")


def downgrade():
    op.drop_table("notifications")
    op.drop_table("category_budgets")
