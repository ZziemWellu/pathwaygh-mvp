def test_careers_default_country_is_gh(client):
    response = client.get("/api/explore/careers")
    assert response.status_code == 200
    careers = response.json()["careers"]
    assert careers
    assert all(c["country"] == "GH" for c in careers)


def test_careers_filters_by_country(client):
    gh = client.get("/api/explore/careers", params={"country": "GH"})
    ng = client.get("/api/explore/careers", params={"country": "NG"})
    unfiltered = client.get("/api/explore/careers")

    assert len(gh.json()["careers"]) == len(unfiltered.json()["careers"])
    assert ng.json()["careers"] == []
