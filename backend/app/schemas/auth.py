import re
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator

_EMAIL = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")
_INVALID_EMAIL = "Informe um e-mail válido, como nome@exemplo.com."


class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str

    @field_validator("name")
    @classmethod
    def _name(cls, value: str) -> str:
        value = " ".join(value.split())
        if not 2 <= len(value) <= 120:
            raise ValueError("Informe seu nome completo.")
        return value

    @field_validator("email")
    @classmethod
    def _email(cls, value: str) -> str:
        value = value.strip().lower()
        if len(value) > 254 or not _EMAIL.match(value):
            raise ValueError(_INVALID_EMAIL)
        return value

    @field_validator("password")
    @classmethod
    def _password(cls, value: str) -> str:
        if len(value) < 8:
            raise ValueError("Use pelo menos 8 caracteres.")
        if len(value) > 128:
            raise ValueError("Use no máximo 128 caracteres.")
        return value


class LoginRequest(BaseModel):
    # Lenient on purpose: a malformed e-mail simply fails to match, like a wrong password.
    email: str = Field(max_length=254)
    password: str = Field(min_length=1, max_length=128)

    @field_validator("email")
    @classmethod
    def _email(cls, value: str) -> str:
        return value.strip().lower()


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    code: int
    name: str
    email: str
    created_at: datetime
