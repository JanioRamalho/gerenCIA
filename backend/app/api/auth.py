from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_session_token
from app.core.config import settings
from app.db.session import get_db
from app.models import User
from app.schemas.auth import LoginRequest, RegisterRequest, UserResponse
from app.services import auth as auth_service

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _start_session(response: Response, db: Session, user: User) -> None:
    token = auth_service.open_session(db, user)
    response.set_cookie(
        settings.session_cookie_name,
        token,
        max_age=int(settings.session_ttl.total_seconds()),
        httponly=True,
        samesite="lax",
        secure=settings.cookie_secure,
        path="/",
    )
    response.headers["Cache-Control"] = "no-store"


@router.post("/register", response_model=UserResponse, status_code=201)
def register(payload: RegisterRequest, response: Response, db: Session = Depends(get_db)):
    try:
        user = auth_service.register(db, name=payload.name, email=payload.email, password=payload.password)
    except auth_service.EmailAlreadyRegistered as exc:
        raise HTTPException(status_code=409, detail="Este e-mail já tem cadastro. Entre com a sua senha.") from exc
    _start_session(response, db, user)
    return user


@router.post("/login", response_model=UserResponse)
def login(payload: LoginRequest, response: Response, db: Session = Depends(get_db)):
    try:
        user = auth_service.authenticate(db, email=payload.email, password=payload.password)
    except auth_service.InvalidCredentials as exc:
        # One message for unknown e-mail and wrong password.
        raise HTTPException(status_code=401, detail="E-mail ou senha incorretos.") from exc
    _start_session(response, db, user)
    return user


@router.post("/logout", status_code=204)
def logout(
    response: Response,
    token: str | None = Depends(get_session_token),
    db: Session = Depends(get_db),
):
    if token:
        auth_service.close_session(db, token)
    response.delete_cookie(settings.session_cookie_name, path="/")
    response.headers["Cache-Control"] = "no-store"


@router.get("/me", response_model=UserResponse)
def me(response: Response, user: User = Depends(get_current_user)):
    response.headers["Cache-Control"] = "no-store"
    return user
