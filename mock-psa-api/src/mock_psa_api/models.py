from enum import StrEnum

from sqlalchemy import CheckConstraint
from sqlmodel import Field, SQLModel


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
