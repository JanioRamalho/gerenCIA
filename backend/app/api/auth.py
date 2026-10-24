"""Rotas de autenticação: cadastro, login, logout e "quem sou eu".

As rotas só recebem a requisição e montam a resposta. As regras, como conferir
a senha e criar a sessão, ficam em services/auth.py.
"""

from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_session_token
from app.core.config import settings
from app.db.session import get_db
from app.models import User
from app.schemas.auth import LoginRequest, RegisterRequest, UserResponse
from app.services import auth as auth_service

# Todas as rotas deste arquivo começam com /api/auth. A tag agrupa as rotas na
# documentação automática, em /docs.
router = APIRouter(prefix="/api/auth", tags=["auth"])


def open_session_and_set_cookie(response: Response, db: Session, user: User) -> None:
    """Abre uma sessão para o usuário e envia o token ao navegador num cookie."""
    token = auth_service.open_session(db, user)

    # Tempo de vida do cookie, em segundos. É o mesmo da sessão no banco.
    max_age_in_seconds = int(settings.session_ttl.total_seconds())

    response.set_cookie(
        settings.session_cookie_name,
        token,
        max_age=max_age_in_seconds,
        # httponly: o JavaScript da página não consegue ler o cookie. Isso
        # protege o token se algum script malicioso rodar no site.
        httponly=True,
        # samesite="lax": o navegador não envia o cookie em requisições
        # disparadas por outros sites, o que protege contra ataques CSRF.
        samesite="lax",
        # secure: o cookie só viaja por HTTPS. Fica ligado em produção.
        secure=settings.cookie_secure,
        # path="/": o cookie vale para todas as rotas do site.
        path="/",
    )
    # Pede ao navegador que não guarde esta resposta em cache, porque ela traz
    # dados do usuário.
    response.headers["Cache-Control"] = "no-store"


@router.post("/register", response_model=UserResponse, status_code=201)
def register(payload: RegisterRequest, response: Response, db: Session = Depends(get_db)):
    """Cria a conta e já deixa a pessoa logada.

    Os dados chegam em `payload`, já validados por RegisterRequest
    (schemas/auth.py). O response_model=UserResponse garante que a resposta
    nunca inclui a senha nem o hash dela.
    """
    try:
        user = auth_service.register(
            db,
            name=payload.name,
            email=payload.email,
            password=payload.password,
        )
    except auth_service.EmailAlreadyRegistered as exc:
        # 409 significa "conflito": o e-mail já está em uso.
        raise HTTPException(
            status_code=409,
            detail="Este e-mail já tem cadastro. Entre com a sua senha.",
        ) from exc

    open_session_and_set_cookie(response, db, user)
    return user


@router.post("/login", response_model=UserResponse)
def login(payload: LoginRequest, response: Response, db: Session = Depends(get_db)):
    """Confere o e-mail e a senha e, se estiverem certos, abre a sessão."""
    try:
        user = auth_service.authenticate(
            db,
            email=payload.email,
            password=payload.password,
        )
    except auth_service.InvalidCredentials as exc:
        # A mesma mensagem para e-mail desconhecido e para senha errada.
        # Assim ninguém descobre quais e-mails têm cadastro.
        raise HTTPException(status_code=401, detail="E-mail ou senha incorretos.") from exc

    open_session_and_set_cookie(response, db, user)
    return user


@router.post("/logout", status_code=204)
def logout(
    response: Response,
    token: str | None = Depends(get_session_token),
    db: Session = Depends(get_db),
):
    """Encerra a sessão. Responde 204 (sem conteúdo) mesmo sem sessão aberta."""
    # Revoga a sessão no banco. Assim, mesmo quem guardou uma cópia do cookie
    # não consegue mais usá-la.
    if token:
        auth_service.close_session(db, token)

    # Pede ao navegador que apague o cookie.
    response.delete_cookie(settings.session_cookie_name, path="/")
    response.headers["Cache-Control"] = "no-store"


@router.get("/me", response_model=UserResponse)
def me(response: Response, user: User = Depends(get_current_user)):
    """Devolve os dados de quem está logado."""
    # Se não houver sessão válida, get_current_user (api/deps.py) já
    # respondeu 401 e esta função nem chega a rodar.
    response.headers["Cache-Control"] = "no-store"
    return user
