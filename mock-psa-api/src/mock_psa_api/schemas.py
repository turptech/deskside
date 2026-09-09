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


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class RootResponse(BaseModel):
    message: str
