import json
from datetime import UTC, datetime
from pathlib import Path

import pytest
from pydantic import ValidationError
from sqlalchemy.pool import StaticPool
from sqlmodel import Session, SQLModel, create_engine, select

import mock_psa_api.load_demo as loader
from mock_psa_api.load_demo import (
    FIXTURE_PATH,
    DemoFixture,
    load_fixture,
    require_local_demo_database,
    reset_demo,
)
from mock_psa_api.models import (
    Company,
    KnowledgeArticle,
    Ticket,
    TicketNote,
    TimeEntry,
    User,
)
from mock_psa_api.security import hash_password, verify_password


def make_engine():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)
    return engine


def fixture_dict() -> dict:
    return json.loads(FIXTURE_PATH.read_text(encoding="utf-8"))


def test_fixture_is_valid_and_has_expected_records() -> None:
    fixture = load_fixture()
    assert [
        len(getattr(fixture, key))
        for key in (
            "companies",
            "sites",
            "contacts",
            "assets",
            "tickets",
            "ticket_notes",
            "time_entries",
            "knowledge_articles",
        )
    ] == [6, 6, 8, 8, 8, 8, 7, 6]
    assert len(fixture.technicians) == 3


@pytest.mark.parametrize(
    "change",
    [
        lambda data: data["sites"][0].update(company_id=999),
        lambda data: data["tickets"][0].update(contact_id=999),
        lambda data: data["ticket_notes"][0].update(user_id=1001),
        lambda data: data["time_entries"][0].update(ticket_note_id=999),
        lambda data: data["knowledge_articles"][0].update(company_id=1, site_id=1),
        lambda data: data["companies"].append(data["companies"][0]),
        lambda data: data["tickets"][0].update(created_at="not a timestamp"),
    ],
)
def test_invalid_fixture_is_rejected_before_database_access(
    change, tmp_path: Path
) -> None:
    data = fixture_dict()
    change(data)
    path = tmp_path / "invalid.json"
    path.write_text(json.dumps(data), encoding="utf-8")
    with pytest.raises(ValidationError):
        load_fixture(path)


@pytest.mark.parametrize(
    "url",
    [
        "postgresql+psycopg://u:p@remote.example/mock_psa_demo",
        "postgresql+psycopg://u:p@localhost/production",
        "sqlite:///mock_psa_demo",
        "postgresql+psycopg:///mock_psa_demo",
        "postgresql+psycopg://localhost/mock_psa_demo?host=remote.example",
    ],
)
def test_reset_rejects_nonlocal_or_wrong_database(url: str) -> None:
    with pytest.raises(ValueError, match="local PostgreSQL database mock_psa_demo"):
        require_local_demo_database(url)


def test_reset_restores_records_preserves_login_and_timestamps() -> None:
    engine = make_engine()
    original_password = "a developer password"
    with Session(engine) as session:
        session.add(
            User(
                id=42,
                email="developer@example.com",
                role="technician",
                password_hash=hash_password(original_password),
            )
        )
        session.commit()

    fixture = load_fixture()
    reset_demo(engine, fixture)
    with Session(engine) as session:
        assert [
            row.id for row in session.exec(select(Company).order_by(Company.id))
        ] == [1, 2, 3, 4, 5, 6]
        assert len(session.exec(select(Ticket)).all()) == 8
        assert len(session.exec(select(KnowledgeArticle)).all()) == 6
        developer = session.get(User, 42)
        assert developer is not None
        assert verify_password(original_password, developer.password_hash)
        assert {session.get(User, id).email for id in (1001, 1002, 1003)} == {
            user.email for user in fixture.technicians
        }
        contact_note = session.get(TicketNote, 501)
        assert contact_note.contact_id is not None and contact_note.user_id is None
        assert (
            contact_note.created_at.replace(tzinfo=UTC)
            == fixture.ticket_notes[0].created_at
        )
        entry = session.get(TimeEntry, 701)
        assert entry.ticket_note_id == fixture.time_entries[0].ticket_note_id
        assert (
            entry.started_at.replace(tzinfo=UTC) == fixture.time_entries[0].started_at
        )
        assert session.get(Ticket, 1048).updated_at.replace(
            tzinfo=UTC
        ) == datetime.fromisoformat("2026-09-15T14:28:00+00:00")
        session.add(Company(name="Temporary change"))
        session.commit()

    reset_demo(engine, fixture)
    with Session(engine) as session:
        assert (
            session.exec(
                select(Company).where(Company.name == "Temporary change")
            ).first()
            is None
        )
        assert len(session.exec(select(Company)).all()) == 6
        assert verify_password(original_password, session.get(User, 42).password_hash)
        session.add(Company(name="New API company"))
        session.commit()
        assert (
            session.exec(select(Company).where(Company.name == "New API company"))
            .one()
            .id
            > 6
        )


def test_reserved_user_collision_does_not_delete_anything() -> None:
    engine = make_engine()
    with Session(engine) as session:
        session.add(
            User(
                id=1001,
                email="real-person@example.com",
                role="admin",
                password_hash="saved",
            )
        )
        session.add(Company(id=999, name="Must survive"))
        session.commit()
    with pytest.raises(ValueError, match="Reserved technician ID"):
        reset_demo(engine, load_fixture())
    with Session(engine) as session:
        assert session.get(Company, 999).name == "Must survive"
        assert session.get(User, 1001).email == "real-person@example.com"


def test_invalid_relationship_cannot_modify_existing_data() -> None:
    engine = make_engine()
    with Session(engine) as session:
        session.add(Company(id=999, name="Must survive"))
        session.commit()
    data = fixture_dict()
    data["assets"][0]["company_id"] = 999
    with pytest.raises(ValidationError):
        DemoFixture.model_validate(data)
    with Session(engine) as session:
        assert session.get(Company, 999).name == "Must survive"


def test_reset_rolls_back_if_an_insert_fails(monkeypatch: pytest.MonkeyPatch) -> None:
    engine = make_engine()
    with Session(engine) as session:
        session.add(Company(id=999, name="Must survive"))
        session.commit()

    def fail_to_hash(_: str) -> str:
        raise RuntimeError("simulated insert failure")

    monkeypatch.setattr(loader, "hash_password", fail_to_hash)
    with pytest.raises(RuntimeError, match="simulated insert failure"):
        reset_demo(engine, load_fixture())
    with Session(engine) as session:
        assert session.get(Company, 999).name == "Must survive"
