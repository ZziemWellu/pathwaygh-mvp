COUNTRIES = ("GH", "NG", "SL", "LR", "GM")


def test_careers_unfiltered_returns_every_career(client):
    response = client.get("/api/explore/careers")
    assert response.status_code == 200
    careers = response.json()["careers"]
    countries = set()
    for c in careers:
        countries.update(c.get("countries") or [c["country"]])
    assert countries == set(COUNTRIES)


def test_careers_filters_by_country(client):
    for country in COUNTRIES:
        careers = client.get("/api/explore/careers", params={"country": country}).json()["careers"]
        assert careers, f"{country} should have at least one career"
        assert all(country in (c.get("countries") or [c["country"]]) for c in careers)


def test_careers_shared_across_countries_appear_in_each(client):
    unfiltered = client.get("/api/explore/careers").json()["careers"]
    shared = {c["id"] for c in unfiltered if set(c.get("countries", [])) == set(COUNTRIES)}
    assert shared
    for country in COUNTRIES:
        ids = {c["id"] for c in client.get("/api/explore/careers", params={"country": country}).json()["careers"]}
        assert shared <= ids


def test_universities_filter_by_country(client):
    ghana = client.get("/api/explore/universities", params={"country": "GH"}).json()["universities"]
    assert len(ghana) >= 250
    assert all(u["country"] == "GH" for u in ghana)
    for country in ("NG", "SL", "LR", "GM"):
        unis = client.get("/api/explore/universities", params={"country": country}).json()["universities"]
        assert unis and all(u["country"] == country for u in unis)


def test_career_and_university_lookup_by_id(client):
    assert client.get("/api/explore/career/medical_doctor").json()["career"]["title"] == "Medical Doctor"
    assert client.get("/api/explore/university/knust").json()["university"]["name"].startswith("Kwame Nkrumah")
    assert client.get("/api/explore/career/not-a-career").status_code == 404
