"""Consultas completas e paginadas sobre a mesma definição de filtros."""

import calendar
from datetime import date
from decimal import Decimal

from sqlalchemy import case, func, or_, select

from app.models import Category, CategoryRule, Transaction, Upload


def included():
    return Transaction.is_duplicate.is_(False) & Transaction.transaction_type.in_(("purchase", "fee", "refund"))


def contribution():
    return case(
        (Transaction.is_duplicate.is_(True), Decimal("0")),
        (Transaction.transaction_type.in_(("purchase", "fee")), Transaction.amount),
        (Transaction.transaction_type == "refund", -Transaction.amount),
        else_=Decimal("0"),
    )


def available_months(db, user_id):
    month = func.to_char(Transaction.transaction_date, "YYYY-MM").label("month")
    return list(db.scalars(select(month).where(
        Transaction.user_id == user_id,
    ).distinct().order_by(month)).all())


def conditions(user_id, filters):
    clauses = [Transaction.user_id == user_id]
    if filters.uncategorized:
        clauses.append(Transaction.category_id.is_(None))
    if filters.month and filters.month not in ("latest", "all"):
        year, month = map(int, filters.month.split("-"))
        clauses += [Transaction.transaction_date >= date(year, month, 1),
                    Transaction.transaction_date <= date(year, month, calendar.monthrange(year, month)[1])]
    for value, expression in (
        (filters.date_from, lambda v: Transaction.transaction_date >= v),
        (filters.date_to, lambda v: Transaction.transaction_date <= v),
        (filters.category_id, lambda v: Transaction.category_id == v),
        (filters.merchant, lambda v: func.lower(Transaction.merchant) == v.lower()),
        (filters.min_amount, lambda v: Transaction.amount >= v),
        (filters.max_amount, lambda v: Transaction.amount <= v),
        (filters.transaction_type, lambda v: Transaction.transaction_type == v),
    ):
        if value is not None:
            clauses.append(expression(value))
    if filters.q:
        # Contains escapes SQL wildcards, so searching '%' searches that character.
        clauses.append(or_(Transaction.description_raw.icontains(filters.q, autoescape=True),
                           Transaction.merchant.icontains(filters.q, autoescape=True)))
    if filters.eligibility != "all":
        clauses.append(included() if filters.eligibility == "included" else ~included())
    return clauses


def list_page(db, user_id, filters):
    clauses = conditions(user_id, filters)
    totals = db.execute(select(
        func.count(), func.coalesce(func.sum(contribution()), 0),
        func.coalesce(func.sum(case((Transaction.transaction_type == "income", case(
            (Transaction.is_duplicate.is_(False), Transaction.amount), else_=0)), else_=0)), 0),
        func.coalesce(func.sum(case((Transaction.transaction_type == "payment", case(
            (Transaction.is_duplicate.is_(False), Transaction.amount), else_=0)), else_=0)), 0),
    ).select_from(Transaction).where(*clauses)).one()
    field = Transaction.amount if filters.sort.startswith("amount") else Transaction.transaction_date
    order = field.asc() if filters.sort.endswith("asc") else field.desc()
    rows = db.execute(select(Transaction, Category.name).outerjoin(Category, Category.id == Transaction.category_id)
        .where(*clauses).order_by(order, Transaction.id).offset((filters.page - 1) * filters.page_size)
        .limit(filters.page_size)).all()
    return rows, totals


def get(db, user_id, transaction_id):
    return db.execute(select(Transaction, Category.name).outerjoin(Category, Category.id == Transaction.category_id)
        .where(Transaction.user_id == user_id, Transaction.id == transaction_id)).first()


def category(db, user_id, category_id):
    return db.scalar(select(Category).where(Category.id == category_id, Category.is_active.is_(True),
        or_(Category.user_id.is_(None), Category.user_id == user_id)))


def save_merchant_rule(db, user_id, merchant, category_id):
    rule = db.scalar(select(CategoryRule).where(CategoryRule.user_id == user_id,
        CategoryRule.match_type == "merchant", func.lower(CategoryRule.match_value) == merchant.lower())
        .order_by(CategoryRule.priority, CategoryRule.id).limit(1))
    if rule is None:
        rule = CategoryRule(user_id=user_id, category_id=category_id, match_type="merchant", match_value=merchant)
        db.add(rule)
    rule.category_id = category_id
    rule.is_active = True


def analysis_records(db, user_id):
    rows = db.execute(select(Transaction, Category.name, Upload).join(Upload, Upload.id == Transaction.upload_id)
        .outerjoin(Category, Category.id == Transaction.category_id).where(Transaction.user_id == user_id)
        .order_by(Transaction.transaction_date, Transaction.id)).all()
    return [{
        "id": str(t.id), "user_id": str(t.user_id), "upload_id": str(t.upload_id),
        "upload_created_at": upload.created_at, "source_format": upload.source_format,
        "document_type": upload.document_type, "bank_transaction_id": t.bank_transaction_id,
        "balance": t.balance, "source_row": t.source_row, "source_sheet": t.source_sheet,
        "is_duplicate": t.is_duplicate, "is_suspected_duplicate": t.is_suspected_duplicate,
        "category_id": str(t.category_id) if t.category_id else None,
        "data": t.transaction_date, "descricao": t.description_raw,
        "estabelecimento": t.merchant or t.description_raw, "categoria": name or "Outros",
        "valor": t.amount, "tipo": t.transaction_type,
        "parcela_atual": t.installment_current, "parcela_total": t.installment_total,
    } for t, name, upload in rows]
