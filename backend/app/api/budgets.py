"""Limites por categoria e caixa de notificações da conta."""

from datetime import date
from decimal import Decimal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from pydantic import BaseModel, Field
from sqlalchemy import delete, func, select, update
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models import Category, CategoryBudget, Notification, User
from app.services import budgets

router = APIRouter(prefix="/api", tags=["budgets"])


class BudgetInput(BaseModel):
    amount: Decimal = Field(gt=0, max_digits=14, decimal_places=2)


@router.get("/budgets")
def list_budgets(
    response: Response,
    mes: str | None = Query(default=None, pattern=budgets.MONTH_PATTERN),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    response.headers["Cache-Control"] = "no-store"
    current = budgets.current_month()
    month = date.fromisoformat(f"{mes}-01") if mes else current
    return {
        "month": month.strftime("%Y-%m"),
        "current_month": current.strftime("%Y-%m"),
        "categories": [
            {
                "id": category_id, "name": name, "color": color, "spent": str(spent),
                "amount": None if amount is None else str(amount),
                "remaining": None if amount is None else str(amount - spent),
                "used": None if amount is None else float(spent / amount),
                "status": ("unset" if amount is None else "over" if spent > amount
                           else "near" if spent * 5 >= amount * 4 else "ok"),
            }
            for category_id, name, color, spent, amount in budgets.category_balances(db, user.id, month)
        ],
    }


@router.put("/budgets/{category_id}", status_code=204)
def save_budget(
    category_id: UUID, payload: BudgetInput,
    mes: str | None = Query(default=None, pattern=budgets.MONTH_PATTERN),
    user: User = Depends(get_current_user), db: Session = Depends(get_db),
):
    current = budgets.current_month()
    month = date.fromisoformat(f"{mes}-01") if mes else current
    budgets.lock_user(db, user.id)
    category = db.scalar(select(Category.id).where(Category.id == category_id, budgets.available_categories(user.id)))
    if category is None:
        raise HTTPException(status_code=404, detail="Categoria não encontrada.")
    db.execute(insert(CategoryBudget).values(
        user_id=user.id, category_id=category_id, period="monthly", month=month, amount=payload.amount,
    ).on_conflict_do_update(
        constraint="category_budgets_user_category_month_key", set_={"amount": payload.amount},
    ))
    if month == current:
        budgets.record_alerts(db, user.id)
    db.commit()
    return Response(status_code=204)


@router.delete("/budgets/{category_id}", status_code=204)
def remove_budget(
    category_id: UUID,
    mes: str | None = Query(default=None, pattern=budgets.MONTH_PATTERN),
    user: User = Depends(get_current_user), db: Session = Depends(get_db),
):
    month = date.fromisoformat(f"{mes}-01") if mes else budgets.current_month()
    budgets.lock_user(db, user.id)
    db.execute(delete(CategoryBudget).where(
        CategoryBudget.user_id == user.id, CategoryBudget.category_id == category_id,
        CategoryBudget.period == "monthly", CategoryBudget.month == month,
    ))
    db.commit()
    return Response(status_code=204)


@router.get("/notifications")
def list_notifications(response: Response, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    response.headers["Cache-Control"] = "no-store"
    owned = Notification.user_id == user.id
    unread = db.scalar(select(func.count()).where(owned, Notification.read_at.is_(None)))
    entries = db.execute(
        select(Notification, Category.name).join(Category, Category.id == Notification.category_id)
        .where(owned)
        .order_by(Notification.read_at.is_not(None), Notification.created_at.desc(), Notification.code.desc())
        .limit(50)
    )
    return {
        "unread": unread,
        "items": [
            {
                "id": item.id, "category": category, "month": item.month.strftime("%Y-%m"),
                "threshold": item.threshold, "spent": str(item.spent), "budget": str(item.budget),
                "created_at": item.created_at, "read_at": item.read_at,
            }
            for item, category in entries
        ],
    }


@router.post("/notifications/read", status_code=204)
def mark_notifications_read(
    notification_id: UUID | None = None,
    user: User = Depends(get_current_user), db: Session = Depends(get_db),
):
    statement = update(Notification).where(Notification.user_id == user.id, Notification.read_at.is_(None))
    if notification_id is not None:
        statement = statement.where(Notification.id == notification_id)
    db.execute(statement.values(read_at=func.now()))
    db.commit()
    return Response(status_code=204)
