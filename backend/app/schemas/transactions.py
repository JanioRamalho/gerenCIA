"""Filtros e respostas da investigação de transações."""

from datetime import date
from decimal import Decimal
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field, model_validator


class TransactionFilters(BaseModel):
    month: str | None = Field(default=None, pattern=r"^(latest|all|\d{4}-(0[1-9]|1[0-2]))$")
    date_from: date | None = None
    date_to: date | None = None
    category_id: UUID | None = None
    uncategorized: bool = False
    merchant: str | None = Field(default=None, max_length=255)
    q: str | None = Field(default=None, max_length=255)
    min_amount: Decimal | None = Field(default=None, ge=0, max_digits=14, decimal_places=2)
    max_amount: Decimal | None = Field(default=None, ge=0, max_digits=14, decimal_places=2)
    transaction_type: Literal["purchase", "fee", "refund", "payment", "income", "other"] | None = None
    eligibility: Literal["all", "included", "excluded"] = "all"
    sort: Literal["date_desc", "date_asc", "amount_desc", "amount_asc"] = "date_desc"
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=25, ge=1, le=100)

    @model_validator(mode="after")
    def intervals(self):
        if self.uncategorized and self.category_id:
            raise ValueError("Escolha categoria ou sem categoria, não os dois.")
        if self.month not in (None, "all", "latest"):
            date.fromisoformat(self.month + "-01")
        if self.month is not None and (self.date_from is not None or self.date_to is not None):
            raise ValueError("Use mês ou intervalo de datas, não os dois.")
        if self.date_from and self.date_to and self.date_from > self.date_to:
            raise ValueError("A data inicial deve vir antes da data final.")
        if self.min_amount is not None and self.max_amount is not None and self.min_amount > self.max_amount:
            raise ValueError("O valor mínimo deve ser menor ou igual ao máximo.")
        return self


class CategoryCorrection(BaseModel):
    category_id: UUID
    save_rule: bool = False


class TransactionItem(BaseModel):
    id: UUID
    upload_id: UUID
    source_row: int
    source_sheet: str | None
    date: date
    description: str
    merchant: str
    amount: str
    transaction_type: str
    category_id: UUID | None
    category_name: str
    category_source: str
    is_duplicate: bool
    is_suspected_duplicate: bool
    contribution: str


class TransactionAggregates(BaseModel):
    net_spending: str
    income: str
    payments: str
    count: int


class TransactionPage(BaseModel):
    items: list[TransactionItem]
    total: int
    page: int
    page_size: int
    month: str | None
    filters: TransactionFilters
    aggregates: TransactionAggregates
