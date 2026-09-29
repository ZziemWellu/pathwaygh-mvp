from models.user import User
from tests.conftest import register_user


def test_forgot_password_for_unknown_email_still_returns_success(client):
    """Must not reveal whether an email is registered."""
    response = client.post("/api/auth/forgot-password", json={"email": "nobody@test.com"})
    assert response.status_code == 200
    assert response.json()["success"] is True


def test_forgot_password_issues_a_working_reset_token(client, db_session):
    register_user(client, email="reset-me@test.com", password="original123")

    forgot = client.post("/api/auth/forgot-password", json={"email": "reset-me@test.com"})
    assert forgot.status_code == 200

    user = db_session.query(User).filter(User.email == "reset-me@test.com").first()
    db_session.refresh(user)
    assert user.password_reset_token_hash is not None
    assert user.password_reset_expires_at is not None


def test_reset_password_with_wrong_token_fails(client):
    register_user(client, email="reset-wrong@test.com", password="original123")
    client.post("/api/auth/forgot-password", json={"email": "reset-wrong@test.com"})

    response = client.post(
        "/api/auth/reset-password",
        json={"email": "reset-wrong@test.com", "token": "not-the-real-token", "new_password": "newpass123"},
    )
    assert response.status_code == 400


def test_reset_password_without_a_pending_request_fails(client):
    register_user(client, email="reset-none@test.com", password="original123")

    response = client.post(
        "/api/auth/reset-password",
        json={"email": "reset-none@test.com", "token": "anything", "new_password": "newpass123"},
    )
    assert response.status_code == 400


def test_reset_password_end_to_end_allows_login_with_new_password(client, monkeypatch):
    register_user(client, email="reset-e2e@test.com", password="original123")

    # Capture the real token the way the user would receive it by email,
    # instead of reimplementing hash verification in the test.
    import secrets as secrets_module

    captured = {}
    real_token_urlsafe = secrets_module.token_urlsafe

    def capture_token(n):
        token = real_token_urlsafe(n)
        captured["token"] = token
        return token

    monkeypatch.setattr(secrets_module, "token_urlsafe", capture_token)
    forgot = client.post("/api/auth/forgot-password", json={"email": "reset-e2e@test.com"})
    monkeypatch.setattr(secrets_module, "token_urlsafe", real_token_urlsafe)

    assert forgot.status_code == 200
    assert "token" in captured

    reset = client.post(
        "/api/auth/reset-password",
        json={"email": "reset-e2e@test.com", "token": captured["token"], "new_password": "brandnewpass123"},
    )
    assert reset.status_code == 200

    old_login = client.post("/api/auth/login", json={"email": "reset-e2e@test.com", "password": "original123"})
    assert old_login.status_code == 401

    new_login = client.post(
        "/api/auth/login", json={"email": "reset-e2e@test.com", "password": "brandnewpass123"}
    )
    assert new_login.status_code == 200


def test_reset_token_cannot_be_reused(client, monkeypatch):
    import secrets as secrets_module

    captured = {}
    real_token_urlsafe = secrets_module.token_urlsafe

    def capture_token(n):
        token = real_token_urlsafe(n)
        captured["token"] = token
        return token

    monkeypatch.setattr(secrets_module, "token_urlsafe", capture_token)

    register_user(client, email="reset-reuse@test.com", password="original123")
    client.post("/api/auth/forgot-password", json={"email": "reset-reuse@test.com"})
    monkeypatch.setattr(secrets_module, "token_urlsafe", real_token_urlsafe)

    first = client.post(
        "/api/auth/reset-password",
        json={"email": "reset-reuse@test.com", "token": captured["token"], "new_password": "firstnewpass123"},
    )
    assert first.status_code == 200

    second = client.post(
        "/api/auth/reset-password",
        json={"email": "reset-reuse@test.com", "token": captured["token"], "new_password": "secondnewpass123"},
    )
    assert second.status_code == 400
