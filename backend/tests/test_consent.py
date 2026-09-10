from tests.conftest import register_user


def _register(client, email, country="GH"):
    data = register_user(client, email=email, country=country)
    return {"Authorization": f"Bearer {data['token']}"}, data["user"]


def test_register_without_consent_field_rejected(client):
    response = client.post(
        "/api/auth/register",
        json={"email": "no_consent@test.com", "full_name": "A", "password": "secret123", "country": "GH"},
    )
    assert response.status_code == 422


def test_register_with_consent_false_rejected(client):
    response = client.post(
        "/api/auth/register",
        json={
            "email": "consent_false@test.com",
            "full_name": "A",
            "password": "secret123",
            "country": "GH",
            "consent_confirmed": False,
        },
    )
    assert response.status_code == 400
    assert "consent" in response.json()["detail"].lower()


def test_register_with_consent_true_stores_timestamp_and_version(client):
    headers, _ = _register(client, "consent_true@test.com")
    profile = client.get("/api/profile/me", headers=headers).json()
    assert profile["consent_given_at"] is not None
    assert profile["consent_version"] == "2026-09-v1"
    assert profile["guardian_email"] is None


def test_register_with_guardian_email_round_trips(client):
    response = client.post(
        "/api/auth/register",
        json={
            "email": "with_guardian@test.com",
            "full_name": "A",
            "password": "secret123",
            "country": "GH",
            "consent_confirmed": True,
            "guardian_email": "parent@test.com",
        },
    )
    assert response.status_code == 200
    headers = {"Authorization": f"Bearer {response.json()['token']}"}
    profile = client.get("/api/profile/me", headers=headers).json()
    assert profile["guardian_email"] == "parent@test.com"


def test_profile_update_sets_guardian_email_without_touching_consent(client):
    headers, _ = _register(client, "update_guardian@test.com")
    before = client.get("/api/profile/me", headers=headers).json()

    update = client.put("/api/profile/me", json={"guardian_email": "p2@test.com"}, headers=headers)
    assert update.status_code == 200

    after = client.get("/api/profile/me", headers=headers).json()
    assert after["guardian_email"] == "p2@test.com"
    # Consent fields are read-only display data - a profile update must
    # never be able to overwrite them.
    assert after["consent_given_at"] == before["consent_given_at"]
    assert after["consent_version"] == before["consent_version"]


def test_school_consent_requires_school_admin(client):
    admin_headers, _ = _register(client, "consent_school_admin@test.com")
    create = client.post("/api/school/create", json={"name": "Consent Test School"}, headers=admin_headers)
    code = create.json()["school"]["join_code"]

    student_headers, _ = _register(client, "consent_school_student@test.com")
    client.post("/api/school/join", json={"join_code": code}, headers=student_headers)

    response = client.patch("/api/school/consent", json={"attested": True}, headers=student_headers)
    assert response.status_code == 403


def test_school_consent_requires_school_link(client):
    headers, _ = _register(client, "consent_unlinked@test.com")
    response = client.patch("/api/school/consent", json={"attested": True}, headers=headers)
    assert response.status_code == 403


def test_school_consent_toggle_persists_and_stamps_audit_fields(client):
    admin_headers, _ = _register(client, "consent_toggle_admin@test.com")
    client.post("/api/school/create", json={"name": "Toggle Test School"}, headers=admin_headers)

    attest = client.patch("/api/school/consent", json={"attested": True}, headers=admin_headers)
    assert attest.status_code == 200
    assert attest.json()["school"]["parent_consent_attested"] is True
    assert attest.json()["school"]["parent_consent_attested_at"] is not None

    # Re-fetch in a separate request to prove it actually persisted, not
    # just echoed back in the PATCH response.
    me = client.get("/api/school/me", headers=admin_headers).json()
    assert me["school"]["parent_consent_attested"] is True

    unattest = client.patch("/api/school/consent", json={"attested": False}, headers=admin_headers)
    assert unattest.json()["school"]["parent_consent_attested"] is False
    assert unattest.json()["school"]["parent_consent_attested_at"] is None


def test_school_out_propagates_consent_field_at_all_call_sites(client):
    admin_headers, admin = _register(client, "consent_propagate_admin@test.com")
    create = client.post("/api/school/create", json={"name": "Propagate Test School"}, headers=admin_headers)
    assert create.json()["school"]["parent_consent_attested"] is False

    client.patch("/api/school/consent", json={"attested": True}, headers=admin_headers)
    code = client.get("/api/school/me", headers=admin_headers).json()["school"]["join_code"]

    me = client.get("/api/school/me", headers=admin_headers).json()
    assert me["school"]["parent_consent_attested"] is True

    student_headers, _ = _register(client, "consent_propagate_student@test.com")
    join = client.post("/api/school/join", json={"join_code": code}, headers=student_headers)
    assert join.json()["school"]["parent_consent_attested"] is True

    dashboard = client.get("/api/school/dashboard", headers=admin_headers).json()
    assert dashboard["school"]["parent_consent_attested"] is True
