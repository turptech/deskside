from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from pydantic import BaseModel, ConfigDict, Field, field_validator


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


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class RootResponse(BaseModel):
    message: str
