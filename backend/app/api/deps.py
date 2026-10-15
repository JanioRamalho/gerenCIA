from fastapi import Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import get_db
from app.models import User
from app.services import auth as auth_service


def get_session_token(request: Request) -> str | None:
    return request.cookies.get(settings.session_cookie_name)


def get_current_user(
    token: str | None = Depends(get_session_token),
    db: Session = Depends(get_db),
) -> User:
    """The only way to learn who is calling: the user always comes from the session."""
    user = auth_service.user_for_token(db, token) if token else None
    if user is None:
        raise HTTPException(status_code=401, detail="Entre para continuar.")
    return user
