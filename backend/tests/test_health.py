def test_health_reports_database_status(client):
    """/health previously always returned "healthy" even if the database
    was unreachable - it's what Render's healthCheckPath and the
    keep-warm ping both hit, so it needs to reflect real state."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["database"] == "ok"


def test_livez_is_alive_without_touching_the_database(client, monkeypatch):
    """Render's healthCheckPath polls /livez every few seconds. If it
    queried the database, Neon could never scale to zero - so it must
    answer even when the database is unreachable."""
    import core.database

    def _no_db(*args, **kwargs):
        raise AssertionError("/livez must not open a database session")

    monkeypatch.setattr(core.database, "SessionLocal", _no_db)
    response = client.get("/livez")
    assert response.status_code == 200
    assert response.json() == {"status": "alive"}


def test_health_still_reports_database_outage(client, monkeypatch):
    """The DB check moved off Render's frequent poll, not away entirely:
    /health (used by monitor-health every 15 min) must still fail loudly."""
    import core.database

    def _db_down(*args, **kwargs):
        raise RuntimeError("database unreachable")

    monkeypatch.setattr(core.database, "SessionLocal", _db_down)
    response = client.get("/health")
    assert response.status_code == 503
    assert response.json()["database"] == "unreachable"
