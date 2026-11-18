"""Consulta e revisão das transações importadas pela pessoa logada."""

from datetime import date
from decimal import Decimal
from typing import Literal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from pydantic import BaseModel
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models import Category, CategoryRule, Transaction, Upload, User
from app.pipeline.previa import _texto_busca
from app.services import budgets

router = APIRouter(prefix="/api/transactions", tags=["transactions"])
TransactionType = Literal["purchase", "fee", "refund", "payment", "income", "other"]
Sort = Literal["recent", "oldest", "highest", "lowest"]
PAGE_SIZE = 25


class CategoryChange(BaseModel):
    category_id: UUID
    remember_merchant: bool = False


@router.get("/filters")
def filters(response: Response, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    response.headers["Cache-Control"] = "no-store"
    month = func.to_char(Transaction.transaction_date, "YYYY-MM")
    months = db.scalars(
        select(month).where(Transaction.user_id == user.id).distinct().order_by(month.desc())
    ).all()
    owned_transaction = (
        select(Transaction.id).where(Transaction.category_id == Category.id, Transaction.user_id == user.id).exists()
    )
    categories = db.execute(
        select(Category.id, Category.name, Category.color, Category.is_active)
        .where(or_(budgets.available_categories(user.id), owned_transaction)).order_by(Category.name)
    ).all()
    return {
        "months": months,
        "categories": [{"id": item.id, "name": item.name, "color": item.color, "active": item.is_active} for item in categories],
    }


@router.get("")
def list_transactions(
    response: Response,
    mes: str | None = Query(default=None, pattern=budgets.MONTH_PATTERN),
    categoria: str | None = Query(default=None, max_length=160),
    q: str | None = Query(default=None, max_length=120),
    tipo: TransactionType | None = None,
    arquivo: UUID | None = None,
    minimo: Decimal | None = Query(default=None, ge=0, max_digits=14, decimal_places=2),
    maximo: Decimal | None = Query(default=None, ge=0, max_digits=14, decimal_places=2),
    ordem: Sort = "recent",
    pagina: int = Query(default=1, ge=1, le=1000000),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    response.headers["Cache-Control"] = "no-store"
    if minimo is not None and maximo is not None and minimo > maximo:
        raise HTTPException(status_code=422, detail="O valor máximo deve ser maior ou igual ao mínimo.")
    conditions = [Transaction.user_id == user.id]
    category_name = func.coalesce(Category.name, "Outros")
    amount = func.abs(Transaction.amount)
    if mes:
        conditions.append(Transaction.transaction_date.between(*budgets.month_range(date.fromisoformat(f"{mes}-01"))))
    if categoria:
        conditions.append(category_name == categoria)
    if q and (search := _texto_busca(q).strip()):
        conditions.append(or_(
            Transaction.description_normalized.contains(search, autoescape=True),
            func.lower(Transaction.description_raw).contains(q.strip().lower(), autoescape=True),
            func.lower(Transaction.merchant).contains(q.strip().lower(), autoescape=True),
        ))
    if tipo:
        conditions.append(Transaction.transaction_type == tipo)
    if arquivo:
        conditions.append(Transaction.upload_id == arquivo)
    if minimo is not None:
        conditions.append(amount >= minimo)
    if maximo is not None:
        conditions.append(amount <= maximo)

    base = select(Transaction).outerjoin(Category, Category.id == Transaction.category_id).where(*conditions)
    total = db.scalar(base.with_only_columns(func.count(Transaction.id))) or 0
    last_page = max(1, (total + PAGE_SIZE - 1) // PAGE_SIZE)
    page = min(pagina, last_page)
    sorting = {
        "recent": Transaction.transaction_date.desc(),
        "oldest": Transaction.transaction_date.asc(),
        "highest": amount.desc(),
        "lowest": amount.asc(),
    }
    rows = db.execute(
        base.add_columns(category_name.label("category"), Category.color, Upload.original_filename)
        .join(Upload, (Upload.id == Transaction.upload_id) & (Upload.user_id == Transaction.user_id))
        .order_by(sorting[ordem], Transaction.transaction_date.desc(), Transaction.code.desc())
        .offset((page - 1) * PAGE_SIZE).limit(PAGE_SIZE)
    )
    return {
        "total": total,
        "page": page,
        "pages": last_page,
        "items": [
            {
                "id": item.id, "date": item.transaction_date, "description": item.description_raw,
                "merchant": item.merchant or item.description_raw, "amount": str(abs(item.amount)),
                "type": item.transaction_type, "category_id": item.category_id, "category": category,
                "category_color": color, "file": filename, "duplicate": item.is_duplicate,
                "installment": f"{item.installment_current}/{item.installment_total}" if item.installment_current else None,
                "can_remember_merchant": bool(item.merchant),
            }
            for item, category, color, filename in rows
        ],
    }


@router.patch("/{transaction_id}/category", status_code=204)
def change_category(
    transaction_id: UUID, payload: CategoryChange,
    user: User = Depends(get_current_user), db: Session = Depends(get_db),
):
    budgets.lock_user(db, user.id)
    item = db.scalar(select(Transaction).where(Transaction.id == transaction_id, Transaction.user_id == user.id))
    if item is None:
        raise HTTPException(status_code=404, detail="Transação não encontrada.")
    category = db.scalar(select(Category.id).where(Category.id == payload.category_id, budgets.available_categories(user.id)))
    if category is None:
        raise HTTPException(status_code=404, detail="Categoria não encontrada.")
    if payload.remember_merchant:
        if not item.merchant:
            raise HTTPException(status_code=422, detail="Esta transação não tem um estabelecimento identificado.")
        conditions = (
            CategoryRule.user_id == user.id, CategoryRule.match_type == "merchant",
            CategoryRule.is_active.is_(True),
        )
        rules = [
            rule for rule in db.scalars(select(CategoryRule).where(*conditions))
            if rule.match_value.casefold() == item.merchant.casefold()
        ]
        if rules:
            for rule in rules:
                rule.category_id = category
        else:
            db.add(CategoryRule(user_id=user.id, category_id=category, match_type="merchant", match_value=item.merchant))
    item.category_id = category
    item.category_source = "manual"
    db.flush()
    budgets.record_alerts(db, user.id)
    db.commit()
    return Response(status_code=204)
