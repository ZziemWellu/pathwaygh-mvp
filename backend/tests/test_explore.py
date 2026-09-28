def test_careers_unfiltered_returns_all_countries(client):
    response = client.get("/api/explore/careers")
    assert response.status_code == 200
    careers = response.json()["careers"]
    countries = {c["country"] for c in careers}
    assert countries == {"GH", "NG", "SL", "LR", "GM"}


def test_careers_filters_by_country(client):
    per_country = {
        country: client.get("/api/explore/careers", params={"country": country})
        for country in ("GH", "NG", "SL", "LR", "GM")
    }
    unfiltered = client.get("/api/explore/careers")

    total = 0
    for country, response in per_country.items():
        careers = response.json()["careers"]
        assert careers, f"{country} should have at least one career"
        assert all(c["country"] == country for c in careers)
        total += len(careers)

    assert total == len(unfiltered.json()["careers"])
