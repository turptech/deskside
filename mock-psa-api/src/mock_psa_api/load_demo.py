"""Validate or restore the repository's development-only PSA demo data."""

import argparse
import secrets
from pathlib import Path
from typing import Annotated, Literal

from pydantic import AwareDatetime, BaseModel, ConfigDict, Field, model_validator
from sqlalchemy import delete, func, text
from sqlalchemy.engine import Engine, make_url
from sqlmodel import Session, SQLModel, create_engine, select

from mock_psa_api.models import (
    Asset,
    AssetStatus,
    AssetType,
    Company,
    Contact,
    KnowledgeArticle,
    Site,
    Ticket,
    TicketNote,
    TicketNoteType,
    TicketPriority,
    TicketSource,
    TicketStatus,
    TimeEntry,
    User,
)
from mock_psa_api.security import hash_password

FIXTURE_PATH = Path(__file__).resolve().parents[3] / "demo-fixtures" / "psa.json"
PositiveId = Annotated[int, Field(gt=0)]
RequiredText = Annotated[str, Field(min_length=1, pattern=r"\S")]


class FixtureRow(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)
    id: PositiveId


class Technician(FixtureRow):
    display_name: RequiredText
    email: RequiredText
    role: Literal["technician"]


class CompanyRow(FixtureRow):
    name: RequiredText


class SiteRow(FixtureRow):
    company_id: PositiveId
    name: RequiredText
    address_line1: str | None
    address_line2: str | None
    city: str | None
    state_province: str | None
    postal_code: str | None
    country_code: str | None
    phone: str | None
    timezone: str | None


class ContactRow(FixtureRow):
    company_id: PositiveId
    site_id: PositiveId | None
    first_name: RequiredText
    last_name: RequiredText
    email: RequiredText
    phone: str | None
    mobile_phone: str | None
    job_title: str | None


class AssetRow(FixtureRow):
    company_id: PositiveId
    site_id: PositiveId | None
    contact_id: PositiveId | None
    name: RequiredText
    asset_type: AssetType
    status: AssetStatus
    manufacturer: str | None
    model: str | None
    serial_number: str | None
    asset_tag: str | None
    hostname: str | None
    operating_system: str | None


class TicketRow(FixtureRow):
    company_id: PositiveId
    contact_id: PositiveId
    site_id: PositiveId | None
    asset_id: PositiveId | None
    assigned_user_id: PositiveId | None
    summary: RequiredText
    description: str | None
    status: TicketStatus
    priority: TicketPriority
    source: TicketSource
    created_at: AwareDatetime
    updated_at: AwareDatetime
    resolved_at: AwareDatetime | None


class TicketNoteRow(FixtureRow):
    ticket_id: PositiveId
    user_id: PositiveId | None
    contact_id: PositiveId | None
    type: TicketNoteType
    body: RequiredText
    created_at: AwareDatetime


class TimeEntryRow(FixtureRow):
    ticket_id: PositiveId
    user_id: PositiveId
    ticket_note_id: PositiveId | None
    started_at: AwareDatetime
    duration_minutes: Annotated[int, Field(gt=0)]
    description: RequiredText
    billable: bool
    created_at: AwareDatetime
    updated_at: AwareDatetime


class KnowledgeArticleRow(FixtureRow):
    company_id: PositiveId | None
    site_id: PositiveId | None
    contact_id: PositiveId | None
    asset_id: PositiveId | None
    title: RequiredText
    body: RequiredText
    created_at: AwareDatetime
    updated_at: AwareDatetime


class DemoFixture(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)
    schema_version: Literal[1]
    demo_now: AwareDatetime
    technicians: list[Technician]
    companies: list[CompanyRow]
    sites: list[SiteRow]
    contacts: list[ContactRow]
    assets: list[AssetRow]
    tickets: list[TicketRow]
    ticket_notes: list[TicketNoteRow]
    time_entries: list[TimeEntryRow]
    knowledge_articles: list[KnowledgeArticleRow]

    @model_validator(mode="after")
    def validate_relationships(self) -> DemoFixture:
        sections = (
            "technicians",
            "companies",
            "sites",
            "contacts",
            "assets",
            "tickets",
            "ticket_notes",
            "time_entries",
            "knowledge_articles",
        )
        maps = {}
        for section in sections:
            rows = getattr(self, section)
            mapped = {row.id: row for row in rows}
            if len(mapped) != len(rows):
                raise ValueError(f"Duplicate ID in {section}")
            maps[section] = mapped
        table_models = {
            "companies": Company,
            "sites": Site,
            "contacts": Contact,
            "assets": Asset,
            "tickets": Ticket,
            "ticket_notes": TicketNote,
            "time_entries": TimeEntry,
            "knowledge_articles": KnowledgeArticle,
        }
        for section, table_model in table_models.items():
            columns = table_model.__table__.columns
            for row in maps[section].values():
                for field_name, value in row.model_dump().items():
                    max_length = getattr(columns[field_name].type, "length", None)
                    if (
                        isinstance(value, str)
                        and max_length
                        and len(value) > max_length
                    ):
                        raise ValueError(
                            f"{section} {row.id} field {field_name} exceeds {max_length} characters"
                        )
        users, sites, contacts, assets, tickets, notes = (
            maps[key]
            for key in (
                "technicians",
                "sites",
                "contacts",
                "assets",
                "tickets",
                "ticket_notes",
            )
        )
        if len({user.email for user in users.values()}) != len(users):
            raise ValueError("Duplicate technician email")

        def require(section: str, identifier: int | None) -> None:
            if identifier is not None and identifier not in maps[section]:
                raise ValueError(f"Unknown {section} ID {identifier}")

        for site in sites.values():
            require("companies", site.company_id)
        for contact in contacts.values():
            require("companies", contact.company_id)
            require("sites", contact.site_id)
            if (
                contact.site_id
                and sites[contact.site_id].company_id != contact.company_id
            ):
                raise ValueError(
                    f"Contact {contact.id} site belongs to another company"
                )
        for asset in assets.values():
            require("companies", asset.company_id)
            require("sites", asset.site_id)
            require("contacts", asset.contact_id)
            if asset.site_id and asset.contact_id:
                raise ValueError(f"Asset {asset.id} has two assignments")
            if asset.site_id and sites[asset.site_id].company_id != asset.company_id:
                raise ValueError(f"Asset {asset.id} site belongs to another company")
            if (
                asset.contact_id
                and contacts[asset.contact_id].company_id != asset.company_id
            ):
                raise ValueError(f"Asset {asset.id} contact belongs to another company")
        for ticket in tickets.values():
            require("companies", ticket.company_id)
            require("contacts", ticket.contact_id)
            require("sites", ticket.site_id)
            require("assets", ticket.asset_id)
            require("technicians", ticket.assigned_user_id)
            for target in (
                contacts[ticket.contact_id],
                sites.get(ticket.site_id),
                assets.get(ticket.asset_id),
            ):
                if target and target.company_id != ticket.company_id:
                    raise ValueError(
                        f"Ticket {ticket.id} target belongs to another company"
                    )
        for note in notes.values():
            require("tickets", note.ticket_id)
            require("technicians", note.user_id)
            require("contacts", note.contact_id)
            if (note.user_id is None) == (note.contact_id is None):
                raise ValueError(f"Note {note.id} must have exactly one author")
            if (
                note.contact_id
                and contacts[note.contact_id].company_id
                != tickets[note.ticket_id].company_id
            ):
                raise ValueError(f"Note {note.id} contact belongs to another company")
        linked_notes: set[int] = set()
        for entry in self.time_entries:
            require("tickets", entry.ticket_id)
            require("technicians", entry.user_id)
            require("ticket_notes", entry.ticket_note_id)
            if entry.ticket_note_id is not None:
                note = notes[entry.ticket_note_id]
                if note.ticket_id != entry.ticket_id or note.user_id != entry.user_id:
                    raise ValueError(f"Time entry {entry.id} has incompatible note")
                if note.id in linked_notes:
                    raise ValueError(f"Note {note.id} is linked twice")
                linked_notes.add(note.id)
        for article in self.knowledge_articles:
            targets = (
                ("companies", article.company_id),
                ("sites", article.site_id),
                ("contacts", article.contact_id),
                ("assets", article.asset_id),
            )
            if sum(identifier is not None for _, identifier in targets) > 1:
                raise ValueError(f"Article {article.id} has multiple targets")
            for section, identifier in targets:
                require(section, identifier)
        return self


def load_fixture(path: Path = FIXTURE_PATH) -> DemoFixture:
    return DemoFixture.model_validate_json(path.read_text(encoding="utf-8"))


def require_local_demo_database(database_url: str) -> None:
    url = make_url(database_url)
    if (
        not url.drivername.startswith("postgresql")
        or url.database != "mock_psa_demo"
        or url.host not in {"localhost", "127.0.0.1", "::1"}
        or bool(url.query)
    ):
        raise ValueError("Reset requires local PostgreSQL database mock_psa_demo")


def reset_demo(engine: Engine, fixture: DemoFixture) -> None:
    """Replace PSA data atomically; caller must enforce the database URL guard."""
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session, session.begin():
        fixture_users = {user.id: user.email for user in fixture.technicians}
        for user in session.exec(select(User)).all():
            if user.id in fixture_users and user.email != fixture_users[user.id]:
                raise ValueError(f"Reserved technician ID {user.id} is occupied")
            if user.email in fixture_users.values() and user.id not in fixture_users:
                raise ValueError(f"Fixture technician email {user.email} is occupied")

        for model in (
            TimeEntry,
            TicketNote,
            Ticket,
            KnowledgeArticle,
            Asset,
            Contact,
            Site,
            Company,
        ):
            session.exec(delete(model))
        session.exec(delete(User).where(User.id.in_(fixture_users)))

        groups = (
            (Company, fixture.companies),
            (Site, fixture.sites),
            (Contact, fixture.contacts),
            (Asset, fixture.assets),
            (Ticket, fixture.tickets),
            (TicketNote, fixture.ticket_notes),
            (TimeEntry, fixture.time_entries),
            (KnowledgeArticle, fixture.knowledge_articles),
        )
        session.add_all(
            User(
                id=user.id,
                email=user.email,
                role=user.role,
                password_hash=hash_password(secrets.token_urlsafe(48)),
            )
            for user in fixture.technicians
        )
        session.flush()
        for model, rows in groups:
            session.add_all(model(**row.model_dump()) for row in rows)
            session.flush()

        if engine.dialect.name == "postgresql":
            for model in (User, *(model for model, _ in groups)):
                table_name = model.__table__.name
                sequence = session.exec(
                    select(func.pg_get_serial_sequence(table_name, "id"))
                ).one()
                if not sequence:
                    raise ValueError(f"No ID sequence found for {table_name}")
                next_id = session.exec(
                    select(func.coalesce(func.max(model.id), 0) + 1)
                ).one()
                # pg_get_serial_sequence returns a database-owned identifier.
                quoted = ".".join(
                    engine.dialect.identifier_preparer.quote(part)
                    for part in sequence.split(".")
                )
                session.exec(text(f"ALTER SEQUENCE {quoted} RESTART WITH {next_id}"))


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument("--check", action="store_true", help="Validate fixtures only")
    mode.add_argument(
        "--reset", action="store_true", help="Restore local demo database"
    )
    args = parser.parse_args()
    fixture = load_fixture()
    if args.check:
        print("Demo fixture is valid.")
        return

    from mock_psa_api.config import get_settings

    database_url = get_settings().database_url
    try:
        require_local_demo_database(database_url)
    except ValueError as error:
        parser.error(str(error))
    engine = create_engine(database_url, pool_pre_ping=True)
    reset_demo(engine, fixture)
    print("Demo database restored.")


if __name__ == "__main__":
    main()
