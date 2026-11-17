"""Persistência dos limites mensais e avisos."""

from datetime import datetime
from decimal import Decimal
from uuid import UUID, uuid4

from sqlalchemy import Boolean, CHAR, CheckConstraint, DateTime, ForeignKey, Index, Integer, Numeric, Text, UniqueConstraint, Uuid, func, text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.entities import DisplayCodeMixin


class CategoryBudget(DisplayCodeMixin, Base):
    __tablename__ = "category_budgets"
    __table_args__ = (
        UniqueConstraint("user_id", "category_id", "period", name="category_budgets_user_category_period_uq"),
        CheckConstraint("period = 'monthly'", name="category_budgets_period_valid"),
        CheckConstraint("amount > 0", name="category_budgets_amount_positive"),
    )

    id: Mapped[UUID] = mapped_column(Uuid, primary_key=True, default=uuid4, server_default=text("gen_random_uuid()"))
    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    category_id: Mapped[UUID] = mapped_column(ForeignKey("categories.id", ondelete="CASCADE"), nullable=False)
    period: Mapped[str] = mapped_column(Text, nullable=False, server_default=text("'monthly'"))
    amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("true"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())


class Notification(DisplayCodeMixin, Base):
    __tablename__ = "notifications"
    __table_args__ = (
        UniqueConstraint("user_id", "category_id", "month", "threshold", name="notifications_month_threshold_uq"),
        CheckConstraint("month ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'", name="notifications_month_valid"),
        CheckConstraint("threshold IN (80, 100)", name="notifications_threshold_valid"),
        Index("notifications_user_created_at_idx", "user_id", text("created_at DESC")),
    )

    id: Mapped[UUID] = mapped_column(Uuid, primary_key=True, default=uuid4, server_default=text("gen_random_uuid()"))
    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    category_id: Mapped[UUID] = mapped_column(ForeignKey("categories.id", ondelete="CASCADE"), nullable=False)
    month: Mapped[str] = mapped_column(CHAR(7), nullable=False)
    threshold: Mapped[int] = mapped_column(Integer, nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    limit_amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    read_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
