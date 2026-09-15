from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI

from mock_psa_api.database import create_tables
from mock_psa_api.routes import (
    assets,
    auth,
    companies,
    contacts,
    knowledge_articles,
    sites,
    ticket_notes,
    tickets,
    time_entries,
)
from mock_psa_api.schemas import RootResponse


def create_app(*, initialize_database: bool = True) -> FastAPI:
    @asynccontextmanager
    async def lifespan(_: FastAPI) -> AsyncIterator[None]:
        if initialize_database:
            create_tables()
        yield

    application = FastAPI(lifespan=lifespan)
    application.include_router(assets.router)
    application.include_router(auth.router)
    application.include_router(companies.router)
    application.include_router(contacts.router)
    application.include_router(knowledge_articles.router)
    application.include_router(sites.router)
    application.include_router(ticket_notes.router)
    application.include_router(tickets.router)
    application.include_router(time_entries.router)

    @application.get("/", response_model=RootResponse)
    def root() -> RootResponse:
        return RootResponse(message="Hello, World!")

    return application


app = create_app()
