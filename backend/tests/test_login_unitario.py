"""Verifica a regra de login com o resultado da consulta simulado."""

from unittest.mock import Mock

import pytest
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.models import User

pytestmark = pytest.mark.unit


@pytest.fixture
def servico_login(app_test_environment):
    from app.services import auth

    return auth


def test_login_recusa_conta_inexistente(servico_login):
    banco = Mock(spec=Session)
    banco.scalar.return_value = None

    with pytest.raises(servico_login.InvalidCredentials):
        servico_login.authenticate(banco, email="ausente@exemplo.test", password="senha-de-teste")


def test_login_aceita_conta_cadastrada_com_senha_correta(servico_login):
    senha = "senha-de-teste"
    conta = User(name="Conta Teste", email="conta@exemplo.test", password_hash=hash_password(senha))
    banco = Mock(spec=Session)
    banco.scalar.return_value = conta

    resultado = servico_login.authenticate(banco, email=conta.email, password=senha)

    assert resultado is conta
