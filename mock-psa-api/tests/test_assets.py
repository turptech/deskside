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


def create_contact(
    client: TestClient,
    headers: dict[str, str],
    company_id: int,
    first_name: str,
    email: str,
) -> int:
    response = client.post(
        "/contacts",
        json={
            "company_id": company_id,
            "first_name": first_name,
            "last_name": "Contact",
            "email": email,
        },
        headers=headers,
    )
    assert response.status_code == 201
    return response.json()["id"]


def test_asset_crud_and_assignment_switching() -> None:
    with make_client() as client:
        headers = authenticate(client)
        company_id = create_company(client, headers, "Acme")
        site_id = create_site(client, headers, company_id, "Headquarters")
        contact_id = create_contact(
            client,
            headers,
            company_id,
            "Avery",
            "avery@example.com",
        )

        create_response = client.post(
            "/assets",
            json={
                "company_id": company_id,
                "name": "  Avery's Laptop  ",
                "asset_type": "laptop",
                "manufacturer": "Lenovo",
                "model": "ThinkPad T14",
                "serial_number": "SERIAL-001",
                "asset_tag": "ACME-001",
                "hostname": "AVERY-LT",
                "operating_system": "Windows 11 Pro",
            },
            headers=headers,
        )
        assert create_response.status_code == 201
        assert create_response.json() == {
            "id": 1,
            "company_id": company_id,
            "site_id": None,
            "contact_id": None,
            "name": "Avery's Laptop",
            "asset_type": "laptop",
            "status": "active",
            "manufacturer": "Lenovo",
            "model": "ThinkPad T14",
            "serial_number": "SERIAL-001",
            "asset_tag": "ACME-001",
            "hostname": "AVERY-LT",
            "operating_system": "Windows 11 Pro",
        }

        assert client.get("/assets", headers=headers).json() == [create_response.json()]
        assert client.get("/assets/1", headers=headers).json() == create_response.json()

        patch_response = client.patch(
            "/assets/1",
            json={"status": "maintenance", "manufacturer": None},
            headers=headers,
        )
        assert patch_response.status_code == 200
        assert patch_response.json()["status"] == "maintenance"
        assert patch_response.json()["manufacturer"] is None

        put_response = client.put(
            "/assets/1",
            json={
                "company_id": company_id,
                "site_id": site_id,
                "name": "Office Printer",
                "asset_type": "printer",
            },
            headers=headers,
        )
        assert put_response.status_code == 200
        assert put_response.json()["site_id"] == site_id
        assert put_response.json()["contact_id"] is None
        assert put_response.json()["status"] == "active"
        assert put_response.json()["serial_number"] is None

        implicit_switch_response = client.patch(
            "/assets/1",
            json={"contact_id": contact_id},
            headers=headers,
        )
        assert implicit_switch_response.status_code == 409

        explicit_switch_response = client.patch(
            "/assets/1",
            json={"site_id": None, "contact_id": contact_id},
            headers=headers,
        )
        assert explicit_switch_response.status_code == 200
        assert explicit_switch_response.json()["site_id"] is None
        assert explicit_switch_response.json()["contact_id"] == contact_id

        unassign_response = client.patch(
            "/assets/1",
            json={"contact_id": None},
            headers=headers,
        )
        assert unassign_response.status_code == 200
        assert unassign_response.json()["contact_id"] is None

        delete_response = client.delete("/assets/1", headers=headers)
        assert delete_response.status_code == 204
        assert delete_response.content == b""
        assert client.get("/assets/1", headers=headers).status_code == 404


def test_asset_list_supports_filters_and_pagination() -> None:
    with make_client() as client:
        headers = authenticate(client)
        first_company_id = create_company(client, headers, "First Company")
        second_company_id = create_company(client, headers, "Second Company")
        first_site_id = create_site(client, headers, first_company_id, "Main")
        contact_id = create_contact(
            client,
            headers,
            first_company_id,
            "Avery",
            "avery@example.com",
        )
        assets = (
            {
                "company_id": first_company_id,
                "site_id": first_site_id,
                "name": "First Printer",
                "asset_type": "printer",
                "status": "active",
            },
            {
                "company_id": second_company_id,
                "name": "Server",
                "asset_type": "server",
                "status": "maintenance",
            },
            {
                "company_id": first_company_id,
                "contact_id": contact_id,
                "name": "First Laptop",
                "asset_type": "laptop",
                "status": "active",
            },
            {
                "company_id": first_company_id,
                "contact_id": contact_id,
                "name": "Second Laptop",
                "asset_type": "laptop",
                "status": "active",
            },
        )
        for asset in assets:
            assert (
                client.post("/assets", json=asset, headers=headers).status_code == 201
            )

        response = client.get(
            (
                f"/assets?company_id={first_company_id}&contact_id={contact_id}"
                "&asset_type=laptop&status=active&offset=1&limit=1"
            ),
            headers=headers,
        )
        site_response = client.get(
            f"/assets?site_id={first_site_id}",
            headers=headers,
        )

    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["name"] == "Second Laptop"
    assert site_response.status_code == 200
    assert [asset["name"] for asset in site_response.json()] == ["First Printer"]


def test_asset_references_and_company_assignment_consistency() -> None:
    with make_client() as client:
        headers = authenticate(client)
        first_company_id = create_company(client, headers, "First Company")
        second_company_id = create_company(client, headers, "Second Company")
        first_site_id = create_site(client, headers, first_company_id, "First Site")
        second_site_id = create_site(client, headers, second_company_id, "Second Site")
        first_contact_id = create_contact(
            client,
            headers,
            first_company_id,
            "First",
            "first@example.com",
        )
        second_contact_id = create_contact(
            client,
            headers,
            second_company_id,
            "Second",
            "second@example.com",
        )
        base_asset = {
            "company_id": first_company_id,
            "name": "Router",
            "asset_type": "network_device",
        }

        unknown_company = client.post(
            "/assets",
            json={**base_asset, "company_id": 999},
            headers=headers,
        )
        unknown_site = client.post(
            "/assets",
            json={**base_asset, "site_id": 999},
            headers=headers,
        )
        unknown_contact = client.post(
            "/assets",
            json={**base_asset, "contact_id": 999},
            headers=headers,
        )
        wrong_site = client.post(
            "/assets",
            json={**base_asset, "site_id": second_site_id},
            headers=headers,
        )
        wrong_contact = client.post(
            "/assets",
            json={**base_asset, "contact_id": second_contact_id},
            headers=headers,
        )
        dual_assignment = client.post(
            "/assets",
            json={
                **base_asset,
                "site_id": first_site_id,
                "contact_id": first_contact_id,
            },
            headers=headers,
        )

        assert unknown_company.status_code == 404
        assert unknown_company.json() == {"detail": "Company not found"}
        assert unknown_site.status_code == 404
        assert unknown_site.json() == {"detail": "Site not found"}
        assert unknown_contact.status_code == 404
        assert unknown_contact.json() == {"detail": "Contact not found"}
        assert wrong_site.status_code == 409
        assert wrong_site.json() == {"detail": "Site does not belong to Company"}
        assert wrong_contact.status_code == 409
        assert wrong_contact.json() == {"detail": "Contact does not belong to Company"}
        assert dual_assignment.status_code == 409
        assert dual_assignment.json() == {
            "detail": "Asset cannot be assigned to both a Site and a Contact"
        }

        create_response = client.post(
            "/assets",
            json={**base_asset, "site_id": first_site_id},
            headers=headers,
        )
        assert create_response.status_code == 201

        invalid_move = client.patch(
            "/assets/1",
            json={"company_id": second_company_id},
            headers=headers,
        )
        assert invalid_move.status_code == 409

        valid_move = client.patch(
            "/assets/1",
            json={"company_id": second_company_id, "site_id": second_site_id},
            headers=headers,
        )
        assert valid_move.status_code == 200
        assert valid_move.json()["company_id"] == second_company_id
        assert valid_move.json()["site_id"] == second_site_id


def test_asset_fields_are_validated() -> None:
    with make_client() as client:
        headers = authenticate(client)
        company_id = create_company(client, headers, "Acme")
        valid_asset = {
            "company_id": company_id,
            "name": "Laptop",
            "asset_type": "laptop",
        }
        invalid_assets = (
            {key: value for key, value in valid_asset.items() if key != "company_id"},
            {**valid_asset, "company_id": 0},
            {**valid_asset, "name": "   "},
            {**valid_asset, "asset_type": "toaster"},
            {**valid_asset, "status": "lost"},
            {**valid_asset, "hostname": "   "},
        )
        for asset in invalid_assets:
            assert (
                client.post("/assets", json=asset, headers=headers).status_code == 422
            )

        assert (
            client.post("/assets", json=valid_asset, headers=headers).status_code == 201
        )
        for field in ("company_id", "name", "asset_type", "status"):
            response = client.patch(
                "/assets/1",
                json={field: None},
                headers=headers,
            )
            assert response.status_code == 422


def test_asset_routes_require_authentication() -> None:
    with make_client() as client:
        response = client.get("/assets")

    assert response.status_code == 401


def test_asset_references_restrict_parent_deletion_and_company_changes() -> None:
    with make_client() as client:
        headers = authenticate(client)
        first_company_id = create_company(client, headers, "First Company")
        second_company_id = create_company(client, headers, "Second Company")
        site_id = create_site(client, headers, first_company_id, "Main")
        contact_id = create_contact(
            client,
            headers,
            first_company_id,
            "Avery",
            "avery@example.com",
        )

        unassigned_asset = client.post(
            "/assets",
            json={
                "company_id": first_company_id,
                "name": "Spare Laptop",
                "asset_type": "laptop",
            },
            headers=headers,
        )
        site_asset = client.post(
            "/assets",
            json={
                "company_id": first_company_id,
                "site_id": site_id,
                "name": "Router",
                "asset_type": "network_device",
            },
            headers=headers,
        )
        contact_asset = client.post(
            "/assets",
            json={
                "company_id": first_company_id,
                "contact_id": contact_id,
                "name": "Avery's Laptop",
                "asset_type": "laptop",
            },
            headers=headers,
        )
        assert unassigned_asset.status_code == 201
        assert site_asset.status_code == 201
        assert contact_asset.status_code == 201

        site_delete = client.delete(f"/sites/{site_id}", headers=headers)
        assert site_delete.status_code == 409
        assert site_delete.json() == {
            "detail": "Site cannot be deleted while it has assets"
        }
        site_move = client.patch(
            f"/sites/{site_id}",
            json={"company_id": second_company_id},
            headers=headers,
        )
        assert site_move.status_code == 409
        assert site_move.json() == {
            "detail": "Site cannot change Company while it has assets"
        }

        contact_delete = client.delete(f"/contacts/{contact_id}", headers=headers)
        assert contact_delete.status_code == 409
        assert contact_delete.json() == {
            "detail": "Contact cannot be deleted while it has assets"
        }
        contact_move = client.patch(
            f"/contacts/{contact_id}",
            json={"company_id": second_company_id},
            headers=headers,
        )
        assert contact_move.status_code == 409
        assert contact_move.json() == {
            "detail": "Contact cannot change Company while it has assets"
        }

        assert client.delete("/assets/2", headers=headers).status_code == 204
        assert client.delete("/assets/3", headers=headers).status_code == 204
        assert client.delete(f"/sites/{site_id}", headers=headers).status_code == 204
        assert (
            client.delete(f"/contacts/{contact_id}", headers=headers).status_code == 204
        )

        company_delete = client.delete(
            f"/companies/{first_company_id}",
            headers=headers,
        )
        assert company_delete.status_code == 409
        assert company_delete.json() == {
            "detail": "Company cannot be deleted while it has assets"
        }

        assert client.delete("/assets/1", headers=headers).status_code == 204
        assert (
            client.delete(f"/companies/{first_company_id}", headers=headers).status_code
            == 204
        )
