"""Testes unitários de senhas e tokens de sessão."""

import hashlib
import unicodedata

import pytest

from app.core import security

pytestmark = pytest.mark.unit


def test_hash_is_salted_and_never_the_password():
    first, second = security.hash_password("senha-segura-1"), security.hash_password("senha-segura-1")
    assert first != second
    assert "senha-segura-1" not in first
    assert first.startswith("scrypt$")


def test_verify_accepts_right_password_and_rejects_wrong_one():
    stored = security.hash_password("senha-segura-1")
    assert security.verify_password("senha-segura-1", stored)
    assert not security.verify_password("senha-segura-2", stored)


def test_verify_treats_equivalent_unicode_as_equal():
    composed = "café-seguro"
    decomposed = unicodedata.normalize("NFD", composed)
    assert security.verify_password(decomposed, security.hash_password(composed))


@pytest.mark.parametrize("stored", ["", "texto-qualquer", "scrypt$1$2$3", "bcrypt$a$b$c$d$e", "scrypt$x$8$1$!!$!!"])
def test_verify_rejects_malformed_hashes_without_raising(stored):
    assert security.verify_password("senha-segura-1", stored) is False


def test_session_token_digest_is_sha256_hex():
    token = security.new_session_token()
    assert len(token) >= 40
    assert security.hash_session_token(token) == hashlib.sha256(token.encode()).hexdigest()
    assert token != security.new_session_token()
