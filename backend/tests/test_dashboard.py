"""
Dashboard API Tests
"""

import pytest
from fastapi.testclient import TestClient
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from backend.main import app

client = TestClient(app)


def test_dashboard_endpoint():
    """Test dashboard API returns valid data"""
    response = client.get("/api/dashboard?user_id=guest")
    assert response.status_code == 200
    
    data = response.json()
    assert "greeting" in data
    assert "progress" in data
    assert "recommendations" in data
    assert "activities" in data
    assert "insights" in data


def test_dashboard_progress():
    """Test progress endpoint"""
    response = client.get("/api/dashboard/progress?user_id=guest")
    assert response.status_code == 200
    assert "progress" in response.json()


def test_dashboard_recommendations():
    """Test recommendations endpoint"""
    response = client.get("/api/dashboard/recommendations?user_id=guest")
    assert response.status_code == 200
    assert "recommendations" in response.json()


def test_dashboard_activity():
    """Test activity endpoint"""
    response = client.get("/api/dashboard/activity?user_id=guest")
    assert response.status_code == 200
    assert "activities" in response.json()


def test_dashboard_insights():
    """Test insights endpoint"""
    response = client.get("/api/dashboard/insights?user_id=guest")
    assert response.status_code == 200
    assert "insights" in response.json()


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
