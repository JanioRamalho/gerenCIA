"""Escolhe um teste do pytest ou abre uma demonstração no terminal."""

import argparse
from contextlib import redirect_stdout
from inspect import getsource
from io import StringIO
import os
from pathlib import Path
import subprocess
import sys
from textwrap import dedent

import pytest

from demonstrar_testes import DEMONSTRACOES
from rodar_todos import RAIZ, executar_pytest

PASTA_TESTES = Path(__file__).resolve().parent


class Coleta:
    def __init__(self):
        self.testes = []

    def pytest_collection_finish(self, session):
        self.testes = list(session.items)


def coletar(alvo):
    coleta = Coleta()
    with redirect_stdout(StringIO()) as saida:
        codigo = pytest.main(["--collect-only", "-q", "-p", "no:cacheprovider", alvo], plugins=[coleta])
    if codigo:
        print(saida.getvalue(), file=sys.stderr, end="")
    return codigo, coleta.testes


def escolher(titulo, opcoes):
    print(f"\n{titulo}")
    for numero, opcao in enumerate(opcoes, start=1):
        print(f"  {numero}. {opcao}")
    while True:
        entrada = input("Escolha um número ou 0 para sair: ").strip()
        try:
            numero = int(entrada)
        except ValueError:
            print("Digite um número da lista.")
            continue
        if numero == 0:
            return None
        if 1 <= numero <= len(opcoes):
            return numero - 1
        print("Digite um número da lista.")


def escolher_teste(testes):
    por_arquivo = {}
    for teste in testes:
        arquivo = teste.nodeid.split("::", 1)[0]
        por_arquivo.setdefault(arquivo, []).append(teste)

    arquivos = list(por_arquivo)
    indice = escolher("Arquivos de testes", arquivos)
    if indice is None:
        return None
    testes_do_arquivo = por_arquivo[arquivos[indice]]
    nomes = [teste.nodeid.split("::", 1)[1] for teste in testes_do_arquivo]
    indice = escolher("Testes do arquivo", nomes)
    return None if indice is None else testes_do_arquivo[indice]


def main():
    parser = argparse.ArgumentParser(description="Roda um teste do GerenCIA por vez.")
    parser.add_argument("alvo", nargs="?", help="identificador arquivo::teste ou nome de demonstração")
    parser.add_argument("--codigo", action="store_true", help="exibe o código do caso selecionado")
    parser.epilog = "Você pode demonstrar " + ", ".join(DEMONSTRACOES) + "."
    args = parser.parse_args()

    if args.alvo in DEMONSTRACOES:
        comando = [sys.executable, str(PASTA_TESTES / "demonstrar_testes.py"), args.alvo]
        if args.codigo:
            comando.append("--codigo")
        return subprocess.call(comando, cwd=RAIZ)

    if args.alvo and "::" not in args.alvo:
        parser.error("Informe arquivo::teste, um nome de demonstração ou abra o menu sem argumentos.")

    os.chdir(RAIZ)
    codigo, testes = coletar(args.alvo or "backend/tests")
    if codigo:
        return codigo
    try:
        teste = testes[0] if args.alvo and len(testes) == 1 else escolher_teste(testes)
    except (EOFError, KeyboardInterrupt):
        print("\nSeleção encerrada.")
        return 0
    if teste is None:
        return 0
    if args.codigo:
        print(f"\nCódigo de {teste.nodeid}\n\n{dedent(getsource(teste.obj))}", flush=True)

    return executar_pytest(teste.nodeid)


if __name__ == "__main__":
    raise SystemExit(main())
