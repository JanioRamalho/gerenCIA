"""Consultas analíticas com períodos resolvidos e valores monetários decimais."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models import User
from app.services import analytics as service

router = APIRouter(prefix="/api/analytics", tags=["analytics"])
Month = Annotated[str, Query(pattern=r"^(latest|all|\d{4}-(0[1-9]|1[0-2]))$")]
Reference = Annotated[str | None, Query(pattern=r"^\d{4}-(0[1-9]|1[0-2])$")]


@router.get("/summary")
def summary(response: Response, month: Month = "latest", reference_month: Reference = None,
            user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    response.headers["Cache-Control"] = "no-store"
    try:
        return service.summary(db, user, month, reference_month)
    except service.InvalidPeriod as exc:
        raise HTTPException(422, str(exc)) from exc


@router.get("/comparison")
def comparison(response: Response,
               month: Annotated[str, Query(pattern=r"^\d{4}-(0[1-9]|1[0-2])$")],
               reference_month: Annotated[str, Query(pattern=r"^\d{4}-(0[1-9]|1[0-2])$")],
               user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return summary(response, month, reference_month, user, db)["comparacao"]


@router.get("/categories")
def categories(response: Response, month: Month = "latest", user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return summary(response, month, None, user, db)["por_categoria"]


@router.get("/merchants")
def merchants(response: Response, month: Month = "latest", user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return summary(response, month, None, user, db)["por_estabelecimento"]


@router.get("/evolution")
def evolution(response: Response, month: Month = "latest", user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    result = summary(response, month, None, user, db)
    return {"mes": result["mes"], "por_mes": result["por_mes"], "por_dia": result["por_dia"]}


@router.get("/largest")
def largest(response: Response, month: Month = "latest", user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return summary(response, month, None, user, db)["maiores_lancamentos"]
