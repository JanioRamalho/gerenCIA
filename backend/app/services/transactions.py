"""Pesquisa, investigação e correção explícita sem recategorizar o histórico."""

from decimal import Decimal

from app.repositories import transactions as repo, users


class NotFound(Exception):
    pass


def money(value):
    return format(Decimal(value).quantize(Decimal("0.01")), ".2f")


def item(transaction, category_name):
    signed = transaction.amount if transaction.transaction_type in ("purchase", "fee") else (
        -transaction.amount if transaction.transaction_type == "refund" else Decimal("0"))
    return dict(id=transaction.id, upload_id=transaction.upload_id, source_row=transaction.source_row,
        source_sheet=transaction.source_sheet, date=transaction.transaction_date,
        description=transaction.description_raw, merchant=transaction.merchant or transaction.description_raw,
        amount=money(transaction.amount), transaction_type=transaction.transaction_type,
        category_id=transaction.category_id, category_name=category_name or "Outros",
        category_source=transaction.category_source, is_duplicate=transaction.is_duplicate,
        is_suspected_duplicate=transaction.is_suspected_duplicate,
        contribution=money(0 if transaction.is_duplicate else signed))


def listing(db, user, filters):
    if filters.month == "latest":
        months = repo.available_months(db, user.id)
        if not months:
            return dict(items=[], total=0, page=filters.page, page_size=filters.page_size,
                month=None, filters=filters, aggregates=dict(net_spending="0.00", income="0.00", payments="0.00", count=0))
        filters = filters.model_copy(update={"month": months[-1]})
    rows, totals = repo.list_page(db, user.id, filters)
    count, spending, income, payments = totals
    return dict(items=[item(*row) for row in rows], total=count, page=filters.page,
        page_size=filters.page_size, month=filters.month, filters=filters,
        aggregates=dict(net_spending=money(spending), income=money(income), payments=money(payments), count=count))


def detail(db, user, transaction_id):
    row = repo.get(db, user.id, transaction_id)
    if row is None:
        raise NotFound
    return item(*row)


def correct_category(db, user, transaction_id, payload):
    users.lock(db, user.id)
    row = repo.get(db, user.id, transaction_id)
    category = repo.category(db, user.id, payload.category_id)
    if row is None or category is None:
        raise NotFound
    transaction, _ = row
    transaction.category_id = category.id
    transaction.category_source = "manual"
    if payload.save_rule:
        repo.save_merchant_rule(db, user.id, transaction.merchant or transaction.description_raw, category.id)
    db.flush()
    from app.services.budgets import evaluate
    evaluate(db, user)
    db.commit()
    return item(transaction, category.name)
