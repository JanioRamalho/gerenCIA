"""Limites mensais e avisos calculados em reais, com Decimal."""

from calendar import monthrange
from datetime import date, datetime
from decimal import Decimal
from uuid import UUID
from zoneinfo import ZoneInfo

from sqlalchemy import and_, case, func, or_, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session

from app.models import Category, CategoryBudget, Notification, Transaction, User
from app.pipeline.analise import TIPOS_DE_GASTO

FUSO_BRASIL = ZoneInfo("America/Sao_Paulo")
MONTH_PATTERN = r"^[1-9][0-9]{3}-(0[1-9]|1[0-2])$"


def current_month() -> date:
    return datetime.now(FUSO_BRASIL).date().replace(day=1)


def month_range(month: date) -> tuple[date, date]:
    return month, month.replace(day=monthrange(month.year, month.month)[1])


def available_categories(user_id: UUID):
    return and_(Category.is_active.is_(True), or_(Category.user_id.is_(None), Category.user_id == user_id))


def lock_user(db: Session, user_id: UUID) -> None:
    """Serializa alterações que podem afetar os avisos de uma mesma conta."""
    db.execute(select(User.id).where(User.id == user_id).with_for_update()).scalar_one()


def category_balances(db: Session, user_id: UUID, month: date):
    other = select(Category.id).where(Category.user_id.is_(None), Category.name == "Outros").scalar_subquery()
    category_id = func.coalesce(Transaction.category_id, other)
    net_amount = case(
        (Transaction.transaction_type == "refund", -func.abs(Transaction.amount)),
        else_=func.abs(Transaction.amount),
    )
    totals = (
        select(category_id.label("category_id"), func.sum(net_amount).label("spent"))
        .where(
            Transaction.user_id == user_id,
            Transaction.transaction_date.between(*month_range(month)),
            Transaction.transaction_type.in_((*TIPOS_DE_GASTO, "refund")),
            Transaction.is_duplicate.is_(False),
        )
        .group_by(category_id)
        .subquery()
    )
    return db.execute(
        select(Category.id, Category.name, Category.color, func.coalesce(totals.c.spent, Decimal("0.00")).label("spent"), CategoryBudget.amount)
        .outerjoin(totals, totals.c.category_id == Category.id)
        .outerjoin(CategoryBudget, and_(
            CategoryBudget.category_id == Category.id,
            CategoryBudget.user_id == user_id,
            CategoryBudget.period == "monthly",
            CategoryBudget.month == month,
        ))
        .where(available_categories(user_id))
        .order_by(Category.name)
    ).all()


def record_alerts(db: Session, user_id: UUID) -> None:
    """Grava o primeiro registro de cada faixa atingida, na transação da alteração."""
    month = current_month()
    alerts = []
    for category_id, _, _, spent, budget in category_balances(db, user_id, month):
        if budget is None:
            continue
        for threshold, reached in ((80, spent * 5 >= budget * 4), (100, spent > budget)):
            if reached:
                alerts.append({
                    "user_id": user_id,
                    "category_id": category_id,
                    "month": month,
                    "threshold": threshold,
                    "spent": spent,
                    "budget": budget,
                })
    if alerts:
        db.execute(insert(Notification).values(alerts).on_conflict_do_nothing(
            constraint="notifications_budget_threshold_key",
        ))
