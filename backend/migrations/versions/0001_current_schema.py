"""Esquema existente: incorpora init.sql e as atualizações SQL 001 e 002.

Revision ID: 0001_current_schema
Revises: None

A cópia SQL é imutável: não depende dos modelos nem dos scripts legados,
que podem mudar nas próximas versões. Bancos já instalados usam a adoção
validada descrita em docs/database-setup.md.
"""

from pathlib import Path

from alembic import op
from alembic.util import CommandError

revision = "0001_current_schema"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    snapshot = Path(__file__).with_name("0001_current_schema.sql")
    op.execute(snapshot.read_text(encoding="utf-8"))


def downgrade() -> None:
    # Esta base também representa bancos adotados com dados anteriores ao Alembic.
    raise CommandError(
        "A revisão inicial não pode ser desfeita automaticamente: isso apagaria "
        "as tabelas e os dados existentes. Use um backup para restaurar o banco."
    )
