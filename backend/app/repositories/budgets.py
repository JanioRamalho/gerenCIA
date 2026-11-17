"""Persistência de limites e avisos; commits pertencem ao caso de uso."""

from sqlalchemy import or_, select

from app.models import Category


def configurations(db, user_id):
    from app.models import CategoryBudget
    categories = db.scalars(select(Category).where(Category.is_active.is_(True),
        or_(Category.user_id.is_(None), Category.user_id == user_id)).order_by(Category.name)).all()
    budgets = db.scalars(select(CategoryBudget).where(CategoryBudget.user_id == user_id,
        CategoryBudget.period == "monthly", CategoryBudget.is_active.is_(True))).all()
    return categories, {b.category_id: b for b in budgets}


def configuration(db, user_id, category_id):
    from app.models import CategoryBudget
    return db.scalar(select(CategoryBudget).where(CategoryBudget.user_id == user_id,
        CategoryBudget.category_id == category_id, CategoryBudget.period == "monthly"))


def put(db, user_id, category_id, amount):
    from app.models import CategoryBudget
    budget = configuration(db, user_id, category_id)
    if budget is None:
        budget = CategoryBudget(user_id=user_id, category_id=category_id, period="monthly", amount=amount)
        db.add(budget)
    budget.amount, budget.is_active = amount, True
    db.flush()
    return budget


def add_notification(db, user_id, category_id, month, threshold, amount, limit_amount):
    from app.models import Notification
    existing = db.scalar(select(Notification.id).where(Notification.user_id == user_id,
        Notification.category_id == category_id, Notification.month == month,
        Notification.threshold == threshold))
    if existing is None:
        db.add(Notification(user_id=user_id, category_id=category_id, month=month,
            threshold=threshold, amount=amount, limit_amount=limit_amount))


def notifications(db, user_id):
    from app.models import Notification
    return db.execute(select(Notification, Category.name).join(Category, Category.id == Notification.category_id)
        .where(Notification.user_id == user_id).order_by(Notification.created_at.desc(),
            Notification.threshold.desc(), Notification.id)).all()
