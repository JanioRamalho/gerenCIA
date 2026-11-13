"""Instala o esquema do gerenCIA em um banco PostgreSQL vazio, como o do Neon.

Faz o mesmo que `psql -f scripts/init.sql`, mas sem precisar do psql: o init.sql
usa dois comandos que só o psql entende (\\set e \\ir), então este script os
resolve antes de enviar o SQL ao banco. O banco indicado em DATABASE_URL (no
arquivo .env) precisa existir e estar vazio.

Uso, a partir da pasta principal do projeto:

    .\\.venv\\Scripts\\python.exe scripts\\instalar_banco.py
"""

import os
import sys
from pathlib import Path

import psycopg
from dotenv import load_dotenv

PASTA_SCRIPTS = Path(__file__).resolve().parent
load_dotenv(PASTA_SCRIPTS.parent / ".env")


def montar_script() -> str:
    """Lê o init.sql e troca cada `\\ir arquivo` pelo conteúdo do arquivo."""
    linhas = []
    texto = (PASTA_SCRIPTS / "init.sql").read_text(encoding="utf-8-sig")
    for linha in texto.splitlines():
        comando = linha.strip()
        if comando.startswith("\\set "):
            continue  # o script já roda tudo dentro de uma transação
        if comando.startswith("\\ir "):
            incluido = PASTA_SCRIPTS / comando[4:].strip()
            linhas.append(incluido.read_text(encoding="utf-8-sig"))
            continue
        linhas.append(linha)
    return "\n".join(linhas)


def endereco_do_banco() -> str:
    url = os.getenv("DATABASE_URL")
    if not url:
        sys.exit("DATABASE_URL não está definida. Preencha o arquivo .env na pasta principal.")
    for prefixo in ("postgresql+psycopg://", "postgres://"):
        if url.startswith(prefixo):
            return "postgresql://" + url[len(prefixo):]
    return url


def main() -> None:
    script = montar_script()
    if "\\ir " in script or "\\set " in script:
        sys.exit("Sobrou um comando do psql no script. Avise quem mantém o projeto.")

    try:
        with psycopg.connect(endereco_do_banco(), autocommit=True) as conexao:
            if conexao.execute("SELECT to_regclass('public.users')").fetchone()[0] is not None:
                sys.exit("Este banco já tem as tabelas do gerenCIA. Nada foi alterado.")
            print("Instalando o esquema...")
            conexao.execute(script)  # o próprio script abre e confirma a transação
            tabelas = conexao.execute(
                "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'"
            ).fetchone()[0]
            categorias = conexao.execute("SELECT count(*) FROM public.categories WHERE user_id IS NULL").fetchone()[0]
    except psycopg.Error as erro:
        sys.exit(f"Não foi possível instalar o esquema: {erro}")

    print(f"Pronto: {tabelas} tabelas e {categorias} categorias iniciais. (O esperado é 10 e 11.)")


if __name__ == "__main__":
    main()
