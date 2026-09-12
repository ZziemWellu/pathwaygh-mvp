def test_profile_defaults_to_english(client, auth_headers):
    headers, _ = auth_headers
    response = client.get("/api/profile/me", headers=headers)
    assert response.status_code == 200
    assert response.json()["language"] == "en"


def test_update_language_round_trips(client, auth_headers):
    headers, _ = auth_headers
    response = client.put("/api/profile/me", json={"language": "tw"}, headers=headers)
    assert response.status_code == 200
    assert response.json()["profile"]["language"] == "tw"

    fetched = client.get("/api/profile/me", headers=headers)
    assert fetched.json()["language"] == "tw"


def test_guardian_phone_and_opt_in_round_trip(client, auth_headers):
    headers, _ = auth_headers
    response = client.put(
        "/api/profile/me",
        json={"guardian_phone": "+233241234567", "guardian_whatsapp_opt_in": True},
        headers=headers,
    )
    assert response.status_code == 200
    assert response.json()["profile"]["guardian_phone"] == "+233241234567"
    assert response.json()["profile"]["guardian_whatsapp_opt_in"] is True

    fetched = client.get("/api/profile/me", headers=headers)
    assert fetched.json()["guardian_phone"] == "+233241234567"
    assert fetched.json()["guardian_whatsapp_opt_in"] is True


def test_guardian_phone_defaults_to_false_opt_in(client, auth_headers):
    headers, _ = auth_headers
    fetched = client.get("/api/profile/me", headers=headers)
    assert fetched.json()["guardian_phone"] is None
    assert fetched.json()["guardian_whatsapp_opt_in"] is False


def test_guardian_phone_rejects_non_e164(client, auth_headers):
    headers, _ = auth_headers
    response = client.put("/api/profile/me", json={"guardian_phone": "0241234567"}, headers=headers)
    assert response.status_code == 422


def test_guardian_phone_change_does_not_touch_email_consent(client, auth_headers):
    headers, _ = auth_headers
    before = client.get("/api/profile/me", headers=headers).json()

    client.put("/api/profile/me", json={"guardian_phone": "+233241234567"}, headers=headers)

    after = client.get("/api/profile/me", headers=headers).json()
    assert after["consent_given_at"] == before["consent_given_at"]
    assert after["guardian_email"] == before["guardian_email"]


def test_school_digest_opt_in_without_valid_phone_rejected(client, auth_headers):
    headers, _ = auth_headers
    response = client.put("/api/profile/me", json={"school_digest_whatsapp_opt_in": True}, headers=headers)
    assert response.status_code == 400
    assert "E.164" in response.json()["detail"]


def test_school_digest_opt_in_with_phone_in_same_request_succeeds(client, auth_headers):
    headers, _ = auth_headers
    response = client.put(
        "/api/profile/me",
        json={"phone": "+233241234567", "school_digest_whatsapp_opt_in": True},
        headers=headers,
    )
    assert response.status_code == 200
    assert response.json()["profile"]["school_digest_whatsapp_opt_in"] is True
    assert response.json()["profile"]["phone"] == "+233241234567"


def test_school_digest_opt_in_with_phone_already_saved_succeeds(client, auth_headers):
    headers, _ = auth_headers
    client.put("/api/profile/me", json={"phone": "+233241234567"}, headers=headers)

    response = client.put("/api/profile/me", json={"school_digest_whatsapp_opt_in": True}, headers=headers)
    assert response.status_code == 200
    assert response.json()["profile"]["school_digest_whatsapp_opt_in"] is True


def test_school_digest_opt_in_with_non_e164_phone_rejected(client, auth_headers):
    headers, _ = auth_headers
    response = client.put(
        "/api/profile/me",
        json={"phone": "0241234567", "school_digest_whatsapp_opt_in": True},
        headers=headers,
    )
    assert response.status_code == 400
