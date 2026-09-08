def test_register_returns_token(client):
    response = client.post(
        "/api/auth/register",
        json={"email": "new@test.com", "full_name": "New Student", "password": "secret123", "country": "GH"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["token"]
    assert data["user"]["email"] == "new@test.com"
    assert data["user"]["is_admin"] is False
    assert data["user"]["country"] == "GH"


def test_duplicate_email_rejected(client):
    client.post("/api/auth/register", json={"email": "dup@test.com", "full_name": "A", "password": "secret123", "country": "GH"})
    response = client.post("/api/auth/register", json={"email": "dup@test.com", "full_name": "B", "password": "other123", "country": "GH"})
    assert response.status_code == 400


def test_login_wrong_password_rejected(client):
    client.post("/api/auth/register", json={"email": "user@test.com", "full_name": "A", "password": "secret123", "country": "GH"})
    response = client.post("/api/auth/login", json={"email": "user@test.com", "password": "wrongpass"})
    assert response.status_code == 401


def test_login_success(client):
    client.post("/api/auth/register", json={"email": "user2@test.com", "full_name": "A", "password": "secret123", "country": "GH"})
    response = client.post("/api/auth/login", json={"email": "user2@test.com", "password": "secret123"})
    assert response.status_code == 200
    assert response.json()["token"]


def test_me_requires_auth(client):
    response = client.get("/api/auth/me")
    assert response.status_code == 401


def test_me_returns_authenticated_user(client, auth_headers):
    headers, user = auth_headers
    response = client.get("/api/auth/me", headers=headers)
    assert response.status_code == 200
    assert response.json()["user"]["email"] == user["email"]
