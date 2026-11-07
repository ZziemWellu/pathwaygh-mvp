import hashlib
import hmac
import json
import logging
import re

import pytest

from core.accounts import issue_username, normalize_username, temporary_password
from models.level_change import LevelChange
from models.school import School
from models.user import User
from modules.licence import service as licence_service
from modules.payment.providers import paystack
from modules.practice import mastery
from tests.conftest import register_user


def signup(client, **overrides):
    body = {
        "username": "ama.pupil",
        "full_name": "Ama Mensah",
        "password": "secret123",
        "country": "GH",
        "level": "primary",
        "grade": "Primary 4",
        "consent_confirmed": True,
        "guardian_phone": "024 123 4567",
    }
    body.update(overrides)
    return client.post("/api/auth/register", json=body)


def auth(token):
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture()
def school_admin(client, db_session):
    data = register_user(client, email="head@test.com", level="shs")
    headers = auth(data["token"])
    assert client.post("/api/school/create", json={"name": "Test School", "country": "GH"}, headers=headers).status_code == 200
    client.patch("/api/school/consent", json={"attested": True}, headers=headers)
    return headers


# --------------------------------------------------------- username accounts

def test_pupil_can_sign_up_with_username_and_parent_phone_only(client):
    response = signup(client)
    assert response.status_code == 200
    user = response.json()["user"]
    assert user["email"] is None
    assert user["username"] == "ama.pupil"
    assert user["grade"] == "Primary 4"


def test_username_or_email_is_required(client):
    response = signup(client, username=None)
    assert response.status_code == 400
    assert "username" in response.json()["detail"]


def test_username_login_ignores_case(client):
    signup(client)
    response = client.post("/api/auth/login", json={"identifier": "AMA.Pupil", "password": "secret123"})
    assert response.status_code == 200


def test_email_login_still_works_with_the_old_field(client):
    signup(client, username=None, email="kofi@test.com", level="jhs", grade="JHS 1")
    assert client.post("/api/auth/login", json={"email": "KOFI@test.com", "password": "secret123"}).status_code == 200


def test_username_cannot_be_used_twice_in_any_case(client):
    signup(client)
    response = signup(client, username="AMA.PUPIL", guardian_phone="0551234567")
    assert response.status_code == 400
    assert "taken" in response.json()["detail"]


@pytest.mark.parametrize("bad", ["ab", "1abc", "has space", "a@b.com", "x" * 31, "kofi-m"])
def test_bad_usernames_are_rejected(client, bad):
    assert signup(client, username=bad).status_code == 400


def test_two_accounts_with_no_email_can_coexist(client):
    assert signup(client).status_code == 200
    assert signup(client, username="kofi.pupil", guardian_phone="0551234567").status_code == 200


def test_class_must_match_level(client):
    response = signup(client, grade="JHS 1")
    assert response.status_code == 400
    assert "class" in response.json()["detail"]


def test_username_account_with_no_guardian_contact_is_rejected(client):
    assert signup(client, guardian_phone=None).status_code == 400


def test_normalize_username():
    assert normalize_username("  Ama.M_2 ") == "ama.m_2"
    with pytest.raises(ValueError):
        normalize_username("a@b")


# ----------------------------------------------- password reset with no email

def test_reset_code_goes_to_the_parents_phone(client, caplog):
    signup(client)
    caplog.clear()
    with caplog.at_level(logging.INFO):
        assert client.post("/api/auth/forgot-password", json={"identifier": "ama.pupil"}).status_code == 200
    message = re.search(r"Message: (.*)", caplog.text).group(1)
    assert "SMS to +233241234567" in caplog.text
    code = re.search(r"code for ama\.pupil: (\d{8})", message).group(1)
    assert len(message) <= 160

    response = client.post("/api/auth/reset-password", json={"identifier": "ama.pupil", "token": code, "new_password": "brandnew123"})
    assert response.status_code == 200
    assert client.post("/api/auth/login", json={"identifier": "ama.pupil", "password": "brandnew123"}).status_code == 200


def test_reset_code_goes_to_the_parents_email_if_no_phone(client, caplog):
    signup(client, guardian_phone=None, guardian_email="parent@test.com")
    caplog.clear()
    with caplog.at_level(logging.INFO):
        client.post("/api/auth/forgot-password", json={"identifier": "ama.pupil"})
    assert "Email to parent@test.com" in caplog.text
    assert "ama.pupil" in caplog.text


def test_forgot_password_response_is_the_same_for_unknown_accounts(client):
    signup(client)
    known = client.post("/api/auth/forgot-password", json={"identifier": "ama.pupil"}).json()
    unknown = client.post("/api/auth/forgot-password", json={"identifier": "nobody.here"}).json()
    assert known == unknown


def test_forgot_password_stays_generic_when_the_sms_cap_is_hit(client, monkeypatch):
    signup(client)
    monkeypatch.setenv("SMS_DAILY_CAP", "1")
    response = client.post("/api/auth/forgot-password", json={"identifier": "ama.pupil"})
    assert response.status_code == 200


def test_platform_sms_cap_stops_a_flood_across_many_numbers(client, monkeypatch):
    monkeypatch.setenv("SMS_DAILY_CAP", "2")
    statuses = [signup(client, username=f"pupil.{i}", guardian_phone=f"024123456{i}").status_code for i in range(3)]
    assert statuses == [200, 200, 429]


# --------------------------------------------------------- school-issued logins

def issue(client, headers, *students):
    return client.post("/api/school/students", json={"students": list(students)}, headers=headers)


def test_school_issues_logins_that_work_and_must_be_changed(client, school_admin):
    response = issue(client, school_admin, {"full_name": "Ama Mensah", "grade": "Primary 3"})
    assert response.status_code == 200
    issued = response.json()["students"][0]
    assert issued["username"] == "ama.m"

    login = client.post("/api/auth/login", json={"identifier": issued["username"], "password": issued["temporary_password"]})
    assert login.status_code == 200
    user = login.json()["user"]
    assert user["must_change_password"] is True
    assert user["level"] == "primary"
    assert user["school_id"] is not None

    changed = client.post(
        "/api/auth/change-password",
        json={"current_password": issued["temporary_password"], "new_password": "mynewpass1"},
        headers=auth(login.json()["token"]),
    )
    assert changed.status_code == 200
    assert changed.json()["user"]["must_change_password"] is False
    # The old token is gone; the new one works.
    assert client.get("/api/auth/me", headers=auth(login.json()["token"])).status_code == 401
    assert client.get("/api/auth/me", headers=auth(changed.json()["token"])).status_code == 200


def test_temporary_password_only_allows_changing_it(client, school_admin):
    issued = issue(client, school_admin, {"full_name": "Ama Mensah", "grade": "JHS 1"}).json()["students"][0]
    token = client.post("/api/auth/login", json={"identifier": issued["username"], "password": issued["temporary_password"]}).json()["token"]
    headers = auth(token)

    assert client.get("/api/auth/me", headers=headers).status_code == 200
    for path in ("/api/profile/me", "/api/dashboard/summary", "/api/learn/enrolled"):
        response = client.get(path, headers=headers)
        assert response.status_code == 403, path
        assert "own password" in response.json()["detail"]

    changed = client.post("/api/auth/change-password", json={"current_password": issued["temporary_password"], "new_password": "mynewpass1"}, headers=headers)
    assert client.get("/api/profile/me", headers=auth(changed.json()["token"])).status_code == 200


def test_issued_usernames_never_collide_and_skip_the_surname(client, school_admin):
    response = issue(
        client,
        school_admin,
        {"full_name": "Ama Mensah", "grade": "JHS 1"},
        {"full_name": "Ama Mills", "grade": "JHS 1"},
        {"full_name": "Ama Mensah", "grade": "JHS 2"},
    )
    assert [s["username"] for s in response.json()["students"]] == ["ama.m", "ama.m2", "ama.m3"]


def test_school_must_confirm_parent_consent_first(client, school_admin):
    client.patch("/api/school/consent", json={"attested": False}, headers=school_admin)
    response = issue(client, school_admin, {"full_name": "Ama", "grade": "JHS 1"})
    assert response.status_code == 400
    assert "consent" in response.json()["detail"]


def test_a_bad_row_issues_nothing(client, school_admin, db_session):
    response = issue(client, school_admin, {"full_name": "Ama", "grade": "JHS 1"}, {"full_name": "Kofi", "grade": "Year 9"})
    assert response.status_code == 400
    assert "Line 2" in response.json()["detail"]
    assert db_session.query(User).filter(User.username.isnot(None)).count() == 0


def test_issuing_respects_the_seat_limit(client, school_admin, db_session, monkeypatch):
    from models.school_licence import SchoolLicence

    db_session.query(SchoolLicence).delete()
    db_session.commit()
    monkeypatch.setattr(licence_service, "FREE_STUDENT_LIMIT", 1)
    response = issue(client, school_admin, {"full_name": "A One", "grade": "JHS 1"}, {"full_name": "B Two", "grade": "JHS 1"})
    assert response.status_code == 403
    assert db_session.query(User).filter(User.username.isnot(None)).count() == 0


def test_student_cannot_issue_logins(client, auth_headers):
    headers, _ = auth_headers
    assert issue(client, headers, {"full_name": "Ama", "grade": "JHS 1"}).status_code == 403


def test_admin_can_reset_an_issued_login_but_not_a_personal_account(client, school_admin, db_session):
    issued = issue(client, school_admin, {"full_name": "Ama Mensah", "grade": "JHS 1"}).json()["students"][0]
    student = db_session.query(User).filter(User.username == issued["username"]).first()
    reset = client.post(f"/api/school/students/{student.id}/reset-password", headers=school_admin)
    assert reset.status_code == 200
    assert client.post("/api/auth/login", json={"identifier": issued["username"], "password": issued["temporary_password"]}).status_code == 401
    assert client.post("/api/auth/login", json={"identifier": issued["username"], "password": reset.json()["temporary_password"]}).status_code == 200

    personal = register_user(client, email="own@test.com")
    db_session.query(User).filter(User.email == "own@test.com").update({User.school_id: student.school_id})
    db_session.commit()
    assert client.post(f"/api/school/students/{personal['user']['id']}/reset-password", headers=school_admin).status_code == 400


def test_temporary_passwords_are_readable_and_unique():
    passwords = {temporary_password() for _ in range(50)}
    assert len(passwords) == 50
    assert all(re.fullmatch(r"[a-z2-9]{4}-[a-z2-9]{4}", p) for p in passwords)


def test_issue_username_handles_accents_and_short_names(db_session):
    assert issue_username(db_session, "Akɔsua Ñuñez").startswith("ak")
    assert issue_username(db_session, "Y") .startswith("pupil")


# ----------------------------------------------------------- level corrections

def test_school_admin_can_correct_a_level_downwards_and_it_is_recorded(client, school_admin, db_session):
    issued = issue(client, school_admin, {"full_name": "Ama Mensah", "grade": "SHS 1"}).json()["students"][0]
    student = db_session.query(User).filter(User.username == issued["username"]).first()

    response = client.patch(f"/api/school/students/{student.id}/level", json={"level": "jhs", "reason": "Picked SHS by mistake"}, headers=school_admin)
    assert response.status_code == 200
    db_session.refresh(student)
    assert student.level == "jhs"
    assert student.grade is None

    record = db_session.query(LevelChange).filter(LevelChange.user_id == student.id).one()
    assert (record.from_level, record.to_level, record.reason) == ("shs", "jhs", "Picked SHS by mistake")
    assert record.changed_by_id is not None


def test_correction_needs_a_reason(client, school_admin, db_session):
    issued = issue(client, school_admin, {"full_name": "Ama", "grade": "SHS 1"}).json()["students"][0]
    student = db_session.query(User).filter(User.username == issued["username"]).first()
    assert client.patch(f"/api/school/students/{student.id}/level", json={"level": "jhs", "reason": ""}, headers=school_admin).status_code == 422


def test_school_admin_cannot_change_another_schools_student(client, school_admin, db_session):
    other = register_user(client, email="other@test.com", level="shs")
    school = School(name="Other", country="GH", join_code="OTHER1", created_by_id=other["user"]["id"])
    db_session.add(school)
    db_session.flush()
    db_session.query(User).filter(User.id == other["user"]["id"]).update({User.school_id: school.id})
    db_session.commit()
    response = client.patch(f"/api/school/students/{other['user']['id']}/level", json={"level": "jhs", "reason": "nope"}, headers=school_admin)
    assert response.status_code == 404


def test_student_with_corrected_level_can_save_profile_again(client, school_admin, db_session):
    issued = issue(client, school_admin, {"full_name": "Ama", "grade": "SHS 1"}).json()["students"][0]
    student = db_session.query(User).filter(User.username == issued["username"]).first()
    client.patch(f"/api/school/students/{student.id}/level", json={"level": "jhs", "reason": "mistake"}, headers=school_admin)
    token = client.post("/api/auth/login", json={"identifier": issued["username"], "password": issued["temporary_password"]}).json()["token"]
    changed = client.post("/api/auth/change-password", json={"current_password": issued["temporary_password"], "new_password": "mynewpass1"}, headers=auth(token))
    assert client.put("/api/profile/me", json={"bio": "hello"}, headers=auth(changed.json()["token"])).status_code == 200


def make_platform_admin(client, db_session):
    data = register_user(client, email="root@test.com", level="shs")
    db_session.query(User).filter(User.email == "root@test.com").update({User.is_admin: True})
    db_session.commit()
    return auth(data["token"])


def test_platform_admin_finds_one_account_and_corrects_it(client, db_session):
    headers = make_platform_admin(client, db_session)
    signup(client, level="jhs", grade="JHS 2")
    found = client.get("/api/admin/students/lookup", params={"identifier": "AMA.PUPIL"}, headers=headers).json()["student"]
    assert found["level"] == "jhs"

    response = client.post("/api/admin/students/level", json={"identifier": "ama.pupil", "level": "primary", "reason": "Parent wrote in"}, headers=headers)
    assert response.json()["student"]["level"] == "primary"
    assert db_session.query(LevelChange).count() == 1


def test_admin_lookup_needs_the_exact_account_and_admin_rights(client, db_session, auth_headers):
    headers, _ = auth_headers
    assert client.get("/api/admin/students/lookup", params={"identifier": "ama"}, headers=headers).status_code == 403
    admin = make_platform_admin(client, db_session)
    signup(client)
    assert client.get("/api/admin/students/lookup", params={"identifier": "ama"}, headers=admin).status_code == 404


# ------------------------------------------------------------- Nigeria + Paystack

def nigerian_school(client):
    data = register_user(client, email="ng@test.com", country="NG", level="shs")
    headers = auth(data["token"])
    client.post("/api/school/create", json={"name": "Lagos School", "country": "NG"}, headers=headers)
    return headers


def test_nigeria_has_a_price_in_naira(client, monkeypatch):
    monkeypatch.delenv("PAYSTACK_SECRET_KEY_NGN", raising=False)
    quote = client.get("/api/payment/quote", headers=nigerian_school(client)).json()
    assert quote["licence"]["can_buy"] is True
    assert {o["currency"] for o in quote["options"]} == {"NGN"}
    term = next(o for o in quote["options"] if o["kind"] == "term")
    assert term["price_per_student_minor"] == 100000


def test_nigeria_cannot_pay_on_ghanas_paystack_key(client, monkeypatch):
    monkeypatch.setenv("PAYSTACK_SECRET_KEY", "sk_test_ghana")
    monkeypatch.delenv("PAYSTACK_SECRET_KEY_NGN", raising=False)
    headers = nigerian_school(client)
    assert client.get("/api/payment/quote", headers=headers).json()["payments_open"] is False
    response = client.post("/api/payment/initialize", json={"plan": "term"}, headers=headers)
    assert response.status_code == 503
    assert "isn't open" in response.json()["detail"]


def test_each_currency_uses_its_own_paystack_key(monkeypatch):
    monkeypatch.setenv("PAYSTACK_SECRET_KEY", "sk_gh")
    monkeypatch.setenv("PAYSTACK_SECRET_KEY_NGN", "sk_ng")
    assert paystack.secret_key_for("GHS") == "sk_gh"
    assert paystack.secret_key_for("NGN") == "sk_ng"
    assert paystack.all_secret_keys() == ["sk_gh", "sk_ng"]


@pytest.mark.parametrize("key", ["sk_gh", "sk_ng"])
def test_webhook_accepts_either_countrys_signature(client, monkeypatch, key):
    monkeypatch.setenv("PAYSTACK_SECRET_KEY", "sk_gh")
    monkeypatch.setenv("PAYSTACK_SECRET_KEY_NGN", "sk_ng")
    body = json.dumps({"event": "transfer.success"}).encode()
    signature = hmac.new(key.encode(), body, hashlib.sha512).hexdigest()
    response = client.post("/api/payment/webhook/paystack", content=body, headers={"x-paystack-signature": signature, "Content-Type": "application/json"})
    assert response.status_code == 200


def test_webhook_rejects_any_other_signature(client, monkeypatch):
    monkeypatch.setenv("PAYSTACK_SECRET_KEY", "sk_gh")
    monkeypatch.setenv("PAYSTACK_SECRET_KEY_NGN", "sk_ng")
    assert client.post("/api/payment/webhook/paystack", content=b"{}", headers={"x-paystack-signature": "f" * 128}).status_code == 401


# ------------------------------------------------------------------ audit fixes

def test_public_subject_route_never_reveals_answers(client):
    text = json.dumps(client.get("/api/practice/subject/mathematics").json())
    assert '"correct"' not in text
    assert '"explanation"' not in text


def test_primary_one_only_gets_questions_for_their_class(client):
    headers = auth(signup(client, grade="Primary 1").json()["token"])
    subjects = client.get("/api/practice/subjects", headers=headers).json()["subjects"]
    assert {s["id"] for s in subjects} == {"mathematics_primary"}
    start = client.post("/api/practice/quiz/start", json={"question_count": 30}, headers=headers).json()
    assert start["questions"]
    assert not any("%" in q["question"] or "/" in q["question"] for q in start["questions"])


def test_primary_six_gets_the_full_range(client):
    headers = auth(signup(client, grade="Primary 6").json()["token"])
    subjects = client.get("/api/practice/subjects", headers=headers).json()["subjects"]
    assert {s["id"] for s in subjects} == {"mathematics_primary", "english_primary", "science_primary"}


def test_drafts_stay_away_from_students_by_default(monkeypatch):
    monkeypatch.delenv("SERVE_DRAFT_QUESTIONS")
    questions = [q for s in mastery.load_questions()["subjects"] for t in s["topics"] for q in t["questions"]]
    assert not any(q.get("review_status") == "pending_review" for q in questions)
    assert any(q.get("review_status") == "computed" for q in questions)
    subject_ids = {s["id"] for s in mastery.load_questions()["subjects"]}
    assert "english_primary" not in subject_ids
    assert "mathematics_primary" in subject_ids


def test_primary_pupil_cannot_post_in_the_community(client):
    headers = auth(signup(client).json()["token"])
    response = client.post("/api/qa/questions", json={"subject_id": "mathematics", "title": "Help please", "body": "What is a fraction?"}, headers=headers)
    assert response.status_code == 403
