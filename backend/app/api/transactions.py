"""Investigação autenticada: filtros no servidor antes da paginação."""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models import User
from app.schemas.transactions import CategoryCorrection, TransactionFilters, TransactionItem, TransactionPage
from app.services import transactions as service

router = APIRouter(prefix="/api/transactions", tags=["transactions"])


@router.get("", response_model=TransactionPage)
def listing(response: Response, filters: Annotated[TransactionFilters, Query()],
            user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    response.headers["Cache-Control"] = "no-store"
    return service.listing(db, user, filters)


@router.get("/{transaction_id}", response_model=TransactionItem)
def detail(transaction_id: UUID, response: Response,
           user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    response.headers["Cache-Control"] = "no-store"
    try:
        return service.detail(db, user, transaction_id)
    except service.NotFound as exc:
        raise HTTPException(404, "Transação não encontrada.") from exc


@router.patch("/{transaction_id}/category", response_model=TransactionItem)
def category(transaction_id: UUID, payload: CategoryCorrection, response: Response,
             user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    response.headers["Cache-Control"] = "no-store"
    try:
        return service.correct_category(db, user, transaction_id, payload)
    except service.NotFound as exc:
        raise HTTPException(404, "Transação ou categoria não encontrada.") from exc
