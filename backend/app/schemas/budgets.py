from decimal import Decimal

from pydantic import BaseModel, Field


class BudgetAmount(BaseModel):
    amount: Decimal = Field(gt=0, max_digits=14, decimal_places=2)
