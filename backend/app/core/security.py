"""Password hashing and session tokens, using only the standard library."""

import base64
import hashlib
import hmac
import secrets
import unicodedata
from functools import cache

# scrypt at N=2^15, r=8, p=3 (32 MiB) is an OWASP-listed configuration.
# The parameters are stored with each hash so they can be raised later.
_SCHEME = "scrypt"
_N, _R, _P = 2**15, 8, 3
_MAXMEM = 64 * 1024 * 1024
_KEY_LENGTH = 32
_SALT_LENGTH = 16


def _derive(password: str, salt: bytes, n: int, r: int, p: int, length: int) -> bytes:
    # NFKC makes visually identical passwords compare equal across keyboards.
    normalized = unicodedata.normalize("NFKC", password).encode("utf-8")
    return hashlib.scrypt(normalized, salt=salt, n=n, r=r, p=p, maxmem=_MAXMEM, dklen=length)


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(_SALT_LENGTH)
    key = _derive(password, salt, _N, _R, _P, _KEY_LENGTH)
    parts = (_SCHEME, str(_N), str(_R), str(_P), base64.b64encode(salt).decode(), base64.b64encode(key).decode())
    return "$".join(parts)


def verify_password(password: str, stored: str) -> bool:
    try:
        scheme, n, r, p, salt_b64, key_b64 = stored.split("$")
        if scheme != _SCHEME:
            return False
        salt, expected = base64.b64decode(salt_b64), base64.b64decode(key_b64)
        candidate = _derive(password, salt, int(n), int(r), int(p), len(expected))
    except (ValueError, TypeError):
        return False
    return hmac.compare_digest(candidate, expected)


@cache
def dummy_hash() -> str:
    """A valid hash to verify against when the e-mail is unknown, so timing does not reveal it."""
    return hash_password(secrets.token_urlsafe(16))


def new_session_token() -> str:
    return secrets.token_urlsafe(32)


def hash_session_token(token: str) -> str:
    """Only this digest is stored; the raw token lives in the browser cookie."""
    return hashlib.sha256(token.encode("utf-8")).hexdigest()
