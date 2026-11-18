"""Captura explícita e somente leitura; nunca executa migrações na origem.

Uso e limites: docs/preparacao-banco-2026-11-17.md.
"""

import argparse
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys

import psycopg
from dotenv import dotenv_values
from sqlalchemy.engine import make_url


ROOT = Path(__file__).resolve().parents[1]
PRIVATE = ROOT / ".private" / "database"
sys.path.insert(0, str(ROOT / "backend"))
from app.db.migration_baseline import schema_signature
from sqlalchemy import create_engine


def connection_info(path, expected_host):
    # Intencionalmente sem load_dotenv/get_database_url ou fallback de ambiente.
    values = dotenv_values(path, interpolate=False, encoding="utf-8-sig")
    value = values.get("GERENCIA_PRODUCTION_DATABASE_URL")
    if not value:
        raise ValueError("Arquivo explícito sem GERENCIA_PRODUCTION_DATABASE_URL.")
    url = make_url(value)
    if url.drivername not in {"postgres", "postgresql", "postgresql+psycopg"}:
        raise ValueError("A conexão precisa ser PostgreSQL.")
    if not url.host or url.host != expected_host or "-pooler" in url.host:
        raise ValueError("Host diferente do confirmado ou conexão com pool; operação recusada.")
    if not url.database or not url.username:
        raise ValueError("Banco e usuário precisam ser explícitos.")
    if url.host not in {"127.0.0.1", "localhost"} and url.query.get("sslmode") not in {"require", "verify-ca", "verify-full"}:
        raise ValueError("Conexão remota exige SSL explícito.")
    return url.set(drivername="postgresql+psycopg")


def fingerprint(connection):
    """Contagens e hashes privados; não exporta linhas para o relatório."""
    connection.execute("SET LOCAL TIME ZONE 'UTC'")
    connection.execute("SET LOCAL DateStyle = 'ISO, MDY'")
    connection.execute("SET LOCAL extra_float_digits = 3")
    tables = connection.execute("""SELECT tablename FROM pg_tables
        WHERE schemaname='public' ORDER BY tablename""").fetchall()
    result = {}
    for (table,) in tables:
        digest, count = hashlib.sha256(), 0
        query = psycopg.sql.SQL('SELECT to_jsonb(t)::text FROM public.{} t ORDER BY to_jsonb(t)::text COLLATE "C"').format(psycopg.sql.Identifier(table))
        with connection.cursor(name="fingerprint") as cursor:
            cursor.execute(query)
            for (row,) in cursor:
                digest.update(row.encode("utf-8") + b"\n")
                count += 1
        result[table] = {"rows": count, "sha256": digest.hexdigest()}
    return result


def schema_inventory(connection):
    connection.execute("SET LOCAL search_path = pg_catalog, public")
    queries = {
        "columns": """SELECT c.relname,a.attname,format_type(a.atttypid,a.atttypmod),a.attnotnull,
            coalesce(pg_get_expr(d.adbin,d.adrelid),''),a.attidentity,a.attgenerated
            FROM pg_attribute a JOIN pg_class c ON c.oid=a.attrelid
            JOIN pg_namespace n ON n.oid=c.relnamespace
            LEFT JOIN pg_attrdef d ON d.adrelid=a.attrelid AND d.adnum=a.attnum
            WHERE n.nspname='public' AND c.relkind IN ('r','p') AND a.attnum>0 AND NOT a.attisdropped
            ORDER BY c.relname,a.attnum""",
        "constraints": """SELECT c.relname,k.conname,pg_get_constraintdef(k.oid),k.convalidated
            FROM pg_constraint k JOIN pg_class c ON c.oid=k.conrelid JOIN pg_namespace n ON n.oid=c.relnamespace
            WHERE n.nspname='public' ORDER BY c.relname,k.conname""",
        "indexes": """SELECT c.relname,pg_get_indexdef(i.indexrelid),i.indisvalid,i.indisready
            FROM pg_index i JOIN pg_class c ON c.oid=i.indrelid JOIN pg_namespace n ON n.oid=c.relnamespace
            WHERE n.nspname='public' ORDER BY c.relname,pg_get_indexdef(i.indexrelid)""",
        "triggers": """SELECT c.relname,t.tgname,pg_get_triggerdef(t.oid),t.tgenabled
            FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid JOIN pg_namespace n ON n.oid=c.relnamespace
            WHERE n.nspname='public' AND NOT t.tgisinternal ORDER BY c.relname,t.tgname""",
        "functions": """SELECT p.proname,pg_get_function_identity_arguments(p.oid),pg_get_functiondef(p.oid)
            FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
            WHERE n.nspname='public' AND p.prokind IN ('f','p') ORDER BY p.proname,pg_get_function_identity_arguments(p.oid)""",
        "sequence_definitions": """SELECT sequencename,data_type::text,start_value,min_value,max_value,increment_by,cycle,cache_size
            FROM pg_sequences WHERE schemaname='public' ORDER BY sequencename""",
    }
    return {name: [[v.replace("\r\n", "\n") if isinstance(v, str) else v for v in row]
                   for row in connection.execute(query)] for name, query in queries.items()}


def sequence_states(connection):
    names = connection.execute("SELECT sequencename FROM pg_sequences WHERE schemaname='public' ORDER BY sequencename").fetchall()
    return {name: list(connection.execute(psycopg.sql.SQL("SELECT last_value,is_called FROM public.{}").format(
        psycopg.sql.Identifier(name))).fetchone()) for (name,) in names}


def pg_environment(url):
    env = {k: v for k, v in os.environ.items() if not k.upper().startswith("PG")}
    # Credenciais ficam no ambiente do processo filho, nunca na linha de comando.
    options = {"sslmode": "PGSSLMODE", "channel_binding": "PGCHANNELBINDING",
               "sslrootcert": "PGSSLROOTCERT", "sslcert": "PGSSLCERT", "sslkey": "PGSSLKEY"}
    if set(url.query) - options.keys():
        raise ValueError("Parâmetro de conexão não previsto; revisão manual necessária.")
    env.update({options[key]: value for key, value in url.query.items()})
    env.update(PGHOST=url.host, PGPORT=str(url.port or 5432),
               PGDATABASE=url.database, PGUSER=url.username, PGPASSWORD=url.password or "",
               PGCONNECT_TIMEOUT="15", PGCLIENTENCODING="UTF8",
               PGOPTIONS="-c default_transaction_read_only=on -c lock_timeout=5000")
    return env


def pg_run(binary, *args, env):
    result = subprocess.run([str(binary), *map(str, args)], env=env,
                            capture_output=True, timeout=600,
                            creationflags=subprocess.CREATE_NO_WINDOW if os.name == "nt" else 0)
    if result.returncode:
        # stderr pode conter nomes de registros e detalhes da conexão.
        raise RuntimeError(f"{binary.stem} falhou; nenhum resultado foi aprovado. Código {result.returncode}.")
    return result.stdout


def capture(url, directory, binaries):
    directory.mkdir(parents=True, exist_ok=False)
    archive = directory / "database.dump"
    env = pg_environment(url)
    engine = create_engine(url, hide_parameters=True, connect_args={"connect_timeout": 15})
    try:
        with engine.connect().execution_options(isolation_level="REPEATABLE READ") as connection:
            connection.exec_driver_sql("SET TRANSACTION READ ONLY")
            connection.exec_driver_sql("SET LOCAL statement_timeout='120s'")
            connection.exec_driver_sql("SET LOCAL lock_timeout='5s'")
            source = connection.connection.driver_connection
            snapshot = connection.exec_driver_sql("SELECT pg_export_snapshot()").scalar_one()
            report = {"created_utc": datetime.now(timezone.utc).isoformat(),
                      "source_identity_sha256": hashlib.sha256(f"{url.host}/{url.database}".encode()).hexdigest(),
                      "server_version_num": connection.exec_driver_sql("SHOW server_version_num").scalar_one(),
                      "revision": connection.exec_driver_sql("SELECT version_num FROM public.alembic_version").scalars().all()
                      if connection.exec_driver_sql("SELECT to_regclass('public.alembic_version')").scalar_one() else [],
                      "baseline_signature": schema_signature(connection),
                      "tables": fingerprint(source),
                      "schema": schema_inventory(source),
                      "sequences_observed_before_dump": sequence_states(source)}
            # O dump usa o MESMO snapshot das contagens/hashes, sem gravar na origem.
            pg_run(binaries / "pg_dump", "--format=custom", "--no-password",
                   "--lock-wait-timeout=5s", f"--snapshot={snapshot}",
                   f"--file={archive}", env=env)
            connection.rollback()
        pg_run(binaries / "pg_restore", "--list", archive, env=env)
        with archive.open("rb") as stream:
            archive_digest = hashlib.file_digest(stream, "sha256").hexdigest()
        report.update(archive_sha256=archive_digest,
                      archive_bytes=archive.stat().st_size,
                      restored=False, migration_rehearsed=False,
                      note="Arquivo capturado; recuperação exige restauração. Sequências não seguem snapshot MVCC e podem avançar durante gravações concorrentes.")
        (directory / "manifest.json").write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8")
        return report
    finally:
        engine.dispose()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--connection-file", required=True, type=Path)
    parser.add_argument("--expected-host", required=True)
    parser.add_argument("--pg-bin", type=Path, default=Path("C:/Program Files/PostgreSQL/18/bin"))
    args = parser.parse_args()
    try:
        url = connection_info(args.connection_file, args.expected_host)
        directory = PRIVATE / datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S%fZ")
        capture(url, directory, args.pg_bin)
    except (Exception, KeyboardInterrupt):
        # Não imprimir exceções da biblioteca: podem conter DSN, SQL ou dados.
        sys.exit("Captura não aprovada. Confira arquivo, host, conexão direta, permissões e versão do cliente. Arquivos parciais não são backups validados.")
    print(f"Captura concluída em {directory.relative_to(ROOT)}. Ainda exige restauração e ensaio; produção não foi migrada.")


if __name__ == "__main__":
    main()
