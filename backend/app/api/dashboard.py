"""Rota do painel: as análises calculadas com pandas sobre as transações gravadas."""

from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models import User
from app.services import uploads as uploads_service

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("")
def painel(
    response: Response,
    mes: str | None = Query(default=None, pattern=r"^\d{4}-(0[1-9]|1[0-2])$", description="Mês no formato AAAA-MM"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Totais, categorias, maiores lançamentos e recorrências da pessoa logada."""
    response.headers["Cache-Control"] = "no-store"
    return uploads_service.painel(db, user, mes)
