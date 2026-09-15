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
from mock_psa_api.models import Ticket, TicketNote, TimeEntry, User, utc_now
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


def make_client():
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
    return TestClient(app), engine


def authenticate(
    client: TestClient,
    email: str = "tech@example.com",
    password: str = "correct horse battery staple",
) -> dict[str, str]:
    response = client.post(
        "/login",
        data={"username": email, "password": password},
    )
    assert response.status_code == 200
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


def create_ticket(
    client: TestClient,
    headers: dict[str, str],
    suffix: str = "",
) -> int:
    company_response = client.post(
        "/companies",
        json={"name": f"Acme{suffix}"},
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
            "email": f"avery{suffix}@example.com",
        },
        headers=headers,
    )
    assert contact_response.status_code == 201
    ticket_response = client.post(
        "/tickets",
        json={
            "company_id": company_id,
            "contact_id": contact_response.json()["id"],
            "summary": f"VPN problem{suffix}",
        },
        headers=headers,
    )
    assert ticket_response.status_code == 201
    return ticket_response.json()["id"]


def create_note(
    client: TestClient,
    ticket_id: int,
    headers: dict[str, str],
    body: str = "Investigated the issue",
) -> int:
    response = client.post(
        f"/tickets/{ticket_id}/notes",
        json={"type": "internal", "body": body},
        headers=headers,
    )
    assert response.status_code == 201
    return response.json()["id"]


def time_entry_payload(**overrides: object) -> dict[str, object]:
    payload: dict[str, object] = {
        "started_at": "2026-09-15T09:30:00-04:00",
        "duration_minutes": 30,
        "description": "Investigated and resolved the issue",
    }
    payload.update(overrides)
    return payload


def parse_timestamp(value: str) -> datetime:
    parsed = datetime.fromisoformat(value)
    assert parsed.tzinfo is not None
    return parsed


def test_time_entry_create_list_get_filters_and_ticket_activity() -> None:
    client, _ = make_client()
    with client:
        headers = authenticate(client)
        ticket_id = create_ticket(client, headers)
        note_id = create_note(client, ticket_id, headers)
        ticket_before = client.get(f"/tickets/{ticket_id}", headers=headers).json()

        linked_response = client.post(
            f"/tickets/{ticket_id}/time-entries",
            json=time_entry_payload(
                ticket_note_id=note_id,
                description="  Investigated and resolved the issue  ",
            ),
            headers=headers,
        )
        assert linked_response.status_code == 201
        linked_entry = linked_response.json()
        assert linked_entry | {"created_at": None, "updated_at": None} == {
            "id": 1,
            "ticket_id": ticket_id,
            "user_id": 1,
            "ticket_note_id": note_id,
            "started_at": "2026-09-15T13:30:00Z",
            "duration_minutes": 30,
            "description": "Investigated and resolved the issue",
            "billable": True,
            "created_at": None,
            "updated_at": None,
        }
        assert parse_timestamp(linked_entry["created_at"]) == parse_timestamp(
            linked_entry["updated_at"]
        )
        ticket_after = client.get(f"/tickets/{ticket_id}", headers=headers).json()
        assert parse_timestamp(ticket_after["updated_at"]) == parse_timestamp(
            linked_entry["created_at"]
        )
        assert parse_timestamp(ticket_after["updated_at"]) >= parse_timestamp(
            ticket_before["updated_at"]
        )

        earlier_response = client.post(
            f"/tickets/{ticket_id}/time-entries",
            json=time_entry_payload(
                started_at="2026-09-15T12:00:00Z",
                duration_minutes=15,
                description="Non-billable preparation",
                billable=False,
            ),
            headers=headers,
        )
        assert earlier_response.status_code == 201
        earlier_entry = earlier_response.json()

        collection_path = f"/tickets/{ticket_id}/time-entries"
        assert client.get(collection_path, headers=headers).json() == [
            earlier_entry,
            linked_entry,
        ]
        assert client.get(
            f"{collection_path}?offset=1&limit=1",
            headers=headers,
        ).json() == [linked_entry]
        assert client.get(
            f"{collection_path}?user_id=1",
            headers=headers,
        ).json() == [earlier_entry, linked_entry]
        assert (
            client.get(
                f"{collection_path}?user_id=2",
                headers=headers,
            ).json()
            == []
        )
        assert client.get(
            f"{collection_path}?ticket_note_id={note_id}",
            headers=headers,
        ).json() == [linked_entry]
        assert client.get(
            f"{collection_path}?billable=false",
            headers=headers,
        ).json() == [earlier_entry]
        assert client.get(
            f"{collection_path}?started_at_from=2026-09-15T13:00:00Z",
            headers=headers,
        ).json() == [linked_entry]
        assert client.get(
            f"{collection_path}?started_at_to=2026-09-15T12:30:00Z",
            headers=headers,
        ).json() == [earlier_entry]
        assert (
            client.get(
                f"{collection_path}?started_at_from=2026-09-16T00:00:00Z"
                "&started_at_to=2026-09-15T00:00:00Z",
                headers=headers,
            ).status_code
            == 422
        )
        assert (
            client.get(
                f"{collection_path}/{linked_entry['id']}",
                headers=headers,
            ).json()
            == linked_entry
        )


def test_time_entry_replace_patch_unlink_relink_and_delete() -> None:
    client, _ = make_client()
    with client:
        headers = authenticate(client)
        ticket_id = create_ticket(client, headers)
        first_note_id = create_note(client, ticket_id, headers, "First note")
        second_note_id = create_note(client, ticket_id, headers, "Second note")
        collection_path = f"/tickets/{ticket_id}/time-entries"
        created = client.post(
            collection_path,
            json=time_entry_payload(ticket_note_id=first_note_id),
            headers=headers,
        ).json()

        replacement_response = client.put(
            f"{collection_path}/{created['id']}",
            json=time_entry_payload(
                started_at="2026-09-15T14:00:00Z",
                duration_minutes=45,
                description="Replacement work detail",
                billable=False,
            ),
            headers=headers,
        )
        assert replacement_response.status_code == 200
        replaced = replacement_response.json()
        assert replaced["ticket_note_id"] is None
        assert replaced["user_id"] == created["user_id"]
        assert replaced["created_at"] == created["created_at"]
        assert parse_timestamp(replaced["updated_at"]) >= parse_timestamp(
            created["updated_at"]
        )

        reused_response = client.post(
            collection_path,
            json=time_entry_payload(
                ticket_note_id=first_note_id,
                started_at="2026-09-15T15:00:00Z",
                description="Reused unlinked note",
            ),
            headers=headers,
        )
        assert reused_response.status_code == 201
        reused = reused_response.json()

        patch_response = client.patch(
            f"{collection_path}/{created['id']}",
            json={
                "ticket_note_id": second_note_id,
                "description": "Patched work detail",
            },
            headers=headers,
        )
        assert patch_response.status_code == 200
        patched = patch_response.json()
        assert patched["ticket_note_id"] == second_note_id
        assert patched["description"] == "Patched work detail"
        assert patched["started_at"] == replaced["started_at"]

        unlink_response = client.patch(
            f"{collection_path}/{created['id']}",
            json={"ticket_note_id": None},
            headers=headers,
        )
        assert unlink_response.status_code == 200
        assert unlink_response.json()["ticket_note_id"] is None

        ticket_before_delete = client.get(
            f"/tickets/{ticket_id}",
            headers=headers,
        ).json()
        assert (
            client.delete(
                f"{collection_path}/{reused['id']}",
                headers=headers,
            ).status_code
            == 204
        )
        ticket_after_delete = client.get(
            f"/tickets/{ticket_id}",
            headers=headers,
        ).json()
        assert parse_timestamp(ticket_after_delete["updated_at"]) >= parse_timestamp(
            ticket_before_delete["updated_at"]
        )
        assert (
            client.get(
                f"{collection_path}/{reused['id']}",
                headers=headers,
            ).status_code
            == 404
        )


def test_time_entry_validation_and_authentication() -> None:
    client, _ = make_client()
    with client:
        headers = authenticate(client)
        ticket_id = create_ticket(client, headers)
        collection_path = f"/tickets/{ticket_id}/time-entries"

        invalid_payloads = (
            time_entry_payload(started_at="2026-09-15T09:30:00"),
            time_entry_payload(duration_minutes=0),
            time_entry_payload(description="   "),
            time_entry_payload(user_id=2),
            time_entry_payload(created_at="2026-09-15T09:30:00Z"),
        )
        for payload in invalid_payloads:
            assert (
                client.post(
                    collection_path,
                    json=payload,
                    headers=headers,
                ).status_code
                == 422
            )

        created_response = client.post(
            collection_path,
            json=time_entry_payload(),
            headers=headers,
        )
        assert created_response.status_code == 201
        time_entry_id = created_response.json()["id"]
        for field in ("started_at", "duration_minutes", "description", "billable"):
            assert (
                client.patch(
                    f"{collection_path}/{time_entry_id}",
                    json={field: None},
                    headers=headers,
                ).status_code
                == 422
            )
        assert (
            client.patch(
                f"{collection_path}/{time_entry_id}",
                json={"user_id": 2},
                headers=headers,
            ).status_code
            == 422
        )

        assert client.post(
            "/tickets/999/time-entries",
            json=time_entry_payload(),
            headers=headers,
        ).json() == {"detail": "Ticket not found"}
        assert client.get(
            f"{collection_path}/999",
            headers=headers,
        ).json() == {"detail": "Time entry not found"}

        requests = (
            ("post", collection_path, {"json": time_entry_payload()}),
            ("get", collection_path, {}),
            ("get", f"{collection_path}/{time_entry_id}", {}),
            (
                "put",
                f"{collection_path}/{time_entry_id}",
                {"json": time_entry_payload()},
            ),
            (
                "patch",
                f"{collection_path}/{time_entry_id}",
                {"json": {"description": "Updated"}},
            ),
            ("delete", f"{collection_path}/{time_entry_id}", {}),
        )
        for method, path, kwargs in requests:
            response = getattr(client, method)(path, **kwargs)
            assert response.status_code == 401


def test_time_entry_ticket_note_integrity() -> None:
    client, engine = make_client()
    with client:
        first_headers = authenticate(client)
        second_headers = authenticate(
            client,
            "second.tech@example.com",
            "another secure password",
        )
        first_ticket_id = create_ticket(client, first_headers, "-one")
        second_ticket_id = create_ticket(client, first_headers, "-two")
        first_note_id = create_note(client, first_ticket_id, first_headers)
        wrong_ticket_note_id = create_note(
            client,
            second_ticket_id,
            first_headers,
        )
        wrong_user_note_id = create_note(
            client,
            first_ticket_id,
            second_headers,
            "Second technician note",
        )

        with Session(engine) as session:
            ticket = session.get(Ticket, first_ticket_id)
            assert ticket is not None
            contact_note = TicketNote(
                ticket_id=first_ticket_id,
                user_id=None,
                contact_id=ticket.contact_id,
                type="public",
                body="Contact reply",
                created_at=utc_now(),
            )
            session.add(contact_note)
            session.commit()
            session.refresh(contact_note)
            assert contact_note.id is not None
            contact_note_id = contact_note.id

        collection_path = f"/tickets/{first_ticket_id}/time-entries"
        error_cases = (
            (999, 404, "Ticket note not found"),
            (wrong_ticket_note_id, 409, "Ticket note does not belong to Ticket"),
            (wrong_user_note_id, 409, "Ticket note does not belong to User"),
            (contact_note_id, 409, "Ticket note does not belong to User"),
        )
        for note_id, expected_status, detail in error_cases:
            response = client.post(
                collection_path,
                json=time_entry_payload(ticket_note_id=note_id),
                headers=first_headers,
            )
            assert response.status_code == expected_status
            assert response.json() == {"detail": detail}

        first_response = client.post(
            collection_path,
            json=time_entry_payload(ticket_note_id=first_note_id),
            headers=first_headers,
        )
        assert first_response.status_code == 201
        duplicate_response = client.post(
            collection_path,
            json=time_entry_payload(
                ticket_note_id=first_note_id,
                started_at="2026-09-15T16:00:00Z",
            ),
            headers=first_headers,
        )
        assert duplicate_response.status_code == 409
        assert duplicate_response.json() == {
            "detail": "Ticket note already has a time entry"
        }


def test_time_entry_idempotency_is_scoped_to_user() -> None:
    client, _ = make_client()
    with client:
        first_headers = authenticate(client)
        second_headers = authenticate(
            client,
            "second.tech@example.com",
            "another secure password",
        )
        first_ticket_id = create_ticket(client, first_headers, "-one")
        second_ticket_id = create_ticket(client, first_headers, "-two")
        collection_path = f"/tickets/{first_ticket_id}/time-entries"
        idempotent_headers = {
            **first_headers,
            "Idempotency-Key": " time-entry-request-1 ",
        }
        payload = time_entry_payload()

        first_response = client.post(
            collection_path,
            json=payload,
            headers=idempotent_headers,
        )
        assert first_response.status_code == 201
        ticket_after_first = client.get(
            f"/tickets/{first_ticket_id}",
            headers=first_headers,
        ).json()
        replay_response = client.post(
            collection_path,
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

        changed_response = client.post(
            collection_path,
            json=time_entry_payload(duration_minutes=60),
            headers=idempotent_headers,
        )
        assert changed_response.status_code == 409
        assert changed_response.json() == {
            "detail": "Idempotency-Key already used with different time entry data"
        }
        different_ticket_response = client.post(
            f"/tickets/{second_ticket_id}/time-entries",
            json=payload,
            headers=idempotent_headers,
        )
        assert different_ticket_response.status_code == 409

        second_user_response = client.post(
            collection_path,
            json=payload,
            headers={**second_headers, "Idempotency-Key": "time-entry-request-1"},
        )
        assert second_user_response.status_code == 201
        assert second_user_response.json()["user_id"] == 2
        assert second_user_response.json()["id"] != first_response.json()["id"]

        assert (
            client.post(
                collection_path,
                json=payload,
                headers={**first_headers, "Idempotency-Key": "   "},
            ).status_code
            == 422
        )


def test_time_entry_database_and_ticket_delete_restrictions() -> None:
    client, engine = make_client()
    with client:
        headers = authenticate(client)
        ticket_id = create_ticket(client, headers)
        collection_path = f"/tickets/{ticket_id}/time-entries"
        created_response = client.post(
            collection_path,
            json=time_entry_payload(),
            headers=headers,
        )
        assert created_response.status_code == 201
        time_entry_id = created_response.json()["id"]

        delete_ticket_response = client.delete(
            f"/tickets/{ticket_id}",
            headers=headers,
        )
        assert delete_ticket_response.status_code == 409
        assert delete_ticket_response.json() == {
            "detail": "Ticket cannot be deleted while it has time entries"
        }

        with Session(engine) as session:
            invalid_entry = TimeEntry(
                ticket_id=ticket_id,
                user_id=1,
                started_at=utc_now(),
                duration_minutes=0,
                description="Invalid duration",
            )
            session.add(invalid_entry)
            with pytest.raises(IntegrityError):
                session.commit()

        assert (
            client.delete(
                f"{collection_path}/{time_entry_id}",
                headers=headers,
            ).status_code
            == 204
        )
        assert (
            client.delete(
                f"/tickets/{ticket_id}",
                headers=headers,
            ).status_code
            == 204
        )


def test_time_entry_openapi_contract_is_nested_crud() -> None:
    client, _ = make_client()
    openapi = client.get("/openapi.json").json()
    collection_path = openapi["paths"]["/tickets/{ticket_id}/time-entries"]
    item_path = openapi["paths"]["/tickets/{ticket_id}/time-entries/{time_entry_id}"]
    assert set(collection_path) == {"post", "get"}
    assert set(item_path) == {"get", "put", "patch", "delete"}
    assert any(
        parameter["name"] == "Idempotency-Key"
        for parameter in collection_path["post"]["parameters"]
    )

    create_properties = openapi["components"]["schemas"]["TimeEntryCreate"][
        "properties"
    ]
    assert set(create_properties) == {
        "ticket_note_id",
        "started_at",
        "duration_minutes",
        "description",
        "billable",
    }
    assert {"started_at", "duration_minutes", "description"} == set(
        openapi["components"]["schemas"]["TimeEntryCreate"]["required"]
    )
    assert {
        "id",
        "ticket_id",
        "user_id",
        "ticket_note_id",
        "started_at",
        "duration_minutes",
        "description",
        "billable",
        "created_at",
        "updated_at",
    } == set(openapi["components"]["schemas"]["TimeEntryRead"]["properties"])
