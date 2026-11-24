"""Testes unitários das regras de nome, senha e e-mail do cadastro."""

import pytest

from app.schemas.auth import RegisterRequest

pytestmark = pytest.mark.unit


def test_cadastro_aceita_nome_com_sobrenome():
    assert RegisterRequest.clean_name("  Ana   Silva ") == "Ana Silva"


@pytest.mark.parametrize("nome", ["AnaSilva", "  Ana  "], ids=["sem-separador", "apenas-primeiro-nome"])
def test_cadastro_rejeita_nome_sem_sobrenome(nome):
    with pytest.raises(ValueError, match="Informe seu nome e sobrenome"):
        RegisterRequest.clean_name(nome)


def test_cadastro_aceita_senha_com_oito_caracteres():
    assert RegisterRequest.check_password_length("12345678") == "12345678"


def test_cadastro_rejeita_senha_com_sete_caracteres():
    with pytest.raises(ValueError, match="Use pelo menos 8 caracteres"):
        RegisterRequest.check_password_length("1234567")


def test_cadastro_aceita_email_com_arroba_e_dominio():
    assert RegisterRequest.clean_email("conta@exemplo.test") == "conta@exemplo.test"


def test_cadastro_rejeita_email_sem_arroba():
    with pytest.raises(ValueError, match="Informe um e-mail válido"):
        RegisterRequest.clean_email("conta.exemplo.test")


def test_cadastro_rejeita_email_sem_ponto_no_dominio():
    with pytest.raises(ValueError, match="Informe um e-mail válido"):
        RegisterRequest.clean_email("conta@exemplo")
