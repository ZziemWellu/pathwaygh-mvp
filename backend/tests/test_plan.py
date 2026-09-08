from models.plan import Plan
from tests.conftest import register_user


def _seed_plan(db_session, slug, target_exam):
    plan = Plan(slug=slug, title=slug, data={"id": slug, "target_exam": target_exam})
    db_session.add(plan)
    db_session.commit()
    return plan


def _headers(client, email, country):
    data = register_user(client, email=email, country=country)
    return {"Authorization": f"Bearer {data['token']}"}


def test_study_plans_requires_auth(client):
    response = client.get("/api/plan/study-plans")
    assert response.status_code == 401


def test_gh_user_sees_wassce_plan(client, db_session):
    _seed_plan(db_session, "wassce-plan", "WASSCE")
    _seed_plan(db_session, "uni-plan", "University Entrance")
    headers = _headers(client, "gh-plan@test.com", "GH")

    response = client.get("/api/plan/study-plans", headers=headers)
    assert response.status_code == 200
    target_exams = {p["target_exam"] for p in response.json()}
    assert "WASSCE" in target_exams
    assert "University Entrance" in target_exams


def test_ng_user_does_not_see_wassce_plan(client, db_session):
    _seed_plan(db_session, "wassce-plan", "WASSCE")
    _seed_plan(db_session, "uni-plan", "University Entrance")
    headers = _headers(client, "ng-plan@test.com", "NG")

    response = client.get("/api/plan/study-plans", headers=headers)
    assert response.status_code == 200
    target_exams = {p["target_exam"] for p in response.json()}
    assert "WASSCE" not in target_exams
    assert "University Entrance" in target_exams
