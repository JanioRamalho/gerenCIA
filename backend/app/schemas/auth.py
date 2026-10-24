"""Formatos dos dados de autenticação que entram e saem da API.

O Pydantic confere os dados de cada requisição antes de a rota rodar. Se algo
estiver errado, a API responde 422 com as mensagens de api/errors.py.
"""

import re
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator

# Expressão regular simples para e-mail: texto sem espaços, um @, texto, um
# ponto e mais texto. Exemplo válido: nome@exemplo.com.
EMAIL_PATTERN = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")
INVALID_EMAIL_MESSAGE = "Informe um e-mail válido, como nome@exemplo.com."


class RegisterRequest(BaseModel):
    """Dados do formulário de cadastro."""

    name: str
    email: str
    password: str

    # @field_validator("name") faz o Pydantic chamar esta função para o campo
    # name. O valor devolvido é o que a rota recebe, e um ValueError vira a
    # mensagem de erro desse campo.
    @field_validator("name")
    @classmethod
    def clean_name(cls, value: str) -> str:
        """Remove os espaços extras do nome e confere o tamanho."""
        # split() quebra o texto nos espaços e descarta os pedaços vazios; o
        # join junta as palavras com um espaço só.
        # Exemplo: "  Alice   Souza " vira "Alice Souza".
        value = " ".join(value.split())
        if len(value) < 2 or len(value) > 120:
            raise ValueError("Informe seu nome completo.")
        return value

    @field_validator("email")
    @classmethod
    def clean_email(cls, value: str) -> str:
        """Deixa o e-mail em minúsculas e confere o formato."""
        value = value.strip().lower()
        # 254 caracteres é o tamanho máximo de um endereço de e-mail.
        if len(value) > 254 or not EMAIL_PATTERN.match(value):
            raise ValueError(INVALID_EMAIL_MESSAGE)
        return value

    @field_validator("password")
    @classmethod
    def check_password_length(cls, value: str) -> str:
        """Confere se a senha tem entre 8 e 128 caracteres."""
        if len(value) < 8:
            raise ValueError("Use pelo menos 8 caracteres.")
        if len(value) > 128:
            raise ValueError("Use no máximo 128 caracteres.")
        return value


class LoginRequest(BaseModel):
    """Dados do formulário de login.

    A validação é mais leve de propósito: um e-mail mal escrito apenas não
    encontra ninguém e recebe a mesma resposta de uma senha errada.
    """

    # Field limita o tamanho do texto, para não aceitar textos enormes.
    email: str = Field(max_length=254)
    password: str = Field(min_length=1, max_length=128)

    @field_validator("email")
    @classmethod
    def clean_email(cls, value: str) -> str:
        """Deixa o e-mail em minúsculas, como no cadastro."""
        return value.strip().lower()


class UserResponse(BaseModel):
    """Dados do usuário devolvidos pela API. Nunca inclui a senha nem o hash."""

    # from_attributes=True permite montar esta resposta direto a partir do
    # modelo User do SQLAlchemy, lendo os atributos do objeto.
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    code: int
    name: str
    email: str
    created_at: datetime
