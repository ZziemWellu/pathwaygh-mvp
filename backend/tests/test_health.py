def test_health_reports_database_status(client):
    """/health previously always returned "healthy" even if the database
    was unreachable - it's what Render's healthCheckPath and the
    keep-warm ping both hit, so it needs to reflect real state."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["database"] == "ok"
