import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from main import app  # imported first - triggers load_dotenv() before core.database binds its engine
from core.database import Base, get_db
from core.rate_limit import limiter


@pytest.fixture(scope="session")
def engine():
    # TEST_DATABASE_URL runs the suite against a real database - CI sets it
    # to a Postgres service matching production, since SQLite differs (e.g.
    # it returns naive datetimes and skips some constraint checks). Unset,
    # tests use a fast in-memory SQLite.
    url = os.getenv("TEST_DATABASE_URL")
    if url:
        return create_engine(url, pool_pre_ping=True)
    return create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )


def _sqlite_foreign_keys(engine, enabled: bool):
    # SQLite ignores foreign keys unless asked. Enforce them during each test
    # (so a test that would violate one on Postgres fails here too), but not
    # while dropping tables - users and schools reference each other, which
    # makes any drop order violate a key.
    if engine.dialect.name == "sqlite":
        with engine.connect() as conn:
            conn.exec_driver_sql(f"PRAGMA foreign_keys={'ON' if enabled else 'OFF'}")


@pytest.fixture()
def db_session(engine):
    _sqlite_foreign_keys(engine, True)
    Base.metadata.create_all(engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        _sqlite_foreign_keys(engine, False)
        Base.metadata.drop_all(engine)


@pytest.fixture()
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    # The Limiter's in-memory storage is module-level state tied to the
    # single `app` import above - it persists across the whole pytest
    # session, not just within one test. Without resetting it here, call
    # volume accumulated by earlier, unrelated tests would eventually trip
    # rate limits in later tests that aren't testing rate limiting at all.
    limiter.reset()
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def register_user(
    client,
    email="student@test.com",
    password="secret123",
    full_name="Test Student",
    country="GH",
    guardian_email="guardian@test.com",
):
    response = client.post(
        "/api/auth/register",
        json={
            "email": email,
            "full_name": full_name,
            "password": password,
            "country": country,
            "consent_confirmed": True,
            "guardian_email": guardian_email,
        },
    )
    assert response.status_code == 200, response.text
    return response.json()


@pytest.fixture()
def auth_headers(client):
    data = register_user(client)
    return {"Authorization": f"Bearer {data['token']}"}, data["user"]
