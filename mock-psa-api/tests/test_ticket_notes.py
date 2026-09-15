from collections.abc import Generator
from datetime import datetime
from typing import Any

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import event
from sqlalchemy.exc import IntegrityError
from sqlalchemy.pool import StaticPool
from sqlmodel import Session, SQLModel, create_engine

from mock_psa_api.config import Settings, get_settings
from mock_psa_api.database import get_session
from mock_psa_api.main import create_app
from mock_psa_api.models import Company, Contact, Ticket, TicketNote, User
from mock_psa_api.security import hash_password

TEST_SECRET = "test-secret-that-is-at-least-32-characters"


def create_sqlite_engine():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

    def enable_foreign_keys(dbapi_connection: Any, _: Any) -> None:
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

    event.listen(engine, "connect", enable_foreign_keys)
    SQLModel.metadata.create_all(engine)
    return engine


def make_client() -> TestClient:
    engine = create_sqlite_engine()
    with Session(engine) as session:
        session.add_all(
            [
                User(
                    email="tech@example.com",
                    password_hash=hash_password("correct horse battery staple"),
                    role="technician",
                ),
                User(
                    email="second.tech@example.com",
                    password_hash=hash_password("another secure password"),
                    role="technician",
                ),
            ]
        )
        session.commit()

    def test_session() -> Generator[Session]:
        with Session(engine) as session:
            yield session

    app = create_app(initialize_database=False)
    app.dependency_overrides[get_session] = test_session
    app.dependency_overrides[get_settings] = lambda: Settings(
        database_url="postgresql+psycopg://unused",
        jwt_secret_key=TEST_SECRET,
        access_token_expire_minutes=30,
    )
    return TestClient(app)


def authenticate(
    client: TestClient,
    email: str = "tech@example.com",
    password: str = "correct horse battery staple",
) -> dict[str, str]:
    response = client.post(
        "/login",
        data={"username": email, "password": password},
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def create_ticket(client: TestClient, headers: dict[str, str]) -> int:
    company_response = client.post(
        "/companies",
        json={"name": "Acme"},
        headers=headers,
    )
    assert company_response.status_code == 201
    company_id = company_response.json()["id"]
    contact_response = client.post(
        "/contacts",
        json={
            "company_id": company_id,
            "first_name": "Avery",
            "last_name": "Morgan",
            "email": "avery@example.com",
        },
        headers=headers,
    )
    assert contact_response.status_code == 201
    ticket_response = client.post(
        "/tickets",
        json={
            "company_id": company_id,
            "contact_id": contact_response.json()["id"],
            "summary": "VPN problem",
        },
        headers=headers,
    )
    assert ticket_response.status_code == 201
    return ticket_response.json()["id"]


def parse_timestamp(value: str) -> datetime:
    parsed = datetime.fromisoformat(value)
    assert parsed.tzinfo is not None
    return parsed


def test_ticket_note_create_list_get_filters_and_ticket_activity() -> None:
    with make_client() as client:
        headers = authenticate(client)
        ticket_id = create_ticket(client, headers)
        ticket_before = client.get(f"/tickets/{ticket_id}", headers=headers).json()

        internal_response = client.post(
            f"/tickets/{ticket_id}/notes",
            json={"type": "internal", "body": "  Restarted the VPN service.  "},
            headers=headers,
        )
        assert internal_response.status_code == 201
        internal_note = internal_response.json()
        assert internal_note | {"created_at": None} == {
            "id": 1,
            "ticket_id": ticket_id,
            "user_id": 1,
            "contact_id": None,
            "type": "internal",
            "body": "Restarted the VPN service.",
            "created_at": None,
        }
        note_created_at = parse_timestamp(internal_note["created_at"])
        ticket_after = client.get(f"/tickets/{ticket_id}", headers=headers).json()
        assert parse_timestamp(ticket_after["updated_at"]) == note_created_at
        assert parse_timestamp(ticket_after["updated_at"]) >= parse_timestamp(
            ticket_before["updated_at"]
        )

        public_response = client.post(
            f"/tickets/{ticket_id}/notes",
            json={"type": "public", "body": "Please try connecting again."},
            headers=headers,
        )
        assert public_response.status_code == 201
        public_note = public_response.json()

        list_response = client.get(
            f"/tickets/{ticket_id}/notes",
            headers=headers,
        )
        assert list_response.status_code == 200
        assert list_response.json() == [internal_note, public_note]

        item_response = client.get(
            f"/tickets/{ticket_id}/notes/1",
            headers=headers,
        )
        assert item_response.status_code == 200
        assert item_response.json() == internal_note

        internal_filter = client.get(
            f"/tickets/{ticket_id}/notes?type=internal&user_id=1",
            headers=headers,
        )
        assert internal_filter.status_code == 200
        assert internal_filter.json() == [internal_note]

        contact_filter = client.get(
            f"/tickets/{ticket_id}/notes?contact_id=1",
            headers=headers,
        )
        assert contact_filter.status_code == 200
        assert contact_filter.json() == []

        paged_response = client.get(
            f"/tickets/{ticket_id}/notes?offset=1&limit=1",
            headers=headers,
        )
        assert paged_response.status_code == 200
        assert paged_response.json() == [public_note]


def test_ticket_note_nested_lookup_and_validation_errors() -> None:
    with make_client() as client:
        headers = authenticate(client)
        first_ticket_id = create_ticket(client, headers)
        second_ticket_response = client.post(
            "/tickets",
            json={
                "company_id": 1,
                "contact_id": 1,
                "summary": "Second ticket",
            },
            headers=headers,
        )
        assert second_ticket_response.status_code == 201
        second_ticket_id = second_ticket_response.json()["id"]
        note_response = client.post(
            f"/tickets/{first_ticket_id}/notes",
            json={"type": "internal", "body": "Investigating."},
            headers=headers,
        )
        assert note_response.status_code == 201

        invalid_payloads = (
            {"body": "Missing type"},
            {"type": "internal"},
            {"type": "internal", "body": "   "},
            {"type": "resolution", "body": "Invalid type"},
            {"type": "internal", "body": "Note", "user_id": 2},
            {"type": "public", "body": "Note", "contact_id": 1},
        )
        for payload in invalid_payloads:
            response = client.post(
                f"/tickets/{first_ticket_id}/notes",
                json=payload,
                headers=headers,
            )
            assert response.status_code == 422

        blank_key_response = client.post(
            f"/tickets/{first_ticket_id}/notes",
            json={"type": "internal", "body": "Note"},
            headers={**headers, "Idempotency-Key": "   "},
        )
        assert blank_key_response.status_code == 422

        missing_ticket = client.get("/tickets/999/notes", headers=headers)
        assert missing_ticket.status_code == 404
        assert missing_ticket.json() == {"detail": "Ticket not found"}

        missing_note = client.get(
            f"/tickets/{first_ticket_id}/notes/999",
            headers=headers,
        )
        assert missing_note.status_code == 404
        assert missing_note.json() == {"detail": "Ticket note not found"}

        wrong_ticket = client.get(
            f"/tickets/{second_ticket_id}/notes/1",
            headers=headers,
        )
        assert wrong_ticket.status_code == 404
        assert wrong_ticket.json() == {"detail": "Ticket note not found"}

        unauthenticated = client.get(f"/tickets/{first_ticket_id}/notes")
        assert unauthenticated.status_code == 401


def test_ticket_note_idempotency_is_scoped_to_the_originating_user() -> None:
    with make_client() as client:
        first_headers = authenticate(client)
        second_headers = authenticate(
            client,
            "second.tech@example.com",
            "another secure password",
        )
        first_ticket_id = create_ticket(client, first_headers)
        second_ticket_response = client.post(
            "/tickets",
            json={
                "company_id": 1,
                "contact_id": 1,
                "summary": "Second ticket",
            },
            headers=first_headers,
        )
        assert second_ticket_response.status_code == 201
        second_ticket_id = second_ticket_response.json()["id"]
        payload = {"type": "public", "body": "Please reconnect."}
        idempotent_headers = {**first_headers, "Idempotency-Key": "note-request-1"}

        first_response = client.post(
            f"/tickets/{first_ticket_id}/notes",
            json=payload,
            headers=idempotent_headers,
        )
        assert first_response.status_code == 201
        ticket_after_first = client.get(
            f"/tickets/{first_ticket_id}",
            headers=first_headers,
        ).json()

        replay_response = client.post(
            f"/tickets/{first_ticket_id}/notes",
            json=payload,
            headers=idempotent_headers,
        )
        assert replay_response.status_code == 201
        assert replay_response.json() == first_response.json()
        ticket_after_replay = client.get(
            f"/tickets/{first_ticket_id}",
            headers=first_headers,
        ).json()
        assert ticket_after_replay["updated_at"] == ticket_after_first["updated_at"]

        changed_body = client.post(
            f"/tickets/{first_ticket_id}/notes",
            json={**payload, "body": "Different content"},
            headers=idempotent_headers,
        )
        assert changed_body.status_code == 409
        assert changed_body.json() == {
            "detail": "Idempotency-Key already used with different note data"
        }

        changed_ticket = client.post(
            f"/tickets/{second_ticket_id}/notes",
            json=payload,
            headers=idempotent_headers,
        )
        assert changed_ticket.status_code == 409

        second_user_response = client.post(
            f"/tickets/{first_ticket_id}/notes",
            json=payload,
            headers={**second_headers, "Idempotency-Key": "note-request-1"},
        )
        assert second_user_response.status_code == 201
        assert second_user_response.json()["user_id"] == 2
        assert second_user_response.json()["id"] != first_response.json()["id"]

        without_key_one = client.post(
            f"/tickets/{first_ticket_id}/notes",
            json=payload,
            headers=first_headers,
        )
        without_key_two = client.post(
            f"/tickets/{first_ticket_id}/notes",
            json=payload,
            headers=first_headers,
        )
        assert without_key_one.status_code == 201
        assert without_key_two.status_code == 201
        assert without_key_one.json()["id"] != without_key_two.json()["id"]


def test_ticket_note_model_enforces_exactly_one_origin() -> None:
    engine = create_sqlite_engine()
    with Session(engine) as session:
        company = Company(name="Acme")
        user = User(
            email="tech@example.com",
            password_hash=hash_password("correct horse battery staple"),
            role="technician",
        )
        session.add(company)
        session.add(user)
        session.commit()
        session.refresh(company)
        session.refresh(user)
        assert company.id is not None
        assert user.id is not None

        contact = Contact(
            company_id=company.id,
            first_name="Avery",
            last_name="Morgan",
            email="avery@example.com",
        )
        session.add(contact)
        session.commit()
        session.refresh(contact)
        assert contact.id is not None

        ticket = Ticket(
            company_id=company.id,
            contact_id=contact.id,
            summary="VPN problem",
        )
        session.add(ticket)
        session.commit()
        session.refresh(ticket)
        assert ticket.id is not None

        session.add(
            TicketNote(
                ticket_id=ticket.id,
                type="internal",
                body="No origin",
            )
        )
        with pytest.raises(IntegrityError):
            session.commit()
        session.rollback()

        session.add(
            TicketNote(
                ticket_id=ticket.id,
                user_id=user.id,
                contact_id=contact.id,
                type="public",
                body="Two origins",
            )
        )
        with pytest.raises(IntegrityError):
            session.commit()
        session.rollback()

        contact_note = TicketNote(
            ticket_id=ticket.id,
            contact_id=contact.id,
            type="public",
            body="Customer reply",
            idempotency_key="contact-message-1",
        )
        session.add(contact_note)
        session.commit()
        session.refresh(contact_note)
        assert contact_note.user_id is None
        assert contact_note.contact_id == contact.id

        session.add(
            TicketNote(
                ticket_id=ticket.id,
                contact_id=contact.id,
                type="public",
                body="Duplicate contact retry key",
                idempotency_key="contact-message-1",
            )
        )
        with pytest.raises(IntegrityError):
            session.commit()


def test_ticket_with_notes_cannot_be_deleted() -> None:
    with make_client() as client:
        headers = authenticate(client)
        ticket_id = create_ticket(client, headers)
        create_response = client.post(
            f"/tickets/{ticket_id}/notes",
            json={"type": "internal", "body": "Investigating."},
            headers=headers,
        )
        assert create_response.status_code == 201

        delete_response = client.delete(f"/tickets/{ticket_id}", headers=headers)
        assert delete_response.status_code == 409
        assert delete_response.json() == {
            "detail": "Ticket cannot be deleted while it has notes"
        }


def test_ticket_note_openapi_contract_is_nested_and_append_only() -> None:
    app = create_app(initialize_database=False)
    openapi = app.openapi()

    collection_path = openapi["paths"]["/tickets/{ticket_id}/notes"]
    item_path = openapi["paths"]["/tickets/{ticket_id}/notes/{note_id}"]
    assert set(collection_path) == {"get", "post"}
    assert set(item_path) == {"get"}

    create_schema = openapi["components"]["schemas"]["TicketNoteCreate"]
    assert set(create_schema["properties"]) == {"type", "body"}
    assert set(create_schema["required"]) == {"type", "body"}

    post_parameters = collection_path["post"]["parameters"]
    assert any(parameter["name"] == "Idempotency-Key" for parameter in post_parameters)
