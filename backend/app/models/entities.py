from datetime import date, datetime
from decimal import Decimal
from typing import Any
from uuid import UUID, uuid4

from sqlalchemy import (
    BigInteger,
    Boolean,
    CheckConstraint,
    Date,
    DateTime,
    ForeignKey,
    ForeignKeyConstraint,
    Index,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    Uuid,
    func,
    text,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class User(Base):
    __tablename__ = "users"
    __table_args__ = (
        CheckConstraint("length(trim(name)) > 0", name="users_name_not_empty"),
        CheckConstraint("length(trim(email)) > 0", name="users_email_not_empty"),
        Index("users_email_lower_uq", func.lower(text("email")), unique=True),
    )

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4, server_default=text("gen_random_uuid()"))
    name: Mapped[str] = mapped_column(Text, nullable=False)
    email: Mapped[str] = mapped_column(Text, nullable=False)
    password_hash: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())


class SessionRecord(Base):
    __tablename__ = "sessions"
    __table_args__ = (
        CheckConstraint("expires_at > created_at", name="sessions_expiry_after_creation"),
        Index("sessions_user_id_idx", "user_id"),
        Index("sessions_expires_at_idx", "expires_at"),
    )

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4, server_default=text("gen_random_uuid()"))
    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    token_hash: Mapped[str] = mapped_column(String(64), nullable=False, unique=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class Upload(Base):
    __tablename__ = "uploads"
    __table_args__ = (
        CheckConstraint("length(trim(original_filename)) > 0", name="uploads_filename_not_empty"),
        CheckConstraint("file_extension IN ('csv', 'xlsx')", name="uploads_extension_valid"),
        CheckConstraint("file_size_bytes > 0 AND file_size_bytes <= 26214400", name="uploads_file_size_valid"),
        CheckConstraint("sha256 ~ '^[0-9a-fA-F]{64}$'", name="uploads_sha256_valid"),
        CheckConstraint(
            "status IN ('uploaded', 'profiling', 'awaiting_mapping', 'processing', 'completed', 'failed')",
            name="uploads_status_valid",
        ),
        UniqueConstraint("id", "user_id", name="uploads_id_user_id_uq"),
        Index("uploads_user_sha256_uq", "user_id", "sha256", unique=True),
        Index("uploads_user_created_at_idx", "user_id", "created_at"),
        Index("uploads_user_status_idx", "user_id", "status"),
    )

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4, server_default=text("gen_random_uuid()"))
    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    original_filename: Mapped[str] = mapped_column(Text, nullable=False)
    file_extension: Mapped[str] = mapped_column(String, nullable=False)
    content_type: Mapped[str | None] = mapped_column(Text)
    file_size_bytes: Mapped[int] = mapped_column(BigInteger, nullable=False)
    sha256: Mapped[str] = mapped_column(String(64), nullable=False)
    storage_path: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String, nullable=False, server_default=text("'uploaded'"))
    error_message: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    processing_started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    processing_finished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class UploadMapping(Base):
    __tablename__ = "upload_mappings"
    __table_args__ = (
        ForeignKeyConstraint(["upload_id", "user_id"], ["uploads.id", "uploads.user_id"], ondelete="CASCADE", name="upload_mappings_upload_user_fk"),
        UniqueConstraint("upload_id", name="upload_mappings_one_per_upload"),
        CheckConstraint("jsonb_typeof(mapping) = 'object'", name="upload_mappings_is_object"),
    )

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4, server_default=text("gen_random_uuid()"))
    upload_id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), nullable=False)
    user_id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), nullable=False)
    mapping: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False)
    confirmed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())


class BronzeRow(Base):
    __tablename__ = "bronze_rows"
    __table_args__ = (
        ForeignKeyConstraint(["upload_id", "user_id"], ["uploads.id", "uploads.user_id"], ondelete="CASCADE", name="bronze_rows_upload_user_fk"),
        CheckConstraint("row_number > 0", name="bronze_rows_row_number_positive"),
        CheckConstraint("jsonb_typeof(raw_data) = 'object'", name="bronze_rows_raw_is_object"),
        UniqueConstraint("upload_id", "row_number", name="bronze_rows_upload_row_uq"),
        UniqueConstraint("id", "upload_id", "user_id", name="bronze_rows_id_upload_user_uq"),
        Index("bronze_rows_user_upload_idx", "user_id", "upload_id"),
    )

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4, server_default=text("gen_random_uuid()"))
    upload_id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), nullable=False)
    user_id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), nullable=False)
    row_number: Mapped[int] = mapped_column(Integer, nullable=False)
    sheet_name: Mapped[str | None] = mapped_column(Text)
    raw_data: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False)
    row_hash: Mapped[str | None] = mapped_column(String(64))
    ingested_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())


class Category(Base):
    __tablename__ = "categories"
    __table_args__ = (
        CheckConstraint("length(trim(name)) > 0", name="categories_name_not_empty"),
        CheckConstraint("color IS NULL OR color ~ '^#[0-9A-Fa-f]{6}$'", name="categories_color_valid"),
        Index("categories_system_name_uq", func.lower(text("name")), unique=True, postgresql_where=text("user_id IS NULL")),
        Index("categories_user_name_uq", "user_id", func.lower(text("name")), unique=True, postgresql_where=text("user_id IS NOT NULL")),
        Index("categories_user_active_idx", "user_id", "is_active"),
    )

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4, server_default=text("gen_random_uuid()"))
    user_id: Mapped[UUID | None] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    name: Mapped[str] = mapped_column(Text, nullable=False)
    color: Mapped[str | None] = mapped_column(String(7))
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("true"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())


class Transaction(Base):
    __tablename__ = "transactions"
    __table_args__ = (
        ForeignKeyConstraint(["upload_id", "user_id"], ["uploads.id", "uploads.user_id"], ondelete="CASCADE", name="transactions_upload_user_fk"),
        ForeignKeyConstraint(["bronze_row_id", "upload_id", "user_id"], ["bronze_rows.id", "bronze_rows.upload_id", "bronze_rows.user_id"], ondelete="SET NULL", name="transactions_bronze_row_fk"),
        CheckConstraint("length(trim(description_raw)) > 0", name="transactions_description_not_empty"),
        CheckConstraint("transaction_type IN ('purchase', 'fee', 'refund', 'payment', 'other')", name="transactions_type_valid"),
        CheckConstraint("category_source IN ('personal_rule', 'bank', 'merchant_rule', 'keyword', 'manual', 'uncategorized')", name="transactions_category_source_valid"),
        CheckConstraint("(installment_current IS NULL AND installment_total IS NULL) OR (installment_current > 0 AND installment_total > 0 AND installment_current <= installment_total)", name="transactions_installments_valid"),
        CheckConstraint("source_row > 0", name="transactions_source_row_positive"),
        Index("transactions_user_date_idx", "user_id", "transaction_date"),
        Index("transactions_user_category_date_idx", "user_id", "category_id", "transaction_date"),
        Index("transactions_user_merchant_idx", "user_id", "merchant"),
        Index("transactions_upload_idx", "upload_id"),
        Index("transactions_bronze_row_uq", "bronze_row_id", unique=True, postgresql_where=text("bronze_row_id IS NOT NULL")),
    )

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4, server_default=text("gen_random_uuid()"))
    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    upload_id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), nullable=False)
    bronze_row_id: Mapped[UUID | None] = mapped_column(Uuid(as_uuid=True))
    transaction_date: Mapped[date] = mapped_column(Date, nullable=False)
    description_raw: Mapped[str] = mapped_column(Text, nullable=False)
    description_normalized: Mapped[str | None] = mapped_column(Text)
    merchant: Mapped[str | None] = mapped_column(Text)
    amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    transaction_type: Mapped[str] = mapped_column(String, nullable=False, server_default=text("'purchase'"))
    category_id: Mapped[UUID | None] = mapped_column(ForeignKey("categories.id", ondelete="SET NULL"))
    category_source: Mapped[str] = mapped_column(String, nullable=False, server_default=text("'uncategorized'"))
    installment_current: Mapped[int | None] = mapped_column(Integer)
    installment_total: Mapped[int | None] = mapped_column(Integer)
    source_row: Mapped[int] = mapped_column(Integer, nullable=False)
    is_duplicate: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("false"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())


class CategoryRule(Base):
    __tablename__ = "category_rules"
    __table_args__ = (
        CheckConstraint("match_type IN ('merchant', 'description_contains')", name="category_rules_match_type_valid"),
        CheckConstraint("length(trim(match_value)) > 0", name="category_rules_match_value_not_empty"),
        Index("category_rules_user_active_priority_idx", "user_id", "is_active", "priority"),
        Index("category_rules_user_match_idx", "user_id", "match_type", func.lower(text("match_value"))),
    )

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4, server_default=text("gen_random_uuid()"))
    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    category_id: Mapped[UUID] = mapped_column(ForeignKey("categories.id", ondelete="CASCADE"), nullable=False)
    match_type: Mapped[str] = mapped_column(String, nullable=False)
    match_value: Mapped[str] = mapped_column(Text, nullable=False)
    priority: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text("100"))
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("true"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())


class QualityCheck(Base):
    __tablename__ = "quality_checks"
    __table_args__ = (
        ForeignKeyConstraint(["upload_id", "user_id"], ["uploads.id", "uploads.user_id"], ondelete="CASCADE", name="quality_checks_upload_user_fk"),
        CheckConstraint("attempt_number > 0", name="quality_checks_attempt_positive"),
        CheckConstraint("total_rows >= 0 AND valid_rows >= 0 AND rejected_rows >= 0 AND duplicate_rows >= 0", name="quality_checks_counts_nonnegative"),
        CheckConstraint("total_rows = valid_rows + rejected_rows", name="quality_checks_rows_reconcile"),
        CheckConstraint("quality_percentage IS NULL OR quality_percentage BETWEEN 0 AND 100", name="quality_checks_percentage_valid"),
        CheckConstraint("jsonb_typeof(monetary_totals) = 'object' AND jsonb_typeof(details) = 'object'", name="quality_checks_json_objects"),
        UniqueConstraint("upload_id", "attempt_number", name="quality_checks_upload_attempt_uq"),
        Index("quality_checks_user_upload_idx", "user_id", "upload_id"),
    )

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4, server_default=text("gen_random_uuid()"))
    upload_id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), nullable=False)
    user_id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), nullable=False)
    attempt_number: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text("1"))
    total_rows: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text("0"))
    valid_rows: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text("0"))
    rejected_rows: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text("0"))
    duplicate_rows: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text("0"))
    quality_percentage: Mapped[Decimal | None] = mapped_column(Numeric(5, 2))
    monetary_totals: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False, server_default=text("'{}'::jsonb"))
    details: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False, server_default=text("'{}'::jsonb"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())


class RejectedRow(Base):
    __tablename__ = "rejected_rows"
    __table_args__ = (
        ForeignKeyConstraint(["upload_id", "user_id"], ["uploads.id", "uploads.user_id"], ondelete="CASCADE", name="rejected_rows_upload_user_fk"),
        CheckConstraint("source_row > 0", name="rejected_rows_source_row_positive"),
        CheckConstraint("jsonb_typeof(raw_data) = 'object'", name="rejected_rows_raw_is_object"),
        CheckConstraint("length(trim(error_code)) > 0", name="rejected_rows_error_code_not_empty"),
        CheckConstraint("length(trim(error_message)) > 0", name="rejected_rows_error_message_not_empty"),
        UniqueConstraint("upload_id", "source_row", "error_code", name="rejected_rows_one_error_per_code_uq"),
        Index("rejected_rows_user_upload_idx", "user_id", "upload_id"),
    )

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4, server_default=text("gen_random_uuid()"))
    upload_id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), nullable=False)
    user_id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), nullable=False)
    source_row: Mapped[int] = mapped_column(Integer, nullable=False)
    raw_data: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False)
    error_code: Mapped[str] = mapped_column(Text, nullable=False)
    error_message: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
