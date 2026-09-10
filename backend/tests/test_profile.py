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
