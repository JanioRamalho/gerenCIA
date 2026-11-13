"""Instala ou atualiza o banco com Alembic, sem depender do executável psql.

Mantém o comando antigo de instalação usando o fluxo atual de migrações.
Para bancos existentes sem versão, use adopt_alembic.py primeiro.
"""
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))

from alembic import command
from sqlalchemy.exc import SQLAlchemyError

from app.db.migrations import migration_config


def main():
    try:
        command.upgrade(migration_config(), "head")
    except RuntimeError as exc:
        print(str(exc), file=sys.stderr)
        return 1
    except (SQLAlchemyError, ValueError):
        print("Não foi possível instalar o banco. Confira a conexão e as permissões de migração.", file=sys.stderr)
        return 1
    print("Banco atualizado pelo Alembic.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
