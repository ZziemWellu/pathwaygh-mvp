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
    return create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )


@pytest.fixture()
def db_session(engine):
    Base.metadata.create_all(engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
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
