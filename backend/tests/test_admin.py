from models.user import User
from tests.conftest import register_user


def _admin_headers(client, db_session, email="admin@test.com"):
    data = register_user(client, email=email, country="GH")
    user = db_session.query(User).filter(User.email == email).first()
    user.is_admin = True
    db_session.commit()
    return {"Authorization": f"Bearer {data['token']}"}


def test_create_course_defaults_to_gh(client, db_session):
    headers = _admin_headers(client, db_session)
    response = client.post(
        "/api/admin/courses",
        json={"slug": "admin-test-course", "title": "T", "level": "jhs"},
        headers=headers,
    )
    assert response.status_code == 200
    assert response.json()["country"] == "GH"


def test_create_and_fetch_ng_course_round_trips(client, db_session):
    headers = _admin_headers(client, db_session)
    create = client.post(
        "/api/admin/courses",
        json={"slug": "ng-admin-course", "title": "NG Course", "level": "jhs", "country": "NG"},
        headers=headers,
    )
    assert create.status_code == 200
    course_id = create.json()["id"]
    assert create.json()["country"] == "NG"

    fetched = client.get(f"/api/admin/courses/{course_id}", headers=headers)
    assert fetched.json()["country"] == "NG"

    listed = client.get("/api/learn/courses", params={"country": "NG"})
    assert any(c["id"] == "ng-admin-course" for c in listed.json())
