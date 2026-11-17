from sqlalchemy import select

from app.models import Category


def system_categories(db):
    return db.scalars(select(Category).where(Category.user_id.is_(None), Category.is_active.is_(True))
        .order_by(Category.name)).all()
