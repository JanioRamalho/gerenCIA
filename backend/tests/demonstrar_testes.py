"""Exercita as regras do GerenCIA com entradas digitadas no terminal."""

import argparse
import ast
import csv
import sys
from getpass import getpass
from inspect import getsource
from io import StringIO
from pathlib import Path
from textwrap import dedent

import httpx2

BACKEND = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND))

from app.schemas.auth import EMAIL_PATTERN, RegisterRequest


def resultado(aceito, mensagem):
    status = "PASSED" if aceito else "FAILED"
    print(f"{status} - {mensagem}")
    return 0 if aceito else 1


def demonstrar_nome():
    nome = RegisterRequest.clean_name(input("Nome e sobrenome fictícios: "))
    return resultado(True, f"Nome aceito como {nome!r}. Há pelo menos duas partes separadas por espaço.")


def demonstrar_email():
    RegisterRequest.clean_email(input("E-mail fictício: "))
    return resultado(True, "E-mail aceito. Há um @ e o domínio tem um ponto.")


def demonstrar_senha():
    senha = getpass("Senha fictícia: ")
    try:
        RegisterRequest.check_password_length(senha)
    except ValueError as erro:
        return resultado(False, f"{len(senha)} caracteres. {erro}")
    return resultado(True, f"{len(senha)} caracteres. A senha atende ao intervalo de 8 a 128.")


def fatura_de_exemplo(valor):
    arquivo = StringIO()
    escritor = csv.writer(arquivo, lineterminator="\n")
    escritor.writerow(["date", "title", "amount"])
    escritor.writerow(["2026-08-01", "Loja Teste", valor])
    return arquivo.getvalue().encode("utf-8")


def demonstrar_fatura():
    from app.pipeline.analise import processar_arquivo

    valor = input("Valor da compra em reais (ex.: 0,01): ")
    fatura = processar_arquivo(fatura_de_exemplo(valor), "fatura.csv")
    if fatura.rejeitadas:
        return resultado(False, fatura.rejeitadas[0]["mensagem"])
    if fatura.transacoes.iloc[0]["tipo"] != "purchase":
        return resultado(False, "O valor foi lido. Uma compra precisa ter valor maior que zero.")
    return resultado(True, "Valor numérico maior que zero. A linha entrou como compra.")


def demonstrar_data():
    from app.pipeline.previa import _converter_data

    entrada = input("Data da fatura (ex.: 15/06/2026): ")
    data = _converter_data(entrada)
    if data is None:
        return resultado(False, "A data não existe ou está em formato desconhecido.")
    return resultado(True, f"Data válida. O GerenCIA leu {data:%d/%m/%Y}.")


def demonstrar_parcela():
    from app.pipeline.previa import _parcela_info

    entrada = input("Parcela (ex.: 2/5): ")
    parcela = _parcela_info(entrada)
    if parcela is None:
        return resultado(False, "Use o formato 2/5. A parcela precisa estar entre 1 e o total de parcelas.")
    atual, total = parcela
    return resultado(True, f"Parcela válida. Esta é a parcela {atual} de {total}.")


def chamar_api(metodo, rota, **kwargs):
    try:
        porta = int(input("Porta da API [8000]: ").strip() or "8000")
    except ValueError:
        raise ValueError("Informe uma porta de 1 a 65535.") from None
    if not 1 <= porta <= 65535:
        raise ValueError("Informe uma porta de 1 a 65535.")

    with httpx2.Client(base_url=f"http://127.0.0.1:{porta}", timeout=5, trust_env=False) as client:
        return client.request(metodo, rota, **kwargs)


def demonstrar_api():
    nome = input("Nome da fatura CSV de exemplo [fatura.csv]: ").strip() or "fatura.csv"
    resposta = chamar_api("POST", "/api/analise/previa", params={"nome": nome}, content=fatura_de_exemplo("25.00"))
    if resposta.status_code == 422:
        return resultado(False, f"HTTP 422. {resposta.json()['detail']}")
    if resposta.status_code != 200:
        return resultado(False, f"HTTP {resposta.status_code}. A API não devolveu a prévia da fatura.")

    analise = resposta.json()
    total = analise.get("resumo") or {}
    if analise.get("qualidade", {}).get("linhas_validas") != 1 or total.get("total_saidas") != 25:
        return resultado(False, "HTTP 200. A prévia veio com um resultado diferente do esperado.")
    return resultado(True, "HTTP 200. A API leu uma linha e calculou R$ 25,00 em compras.")


def demonstrar_servidor():
    resposta = chamar_api("GET", "/api/health")
    if resposta.status_code == 200 and resposta.json() == {"status": "ok"}:
        return resultado(True, 'HTTP 200. O servidor respondeu {"status":"ok"}.')
    return resultado(False, f"HTTP {resposta.status_code}. A resposta de saúde foi diferente da esperada.")


def mostrar_codigo(arquivo, nomes):
    caminho = BACKEND / "tests" / arquivo
    fonte = caminho.read_text(encoding="utf-8")
    linhas = fonte.splitlines()
    funcoes = {no.name: no for no in ast.parse(fonte).body if isinstance(no, ast.FunctionDef)}
    print(f"\nCódigo dos testes em backend/tests/{arquivo}\n")
    for nome in nomes:
        funcao = funcoes[nome]
        inicio = funcao.decorator_list[0].lineno if funcao.decorator_list else funcao.lineno
        print("\n".join(linhas[inicio - 1:funcao.end_lineno]), end="\n\n")


DEMONSTRACOES = {
    "nome": (demonstrar_nome, "test_validacao_cadastro.py", (
        "test_cadastro_aceita_nome_com_sobrenome", "test_cadastro_rejeita_nome_sem_sobrenome",
    )),
    "email": (demonstrar_email, "test_validacao_cadastro.py", (
        "test_cadastro_aceita_email_com_arroba_e_dominio", "test_cadastro_rejeita_email_sem_arroba",
        "test_cadastro_rejeita_email_sem_ponto_no_dominio",
    )),
    "senha": (demonstrar_senha, "test_validacao_cadastro.py", (
        "test_cadastro_aceita_senha_com_oito_caracteres", "test_cadastro_rejeita_senha_com_sete_caracteres",
    )),
    "fatura": (demonstrar_fatura, "test_previa_fatura.py", (
        "test_fatura_compra_exige_valor_positivo", "test_fatura_rejeita_valor_nao_numerico",
    )),
    "data": (demonstrar_data, "test_previa_fatura.py", ("test_converter_data",)),
    "parcela": (demonstrar_parcela, "test_previa_fatura.py", ("test_parcela_info",)),
    "api": (demonstrar_api, "test_api.py", (
        "test_previa_retorna_a_analise_de_uma_fatura", "test_previa_recusa_arquivo_invalido",
    )),
    "servidor": (demonstrar_servidor, "test_server.py", ("test_saude_do_servidor_retorna_ok",)),
}


def main():
    regras_cadastro = {
        "nome": RegisterRequest.clean_name,
        "email": RegisterRequest.clean_email,
        "senha": RegisterRequest.check_password_length,
    }
    parser = argparse.ArgumentParser(description="Demonstra as validações e a API do GerenCIA.")
    parser.add_argument("caso", choices=DEMONSTRACOES, help="demonstração a executar")
    parser.add_argument("--codigo", action="store_true", help="mostra o código antes da demonstração")
    args = parser.parse_args()

    demonstrar, arquivo, testes = DEMONSTRACOES[args.caso]
    if args.codigo:
        mostrar_codigo(arquivo, testes)
        regra = regras_cadastro.get(args.caso)
        if regra is not None:
            print("Regra do cadastro em backend/app/schemas/auth.py\n")
            if args.caso == "email":
                print(f"EMAIL_PATTERN = re.compile({EMAIL_PATTERN.pattern!r})\n")
            print(dedent(getsource(regra)))

    try:
        return demonstrar()
    except httpx2.RequestError as erro:
        porta = erro.request.url.port or 80
        return resultado(False, f"A API local não respondeu na porta {porta}.")
    except ValueError as erro:
        return resultado(False, str(erro))
    except (EOFError, KeyboardInterrupt):
        print("\nDemonstração encerrada.")
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
