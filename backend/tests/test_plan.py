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


def test_sl_lr_gm_users_see_wassce_plan(client, db_session):
    """Sierra Leone, Liberia, and The Gambia all sit WASSCE under WAEC, same
    as Ghana - see WASSCE_COUNTRIES in modules/plan/router.py."""
    _seed_plan(db_session, "wassce-plan", "WASSCE")
    _seed_plan(db_session, "uni-plan", "University Entrance")

    for i, country in enumerate(("SL", "LR", "GM")):
        headers = _headers(client, f"{country.lower()}-plan{i}@test.com", country)
        response = client.get("/api/plan/study-plans", headers=headers)
        assert response.status_code == 200
        target_exams = {p["target_exam"] for p in response.json()}
        assert "WASSCE" in target_exams, f"{country} should see WASSCE plans"
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


def test_create_update_delete_progress_require_auth(client):
    """Previously these had no Depends(get_current_user) at all - anyone
    could create, edit, or delete any plan with no login."""
    assert client.post("/api/plan/study-plans/create", json={"name": "x"}).status_code == 401
    assert client.put("/api/plan/study-plans/some-slug", json={"name": "x"}).status_code == 401
    assert client.delete("/api/plan/study-plans/some-slug").status_code == 401
    assert client.put("/api/plan/study-plans/some-slug/progress", json={"progress": 50}).status_code == 401


def test_created_plan_is_private_to_its_owner(client):
    """create_study_plan previously never set user_id, so every created
    plan was visible to every user - there was no such thing as 'your'
    plan."""
    owner_headers = _headers(client, "plan-owner@test.com", "GH")
    other_headers = _headers(client, "plan-other@test.com", "GH")

    create = client.post(
        "/api/plan/study-plans/create",
        json={"name": "My Private Plan", "goal": "exam preparation"},
        headers=owner_headers,
    )
    assert create.status_code == 200
    plan_id = create.json()["plan"]["id"]

    owner_list = client.get("/api/plan/study-plans", headers=owner_headers).json()
    assert any(p["id"] == plan_id for p in owner_list)

    other_list = client.get("/api/plan/study-plans", headers=other_headers).json()
    assert not any(p["id"] == plan_id for p in other_list)

    other_get = client.get(f"/api/plan/study-plans/{plan_id}", headers=other_headers)
    assert other_get.status_code == 404


def test_cannot_update_or_delete_another_users_plan(client):
    owner_headers = _headers(client, "plan-owner2@test.com", "GH")
    attacker_headers = _headers(client, "plan-attacker@test.com", "GH")

    create = client.post(
        "/api/plan/study-plans/create", json={"name": "Owner's Plan"}, headers=owner_headers
    )
    plan_id = create.json()["plan"]["id"]

    update = client.put(
        f"/api/plan/study-plans/{plan_id}", json={"name": "Hijacked"}, headers=attacker_headers
    )
    assert update.status_code == 403

    progress = client.put(
        f"/api/plan/study-plans/{plan_id}/progress", json={"progress": 100}, headers=attacker_headers
    )
    assert progress.status_code == 403

    delete = client.delete(f"/api/plan/study-plans/{plan_id}", headers=attacker_headers)
    assert delete.status_code == 403

    # the plan must still exist, untouched, for its real owner
    still_there = client.get(f"/api/plan/study-plans/{plan_id}", headers=owner_headers)
    assert still_there.status_code == 200
    assert still_there.json()["name"] == "Owner's Plan"


def test_shared_template_plan_cannot_be_edited_or_deleted_by_a_user(client, db_session):
    """DEFAULT_PLANS-style system templates have user_id=None - no regular
    user may mutate the shared list everyone sees."""
    _seed_plan(db_session, "shared-template", "WASSCE")
    headers = _headers(client, "plan-template-user@test.com", "GH")

    update = client.put(
        "/api/plan/study-plans/shared-template", json={"name": "Hijacked"}, headers=headers
    )
    assert update.status_code == 403

    delete = client.delete("/api/plan/study-plans/shared-template", headers=headers)
    assert delete.status_code == 403
