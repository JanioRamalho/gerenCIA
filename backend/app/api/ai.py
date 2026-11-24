"""Rota da IA: perfil de gastos e meses fora do padrão, calculados pelo modelo próprio."""

from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models import User
from app.services import ai as ai_service

router = APIRouter(prefix="/api/ai", tags=["ia"])


@router.get("/spending-profile")
def spending_profile(
    response: Response,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Perfil aprendido com a regressão linear e os meses em que o gasto extrapolou."""
    response.headers["Cache-Control"] = "no-store"
    return ai_service.perfil_de_gastos(db, user)
