"""Limites mensais e memória persistente das faixas já avisadas."""

from datetime import datetime
from decimal import Decimal
from zoneinfo import ZoneInfo

from app.repositories import budgets as repo, transactions, users
from app.services import analytics
from app.services.transactions import NotFound, money


def current_month():
    return datetime.now(ZoneInfo("America/Sao_Paulo")).strftime("%Y-%m")


def category_totals(db, user, month):
    if month not in transactions.available_months(db, user.id):
        return {}, False
    data = analytics.summary(db, user, month)
    return {row["category_id"]: Decimal(row["total"]) for row in data["por_categoria"]}, True


def listing(db, user, month):
    categories, configurations = repo.configurations(db, user.id)
    totals, available = category_totals(db, user, month)
    result = []
    for category in categories:
        config = configurations.get(category.id)
        spent = totals.get(str(category.id), Decimal("0"))
        limit = config.amount if config else None
        result.append(dict(id=str(config.id) if config else None, category_id=str(category.id),
            category_name=category.name, amount=money(limit) if limit is not None else None,
            spent=money(spent), remaining=money(limit-spent) if limit is not None else None,
            used_percentage=float(spent/limit) if limit is not None else None, is_active=config is not None))
    return dict(month=month, coverage_available=available, items=result)


def evaluate(db, user):
    """Avalia só o mês corrente, na transação já bloqueada da mutação."""
    month = current_month()
    totals, _ = category_totals(db, user, month)
    _, configurations = repo.configurations(db, user.id)
    for category_id, config in configurations.items():
        amount = totals.get(str(category_id), Decimal("0"))
        for threshold, reached in ((80, amount >= config.amount*Decimal("0.8")), (100, amount > config.amount)):
            if reached:
                repo.add_notification(db, user.id, category_id, month, threshold, amount, config.amount)
    db.flush()


def put(db, user, category_id, amount):
    users.lock(db, user.id)
    if transactions.category(db, user.id, category_id) is None:
        raise NotFound
    repo.put(db, user.id, category_id, amount)
    evaluate(db, user)
    db.commit()
    return listing(db, user, current_month())


def remove(db, user, category_id):
    users.lock(db, user.id)
    config = repo.configuration(db, user.id, category_id)
    if config is None:
        raise NotFound
    config.is_active = False
    db.flush()
    evaluate(db, user)
    db.commit()


def notifications(db, user):
    rows = repo.notifications(db, user.id)
    return dict(items=[dict(id=str(n.id), category_id=str(n.category_id), category_name=name,
        month=n.month, threshold=n.threshold, amount=money(n.amount), limit_amount=money(n.limit_amount),
        created_at=n.created_at, read_at=n.read_at) for n, name in rows],
        unread_count=sum(n.read_at is None for n, _ in rows))


def mark_read(db, user, notification_id=None):
    users.lock(db, user.id)
    rows = repo.notifications(db, user.id)
    selected = [n for n, _ in rows if notification_id is None or n.id == notification_id]
    if notification_id is not None and not selected:
        raise NotFound
    now = datetime.now(ZoneInfo("UTC"))
    for notification in selected:
        if notification.read_at is None:
            notification.read_at = now
    db.commit()
    return notifications(db, user)
