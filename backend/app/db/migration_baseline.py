"""Confere o esquema legado antes de registrá-lo na base do Alembic.

A assinatura foi obtida em PostgreSQL 18 a partir do instalador SQL atual.
Ela compara estrutura, não dados, donos, permissões ou valores de sequências.
Não usa Base.metadata: a revisão inicial deve continuar fixa quando os modelos
mudarem. Só as tabelas e funções gerenciadas pelo gerenCIA são comparadas.
"""

import hashlib
import json
from alembic import command
from alembic.config import Config
from alembic.runtime.migration import MigrationContext
from sqlalchemy import text
from sqlalchemy.engine import Connection

from app.db.config import PROJECT_ROOT

BASELINE_REVISION = "0001_current_schema"
SIGNATURE_PATH = PROJECT_ROOT / "backend/migrations/0001_schema_signature.json"
TABLES = (
    "users", "sessions", "uploads", "upload_mappings", "bronze_rows",
    "categories", "transactions", "category_rules", "quality_checks", "rejected_rows",
)


class IncompatibleSchema(ValueError):
    """O banco não corresponde à revisão inicial; nenhuma versão é registrada."""


def _digest(connection: Connection, query: str, **params) -> str:
    # O psql do Windows preserva CRLF no corpo de funções; psycopg usa LF.
    # Normalize só as quebras, sem ignorar mudanças nas regras SQL.
    rows = [
        [value.replace("\r\n", "\n") if isinstance(value, str) else value for value in row]
        for row in connection.execute(text(query), params)
    ]
    encoded = json.dumps(rows, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
    return hashlib.sha256(encoded).hexdigest()


def schema_signature(connection: Connection) -> dict:
    """Assina colunas, restrições, índices, triggers e funções em ordem estável."""
    # As funções pg_get_* dependem do search_path para qualificar os nomes.
    previous_path = connection.scalar(text("SHOW search_path"))
    connection.execute(text("SELECT set_config('search_path', 'pg_catalog, public', true)"))
    try:
        tables = {}
        for table in TABLES:
            oid = connection.scalar(text("SELECT to_regclass(:name)::oid"), {"name": f"public.{table}"})
            if oid is None:
                tables[table] = None
                continue
            tables[table] = {
                "columns": _digest(connection, """
                    SELECT a.attname, format_type(a.atttypid, a.atttypmod),
                        a.attnotnull, coalesce(pg_get_expr(d.adbin, d.adrelid), ''),
                        a.attidentity, a.attgenerated, coalesce(c.collname, '')
                    FROM pg_attribute a
                    LEFT JOIN pg_attrdef d ON d.adrelid = a.attrelid AND d.adnum = a.attnum
                    LEFT JOIN pg_collation c ON c.oid = a.attcollation
                    WHERE a.attrelid = :oid AND a.attnum > 0 AND NOT a.attisdropped
                    ORDER BY a.attnum
                """, oid=oid),
                "constraints": _digest(connection, """
                    SELECT conname, pg_get_constraintdef(oid), convalidated
                    FROM pg_constraint WHERE conrelid = :oid ORDER BY conname
                """, oid=oid),
                "indexes": _digest(connection, """
                    SELECT pg_get_indexdef(indexrelid), indisvalid, indisready
                    FROM pg_index WHERE indrelid = :oid ORDER BY pg_get_indexdef(indexrelid)
                """, oid=oid),
                "triggers": _digest(connection, """
                    SELECT tgname, pg_get_triggerdef(oid), tgenabled
                    FROM pg_trigger WHERE tgrelid = :oid AND NOT tgisinternal ORDER BY tgname
                """, oid=oid),
            }
        functions = _digest(connection, """
            SELECT p.proname, pg_get_function_identity_arguments(p.oid), pg_get_functiondef(p.oid)
            FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
            WHERE n.nspname = 'public'
                AND p.proname IN ('enforce_category_owner', 'prevent_category_owner_change')
            ORDER BY p.proname, pg_get_function_identity_arguments(p.oid)
        """)
        return {"tables": tables, "functions": functions}
    finally:
        connection.execute(text("SELECT set_config('search_path', :path, true)"), {"path": previous_path})


def validate_baseline(connection: Connection) -> None:
    """Recusa diferenças estruturais, inclusive triggers ausentes ou desativados."""
    expected = json.loads(SIGNATURE_PATH.read_text(encoding="utf-8"))
    actual = schema_signature(connection)
    differences = []
    for table in TABLES:
        if actual["tables"][table] is None:
            differences.append(f"tabela {table} ausente")
            continue
        for part, digest in expected["tables"][table].items():
            if actual["tables"][table][part] != digest:
                differences.append(f"{table}: {part}")
    if actual["functions"] != expected["functions"]:
        differences.append("funções de proteção das categorias")
    if differences:
        raise IncompatibleSchema(
            "O esquema difere da revisão inicial: " + "; ".join(differences)
            + ". Confira as atualizações SQL 001 e 002 e o guia docs/database-setup.md."
        )


def adopt_baseline(connection: Connection) -> None:
    """Valida e registra somente a revisão inicial, na transação do chamador."""
    context = MigrationContext.configure(connection, opts={"version_table_schema": "public"})
    heads = context.get_current_heads()
    if heads and heads != (BASELINE_REVISION,):
        raise IncompatibleSchema(
            "Este banco já tem outra revisão Alembic. Use alembic current e alembic upgrade head."
        )
    validate_baseline(connection)
    if not heads:
        config = Config(str(PROJECT_ROOT / "alembic.ini"))
        config.attributes["connection"] = connection
        command.stamp(config, BASELINE_REVISION)
