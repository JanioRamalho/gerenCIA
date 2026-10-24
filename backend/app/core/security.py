"""Hash de senhas e tokens de sessão, usando só a biblioteca padrão do Python.

- hash_password e verify_password cuidam das senhas.
- new_session_token e hash_session_token cuidam dos tokens de sessão.
"""

import base64
import hashlib
import hmac
import secrets
import unicodedata
from functools import cache

# Nome do algoritmo, gravado no começo de cada hash.
HASH_SCHEME = "scrypt"

# Parâmetros do scrypt. É uma configuração recomendada pela OWASP e usa 32 MiB
# de memória por senha. Os parâmetros ficam gravados junto com cada hash, então
# podem ser aumentados no futuro sem invalidar as senhas antigas.
SCRYPT_N = 2**15  # custo: quanto maior, mais lento e mais memória
SCRYPT_R = 8  # tamanho do bloco
SCRYPT_P = 3  # paralelismo
SCRYPT_MAX_MEMORY = 64 * 1024 * 1024  # limite de memória permitido: 64 MiB

KEY_LENGTH = 32  # tamanho do hash gerado, em bytes
SALT_LENGTH = 16  # tamanho do sal, em bytes


def derive_key(password: str, salt: bytes, n: int, r: int, p: int, key_length: int) -> bytes:
    """Transforma a senha em um hash com o algoritmo scrypt.

    O scrypt é lento de propósito: para quem tenta adivinhar senhas testando
    milhões de combinações, cada tentativa sai cara.
    """
    # A normalização NFKC faz senhas visualmente iguais virarem os mesmos
    # bytes, mesmo digitadas em teclados diferentes. Exemplo: "é" pode ser um
    # caractere só ou "e" seguido do acento; depois da NFKC, os dois ficam iguais.
    normalized_password = unicodedata.normalize("NFKC", password)
    password_bytes = normalized_password.encode("utf-8")

    return hashlib.scrypt(
        password_bytes,
        salt=salt,
        n=n,
        r=r,
        p=p,
        maxmem=SCRYPT_MAX_MEMORY,
        dklen=key_length,
    )


def hash_password(password: str) -> str:
    """Gera o texto que fica guardado no banco no lugar da senha.

    O formato é "scrypt$N$r$p$sal$hash", com o sal e o hash em base64.
    Exemplo: "scrypt$32768$8$3$Yx...==$Qk...=".
    """
    # O sal é um valor aleatório diferente para cada senha. Por causa dele,
    # duas pessoas com a mesma senha têm hashes diferentes.
    salt = secrets.token_bytes(SALT_LENGTH)
    key = derive_key(password, salt, SCRYPT_N, SCRYPT_R, SCRYPT_P, KEY_LENGTH)

    # base64 transforma bytes em texto, para caber numa coluna de texto.
    salt_text = base64.b64encode(salt).decode()
    key_text = base64.b64encode(key).decode()

    parts = [HASH_SCHEME, str(SCRYPT_N), str(SCRYPT_R), str(SCRYPT_P), salt_text, key_text]
    return "$".join(parts)


def verify_password(password: str, stored_hash: str) -> bool:
    """Confere se a senha digitada corresponde ao hash guardado no banco.

    Refaz o hash da senha digitada com o mesmo sal e os mesmos parâmetros do
    hash guardado e compara os dois. Um hash corrompido ou de formato
    desconhecido conta como senha errada, sem gerar erro.
    """
    try:
        # Separa as seis partes. Se não forem exatamente seis, dá ValueError.
        scheme, n, r, p, salt_text, key_text = stored_hash.split("$")
        if scheme != HASH_SCHEME:
            return False

        salt = base64.b64decode(salt_text)
        expected_key = base64.b64decode(key_text)
        typed_key = derive_key(password, salt, int(n), int(r), int(p), len(expected_key))
    except (ValueError, TypeError):
        return False

    # compare_digest compara em tempo constante: demora o mesmo tanto acertando
    # ou errando, e por isso não dá pistas a quem mede o tempo da resposta.
    return hmac.compare_digest(typed_key, expected_key)


# @cache guarda o resultado da primeira chamada. O hash é calculado uma vez só,
# e as chamadas seguintes devolvem o mesmo texto na hora.
@cache
def dummy_hash() -> str:
    """Hash válido de uma senha aleatória, usado quando o e-mail não existe.

    No login, conferimos a senha contra este hash quando o e-mail não tem
    cadastro. Assim a resposta demora o mesmo tempo nos dois casos, e ninguém
    descobre quais e-mails estão cadastrados medindo o tempo.
    """
    return hash_password(secrets.token_urlsafe(16))


def new_session_token() -> str:
    """Gera um token de sessão aleatório e difícil de adivinhar.

    secrets.token_urlsafe(32) usa 32 bytes aleatórios e devolve um texto de
    cerca de 43 caracteres, que pode ir num cookie.
    """
    return secrets.token_urlsafe(32)


def hash_session_token(token: str) -> str:
    """Calcula o SHA-256 do token de sessão.

    O banco guarda só este resumo; o token de verdade fica apenas no cookie do
    navegador. Assim, quem conseguir ler o banco não consegue usar as sessões.
    """
    token_bytes = token.encode("utf-8")
    return hashlib.sha256(token_bytes).hexdigest()
