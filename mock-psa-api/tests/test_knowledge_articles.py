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
from mock_psa_api.models import KnowledgeArticle, User
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
    return TestClient(app), engine


def authenticate(client: TestClient) -> dict[str, str]:
    response = client.post(
        "/login",
        data={
            "username": "tech@example.com",
            "password": "correct horse battery staple",
        },
    )
    assert response.status_code == 200
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


def create_company(
    client: TestClient,
    headers: dict[str, str],
    name: str,
) -> int:
    response = client.post("/companies", json={"name": name}, headers=headers)
    assert response.status_code == 201
    return response.json()["id"]


def create_target_entities(
    client: TestClient,
    headers: dict[str, str],
) -> dict[str, int]:
    company_id = create_company(client, headers, "Acme")
    site_response = client.post(
        "/sites",
        json={"company_id": company_id, "name": "Headquarters"},
        headers=headers,
    )
    assert site_response.status_code == 201
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
    asset_response = client.post(
        "/assets",
        json={
            "company_id": company_id,
            "name": "Avery's laptop",
            "asset_type": "laptop",
        },
        headers=headers,
    )
    assert asset_response.status_code == 201
    return {
        "company_id": company_id,
        "site_id": site_response.json()["id"],
        "contact_id": contact_response.json()["id"],
        "asset_id": asset_response.json()["id"],
    }


def create_article(
    client: TestClient,
    headers: dict[str, str],
    title: str,
    **target: int,
) -> dict[str, object]:
    response = client.post(
        "/knowledge-articles",
        json={
            **target,
            "title": title,
            "body": f"Instructions for {title}",
        },
        headers=headers,
    )
    assert response.status_code == 201
    return response.json()


def parse_timestamp(value: str) -> datetime:
    parsed = datetime.fromisoformat(value)
    assert parsed.tzinfo is not None
    return parsed


def test_create_generic_and_targeted_articles_with_filters() -> None:
    client, _ = make_client()
    with client:
        headers = authenticate(client)
        targets = create_target_entities(client, headers)
        generic_response = client.post(
            "/knowledge-articles",
            json={
                "title": "  General troubleshooting  ",
                "body": "  Restart the affected service.  ",
            },
            headers=headers,
        )
        assert generic_response.status_code == 201
        generic = generic_response.json()
        assert generic | {"created_at": None, "updated_at": None} == {
            "id": 1,
            "company_id": None,
            "site_id": None,
            "contact_id": None,
            "asset_id": None,
            "title": "General troubleshooting",
            "body": "Restart the affected service.",
            "created_at": None,
            "updated_at": None,
        }
        assert parse_timestamp(generic["created_at"]) == parse_timestamp(
            generic["updated_at"]
        )

        company_article = create_article(
            client,
            headers,
            "Company VPN",
            company_id=targets["company_id"],
        )
        second_company_article = create_article(
            client,
            headers,
            "Company email",
            company_id=targets["company_id"],
        )
        site_article = create_article(
            client,
            headers,
            "Site network",
            site_id=targets["site_id"],
        )
        contact_article = create_article(
            client,
            headers,
            "Contact preferences",
            contact_id=targets["contact_id"],
        )
        asset_article = create_article(
            client,
            headers,
            "Laptop recovery",
            asset_id=targets["asset_id"],
        )
        all_articles = [
            generic,
            company_article,
            second_company_article,
            site_article,
            contact_article,
            asset_article,
        ]
        assert (
            client.get(
                "/knowledge-articles",
                headers=headers,
            ).json()
            == all_articles
        )
        assert (
            client.get(
                "/knowledge-articles?offset=2&limit=2",
                headers=headers,
            ).json()
            == all_articles[2:4]
        )
        assert client.get(
            f"/knowledge-articles?company_id={targets['company_id']}",
            headers=headers,
        ).json() == [company_article, second_company_article]
        for target_name, article in (
            ("site_id", site_article),
            ("contact_id", contact_article),
            ("asset_id", asset_article),
        ):
            assert client.get(
                f"/knowledge-articles?{target_name}={targets[target_name]}",
                headers=headers,
            ).json() == [article]


def test_retrieve_replace_patch_switch_and_delete_article() -> None:
    client, _ = make_client()
    with client:
        headers = authenticate(client)
        targets = create_target_entities(client, headers)
        created = create_article(
            client,
            headers,
            "Company VPN",
            company_id=targets["company_id"],
        )
        item_path = f"/knowledge-articles/{created['id']}"
        assert client.get(item_path, headers=headers).json() == created

        replacement_response = client.put(
            item_path,
            json={"title": "Generic VPN", "body": "Replacement instructions"},
            headers=headers,
        )
        assert replacement_response.status_code == 200
        replaced = replacement_response.json()
        assert replaced["company_id"] is None
        assert replaced["created_at"] == created["created_at"]
        assert parse_timestamp(replaced["updated_at"]) >= parse_timestamp(
            created["updated_at"]
        )

        site_response = client.patch(
            item_path,
            json={"site_id": targets["site_id"]},
            headers=headers,
        )
        assert site_response.status_code == 200
        assert site_response.json()["site_id"] == targets["site_id"]

        implicit_switch = client.patch(
            item_path,
            json={"asset_id": targets["asset_id"]},
            headers=headers,
        )
        assert implicit_switch.status_code == 409
        assert implicit_switch.json() == {
            "detail": "Knowledge article can reference only one entity"
        }

        explicit_switch = client.patch(
            item_path,
            json={"site_id": None, "asset_id": targets["asset_id"]},
            headers=headers,
        )
        assert explicit_switch.status_code == 200
        switched = explicit_switch.json()
        assert switched["site_id"] is None
        assert switched["asset_id"] == targets["asset_id"]

        clear_response = client.patch(
            item_path,
            json={"asset_id": None, "title": "Generic recovery"},
            headers=headers,
        )
        assert clear_response.status_code == 200
        assert clear_response.json()["asset_id"] is None
        assert clear_response.json()["title"] == "Generic recovery"

        assert client.delete(item_path, headers=headers).status_code == 204
        missing_response = client.get(item_path, headers=headers)
        assert missing_response.status_code == 404
        assert missing_response.json() == {"detail": "Knowledge article not found"}


def test_article_validation_missing_targets_and_database_constraint() -> None:
    client, engine = make_client()
    with client:
        headers = authenticate(client)
        targets = create_target_entities(client, headers)
        invalid_payloads = (
            {"title": "   ", "body": "Body"},
            {"title": "Title", "body": "   "},
            {"body": "Body"},
            {"title": "Title"},
            {"title": "Title", "body": "Body", "created_at": "2026-09-15"},
            {"title": "Title", "body": "Body", "company_id": 0},
        )
        for payload in invalid_payloads:
            assert (
                client.post(
                    "/knowledge-articles",
                    json=payload,
                    headers=headers,
                ).status_code
                == 422
            )

        missing_targets = (
            ("company_id", "Company not found"),
            ("site_id", "Site not found"),
            ("contact_id", "Contact not found"),
            ("asset_id", "Asset not found"),
        )
        for field, detail in missing_targets:
            response = client.post(
                "/knowledge-articles",
                json={field: 999, "title": "Title", "body": "Body"},
                headers=headers,
            )
            assert response.status_code == 404
            assert response.json() == {"detail": detail}

        multiple_targets = client.post(
            "/knowledge-articles",
            json={
                "company_id": targets["company_id"],
                "site_id": targets["site_id"],
                "title": "Invalid",
                "body": "Invalid target combination",
            },
            headers=headers,
        )
        assert multiple_targets.status_code == 409
        assert multiple_targets.json() == {
            "detail": "Knowledge article can reference only one entity"
        }

        article = create_article(client, headers, "Valid")
        item_path = f"/knowledge-articles/{article['id']}"
        replacement_conflict = client.put(
            item_path,
            json={
                "company_id": targets["company_id"],
                "site_id": targets["site_id"],
                "title": "Invalid replacement",
                "body": "Invalid target combination",
            },
            headers=headers,
        )
        assert replacement_conflict.status_code == 409
        missing_patch_target = client.patch(
            item_path,
            json={"asset_id": 999},
            headers=headers,
        )
        assert missing_patch_target.status_code == 404
        assert missing_patch_target.json() == {"detail": "Asset not found"}
        for field in ("title", "body"):
            assert (
                client.patch(
                    item_path,
                    json={field: None},
                    headers=headers,
                ).status_code
                == 422
            )
        assert (
            client.patch(
                item_path,
                json={"updated_at": "2026-09-15T12:00:00Z"},
                headers=headers,
            ).status_code
            == 422
        )

        with Session(engine) as session:
            invalid_article = KnowledgeArticle(
                company_id=targets["company_id"],
                site_id=targets["site_id"],
                title="Invalid direct record",
                body="The database must reject this.",
            )
            session.add(invalid_article)
            with pytest.raises(IntegrityError):
                session.commit()


def test_direct_parent_deletion_is_restricted_until_article_is_cleared() -> None:
    client, _ = make_client()
    with client:
        headers = authenticate(client)

        company_id = create_company(client, headers, "Company target")
        company_article = create_article(
            client,
            headers,
            "Company article",
            company_id=company_id,
        )
        company_delete = client.delete(f"/companies/{company_id}", headers=headers)
        assert company_delete.status_code == 409
        assert company_delete.json() == {
            "detail": "Company cannot be deleted while it has knowledge articles"
        }
        assert (
            client.patch(
                f"/knowledge-articles/{company_article['id']}",
                json={"company_id": None},
                headers=headers,
            ).status_code
            == 200
        )
        assert (
            client.delete(f"/companies/{company_id}", headers=headers).status_code
            == 204
        )

        targets = create_target_entities(client, headers)
        deletion_cases = (
            (
                "site_id",
                "/sites",
                "Site cannot be deleted while it has knowledge articles",
            ),
            (
                "contact_id",
                "/contacts",
                "Contact cannot be deleted while it has knowledge articles",
            ),
            (
                "asset_id",
                "/assets",
                "Asset cannot be deleted while it has knowledge articles",
            ),
        )
        for field, route, detail in deletion_cases:
            article = create_article(
                client,
                headers,
                f"{field} article",
                **{field: targets[field]},
            )
            delete_response = client.delete(
                f"{route}/{targets[field]}",
                headers=headers,
            )
            assert delete_response.status_code == 409
            assert delete_response.json() == {"detail": detail}
            assert (
                client.delete(
                    f"/knowledge-articles/{article['id']}",
                    headers=headers,
                ).status_code
                == 204
            )
            assert (
                client.delete(
                    f"{route}/{targets[field]}",
                    headers=headers,
                ).status_code
                == 204
            )


def test_contextual_article_links_do_not_block_company_moves() -> None:
    client, _ = make_client()
    with client:
        headers = authenticate(client)
        targets = create_target_entities(client, headers)
        destination_company_id = create_company(client, headers, "Destination")
        create_article(
            client,
            headers,
            "Site article",
            site_id=targets["site_id"],
        )
        create_article(
            client,
            headers,
            "Contact article",
            contact_id=targets["contact_id"],
        )
        create_article(
            client,
            headers,
            "Asset article",
            asset_id=targets["asset_id"],
        )

        site_move = client.patch(
            f"/sites/{targets['site_id']}",
            json={"company_id": destination_company_id},
            headers=headers,
        )
        assert site_move.status_code == 200
        contact_move = client.patch(
            f"/contacts/{targets['contact_id']}",
            json={"company_id": destination_company_id},
            headers=headers,
        )
        assert contact_move.status_code == 200
        asset_move = client.patch(
            f"/assets/{targets['asset_id']}",
            json={"company_id": destination_company_id},
            headers=headers,
        )
        assert asset_move.status_code == 200


def test_knowledge_article_authentication_and_openapi_contract() -> None:
    client, _ = make_client()
    with client:
        headers = authenticate(client)
        article = create_article(client, headers, "Authentication test")
        item_path = f"/knowledge-articles/{article['id']}"
        requests = (
            (
                "post",
                "/knowledge-articles",
                {"json": {"title": "Title", "body": "Body"}},
            ),
            ("get", "/knowledge-articles", {}),
            ("get", item_path, {}),
            (
                "put",
                item_path,
                {"json": {"title": "Title", "body": "Body"}},
            ),
            ("patch", item_path, {"json": {"title": "Title"}}),
            ("delete", item_path, {}),
        )
        for method, path, kwargs in requests:
            assert getattr(client, method)(path, **kwargs).status_code == 401

    openapi = client.get("/openapi.json").json()
    collection_path = openapi["paths"]["/knowledge-articles"]
    item_path = openapi["paths"]["/knowledge-articles/{knowledge_article_id}"]
    assert set(collection_path) == {"post", "get"}
    assert set(item_path) == {"get", "put", "patch", "delete"}
    create_schema = openapi["components"]["schemas"]["KnowledgeArticleCreate"]
    assert set(create_schema["required"]) == {"title", "body"}
    assert set(create_schema["properties"]) == {
        "company_id",
        "site_id",
        "contact_id",
        "asset_id",
        "title",
        "body",
    }
    assert {
        "id",
        "company_id",
        "site_id",
        "contact_id",
        "asset_id",
        "title",
        "body",
        "created_at",
        "updated_at",
    } == set(openapi["components"]["schemas"]["KnowledgeArticleRead"]["properties"])
