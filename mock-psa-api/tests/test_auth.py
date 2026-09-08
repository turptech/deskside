from collections.abc import Generator

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
            json={
                "email": "TECH@example.com",
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


def test_login_rejects_invalid_credentials() -> None:
    with make_client() as client:
        response = client.post(
            "/login",
            json={"email": "tech@example.com", "password": "wrong"},
        )

    assert response.status_code == 401
    assert response.json() == {"detail": "Invalid email or password"}
