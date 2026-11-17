from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models import User
from app.schemas.budgets import BudgetAmount
from app.services import budgets as service
from app.services.transactions import NotFound

router = APIRouter(prefix="/api/budgets", tags=["budgets"])
notification_router = APIRouter(prefix="/api/notifications", tags=["notifications"])


@router.get("")
def listing(response: Response, month: Annotated[str | None, Query(pattern=r"^\d{4}-(0[1-9]|1[0-2])$")] = None,
            user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    response.headers["Cache-Control"] = "no-store"
    return service.listing(db, user, month or service.current_month())


@router.put("/{category_id}")
def put(category_id: UUID, payload: BudgetAmount, response: Response,
        user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    response.headers["Cache-Control"] = "no-store"
    try:
        return service.put(db, user, category_id, payload.amount)
    except NotFound as exc:
        raise HTTPException(404, "Categoria não encontrada.") from exc


@router.delete("/{category_id}", status_code=204)
def remove(category_id: UUID, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        service.remove(db, user, category_id)
    except NotFound as exc:
        raise HTTPException(404, "Limite não encontrado.") from exc
    return Response(status_code=204, headers={"Cache-Control": "no-store"})


@notification_router.get("")
def notifications(response: Response, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    response.headers["Cache-Control"] = "no-store"
    return service.notifications(db, user)


@notification_router.post("/read-all")
def read_all(response: Response, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    response.headers["Cache-Control"] = "no-store"
    return service.mark_read(db, user)


@notification_router.post("/{notification_id}/read")
def read(notification_id: UUID, response: Response, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    response.headers["Cache-Control"] = "no-store"
    try:
        return service.mark_read(db, user, notification_id)
    except NotFound as exc:
        raise HTTPException(404, "Aviso não encontrado.") from exc
