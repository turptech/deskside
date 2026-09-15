from collections.abc import Generator
from datetime import datetime
from typing import Any

from fastapi.testclient import TestClient
from sqlalchemy import event
from sqlalchemy.pool import StaticPool
from sqlmodel import Session, SQLModel, create_engine

from mock_psa_api.config import Settings, get_settings
from mock_psa_api.database import get_session
from mock_psa_api.main import create_app
from mock_psa_api.models import User
from mock_psa_api.security import hash_password

TEST_SECRET = "test-secret-that-is-at-least-32-characters"


def make_client() -> TestClient:
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


def authenticate(client: TestClient) -> dict[str, str]:
    response = client.post(
        "/login",
        data={
            "username": "tech@example.com",
            "password": "correct horse battery staple",
        },
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def create_company(client: TestClient, headers: dict[str, str], name: str) -> int:
    response = client.post("/companies", json={"name": name}, headers=headers)
    assert response.status_code == 201
    return response.json()["id"]


def create_site(
    client: TestClient,
    headers: dict[str, str],
    company_id: int,
    name: str,
) -> int:
    response = client.post(
        "/sites",
        json={"company_id": company_id, "name": name},
        headers=headers,
    )
    assert response.status_code == 201
    return response.json()["id"]


def create_contact(
    client: TestClient,
    headers: dict[str, str],
    company_id: int,
    email: str,
    site_id: int | None = None,
) -> int:
    response = client.post(
        "/contacts",
        json={
            "company_id": company_id,
            "site_id": site_id,
            "first_name": "Avery",
            "last_name": "Morgan",
            "email": email,
        },
        headers=headers,
    )
    assert response.status_code == 201
    return response.json()["id"]


def create_asset(
    client: TestClient,
    headers: dict[str, str],
    company_id: int,
    name: str,
    contact_id: int | None = None,
) -> int:
    response = client.post(
        "/assets",
        json={
            "company_id": company_id,
            "contact_id": contact_id,
            "name": name,
            "asset_type": "laptop",
        },
        headers=headers,
    )
    assert response.status_code == 201
    return response.json()["id"]


def parse_timestamp(value: str) -> datetime:
    parsed = datetime.fromisoformat(value)
    assert parsed.tzinfo is not None
    return parsed


def test_ticket_crud_and_lifecycle_timestamps() -> None:
    with make_client() as client:
        headers = authenticate(client)
        company_id = create_company(client, headers, "Acme")
        site_id = create_site(client, headers, company_id, "Headquarters")
        contact_id = create_contact(
            client,
            headers,
            company_id,
            "avery@example.com",
        )
        asset_id = create_asset(client, headers, company_id, "Laptop")

        create_response = client.post(
            "/tickets",
            json={
                "company_id": company_id,
                "contact_id": contact_id,
                "site_id": site_id,
                "asset_id": asset_id,
                "assigned_user_id": 1,
                "summary": "  VPN connection fails  ",
                "description": "  User cannot connect from home.  ",
            },
            headers=headers,
        )
        assert create_response.status_code == 201
        created = create_response.json()
        assert created | {
            "created_at": None,
            "updated_at": None,
        } == {
            "id": 1,
            "company_id": company_id,
            "contact_id": contact_id,
            "site_id": site_id,
            "asset_id": asset_id,
            "assigned_user_id": 1,
            "summary": "VPN connection fails",
            "description": "User cannot connect from home.",
            "status": "new",
            "priority": "normal",
            "source": "phone",
            "created_at": None,
            "updated_at": None,
            "resolved_at": None,
        }
        created_at = parse_timestamp(created["created_at"])
        updated_at = parse_timestamp(created["updated_at"])
        assert created_at == updated_at

        assert client.get("/tickets", headers=headers).json() == [created]
        assert client.get("/tickets/1", headers=headers).json() == created

        resolved_response = client.patch(
            "/tickets/1",
            json={"status": "resolved", "description": None},
            headers=headers,
        )
        assert resolved_response.status_code == 200
        resolved = resolved_response.json()
        resolved_at = parse_timestamp(resolved["resolved_at"])
        assert parse_timestamp(resolved["updated_at"]) >= updated_at
        assert resolved["description"] is None

        closed_response = client.patch(
            "/tickets/1",
            json={"status": "closed"},
            headers=headers,
        )
        assert closed_response.status_code == 200
        assert closed_response.json()["resolved_at"] == resolved["resolved_at"]

        reopened_response = client.patch(
            "/tickets/1",
            json={"status": "open"},
            headers=headers,
        )
        assert reopened_response.status_code == 200
        assert reopened_response.json()["resolved_at"] is None
        assert resolved_at >= created_at

        put_response = client.put(
            "/tickets/1",
            json={
                "company_id": company_id,
                "contact_id": contact_id,
                "summary": "Replacement ticket",
            },
            headers=headers,
        )
        assert put_response.status_code == 200
        replaced = put_response.json()
        assert replaced["created_at"] == created["created_at"]
        assert replaced["site_id"] is None
        assert replaced["asset_id"] is None
        assert replaced["assigned_user_id"] is None
        assert replaced["status"] == "new"
        assert replaced["priority"] == "normal"
        assert replaced["source"] == "phone"

        assert client.delete("/tickets/1", headers=headers).status_code == 204
        missing_response = client.get("/tickets/1", headers=headers)
        assert missing_response.status_code == 404
        assert missing_response.json() == {"detail": "Ticket not found"}


def test_ticket_list_supports_every_filter_and_pagination() -> None:
    with make_client() as client:
        headers = authenticate(client)
        first_company = create_company(client, headers, "First")
        second_company = create_company(client, headers, "Second")
        first_site = create_site(client, headers, first_company, "Main")
        first_contact = create_contact(
            client,
            headers,
            first_company,
            "first@example.com",
        )
        second_contact = create_contact(
            client,
            headers,
            second_company,
            "second@example.com",
        )
        first_asset = create_asset(client, headers, first_company, "First laptop")

        tickets = (
            {
                "company_id": first_company,
                "contact_id": first_contact,
                "site_id": first_site,
                "asset_id": first_asset,
                "assigned_user_id": 2,
                "summary": "First match",
                "status": "in_progress",
                "priority": "urgent",
                "source": "monitoring",
            },
            {
                "company_id": second_company,
                "contact_id": second_contact,
                "summary": "Different ticket",
            },
            {
                "company_id": first_company,
                "contact_id": first_contact,
                "site_id": first_site,
                "asset_id": first_asset,
                "assigned_user_id": 2,
                "summary": "Second match",
                "status": "in_progress",
                "priority": "urgent",
                "source": "monitoring",
            },
        )
        for ticket in tickets:
            assert (
                client.post("/tickets", json=ticket, headers=headers).status_code == 201
            )

        filters = {
            "company_id": first_company,
            "contact_id": first_contact,
            "site_id": first_site,
            "asset_id": first_asset,
            "assigned_user_id": 2,
            "status": "in_progress",
            "priority": "urgent",
            "source": "monitoring",
        }
        for name, value in filters.items():
            response = client.get(f"/tickets?{name}={value}", headers=headers)
            assert response.status_code == 200
            assert [ticket["summary"] for ticket in response.json()] == [
                "First match",
                "Second match",
            ]

        paged_response = client.get(
            "/tickets?company_id=1&offset=1&limit=1",
            headers=headers,
        )
        assert paged_response.status_code == 200
        assert [ticket["summary"] for ticket in paged_response.json()] == [
            "Second match"
        ]


def test_ticket_references_and_company_consistency() -> None:
    with make_client() as client:
        headers = authenticate(client)
        first_company = create_company(client, headers, "First")
        second_company = create_company(client, headers, "Second")
        first_site = create_site(client, headers, first_company, "First site")
        second_site = create_site(client, headers, second_company, "Second site")
        first_contact = create_contact(
            client,
            headers,
            first_company,
            "first@example.com",
        )
        reporting_contact = create_contact(
            client,
            headers,
            first_company,
            "reporter@example.com",
            first_site,
        )
        second_contact = create_contact(
            client,
            headers,
            second_company,
            "second@example.com",
        )
        first_asset = create_asset(
            client,
            headers,
            first_company,
            "Someone else's laptop",
            first_contact,
        )
        second_asset = create_asset(client, headers, second_company, "Second laptop")
        base_ticket = {
            "company_id": first_company,
            "contact_id": reporting_contact,
            "summary": "Help needed",
        }

        missing_cases = (
            ({**base_ticket, "company_id": 999}, "Company not found"),
            ({**base_ticket, "contact_id": 999}, "Contact not found"),
            ({**base_ticket, "site_id": 999}, "Site not found"),
            ({**base_ticket, "asset_id": 999}, "Asset not found"),
            ({**base_ticket, "assigned_user_id": 999}, "User not found"),
        )
        for payload, detail in missing_cases:
            response = client.post("/tickets", json=payload, headers=headers)
            assert response.status_code == 404
            assert response.json() == {"detail": detail}

        conflict_cases = (
            (
                {**base_ticket, "contact_id": second_contact},
                "Contact does not belong to Company",
            ),
            (
                {**base_ticket, "site_id": second_site},
                "Site does not belong to Company",
            ),
            (
                {**base_ticket, "asset_id": second_asset},
                "Asset does not belong to Company",
            ),
        )
        for payload, detail in conflict_cases:
            response = client.post("/tickets", json=payload, headers=headers)
            assert response.status_code == 409
            assert response.json() == {"detail": detail}

        valid_response = client.post(
            "/tickets",
            json={**base_ticket, "site_id": first_site, "asset_id": first_asset},
            headers=headers,
        )
        assert valid_response.status_code == 201

        invalid_move = client.patch(
            "/tickets/1",
            json={"company_id": second_company},
            headers=headers,
        )
        assert invalid_move.status_code == 409

        valid_move = client.patch(
            "/tickets/1",
            json={
                "company_id": second_company,
                "contact_id": second_contact,
                "site_id": second_site,
                "asset_id": second_asset,
            },
            headers=headers,
        )
        assert valid_move.status_code == 200
        assert valid_move.json()["company_id"] == second_company


def test_ticket_fields_are_validated_and_routes_require_authentication() -> None:
    with make_client() as client:
        headers = authenticate(client)
        company_id = create_company(client, headers, "Acme")
        contact_id = create_contact(
            client,
            headers,
            company_id,
            "avery@example.com",
        )
        valid_ticket = {
            "company_id": company_id,
            "contact_id": contact_id,
            "summary": "Support request",
        }
        invalid_tickets = (
            {key: value for key, value in valid_ticket.items() if key != "company_id"},
            {key: value for key, value in valid_ticket.items() if key != "contact_id"},
            {key: value for key, value in valid_ticket.items() if key != "summary"},
            {**valid_ticket, "company_id": 0},
            {**valid_ticket, "summary": "   "},
            {**valid_ticket, "description": "   "},
            {**valid_ticket, "status": "cancelled"},
            {**valid_ticket, "priority": "critical"},
            {**valid_ticket, "source": "chat"},
        )
        for ticket in invalid_tickets:
            assert (
                client.post("/tickets", json=ticket, headers=headers).status_code == 422
            )

        assert (
            client.post("/tickets", json=valid_ticket, headers=headers).status_code
            == 201
        )
        for field in (
            "company_id",
            "contact_id",
            "summary",
            "status",
            "priority",
            "source",
        ):
            response = client.patch(
                "/tickets/1",
                json={field: None},
                headers=headers,
            )
            assert response.status_code == 422

        unauthenticated = client.get("/tickets")
        assert unauthenticated.status_code == 401


def test_ticket_references_restrict_parent_deletion_and_company_changes() -> None:
    with make_client() as client:
        headers = authenticate(client)
        first_company = create_company(client, headers, "First")
        second_company = create_company(client, headers, "Second")
        site_id = create_site(client, headers, first_company, "Main")
        contact_id = create_contact(
            client,
            headers,
            first_company,
            "avery@example.com",
        )
        asset_id = create_asset(client, headers, first_company, "Laptop")
        ticket_response = client.post(
            "/tickets",
            json={
                "company_id": first_company,
                "contact_id": contact_id,
                "site_id": site_id,
                "asset_id": asset_id,
                "summary": "Blocked resources",
            },
            headers=headers,
        )
        assert ticket_response.status_code == 201

        blocked_deletes = (
            (
                f"/companies/{first_company}",
                "Company cannot be deleted while it has tickets",
            ),
            (f"/sites/{site_id}", "Site cannot be deleted while it has tickets"),
            (
                f"/contacts/{contact_id}",
                "Contact cannot be deleted while it has tickets",
            ),
            (f"/assets/{asset_id}", "Asset cannot be deleted while it has tickets"),
        )
        for path, detail in blocked_deletes:
            response = client.delete(path, headers=headers)
            assert response.status_code == 409
            assert response.json() == {"detail": detail}

        blocked_moves = (
            (
                f"/sites/{site_id}",
                "Site cannot change Company while it has tickets",
            ),
            (
                f"/contacts/{contact_id}",
                "Contact cannot change Company while it has tickets",
            ),
            (
                f"/assets/{asset_id}",
                "Asset cannot change Company while it has tickets",
            ),
        )
        for path, detail in blocked_moves:
            response = client.patch(
                path,
                json={"company_id": second_company},
                headers=headers,
            )
            assert response.status_code == 409
            assert response.json() == {"detail": detail}

        assert client.delete("/tickets/1", headers=headers).status_code == 204
        for path, _ in blocked_moves:
            response = client.patch(
                path,
                json={"company_id": second_company},
                headers=headers,
            )
            assert response.status_code == 200


def test_ticket_openapi_contract_exposes_crud_and_read_only_timestamps() -> None:
    app = create_app(initialize_database=False)
    openapi = app.openapi()

    assert set(openapi["paths"]["/tickets"]) == {"get", "post"}
    assert set(openapi["paths"]["/tickets/{ticket_id}"]) == {
        "get",
        "put",
        "patch",
        "delete",
    }
    create_properties = openapi["components"]["schemas"]["TicketCreate"]["properties"]
    read_properties = openapi["components"]["schemas"]["TicketRead"]["properties"]
    assert "created_at" not in create_properties
    assert {"created_at", "updated_at", "resolved_at"} <= set(read_properties)
