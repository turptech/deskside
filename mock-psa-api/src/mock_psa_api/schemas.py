from datetime import UTC, datetime
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from mock_psa_api.models import (
    AssetStatus,
    AssetType,
    TicketNoteType,
    TicketPriority,
    TicketSource,
    TicketStatus,
)


class CompanyBase(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    name: str = Field(min_length=1, max_length=255)


class CompanyCreate(CompanyBase):
    pass


class CompanyRead(CompanyBase):
    id: int


class CompanyUpdate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    name: str | None = Field(default=None, min_length=1, max_length=255)

    @field_validator("name")
    @classmethod
    def name_cannot_be_null(cls, value: str | None) -> str | None:
        if value is None:
            raise ValueError("name cannot be null")
        return value


class SiteBase(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    company_id: int = Field(gt=0)
    name: str = Field(min_length=1, max_length=255)
    address_line1: str | None = Field(default=None, min_length=1, max_length=255)
    address_line2: str | None = Field(default=None, min_length=1, max_length=255)
    city: str | None = Field(default=None, min_length=1, max_length=100)
    state_province: str | None = Field(default=None, min_length=1, max_length=100)
    postal_code: str | None = Field(default=None, min_length=1, max_length=32)
    country_code: str | None = Field(
        default=None,
        min_length=2,
        max_length=2,
    )
    phone: str | None = Field(default=None, min_length=1, max_length=50)
    timezone: str | None = Field(default=None, min_length=1, max_length=64)

    @field_validator("country_code")
    @classmethod
    def normalize_country_code(cls, value: str | None) -> str | None:
        if value is not None:
            if not value.isascii() or not value.isalpha():
                raise ValueError("country_code must contain two ASCII letters")
            return value.upper()
        return None

    @field_validator("timezone")
    @classmethod
    def validate_timezone(cls, value: str | None) -> str | None:
        if value is not None:
            try:
                ZoneInfo(value)
            except ZoneInfoNotFoundError as error:
                raise ValueError("timezone must be a valid IANA timezone") from error
        return value


class SiteCreate(SiteBase):
    pass


class SiteRead(SiteBase):
    id: int


class SiteUpdate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    company_id: int | None = Field(default=None, gt=0)
    name: str | None = Field(default=None, min_length=1, max_length=255)
    address_line1: str | None = Field(default=None, min_length=1, max_length=255)
    address_line2: str | None = Field(default=None, min_length=1, max_length=255)
    city: str | None = Field(default=None, min_length=1, max_length=100)
    state_province: str | None = Field(default=None, min_length=1, max_length=100)
    postal_code: str | None = Field(default=None, min_length=1, max_length=32)
    country_code: str | None = Field(
        default=None,
        min_length=2,
        max_length=2,
    )
    phone: str | None = Field(default=None, min_length=1, max_length=50)
    timezone: str | None = Field(default=None, min_length=1, max_length=64)

    @field_validator("company_id", "name")
    @classmethod
    def required_fields_cannot_be_null(cls, value: int | str | None) -> int | str:
        if value is None:
            raise ValueError("field cannot be null")
        return value

    @field_validator("country_code")
    @classmethod
    def normalize_country_code(cls, value: str | None) -> str | None:
        if value is not None:
            if not value.isascii() or not value.isalpha():
                raise ValueError("country_code must contain two ASCII letters")
            return value.upper()
        return None

    @field_validator("timezone")
    @classmethod
    def validate_timezone(cls, value: str | None) -> str | None:
        if value is not None:
            try:
                ZoneInfo(value)
            except ZoneInfoNotFoundError as error:
                raise ValueError("timezone must be a valid IANA timezone") from error
        return value


class ContactBase(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    company_id: int = Field(gt=0)
    site_id: int | None = Field(default=None, gt=0)
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    email: EmailStr
    phone: str | None = Field(default=None, min_length=1, max_length=50)
    mobile_phone: str | None = Field(default=None, min_length=1, max_length=50)
    job_title: str | None = Field(default=None, min_length=1, max_length=100)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: EmailStr) -> str:
        return str(value).lower()


class ContactCreate(ContactBase):
    pass


class ContactRead(ContactBase):
    id: int


class ContactUpdate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    company_id: int | None = Field(default=None, gt=0)
    site_id: int | None = Field(default=None, gt=0)
    first_name: str | None = Field(default=None, min_length=1, max_length=100)
    last_name: str | None = Field(default=None, min_length=1, max_length=100)
    email: EmailStr | None = None
    phone: str | None = Field(default=None, min_length=1, max_length=50)
    mobile_phone: str | None = Field(default=None, min_length=1, max_length=50)
    job_title: str | None = Field(default=None, min_length=1, max_length=100)

    @field_validator("company_id", "first_name", "last_name")
    @classmethod
    def required_fields_cannot_be_null(cls, value: int | str | None) -> int | str:
        if value is None:
            raise ValueError("field cannot be null")
        return value

    @field_validator("email")
    @classmethod
    def normalize_required_email(cls, value: EmailStr | None) -> str:
        if value is None:
            raise ValueError("email cannot be null")
        return str(value).lower()


class AssetBase(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    company_id: int = Field(gt=0)
    site_id: int | None = Field(default=None, gt=0)
    contact_id: int | None = Field(default=None, gt=0)
    name: str = Field(min_length=1, max_length=255)
    asset_type: AssetType
    status: AssetStatus = AssetStatus.ACTIVE
    manufacturer: str | None = Field(default=None, min_length=1, max_length=100)
    model: str | None = Field(default=None, min_length=1, max_length=100)
    serial_number: str | None = Field(default=None, min_length=1, max_length=255)
    asset_tag: str | None = Field(default=None, min_length=1, max_length=100)
    hostname: str | None = Field(default=None, min_length=1, max_length=255)
    operating_system: str | None = Field(
        default=None,
        min_length=1,
        max_length=255,
    )


class AssetCreate(AssetBase):
    pass


class AssetRead(AssetBase):
    id: int


class AssetUpdate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    company_id: int | None = Field(default=None, gt=0)
    site_id: int | None = Field(default=None, gt=0)
    contact_id: int | None = Field(default=None, gt=0)
    name: str | None = Field(default=None, min_length=1, max_length=255)
    asset_type: AssetType | None = None
    status: AssetStatus | None = None
    manufacturer: str | None = Field(default=None, min_length=1, max_length=100)
    model: str | None = Field(default=None, min_length=1, max_length=100)
    serial_number: str | None = Field(default=None, min_length=1, max_length=255)
    asset_tag: str | None = Field(default=None, min_length=1, max_length=100)
    hostname: str | None = Field(default=None, min_length=1, max_length=255)
    operating_system: str | None = Field(
        default=None,
        min_length=1,
        max_length=255,
    )

    @field_validator("company_id", "name", "asset_type", "status")
    @classmethod
    def required_fields_cannot_be_null(
        cls,
        value: int | str | AssetType | AssetStatus | None,
    ) -> int | str | AssetType | AssetStatus:
        if value is None:
            raise ValueError("field cannot be null")
        return value


class TicketBase(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    company_id: int = Field(gt=0)
    contact_id: int = Field(gt=0)
    site_id: int | None = Field(default=None, gt=0)
    asset_id: int | None = Field(default=None, gt=0)
    assigned_user_id: int | None = Field(default=None, gt=0)
    summary: str = Field(min_length=1, max_length=255)
    description: str | None = Field(default=None, min_length=1)
    status: TicketStatus = TicketStatus.NEW
    priority: TicketPriority = TicketPriority.NORMAL
    source: TicketSource = TicketSource.PHONE


class TicketCreate(TicketBase):
    pass


class TicketRead(TicketBase):
    id: int
    created_at: datetime
    updated_at: datetime
    resolved_at: datetime | None

    @field_validator("created_at", "updated_at", "resolved_at")
    @classmethod
    def ensure_utc_timezone(cls, value: datetime | None) -> datetime | None:
        if value is None:
            return None
        if value.tzinfo is None:
            return value.replace(tzinfo=UTC)
        return value.astimezone(UTC)


class TicketUpdate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    company_id: int | None = Field(default=None, gt=0)
    contact_id: int | None = Field(default=None, gt=0)
    site_id: int | None = Field(default=None, gt=0)
    asset_id: int | None = Field(default=None, gt=0)
    assigned_user_id: int | None = Field(default=None, gt=0)
    summary: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = Field(default=None, min_length=1)
    status: TicketStatus | None = None
    priority: TicketPriority | None = None
    source: TicketSource | None = None

    @field_validator(
        "company_id",
        "contact_id",
        "summary",
        "status",
        "priority",
        "source",
    )
    @classmethod
    def required_fields_cannot_be_null(
        cls,
        value: int | str | TicketStatus | TicketPriority | TicketSource | None,
    ) -> int | str | TicketStatus | TicketPriority | TicketSource:
        if value is None:
            raise ValueError("field cannot be null")
        return value


class TicketNoteCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")

    type: TicketNoteType
    body: str = Field(min_length=1)


class TicketNoteRead(TicketNoteCreate):
    id: int
    ticket_id: int
    user_id: int | None
    contact_id: int | None
    created_at: datetime

    @field_validator("created_at")
    @classmethod
    def ensure_utc_timezone(cls, value: datetime) -> datetime:
        if value.tzinfo is None:
            return value.replace(tzinfo=UTC)
        return value.astimezone(UTC)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class RootResponse(BaseModel):
    message: str
