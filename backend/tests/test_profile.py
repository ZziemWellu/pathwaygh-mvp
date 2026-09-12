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
