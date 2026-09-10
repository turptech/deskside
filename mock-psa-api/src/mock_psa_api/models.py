from sqlmodel import Field, SQLModel


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


class User(SQLModel, table=True):
    __tablename__ = "users"

    id: int | None = Field(default=None, primary_key=True)
    email: str = Field(max_length=320, unique=True, index=True)
    password_hash: str = Field(max_length=512)
    role: str = Field(max_length=50)
