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


def test_contact_crud() -> None:
    with make_client() as client:
        headers = authenticate(client)
        company_id = create_company(client, headers, "Acme Dental")
        site_id = create_site(client, headers, company_id, "Headquarters")

        create_response = client.post(
            "/contacts",
            json={
                "company_id": company_id,
                "site_id": site_id,
                "first_name": "  Avery  ",
                "last_name": "Morgan",
                "email": "AVERY.MORGAN@EXAMPLE.COM",
                "phone": "+1 919-555-0100",
                "mobile_phone": "+1 919-555-0101",
                "job_title": "Office Manager",
            },
            headers=headers,
        )
        assert create_response.status_code == 201
        assert create_response.json() == {
            "id": 1,
            "company_id": company_id,
            "site_id": site_id,
            "first_name": "Avery",
            "last_name": "Morgan",
            "email": "avery.morgan@example.com",
            "phone": "+1 919-555-0100",
            "mobile_phone": "+1 919-555-0101",
            "job_title": "Office Manager",
        }

        list_response = client.get("/contacts", headers=headers)
        assert list_response.status_code == 200
        assert list_response.json() == [create_response.json()]

        get_response = client.get("/contacts/1", headers=headers)
        assert get_response.status_code == 200
        assert get_response.json() == create_response.json()

        patch_response = client.patch(
            "/contacts/1",
            json={"job_title": "Operations Manager", "mobile_phone": None},
            headers=headers,
        )
        assert patch_response.status_code == 200
        assert patch_response.json()["job_title"] == "Operations Manager"
        assert patch_response.json()["mobile_phone"] is None

        put_response = client.put(
            "/contacts/1",
            json={
                "company_id": company_id,
                "first_name": "Avery",
                "last_name": "Morgan",
                "email": "new.address@example.com",
            },
            headers=headers,
        )
        assert put_response.status_code == 200
        assert put_response.json()["site_id"] is None
        assert put_response.json()["email"] == "new.address@example.com"
        assert put_response.json()["phone"] is None

        delete_response = client.delete("/contacts/1", headers=headers)
        assert delete_response.status_code == 204
        assert delete_response.content == b""

        missing_response = client.get("/contacts/1", headers=headers)
        assert missing_response.status_code == 404
        assert missing_response.json() == {"detail": "Contact not found"}


def test_contact_list_supports_company_and_site_filters_and_pagination() -> None:
    with make_client() as client:
        headers = authenticate(client)
        first_company_id = create_company(client, headers, "First Company")
        second_company_id = create_company(client, headers, "Second Company")
        first_site_id = create_site(client, headers, first_company_id, "First Site")
        second_site_id = create_site(client, headers, second_company_id, "Second Site")

        for company_id, site_id, first_name, email in (
            (first_company_id, first_site_id, "First", "first@example.com"),
            (second_company_id, second_site_id, "Second", "second@example.com"),
            (first_company_id, first_site_id, "Third", "third@example.com"),
        ):
            response = client.post(
                "/contacts",
                json={
                    "company_id": company_id,
                    "site_id": site_id,
                    "first_name": first_name,
                    "last_name": "Contact",
                    "email": email,
                },
                headers=headers,
            )
            assert response.status_code == 201

        response = client.get(
            (
                f"/contacts?company_id={first_company_id}"
                f"&site_id={first_site_id}&offset=1&limit=1"
            ),
            headers=headers,
        )

    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["first_name"] == "Third"


def test_contact_references_and_company_site_consistency() -> None:
    with make_client() as client:
        headers = authenticate(client)
        first_company_id = create_company(client, headers, "First Company")
        second_company_id = create_company(client, headers, "Second Company")
        first_site_id = create_site(client, headers, first_company_id, "First Site")
        second_site_id = create_site(client, headers, second_company_id, "Second Site")
        contact_payload = {
            "company_id": first_company_id,
            "site_id": first_site_id,
            "first_name": "Avery",
            "last_name": "Morgan",
            "email": "avery@example.com",
        }

        unknown_company_response = client.post(
            "/contacts",
            json={**contact_payload, "company_id": 999, "site_id": None},
            headers=headers,
        )
        unknown_site_response = client.post(
            "/contacts",
            json={**contact_payload, "site_id": 999},
            headers=headers,
        )
        mismatched_site_response = client.post(
            "/contacts",
            json={**contact_payload, "site_id": second_site_id},
            headers=headers,
        )

        assert unknown_company_response.status_code == 404
        assert unknown_company_response.json() == {"detail": "Company not found"}
        assert unknown_site_response.status_code == 404
        assert unknown_site_response.json() == {"detail": "Site not found"}
        assert mismatched_site_response.status_code == 409
        assert mismatched_site_response.json() == {
            "detail": "Site does not belong to Company"
        }

        create_response = client.post(
            "/contacts",
            json=contact_payload,
            headers=headers,
        )
        assert create_response.status_code == 201

        invalid_move_response = client.patch(
            "/contacts/1",
            json={"company_id": second_company_id},
            headers=headers,
        )
        assert invalid_move_response.status_code == 409

        valid_move_response = client.patch(
            "/contacts/1",
            json={"company_id": second_company_id, "site_id": second_site_id},
            headers=headers,
        )
        assert valid_move_response.status_code == 200
        assert valid_move_response.json()["company_id"] == second_company_id
        assert valid_move_response.json()["site_id"] == second_site_id

        unassign_response = client.patch(
            "/contacts/1",
            json={"site_id": None},
            headers=headers,
        )
        assert unassign_response.status_code == 200
        assert unassign_response.json()["site_id"] is None


def test_contact_fields_are_validated() -> None:
    with make_client() as client:
        headers = authenticate(client)
        company_id = create_company(client, headers, "Acme")
        valid_payload = {
            "company_id": company_id,
            "first_name": "Avery",
            "last_name": "Morgan",
            "email": "avery@example.com",
        }
        invalid_payloads = (
            {key: value for key, value in valid_payload.items() if key != "company_id"},
            {**valid_payload, "company_id": 0},
            {**valid_payload, "first_name": "   "},
            {**valid_payload, "last_name": "   "},
            {**valid_payload, "email": "not-an-email"},
            {**valid_payload, "phone": "   "},
        )

        for payload in invalid_payloads:
            response = client.post("/contacts", json=payload, headers=headers)
            assert response.status_code == 422

        create_response = client.post(
            "/contacts",
            json=valid_payload,
            headers=headers,
        )
        assert create_response.status_code == 201

        for field in ("company_id", "first_name", "last_name", "email"):
            response = client.patch(
                "/contacts/1",
                json={field: None},
                headers=headers,
            )
            assert response.status_code == 422


def test_contact_routes_require_authentication() -> None:
    with make_client() as client:
        response = client.get("/contacts")

    assert response.status_code == 401


def test_company_and_site_with_contacts_cannot_be_deleted() -> None:
    with make_client() as client:
        headers = authenticate(client)
        company_id = create_company(client, headers, "Acme")
        site_id = create_site(client, headers, company_id, "Main")
        contact_response = client.post(
            "/contacts",
            json={
                "company_id": company_id,
                "site_id": site_id,
                "first_name": "Avery",
                "last_name": "Morgan",
                "email": "avery@example.com",
            },
            headers=headers,
        )
        assert contact_response.status_code == 201

        site_delete_response = client.delete(f"/sites/{site_id}", headers=headers)
        assert site_delete_response.status_code == 409
        assert site_delete_response.json() == {
            "detail": "Site cannot be deleted while it has contacts"
        }

        unassign_response = client.patch(
            "/contacts/1",
            json={"site_id": None},
            headers=headers,
        )
        assert unassign_response.status_code == 200
        assert client.delete(f"/sites/{site_id}", headers=headers).status_code == 204

        company_delete_response = client.delete(
            f"/companies/{company_id}",
            headers=headers,
        )
        assert company_delete_response.status_code == 409
        assert company_delete_response.json() == {
            "detail": "Company cannot be deleted while it has contacts"
        }

        assert client.delete("/contacts/1", headers=headers).status_code == 204
        assert (
            client.delete(f"/companies/{company_id}", headers=headers).status_code
            == 204
        )
