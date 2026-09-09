from collections.abc import Generator

from fastapi.testclient import TestClient
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


def test_company_crud() -> None:
    with make_client() as client:
        headers = authenticate(client)

        create_response = client.post(
            "/companies",
            json={"name": "  Acme Dental  "},
            headers=headers,
        )
        assert create_response.status_code == 201
        assert create_response.json() == {"id": 1, "name": "Acme Dental"}

        list_response = client.get("/companies", headers=headers)
        assert list_response.status_code == 200
        assert list_response.json() == [{"id": 1, "name": "Acme Dental"}]

        get_response = client.get("/companies/1", headers=headers)
        assert get_response.status_code == 200
        assert get_response.json() == {"id": 1, "name": "Acme Dental"}

        patch_response = client.patch(
            "/companies/1",
            json={"name": "Acme Health"},
            headers=headers,
        )
        assert patch_response.status_code == 200
        assert patch_response.json() == {"id": 1, "name": "Acme Health"}

        put_response = client.put(
            "/companies/1",
            json={"name": "Acme Services"},
            headers=headers,
        )
        assert put_response.status_code == 200
        assert put_response.json() == {"id": 1, "name": "Acme Services"}

        delete_response = client.delete("/companies/1", headers=headers)
        assert delete_response.status_code == 204
        assert delete_response.content == b""

        missing_response = client.get("/companies/1", headers=headers)
        assert missing_response.status_code == 404
        assert missing_response.json() == {"detail": "Company not found"}


def test_company_routes_require_authentication() -> None:
    with make_client() as client:
        response = client.get("/companies")

    assert response.status_code == 401


def test_company_name_is_required_and_non_blank() -> None:
    with make_client() as client:
        headers = authenticate(client)

        missing_response = client.post("/companies", json={}, headers=headers)
        blank_response = client.post(
            "/companies",
            json={"name": "   "},
            headers=headers,
        )
        null_patch_response = client.patch(
            "/companies/1",
            json={"name": None},
            headers=headers,
        )

    assert missing_response.status_code == 422
    assert blank_response.status_code == 422
    assert null_patch_response.status_code == 422


def test_company_list_supports_pagination() -> None:
    with make_client() as client:
        headers = authenticate(client)
        for name in ("First", "Second", "Third"):
            response = client.post("/companies", json={"name": name}, headers=headers)
            assert response.status_code == 201

        response = client.get("/companies?offset=1&limit=1", headers=headers)

    assert response.status_code == 200
    assert response.json() == [{"id": 2, "name": "Second"}]
