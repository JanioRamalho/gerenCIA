"""Confere o banco instalado pelo SQL antigo; --apply adota e atualiza sem recriar tabelas.

Sem --apply, só inspeciona. Credenciais vêm do .env e nunca são impressas.
"""
import argparse
import json
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))

from alembic import command
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.exc import SQLAlchemyError

from app.db.migrations import migration_config, migration_database_url


def validate_legacy(connection):
    expected = json.loads((ROOT / "backend/migrations/sql/0001_schema.json").read_text(encoding="utf-8"))
    inspector = inspect(connection)
    tables = set(inspector.get_table_names())
    problems = []
    for table, spec in expected.items():
        if table not in tables:
            problems.append(f"Tabela ausente: {table}")
            continue
        columns = {item["name"] for item in inspector.get_columns(table)}
        missing = set(spec["columns"]) - columns
        if missing:
            problems.append(f"Colunas ausentes em {table}: {', '.join(sorted(missing))}")
        checks = {item["name"] for item in inspector.get_check_constraints(table)}
        checks |= {item["name"] for item in inspector.get_foreign_keys(table)}
        checks |= {item["name"] for item in inspector.get_unique_constraints(table)}
        indexes = {item["name"] for item in inspector.get_indexes(table)}
        missing = (set(spec["constraints"]) | set(spec["indexes"])) - (checks | indexes)
        if missing:
            problems.append(f"Proteções ausentes em {table}: {', '.join(sorted(missing))}")
    triggers = set(connection.execute(text(
        "SELECT tgname FROM pg_trigger WHERE NOT tgisinternal AND "
        "tgrelid IN ('categories'::regclass, 'transactions'::regclass, 'category_rules'::regclass)"
    )).scalars()) if set(expected) <= tables else set()
    required = {"transactions_category_owner_guard", "category_rules_category_owner_guard", "categories_owner_immutable"}
    if required - triggers:
        problems.append("Triggers de isolamento ausentes; aplique as atualizações SQL históricas primeiro.")
    if problems:
        raise RuntimeError("\n".join(problems))


def adopt(connection, *, apply=False):
    if apply:
        can_create = connection.execute(text(
            "SELECT has_schema_privilege(current_user, 'public', 'CREATE')"
        )).scalar()
        owns_tables = connection.execute(text(
            "SELECT bool_and(pg_has_role(current_user, c.relowner, 'USAGE')) "
            "FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace "
            "WHERE n.nspname = 'public' AND c.relkind = 'r'"
        )).scalar()
        if not can_create or owns_tables is False:
            raise RuntimeError(
                "A conexão não tem permissão para criar ou alterar as tabelas. "
                "Configure MIGRATION_DATABASE_URL no .env com o proprietário "
                "das tabelas do mesmo banco. DATABASE_URL continua sendo a conexão da API."
            )
    inspector = inspect(connection)
    if "alembic_version" in inspector.get_table_names():
        version = connection.execute(text("SELECT version_num FROM alembic_version")).scalar()
        if version:
            if apply:
                command.upgrade(migration_config(connection=connection), "head")
            return "Banco já versionado pelo Alembic."
    validate_legacy(connection)
    if apply:
        config = migration_config(connection=connection)
        command.stamp(config, "0001_baseline")
        command.upgrade(config, "head")
        return "Banco adotado e atualizado; registros existentes preservados."
    return "Estrutura histórica conferida. Para registrar a versão e atualizar, execute com --apply."


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()
    engine = None
    try:
        engine = create_engine(migration_database_url())
        with engine.begin() as connection:
            result = adopt(connection, apply=args.apply)
        print(result)
    except RuntimeError as exc:
        print(str(exc), file=sys.stderr)
        sys.exit(1)
    except (SQLAlchemyError, ValueError):
        print("Não foi possível acessar ou atualizar o banco. Confira a conexão, "
              "as permissões e a disponibilidade do PostgreSQL. Nenhuma adoção parcial foi confirmada.",
              file=sys.stderr)
        sys.exit(1)
    finally:
        if engine is not None:
            engine.dispose()
