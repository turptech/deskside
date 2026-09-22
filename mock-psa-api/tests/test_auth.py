from collections.abc import Generator
from datetime import UTC, datetime, timedelta

import jwt
from fastapi.testclient import TestClient
from sqlalchemy.pool import StaticPool
from sqlmodel import Session, SQLModel, create_engine

from mock_psa_api.config import Settings, get_settings
from mock_psa_api.database import get_session
from mock_psa_api.main import create_app
from mock_psa_api.models import User
from mock_psa_api.security import ALGORITHM, hash_password, verify_password

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


def test_passwords_are_salted_and_verifiable() -> None:
    first_hash = hash_password("same password")
    second_hash = hash_password("same password")

    assert first_hash != second_hash
    assert verify_password("same password", first_hash)


def test_login_returns_signed_jwt() -> None:
    with make_client() as client:
        response = client.post(
            "/login",
            data={
                "username": "TECH@example.com",
                "password": "correct horse battery staple",
            },
        )

    assert response.status_code == 200
    body = response.json()
    assert body["token_type"] == "bearer"
    claims = jwt.decode(body["access_token"], TEST_SECRET, algorithms=[ALGORITHM])
    assert claims["sub"] == "1"
    assert claims["role"] == "technician"
    assert "exp" in claims


def test_login_openapi_contract_uses_oauth2_form_data() -> None:
    app = create_app(initialize_database=False)

    request_content = app.openapi()["paths"]["/login"]["post"]["requestBody"]["content"]

    assert "application/x-www-form-urlencoded" in request_content
    assert "application/json" not in request_content


def test_login_rejects_invalid_credentials() -> None:
    with make_client() as client:
        response = client.post(
            "/login",
            data={"username": "tech@example.com", "password": "wrong"},
        )

    assert response.status_code == 401
    assert response.json() == {"detail": "Invalid email or password"}


def login_headers(client: TestClient) -> dict[str, str]:
    response = client.post(
        "/login",
        data={
            "username": "tech@example.com",
            "password": "correct horse battery staple",
        },
    )
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


def test_me_returns_the_authenticated_user_without_password_data() -> None:
    with make_client() as client:
        response = client.get("/me", headers=login_headers(client))

    assert response.status_code == 200
    assert response.json() == {
        "id": 1,
        "email": "tech@example.com",
        "role": "technician",
    }
    assert "password" not in response.text


def test_me_requires_a_valid_unexpired_token() -> None:
    with make_client() as client:
        missing = client.get("/me")
        invalid = client.get("/me", headers={"Authorization": "Bearer not-a-token"})
        expired_token = jwt.encode(
            {
                "sub": "1",
                "role": "technician",
                "exp": datetime.now(UTC) - timedelta(minutes=1),
            },
            TEST_SECRET,
            algorithm=ALGORITHM,
        )
        expired = client.get(
            "/me", headers={"Authorization": f"Bearer {expired_token}"}
        )

    assert missing.status_code == 401
    assert invalid.status_code == 401
    assert expired.status_code == 401


def test_me_rejects_a_token_for_a_deleted_user() -> None:
    token = jwt.encode(
        {
            "sub": "999",
            "role": "technician",
            "exp": datetime.now(UTC) + timedelta(minutes=5),
        },
        TEST_SECRET,
        algorithm=ALGORITHM,
    )

    with make_client() as client:
        response = client.get("/me", headers={"Authorization": f"Bearer {token}"})

    assert response.status_code == 401


def test_me_openapi_contract() -> None:
    schema = create_app(initialize_database=False).openapi()
    operation = schema["paths"]["/me"]["get"]
    response_schema = operation["responses"]["200"]["content"]["application/json"][
        "schema"
    ]

    assert response_schema == {"$ref": "#/components/schemas/AuthenticatedUserResponse"}
    assert operation["security"] == [{"OAuth2PasswordBearer": []}]
