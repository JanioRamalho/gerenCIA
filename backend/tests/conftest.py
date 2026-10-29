"""Preparação dos testes: um PostgreSQL temporário, criado e apagado a cada execução.

Os testes nunca usam o banco do DATABASE_URL. O pytest cria um cluster novo
numa pasta temporária, cria os bancos que cada teste precisa e desliga tudo
no fim.
"""

import os
from pathlib import Path
import shutil
import socket
import subprocess
import tempfile

import pytest


PROJECT_ROOT = Path(__file__).resolve().parents[2]

# app.db.session exige um DATABASE_URL quando é importado. Este endereço não
# leva a lugar nenhum (porta 1): ele existe só para a importação funcionar e
# garante que nenhum teste fale com o banco do .env por engano.
os.environ["DATABASE_URL"] = "postgresql+psycopg://unused@127.0.0.1:1/unused"


class TestDatabase:
    """Um banco do cluster temporário, usado pelos testes por meio do psql."""

    # Sem isto, o pytest tentaria rodar esta classe como teste, por causa do nome.
    __test__ = False

    def __init__(self, binaries, port, name):
        self.binaries = binaries
        self.port = port
        self.name = name
        # Tira as variáveis PG* do ambiente, para o psql não usar outro servidor.
        self.env = {key: value for key, value in os.environ.items() if not key.startswith("PG")}
        self.env["PGCLIENTENCODING"] = "UTF8"

    def command(self, program, *args, input=None):
        """Roda um programa do PostgreSQL (initdb, pg_ctl, psql) e devolve o resultado."""
        if program == "pg_ctl":
            # No Windows, o postgres pode herdar os pipes do pg_ctl. Um arquivo
            # comum evita esperar o servidor fechá-los depois que o pg_ctl termina.
            with tempfile.TemporaryFile() as output:
                result = subprocess.run(
                    [str(self.binaries / program), *map(str, args)],
                    stdin=subprocess.DEVNULL, stdout=output, stderr=subprocess.STDOUT,
                    env=self.env, timeout=60,
                    creationflags=subprocess.CREATE_NO_WINDOW if os.name == "nt" else 0,
                )
                output.seek(0)
                return subprocess.CompletedProcess(
                    result.args, result.returncode, output.read().decode("utf-8", errors="replace"), "",
                )
        return subprocess.run(
            [str(self.binaries / program), *map(str, args)],
            input=input, capture_output=True, text=True, encoding="utf-8",
            errors="replace", env=self.env, timeout=60,
            creationflags=subprocess.CREATE_NO_WINDOW if os.name == "nt" else 0,
        )

    def sql(self, sql, *, check=True):
        """Roda um SQL no banco. Com check=True, falha o teste se o SQL der erro."""
        result = self.command(
            "psql", "-X", "-w", "-h", "127.0.0.1", "-p", self.port,
            "-U", "postgres", "-d", self.name, "-v", "ON_ERROR_STOP=1",
            "-v", "VERBOSITY=verbose", "-t", "-A", "-q", input=sql,
        )
        if check:
            assert result.returncode == 0, result.stderr
        return result

    def script(self, path, *, check=True):
        """Roda um arquivo .sql inteiro no banco."""
        # Os scripts usam \ir, que acha os arquivos incluídos a partir da pasta
        # do próprio script, mesmo com espaços no caminho.
        return self.sql(f"\\i '{Path(path).as_posix()}'\n", check=check)


def find_postgres_binaries() -> Path:
    """A pasta com initdb, pg_ctl e psql.

    Ordem de busca: a variável GERENCIA_PG_BIN, depois o PATH e, por último,
    a pasta padrão do instalador do PostgreSQL 18 no Windows.
    """
    configured = os.environ.get("GERENCIA_PG_BIN")
    if configured:
        return Path(configured)

    executable = shutil.which("initdb")
    if executable:
        return Path(executable).parent

    return Path("C:/Program Files/PostgreSQL/18/bin")


@pytest.fixture(scope="session")
def postgres_cluster(tmp_path_factory):
    """Cria e liga um cluster PostgreSQL temporário, uma vez por execução do pytest."""
    binaries = find_postgres_binaries()
    suffix = ".exe" if os.name == "nt" else ""
    if not all((binaries / (name + suffix)).is_file() for name in ("initdb", "pg_ctl", "psql")):
        pytest.fail("Os testes precisam do PostgreSQL instalado. Aponte GERENCIA_PG_BIN para a pasta com initdb, pg_ctl e psql.")

    directory = tmp_path_factory.mktemp("gerencia-postgres")
    data = directory / "data"
    # Pede ao sistema uma porta livre: abrir um socket na porta 0 escolhe uma.
    with socket.socket() as sock:
        sock.bind(("127.0.0.1", 0))
        port = sock.getsockname()[1]
    database = TestDatabase(binaries, port, "postgres")
    result = database.command(
        "initdb", "-D", data, "-U", "postgres", "--auth=trust",
        "--encoding=UTF8", "--no-locale",
    )
    assert result.returncode == 0, result.stderr
    try:
        result = database.command(
            "pg_ctl", "-D", data, "-l", directory / "postgres.log",
            "-o", f"-h 127.0.0.1 -p {port}", "-w", "-t", "30", "start",
        )
        assert result.returncode == 0, result.stderr + result.stdout
        yield database
    finally:
        database.command("pg_ctl", "-D", data, "-m", "immediate", "-w", "stop")


def restore_legacy_constraints(db):
    """Volta o banco às regras antigas, de antes das migrações em scripts/migrations/.

    Serve para testar a atualização de um banco que já existia: as migrações
    precisam funcionar tanto num banco novo quanto num antigo.
    """
    db.sql("""
            ALTER TABLE transactions DROP CONSTRAINT transactions_bronze_row_fk;
            ALTER TABLE transactions ADD CONSTRAINT transactions_bronze_row_fk
                FOREIGN KEY (bronze_row_id, upload_id, user_id)
                REFERENCES bronze_rows(id, upload_id, user_id) ON DELETE SET NULL;
            ALTER TABLE transactions DROP CONSTRAINT transactions_installments_valid;
            ALTER TABLE transactions ADD CONSTRAINT transactions_installments_valid CHECK (
                (installment_current IS NULL AND installment_total IS NULL)
                OR (installment_current > 0 AND installment_total > 0
                    AND installment_current <= installment_total));
            ALTER TABLE bronze_rows DROP CONSTRAINT bronze_rows_upload_row_uq;
            ALTER TABLE bronze_rows ADD CONSTRAINT bronze_rows_upload_row_uq
                UNIQUE (upload_id, row_number);
            DROP TRIGGER IF EXISTS transactions_category_owner_guard ON transactions;
            DROP TRIGGER IF EXISTS category_rules_category_owner_guard ON category_rules;
            DROP TRIGGER IF EXISTS categories_owner_immutable ON categories;
            DO $$
            DECLARE target_table text;
            BEGIN
                FOREACH target_table IN ARRAY ARRAY[
                    'users', 'sessions', 'uploads', 'upload_mappings', 'bronze_rows',
                    'categories', 'transactions', 'category_rules', 'quality_checks', 'rejected_rows'
                ] LOOP
                    EXECUTE format('ALTER TABLE public.%I DROP COLUMN IF EXISTS code', target_table);
                END LOOP;
            END;
            $$;
        """)


@pytest.fixture(scope="session", params=["fresh", "upgrade"])
def database(postgres_cluster, request):
    """Banco para os testes de integridade, em duas versões: "fresh" (criado pelo
    init.sql) e "upgrade" (antigo, atualizado pelas migrações). Cada teste que
    usa esta fixture roda nas duas."""
    name = "integrity_" + request.param
    postgres_cluster.sql(f"CREATE DATABASE {name};")
    db = TestDatabase(postgres_cluster.binaries, postgres_cluster.port, name)
    db.script(PROJECT_ROOT / "scripts/init.sql")
    if request.param == "upgrade":
        restore_legacy_constraints(db)
        db.sql("DELETE FROM categories;")
        db.script(PROJECT_ROOT / "scripts/migrations/001_integrity.sql")
        db.script(PROJECT_ROOT / "scripts/migrations/002_display_codes.sql")
    return db


@pytest.fixture
def legacy_database(postgres_cluster):
    """Um banco novo com as regras antigas, ainda sem as migrações."""
    from uuid import uuid4

    name = "legacy_" + uuid4().hex
    postgres_cluster.sql(f"CREATE DATABASE {name};")
    db = TestDatabase(postgres_cluster.binaries, postgres_cluster.port, name)
    db.script(PROJECT_ROOT / "scripts/init.sql")
    restore_legacy_constraints(db)
    return db


@pytest.fixture(scope="module")
def auth_database(postgres_cluster):
    """Um banco criado pelo init.sql para os testes da API, um por arquivo de teste."""
    from uuid import uuid4

    name = "auth_" + uuid4().hex
    postgres_cluster.sql(f"CREATE DATABASE {name};")
    db = TestDatabase(postgres_cluster.binaries, postgres_cluster.port, name)
    db.script(PROJECT_ROOT / "scripts/init.sql")
    return db


@pytest.fixture
def auth_client(auth_database):
    """Cliente HTTP da API ligado ao banco temporário, sem servidor de verdade."""
    from fastapi.testclient import TestClient
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker

    from app.api.main import app
    from app.db.session import get_db

    engine = create_engine(
        f"postgresql+psycopg://postgres@127.0.0.1:{auth_database.port}/{auth_database.name}"
    )
    factory = sessionmaker(bind=engine, autoflush=False, autocommit=False)

    def override_get_db():
        db = factory()
        try:
            yield db
        finally:
            db.close()

    # Cada teste começa sem usuários. As sessões são apagadas junto, pela
    # chave estrangeira com ON DELETE CASCADE.
    auth_database.sql("DELETE FROM users;")
    # dependency_overrides troca o get_db das rotas pelo que usa o banco temporário.
    app.dependency_overrides[get_db] = override_get_db
    try:
        with TestClient(app) as client:
            yield client
    finally:
        app.dependency_overrides.clear()
        engine.dispose()
