"""Esquema histórico, incluindo integridade, códigos e categorias iniciais."""
from pathlib import Path

from alembic import context, op
import sqlalchemy as sa

revision = "0001_baseline"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    if not context.is_offline_mode() and sa.inspect(op.get_bind()).get_table_names():
        tables = set(sa.inspect(op.get_bind()).get_table_names()) - {"alembic_version"}
        if tables:
            raise RuntimeError(
                "O banco já contém tabelas. Use scripts/adopt_alembic.py para verificar "
                "e adotar o esquema existente sem recriá-lo."
            )
    snapshot = Path(__file__).resolve().parents[1] / "sql" / "0001_baseline.sql"
    op.execute(sa.text(snapshot.read_text(encoding="utf-8")))
    op.execute("SET LOCAL search_path TO public")


def downgrade():
    raise RuntimeError("A base histórica é preservada; downgrade para base apagaria os dados.")
