"""Faz uma tentativa de login pela API local e mostra o resultado no terminal."""

import argparse
import sys
from getpass import getpass

import httpx2


def main():
    parser = argparse.ArgumentParser(description="Verifica o login no GerenCIA pela API local.")
    parser.add_argument("--porta", type=int, default=8000, help="porta da API local (padrão 8000)")
    args = parser.parse_args()
    if not 1 <= args.porta <= 65535:
        parser.error("A porta deve estar entre 1 e 65535.")

    email = input("E-mail: ").strip()
    senha = getpass("Senha: ")
    url = f"http://127.0.0.1:{args.porta}"
    with httpx2.Client(base_url=url, timeout=5, trust_env=False) as client:
        try:
            resposta = client.post("/api/auth/login", json={"email": email, "password": senha})
        except httpx2.RequestError:
            print(f"Erro de conexão. Confira se a API está rodando em {url}.", file=sys.stderr)
            return 2

        if resposta.status_code == 200:
            print("PASSED - Login aceito.")
            try:
                client.post("/api/auth/logout").raise_for_status()
            except httpx2.HTTPError:
                print("A sessão criada pela tentativa não pôde ser encerrada.", file=sys.stderr)
            return 0

    if resposta.status_code == 401:
        print("FAILED - E-mail ou senha incorretos.")
        return 1

    if resposta.status_code == 422:
        print("FAILED - Confira os campos informados.")
        return 1

    print(f"A API respondeu com HTTP {resposta.status_code}. Confira o servidor.", file=sys.stderr)
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
