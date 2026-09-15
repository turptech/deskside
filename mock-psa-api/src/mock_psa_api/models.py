from datetime import UTC, datetime
from enum import StrEnum

from sqlalchemy import CheckConstraint, DateTime, Text, UniqueConstraint
from sqlmodel import Field, SQLModel


def utc_now() -> datetime:
    return datetime.now(UTC)


class AssetType(StrEnum):
    LAPTOP = "laptop"
    DESKTOP = "desktop"
    SERVER = "server"
    NETWORK_DEVICE = "network_device"
    PRINTER = "printer"
    MOBILE_DEVICE = "mobile_device"
    OTHER = "other"


class AssetStatus(StrEnum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    IN_STOCK = "in_stock"
    MAINTENANCE = "maintenance"
    RETIRED = "retired"


class TicketStatus(StrEnum):
    NEW = "new"
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    WAITING_CUSTOMER = "waiting_customer"
    RESOLVED = "resolved"
    CLOSED = "closed"


class TicketPriority(StrEnum):
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    URGENT = "urgent"


class TicketSource(StrEnum):
    PHONE = "phone"
    EMAIL = "email"
    PORTAL = "portal"
    MONITORING = "monitoring"
    OTHER = "other"


class TicketNoteType(StrEnum):
    INTERNAL = "internal"
    PUBLIC = "public"


class Company(SQLModel, table=True):
    __tablename__ = "companies"

    id: int | None = Field(default=None, primary_key=True)
    name: str = Field(max_length=255, index=True)


class Site(SQLModel, table=True):
    __tablename__ = "sites"

    id: int | None = Field(default=None, primary_key=True)
    company_id: int = Field(
        foreign_key="companies.id",
        ondelete="RESTRICT",
        index=True,
    )
    name: str = Field(max_length=255, index=True)
    address_line1: str | None = Field(default=None, max_length=255)
    address_line2: str | None = Field(default=None, max_length=255)
    city: str | None = Field(default=None, max_length=100)
    state_province: str | None = Field(default=None, max_length=100)
    postal_code: str | None = Field(default=None, max_length=32)
    country_code: str | None = Field(default=None, max_length=2)
    phone: str | None = Field(default=None, max_length=50)
    timezone: str | None = Field(default=None, max_length=64)


class Contact(SQLModel, table=True):
    __tablename__ = "contacts"

    id: int | None = Field(default=None, primary_key=True)
    company_id: int = Field(
        foreign_key="companies.id",
        ondelete="RESTRICT",
        index=True,
    )
    site_id: int | None = Field(
        default=None,
        foreign_key="sites.id",
        ondelete="RESTRICT",
        index=True,
    )
    first_name: str = Field(max_length=100)
    last_name: str = Field(max_length=100)
    email: str = Field(max_length=320, index=True)
    phone: str | None = Field(default=None, max_length=50)
    mobile_phone: str | None = Field(default=None, max_length=50)
    job_title: str | None = Field(default=None, max_length=100)


class Asset(SQLModel, table=True):
    __tablename__ = "assets"
    __table_args__ = (
        CheckConstraint(
            "NOT (site_id IS NOT NULL AND contact_id IS NOT NULL)",
            name="assets_single_assignment",
        ),
    )

    id: int | None = Field(default=None, primary_key=True)
    company_id: int = Field(
        foreign_key="companies.id",
        ondelete="RESTRICT",
        index=True,
    )
    site_id: int | None = Field(
        default=None,
        foreign_key="sites.id",
        ondelete="RESTRICT",
        index=True,
    )
    contact_id: int | None = Field(
        default=None,
        foreign_key="contacts.id",
        ondelete="RESTRICT",
        index=True,
    )
    name: str = Field(max_length=255, index=True)
    asset_type: str = Field(max_length=50, index=True)
    status: str = Field(default=AssetStatus.ACTIVE.value, max_length=50, index=True)
    manufacturer: str | None = Field(default=None, max_length=100)
    model: str | None = Field(default=None, max_length=100)
    serial_number: str | None = Field(default=None, max_length=255)
    asset_tag: str | None = Field(default=None, max_length=100)
    hostname: str | None = Field(default=None, max_length=255)
    operating_system: str | None = Field(default=None, max_length=255)


class User(SQLModel, table=True):
    __tablename__ = "users"

    id: int | None = Field(default=None, primary_key=True)
    email: str = Field(max_length=320, unique=True, index=True)
    password_hash: str = Field(max_length=512)
    role: str = Field(max_length=50)


class Ticket(SQLModel, table=True):
    __tablename__ = "tickets"

    id: int | None = Field(default=None, primary_key=True)
    company_id: int = Field(
        foreign_key="companies.id",
        ondelete="RESTRICT",
        index=True,
    )
    contact_id: int = Field(
        foreign_key="contacts.id",
        ondelete="RESTRICT",
        index=True,
    )
    site_id: int | None = Field(
        default=None,
        foreign_key="sites.id",
        ondelete="RESTRICT",
        index=True,
    )
    asset_id: int | None = Field(
        default=None,
        foreign_key="assets.id",
        ondelete="RESTRICT",
        index=True,
    )
    assigned_user_id: int | None = Field(
        default=None,
        foreign_key="users.id",
        ondelete="RESTRICT",
        index=True,
    )
    summary: str = Field(max_length=255)
    description: str | None = Field(default=None, sa_type=Text)
    status: str = Field(default=TicketStatus.NEW.value, max_length=50, index=True)
    priority: str = Field(
        default=TicketPriority.NORMAL.value,
        max_length=50,
        index=True,
    )
    source: str = Field(default=TicketSource.PHONE.value, max_length=50, index=True)
    created_at: datetime = Field(
        default_factory=utc_now,
        sa_type=DateTime(timezone=True),
    )
    updated_at: datetime = Field(
        default_factory=utc_now,
        sa_type=DateTime(timezone=True),
    )
    resolved_at: datetime | None = Field(
        default=None,
        sa_type=DateTime(timezone=True),
    )


class TicketNote(SQLModel, table=True):
    __tablename__ = "ticket_notes"
    __table_args__ = (
        CheckConstraint(
            "((user_id IS NOT NULL AND contact_id IS NULL) OR "
            "(user_id IS NULL AND contact_id IS NOT NULL))",
            name="ticket_notes_single_origin",
        ),
        UniqueConstraint(
            "user_id",
            "idempotency_key",
            name="ticket_notes_user_idempotency_key",
        ),
        UniqueConstraint(
            "contact_id",
            "idempotency_key",
            name="ticket_notes_contact_idempotency_key",
        ),
    )

    id: int | None = Field(default=None, primary_key=True)
    ticket_id: int = Field(
        foreign_key="tickets.id",
        ondelete="RESTRICT",
        index=True,
    )
    user_id: int | None = Field(
        default=None,
        foreign_key="users.id",
        ondelete="RESTRICT",
        index=True,
    )
    contact_id: int | None = Field(
        default=None,
        foreign_key="contacts.id",
        ondelete="RESTRICT",
        index=True,
    )
    type: str = Field(max_length=50, index=True)
    body: str = Field(sa_type=Text)
    created_at: datetime = Field(
        default_factory=utc_now,
        sa_type=DateTime(timezone=True),
        index=True,
    )
    idempotency_key: str | None = Field(default=None, max_length=255)


class TimeEntry(SQLModel, table=True):
    __tablename__ = "time_entries"
    __table_args__ = (
        CheckConstraint(
            "duration_minutes > 0",
            name="time_entries_positive_duration",
        ),
        UniqueConstraint(
            "ticket_note_id",
            name="time_entries_ticket_note_id",
        ),
        UniqueConstraint(
            "user_id",
            "idempotency_key",
            name="time_entries_user_idempotency_key",
        ),
    )

    id: int | None = Field(default=None, primary_key=True)
    ticket_id: int = Field(
        foreign_key="tickets.id",
        ondelete="RESTRICT",
        index=True,
    )
    user_id: int = Field(
        foreign_key="users.id",
        ondelete="RESTRICT",
        index=True,
    )
    ticket_note_id: int | None = Field(
        default=None,
        foreign_key="ticket_notes.id",
        ondelete="RESTRICT",
        index=True,
    )
    started_at: datetime = Field(
        sa_type=DateTime(timezone=True),
        index=True,
    )
    duration_minutes: int
    description: str = Field(sa_type=Text)
    billable: bool = Field(default=True, index=True)
    created_at: datetime = Field(
        default_factory=utc_now,
        sa_type=DateTime(timezone=True),
    )
    updated_at: datetime = Field(
        default_factory=utc_now,
        sa_type=DateTime(timezone=True),
    )
    idempotency_key: str | None = Field(default=None, max_length=255)


class KnowledgeArticle(SQLModel, table=True):
    __tablename__ = "knowledge_articles"
    __table_args__ = (
        CheckConstraint(
            "(CASE WHEN company_id IS NULL THEN 0 ELSE 1 END + "
            "CASE WHEN site_id IS NULL THEN 0 ELSE 1 END + "
            "CASE WHEN contact_id IS NULL THEN 0 ELSE 1 END + "
            "CASE WHEN asset_id IS NULL THEN 0 ELSE 1 END) <= 1",
            name="knowledge_articles_single_target",
        ),
    )

    id: int | None = Field(default=None, primary_key=True)
    company_id: int | None = Field(
        default=None,
        foreign_key="companies.id",
        ondelete="RESTRICT",
        index=True,
    )
    site_id: int | None = Field(
        default=None,
        foreign_key="sites.id",
        ondelete="RESTRICT",
        index=True,
    )
    contact_id: int | None = Field(
        default=None,
        foreign_key="contacts.id",
        ondelete="RESTRICT",
        index=True,
    )
    asset_id: int | None = Field(
        default=None,
        foreign_key="assets.id",
        ondelete="RESTRICT",
        index=True,
    )
    title: str = Field(max_length=255)
    body: str = Field(sa_type=Text)
    created_at: datetime = Field(
        default_factory=utc_now,
        sa_type=DateTime(timezone=True),
    )
    updated_at: datetime = Field(
        default_factory=utc_now,
        sa_type=DateTime(timezone=True),
    )
