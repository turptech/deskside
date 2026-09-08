from collections.abc import Generator
from functools import lru_cache

from sqlalchemy.engine import Engine
from sqlmodel import Session, SQLModel, create_engine

from mock_psa_api.config import get_settings
from mock_psa_api import models  # noqa: F401


@lru_cache
def get_engine() -> Engine:
    return create_engine(get_settings().database_url, pool_pre_ping=True)


def create_tables() -> None:
    SQLModel.metadata.create_all(get_engine())


def get_session() -> Generator[Session]:
    with Session(get_engine()) as session:
        yield session
