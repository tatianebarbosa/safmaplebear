"""SQLAlchemy models for core entities stored in PostgreSQL."""
from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional, List

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    UniqueConstraint,
    func,
    text,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .db import Base


class School(Base):
    __tablename__ = "schools"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    city: Mapped[Optional[str]] = mapped_column(String, default="")
    state: Mapped[Optional[str]] = mapped_column(String, default="")
    region: Mapped[Optional[str]] = mapped_column(String, default="")
    cluster: Mapped[Optional[str]] = mapped_column(String, default="")
    carteira_saf: Mapped[Optional[str]] = mapped_column(String, default="")
    license_limit: Mapped[int] = mapped_column(
        Integer, default=0, nullable=False, server_default=text("0")
    )
    status: Mapped[Optional[str]] = mapped_column(String, default="")
    contact_email: Mapped[Optional[str]] = mapped_column(String, default="")
    contact_phone: Mapped[Optional[str]] = mapped_column(String, default="")
    address: Mapped[Optional[str]] = mapped_column(String, default="")
    neighborhood: Mapped[Optional[str]] = mapped_column(String, default="")

    __table_args__ = (
        CheckConstraint("license_limit >= 0", name="ck_schools_license_limit_nonnegative"),
    )

    users: Mapped[List["User"]] = relationship(
        "User", back_populates="school", cascade="all, delete-orphan"
    )
    limits: Mapped[List["SchoolLimit"]] = relationship(
        "SchoolLimit", back_populates="school", cascade="all, delete-orphan"
    )


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )
    school_id: Mapped[str] = mapped_column(
        String, ForeignKey("schools.id", ondelete="CASCADE"), nullable=False
    )
    email: Mapped[str] = mapped_column(String, nullable=False)
    name: Mapped[Optional[str]] = mapped_column(String, default="")
    has_canva: Mapped[bool] = mapped_column(Boolean, default=False)
    is_compliant: Mapped[bool] = mapped_column(Boolean, default=True)

    school: Mapped[School] = relationship("School", back_populates="users")

    __table_args__ = (
        UniqueConstraint("email", name="uq_users_email"),
        Index("uq_users_email_lower", func.lower(email), unique=True),
        Index("idx_users_school_id", "school_id"),
        Index("idx_users_has_canva", "has_canva"),
    )


class SchoolLimit(Base):
    __tablename__ = "school_limits"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    school_id: Mapped[str] = mapped_column(
        String, ForeignKey("schools.id", ondelete="CASCADE"), nullable=False
    )
    limit: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, server_default=text("0")
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    school: Mapped[School] = relationship("School", back_populates="limits")

    __table_args__ = (
        CheckConstraint('"limit" >= 0', name="ck_school_limits_limit_nonnegative"),
        Index("idx_school_limits_school_id", "school_id"),
    )


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    action: Mapped[str] = mapped_column(String, nullable=False)
    school_id: Mapped[Optional[str]] = mapped_column(
        String, ForeignKey("schools.id", ondelete="SET NULL"), nullable=True
    )
    actor: Mapped[str] = mapped_column(String, nullable=False)
    payload: Mapped[dict] = mapped_column(JSONB, default=dict)
    ts: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    __table_args__ = (
        Index("idx_audit_logs_school_id_ts", "school_id", ts.desc()),
    )
