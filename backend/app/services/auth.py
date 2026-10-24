"""Regras de autenticação: cadastro, login e sessões.

As rotas (api/auth.py) chamam estas funções. Aqui ficam as decisões; o acesso
ao banco fica nos repositórios (repositories/).
"""

from datetime import datetime, timezone

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core import security
from app.core.config import settings
from app.models import User
from app.repositories import sessions, users


class EmailAlreadyRegistered(Exception):
    """Erro lançado quando o e-mail do cadastro já pertence a outra conta."""


class InvalidCredentials(Exception):
    """Erro lançado quando o e-mail ou a senha do login estão errados."""


def now_utc() -> datetime:
    """Data e hora atuais, com fuso horário UTC, para comparar com as datas do banco."""
    return datetime.now(timezone.utc)


# O * na lista de parâmetros obriga a passar os argumentos seguintes pelo nome,
# como register(db, name=..., email=..., password=...). Isso evita trocar o
# e-mail pela senha sem perceber.
def register(db: Session, *, name: str, email: str, password: str) -> User:
    """Cria a conta, guardando só o hash da senha."""
    existing_user = users.get_by_email(db, email)
    if existing_user:
        raise EmailAlreadyRegistered

    password_hash = security.hash_password(password)
    try:
        user = users.create(db, name=name, email=email, password_hash=password_hash)
        db.commit()
    except IntegrityError as exc:
        # Dois cadastros com o mesmo e-mail chegaram ao mesmo tempo, e os dois
        # passaram pela verificação acima. O índice único do banco aceitou só o
        # primeiro; o segundo cai aqui.
        db.rollback()
        raise EmailAlreadyRegistered from exc

    return user


def authenticate(db: Session, *, email: str, password: str) -> User:
    """Confere o e-mail e a senha. Devolve o usuário ou lança InvalidCredentials."""
    user = users.get_by_email(db, email)

    # Mesmo quando o e-mail não existe, conferimos a senha contra um hash
    # falso. Assim a resposta demora o mesmo tempo nos dois casos, e ninguém
    # descobre quais e-mails têm cadastro medindo o tempo da resposta.
    if user is None:
        stored_hash = security.dummy_hash()
    else:
        stored_hash = user.password_hash

    password_is_valid = security.verify_password(password, stored_hash)

    if user is None or not password_is_valid:
        raise InvalidCredentials
    return user


def open_session(db: Session, user: User) -> str:
    """Cria uma sessão no banco e devolve o token que vai para o cookie."""
    token = security.new_session_token()
    expires_at = now_utc() + settings.session_ttl

    # O banco guarda só o hash do token, nunca o token em si.
    sessions.create(
        db,
        user_id=user.id,
        token_hash=security.hash_session_token(token),
        expires_at=expires_at,
    )
    db.commit()
    return token


def user_for_token(db: Session, token: str) -> User | None:
    """Devolve o dono de uma sessão válida, ou None.

    A sessão é válida se existe, não foi revogada e ainda não expirou.
    """
    token_hash = security.hash_session_token(token)
    return sessions.get_active_user(db, token_hash=token_hash, now=now_utc())


def close_session(db: Session, token: str) -> None:
    """Revoga a sessão no banco, no logout."""
    token_hash = security.hash_session_token(token)
    sessions.revoke(db, token_hash=token_hash, now=now_utc())
    db.commit()
