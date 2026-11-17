from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.categories import CategoryResponse
from app.services import categories as service

router = APIRouter(prefix="/api/categories", tags=["categories"])


@router.get("", response_model=list[CategoryResponse])
def listing(db: Session = Depends(get_db)):
    try:
        return service.listing(db)
    except SQLAlchemyError as exc:
        raise HTTPException(503, "Não foi possível consultar as categorias.") from exc
