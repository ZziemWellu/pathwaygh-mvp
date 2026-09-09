def test_careers_unfiltered_returns_all_countries(client):
    response = client.get("/api/explore/careers")
    assert response.status_code == 200
    careers = response.json()["careers"]
    countries = {c["country"] for c in careers}
    assert countries == {"GH", "NG"}


def test_careers_filters_by_country(client):
    gh = client.get("/api/explore/careers", params={"country": "GH"})
    ng = client.get("/api/explore/careers", params={"country": "NG"})
    unfiltered = client.get("/api/explore/careers")

    assert gh.json()["careers"]
    assert ng.json()["careers"]
    assert all(c["country"] == "GH" for c in gh.json()["careers"])
    assert all(c["country"] == "NG" for c in ng.json()["careers"])
    assert len(gh.json()["careers"]) + len(ng.json()["careers"]) == len(unfiltered.json()["careers"])
