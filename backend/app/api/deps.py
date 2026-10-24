"""Dependências compartilhadas pelas rotas.

No FastAPI, uma dependência é uma função que a rota pede com Depends(...). O
FastAPI executa essa função antes da rota e entrega o resultado como
parâmetro. Aqui ficam as dependências que descobrem quem está logado.
"""

from fastapi import Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import get_db
from app.models import User
from app.services import auth as auth_service


def get_session_token(request: Request) -> str | None:
    """Lê o token de sessão do cookie. Devolve None se o cookie não existir."""
    return request.cookies.get(settings.session_cookie_name)


def get_current_user(
    token: str | None = Depends(get_session_token),
    db: Session = Depends(get_db),
) -> User:
    """Descobre quem está fazendo a requisição, ou responde 401.

    É o único jeito de saber quem é o usuário: ele sempre vem da sessão, nunca
    de um user_id enviado pelo frontend. Para proteger uma rota nova, basta
    acrescentar o parâmetro `user: User = Depends(get_current_user)`.
    """
    # Sem o cookie de sessão, ninguém está logado.
    if not token:
        raise HTTPException(status_code=401, detail="Entre para continuar.")

    user = auth_service.user_for_token(db, token)

    # O token existe, mas pode ter expirado, ter sido revogado ou ser inventado.
    if user is None:
        raise HTTPException(status_code=401, detail="Entre para continuar.")

    return user
