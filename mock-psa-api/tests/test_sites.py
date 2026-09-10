from collections.abc import Generator
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
        session.add(
            User(
                email="tech@example.com",
                password_hash=hash_password("correct horse battery staple"),
                role="technician",
            )
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


def test_site_crud_and_company_reassignment() -> None:
    with make_client() as client:
        headers = authenticate(client)
        first_company_id = create_company(client, headers, "Acme Dental")
        second_company_id = create_company(client, headers, "Acme Health")

        create_response = client.post(
            "/sites",
            json={
                "company_id": first_company_id,
                "name": "  Headquarters  ",
                "address_line1": "100 Main Street",
                "address_line2": "Suite 200",
                "city": "Raleigh",
                "state_province": "NC",
                "postal_code": "27601",
                "country_code": "us",
                "phone": "+1 919-555-0100",
                "timezone": "America/New_York",
            },
            headers=headers,
        )
        assert create_response.status_code == 201
        assert create_response.json() == {
            "id": 1,
            "company_id": first_company_id,
            "name": "Headquarters",
            "address_line1": "100 Main Street",
            "address_line2": "Suite 200",
            "city": "Raleigh",
            "state_province": "NC",
            "postal_code": "27601",
            "country_code": "US",
            "phone": "+1 919-555-0100",
            "timezone": "America/New_York",
        }

        list_response = client.get("/sites", headers=headers)
        assert list_response.status_code == 200
        assert list_response.json() == [create_response.json()]

        get_response = client.get("/sites/1", headers=headers)
        assert get_response.status_code == 200
        assert get_response.json() == create_response.json()

        patch_response = client.patch(
            "/sites/1",
            json={"name": "Branch Office", "address_line2": None},
            headers=headers,
        )
        assert patch_response.status_code == 200
        assert patch_response.json()["name"] == "Branch Office"
        assert patch_response.json()["address_line2"] is None

        put_response = client.put(
            "/sites/1",
            json={"company_id": second_company_id, "name": "Main Office"},
            headers=headers,
        )
        assert put_response.status_code == 200
        assert put_response.json()["company_id"] == second_company_id
        assert put_response.json()["name"] == "Main Office"
        assert put_response.json()["address_line1"] is None

        delete_response = client.delete("/sites/1", headers=headers)
        assert delete_response.status_code == 204
        assert delete_response.content == b""

        missing_response = client.get("/sites/1", headers=headers)
        assert missing_response.status_code == 404
        assert missing_response.json() == {"detail": "Site not found"}


def test_site_list_supports_company_filter_and_pagination() -> None:
    with make_client() as client:
        headers = authenticate(client)
        first_company_id = create_company(client, headers, "First Company")
        second_company_id = create_company(client, headers, "Second Company")

        for company_id, name in (
            (first_company_id, "First Site"),
            (second_company_id, "Second Site"),
            (first_company_id, "Third Site"),
        ):
            response = client.post(
                "/sites",
                json={"company_id": company_id, "name": name},
                headers=headers,
            )
            assert response.status_code == 201

        response = client.get(
            f"/sites?company_id={first_company_id}&offset=1&limit=1",
            headers=headers,
        )

    assert response.status_code == 200
    assert response.json()[0]["name"] == "Third Site"


def test_site_requires_valid_company_references() -> None:
    with make_client() as client:
        headers = authenticate(client)
        company_id = create_company(client, headers, "Acme")
        site_response = client.post(
            "/sites",
            json={"company_id": company_id, "name": "Main"},
            headers=headers,
        )
        assert site_response.status_code == 201

        create_response = client.post(
            "/sites",
            json={"company_id": 999, "name": "Unknown"},
            headers=headers,
        )
        patch_response = client.patch(
            "/sites/1",
            json={"company_id": 999},
            headers=headers,
        )
        put_response = client.put(
            "/sites/1",
            json={"company_id": 999, "name": "Unknown"},
            headers=headers,
        )

    for response in (create_response, patch_response, put_response):
        assert response.status_code == 404
        assert response.json() == {"detail": "Company not found"}


def test_site_fields_are_validated() -> None:
    with make_client() as client:
        headers = authenticate(client)
        company_id = create_company(client, headers, "Acme")
        invalid_payloads = (
            {"name": "Main"},
            {"company_id": 0, "name": "Main"},
            {"company_id": company_id, "name": "   "},
            {"company_id": company_id, "name": "Main", "city": "   "},
            {"company_id": company_id, "name": "Main", "country_code": "USA"},
            {"company_id": company_id, "name": "Main", "country_code": "12"},
            {
                "company_id": company_id,
                "name": "Main",
                "timezone": "Not/A_Timezone",
            },
        )

        for payload in invalid_payloads:
            response = client.post("/sites", json=payload, headers=headers)
            assert response.status_code == 422

        site_response = client.post(
            "/sites",
            json={"company_id": company_id, "name": "Main"},
            headers=headers,
        )
        assert site_response.status_code == 201

        null_company_response = client.patch(
            "/sites/1",
            json={"company_id": None},
            headers=headers,
        )
        null_name_response = client.patch(
            "/sites/1",
            json={"name": None},
            headers=headers,
        )

    assert null_company_response.status_code == 422
    assert null_name_response.status_code == 422


def test_site_routes_require_authentication() -> None:
    with make_client() as client:
        response = client.get("/sites")

    assert response.status_code == 401


def test_company_with_sites_cannot_be_deleted() -> None:
    with make_client() as client:
        headers = authenticate(client)
        company_id = create_company(client, headers, "Acme")
        site_response = client.post(
            "/sites",
            json={"company_id": company_id, "name": "Main"},
            headers=headers,
        )
        assert site_response.status_code == 201

        blocked_response = client.delete(f"/companies/{company_id}", headers=headers)
        assert blocked_response.status_code == 409
        assert blocked_response.json() == {
            "detail": "Company cannot be deleted while it has sites"
        }

        assert client.delete("/sites/1", headers=headers).status_code == 204
        assert (
            client.delete(f"/companies/{company_id}", headers=headers).status_code
            == 204
        )
