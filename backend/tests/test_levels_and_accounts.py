import logging
import re

import pytest

from core.levels import can_move_to_level, level_from_grade
from core.phone import mask_phone, normalize_phone
from models.course import Course, Lesson
from models.user import User
from modules.practice_sms import providers as sms_providers
from modules.practice_sms.providers import africas_talking


def signup(client, **overrides):
    body = {
        "email": "pupil@test.com",
        "full_name": "Ama Mensah",
        "password": "secret123",
        "country": "GH",
        "level": "jhs",
        "consent_confirmed": True,
        "guardian_phone": "024 123 4567",
    }
    body.update(overrides)
    return client.post("/api/auth/register", json=body)


def auth(response):
    return {"Authorization": f"Bearer {response.json()['token']}"}


def add_course(db, slug, level, country="GH"):
    course = Course(slug=slug, title=slug, level=level, country=country)
    db.add(course)
    db.flush()
    db.add(Lesson(course_id=course.id, slug=f"{slug}-1", title="One", lesson_type="text", content="Hello"))
    db.commit()
    return course


# ------------------------------------------------------------ sign-up level

def test_signup_requires_a_level(client):
    body = {"email": "a@test.com", "full_name": "A", "password": "secret123", "country": "GH", "consent_confirmed": True, "guardian_email": "g@test.com"}
    assert client.post("/api/auth/register", json=body).status_code == 422


def test_signup_rejects_an_unknown_level(client):
    assert signup(client, level="university").status_code == 422


@pytest.mark.parametrize("level", ["primary", "jhs", "shs"])
def test_signup_stores_the_level(client, level):
    response = signup(client, level=level)
    assert response.status_code == 200
    assert response.json()["user"]["level"] == level


# ------------------------------------------------------- one email, one account

@pytest.mark.parametrize(
    "overrides",
    [
        {"level": "shs"},
        {"country": "NG", "guardian_phone": "0803 123 4567"},
        {"email": "PUPIL@Test.com"},
        {"email": "Pupil@test.com", "level": "primary", "country": "NG", "guardian_phone": "0803 123 4567"},
    ],
)
def test_an_email_cannot_sign_up_again_for_any_level_or_country(client, overrides):
    assert signup(client).status_code == 200
    response = signup(client, **overrides)
    assert response.status_code == 400
    assert "already has an account" in response.json()["detail"]


def test_duplicate_message_does_not_reveal_the_accounts_country_or_level(client):
    signup(client)
    detail = signup(client, level="shs").json()["detail"]
    assert "JHS" not in detail and "Ghana" not in detail


def test_login_and_reset_ignore_email_case(client):
    signup(client, email="MixedCase@test.com")
    login = client.post("/api/auth/login", json={"email": "mixedcase@TEST.com", "password": "secret123"})
    assert login.status_code == 200
    assert login.json()["user"]["email"] == "mixedcase@test.com"


# -------------------------------------------------------------- course access

def test_jhs_student_only_sees_jhs_courses(client, db_session):
    add_course(db_session, "p-maths", "primary")
    add_course(db_session, "j-maths", "jhs")
    add_course(db_session, "s-maths", "shs")
    add_course(db_session, "skills-coding", "skills")
    headers = auth(signup(client))

    slugs = {c["id"] for c in client.get("/api/learn/courses", headers=headers).json()}
    assert slugs == {"j-maths", "skills-coding"}


def test_query_parameters_cannot_widen_a_students_courses(client, db_session):
    add_course(db_session, "s-maths", "shs")
    add_course(db_session, "ng-maths", "jhs", country="NG")
    headers = auth(signup(client))

    assert client.get("/api/learn/courses", params={"level": "shs"}, headers=headers).json() == []
    assert client.get("/api/learn/courses", params={"country": "NG"}, headers=headers).json() == []


def test_student_cannot_open_or_enroll_in_another_levels_course(client, db_session):
    add_course(db_session, "s-maths", "shs")
    headers = auth(signup(client))

    assert client.get("/api/learn/courses/s-maths", headers=headers).status_code == 403
    assert client.post("/api/learn/courses/s-maths/enroll", headers=headers).status_code == 403
    assert client.get("/api/learn/lessons/s-maths-1", headers=headers).status_code == 403


def test_student_cannot_open_another_countrys_course(client, db_session):
    add_course(db_session, "ng-maths", "jhs", country="NG")
    headers = auth(signup(client))
    assert client.get("/api/learn/courses/ng-maths", headers=headers).status_code == 403


def test_enrolled_course_stays_open_after_moving_up_a_level(client, db_session):
    add_course(db_session, "j-maths", "jhs")
    headers = auth(signup(client))
    assert client.post("/api/learn/courses/j-maths/enroll", headers=headers).status_code == 200

    assert client.put("/api/profile/me", json={"grade": "SHS 1"}, headers=headers).status_code == 200
    assert client.get("/api/learn/courses/j-maths", headers=headers).status_code == 200
    assert client.get("/api/learn/courses", headers=headers).json() == []


def test_account_without_a_level_still_sees_its_countrys_courses(client, db_session):
    add_course(db_session, "j-maths", "jhs")
    add_course(db_session, "s-maths", "shs")
    add_course(db_session, "ng-maths", "jhs", country="NG")
    response = signup(client)
    db_session.query(User).update({User.level: None})
    db_session.commit()

    slugs = {c["id"] for c in client.get("/api/learn/courses", headers=auth(response)).json()}
    assert slugs == {"j-maths", "s-maths"}


def test_home_next_step_uses_the_signup_level(client, db_session):
    add_course(db_session, "s-maths", "shs")
    add_course(db_session, "p-maths", "primary")
    headers = auth(signup(client, level="primary"))
    step = client.get("/api/dashboard/summary", headers=headers).json()["next_step"]
    assert step["kind"] == "start"
    assert step["course_id"] == "p-maths"


# --------------------------------------------------------------- level changes

def test_level_moves_up_with_grade_but_not_down(client):
    headers = auth(signup(client))
    assert client.put("/api/profile/me", json={"grade": "SHS 2"}, headers=headers).json()["profile"]["level"] == "shs"

    response = client.put("/api/profile/me", json={"grade": "JHS 3"}, headers=headers)
    assert response.status_code == 400
    assert client.get("/api/profile/me", headers=headers).json()["grade"] == "SHS 2"


def test_country_cannot_be_changed_through_the_profile(client):
    headers = auth(signup(client))
    client.put("/api/profile/me", json={"country": "NG"}, headers=headers)
    assert client.get("/api/auth/me", headers=headers).json()["user"]["country"] == "GH"


def test_level_helpers():
    assert level_from_grade("Primary 4") == "primary"
    assert level_from_grade("University") == "university"
    assert can_move_to_level(None, "primary")
    assert can_move_to_level("primary", "shs")
    assert not can_move_to_level("shs", "jhs")


# ---------------------------------------------------------------- phone numbers

@pytest.mark.parametrize(
    "raw,country,expected",
    [
        ("024 123 4567", "GH", "+233241234567"),
        ("0241234567", "GH", "+233241234567"),
        ("233241234567", "GH", "+233241234567"),
        ("00233241234567", "GH", "+233241234567"),
        ("+233 24-123-4567", "GH", "+233241234567"),
        ("0803 123 4567", "NG", "+2348031234567"),
        ("+220 712 3456", "GM", "+2207123456"),
    ],
)
def test_normalize_phone(raw, country, expected):
    assert normalize_phone(raw, country) == expected


@pytest.mark.parametrize("raw", ["+14155552671", "+2348031234567", "12345", "not a phone", ""])
def test_normalize_phone_rejects_other_countries_and_bad_lengths(raw):
    with pytest.raises(ValueError):
        normalize_phone(raw, "GH")


def test_mask_phone_hides_the_middle():
    assert mask_phone("+233241234567") == "+233 ••• 4567"


# ---------------------------------------------------------- consent by SMS

def test_phone_only_signup_sends_the_consent_code_by_sms(client, caplog):
    with caplog.at_level(logging.INFO):
        response = signup(client)
    assert response.status_code == 200
    assert "SMS to +233241234567" in caplog.text
    user = response.json()["user"]
    assert user["guardian_email"] is None
    assert user["guardian_phone_masked"] == "+233 ••• 4567"
    assert user["consent_verified"] is False


def test_guardian_can_consent_with_the_sms_code(client, caplog):
    with caplog.at_level(logging.INFO):
        response = signup(client)
    code = re.search(r"share this code with them: (\d{6})", caplog.text).group(1)
    verified = client.post("/api/auth/verify-consent", json={"code": code}, headers=auth(response))
    assert verified.status_code == 200
    assert verified.json()["user"]["consent_verified"] is True


def test_consent_sms_fits_one_text_and_only_uses_the_first_name(client, caplog):
    with caplog.at_level(logging.INFO):
        signup(client, full_name="Nana Akosua Serwaa Boatemaa Mensah")
    message = re.search(r"Message: (.*)", caplog.text).group(1)
    assert len(message) <= 160
    assert "Mensah" not in message


def test_consent_code_goes_to_both_contacts_when_both_are_given(client, caplog):
    with caplog.at_level(logging.INFO):
        signup(client, guardian_email="parent@test.com")
    assert "SMS to +233241234567" in caplog.text
    assert "Email to parent@test.com" in caplog.text


def test_signup_needs_a_guardian_phone_or_email(client):
    response = signup(client, guardian_phone="")
    assert response.status_code == 400
    assert "phone number or email" in response.json()["detail"]


def test_signup_rejects_a_guardian_number_from_another_country(client):
    assert signup(client, guardian_phone="+14155552671").status_code == 400


@pytest.mark.parametrize("country,phone", [("SL", "076 123 456"), ("LR", "077 123 4567")])
def test_country_without_sms_must_give_a_guardian_email(client, country, phone):
    response = signup(client, country=country, guardian_phone=phone)
    assert response.status_code == 400
    assert "email" in response.json()["detail"]
    assert signup(client, country=country, guardian_phone=phone, guardian_email="p@test.com").status_code == 200


def test_unconfigured_sms_is_not_treated_as_delivered(client, monkeypatch):
    # Production without Africa's Talking keys: the code must not vanish into
    # a log while the account is told it was sent.
    monkeypatch.delenv("SMS_DEV_LOG")
    monkeypatch.delenv("AFRICAS_TALKING_USERNAME", raising=False)
    monkeypatch.delenv("AFRICAS_TALKING_API_KEY", raising=False)
    assert client.get("/api/auth/consent-channels", params={"country": "GH"}).json()["sms"] is False
    assert signup(client).status_code == 400
    assert signup(client, guardian_email="p@test.com").status_code == 200


def test_consent_channels_reports_real_availability(client, monkeypatch):
    monkeypatch.setenv("AFRICAS_TALKING_USERNAME", "u")
    monkeypatch.setenv("AFRICAS_TALKING_API_KEY", "k")
    assert africas_talking.is_configured()
    assert client.get("/api/auth/consent-channels", params={"country": "GH"}).json()["sms"] is True
    assert client.get("/api/auth/consent-channels", params={"country": "LR"}).json()["sms"] is False


def test_failed_sms_creates_no_account(client, db_session, monkeypatch):
    monkeypatch.setitem(sms_providers.PROVIDERS_BY_COUNTRY, "GH", {"send": lambda **kw: False})
    assert signup(client).status_code == 502
    assert db_session.query(User).count() == 0


def test_consent_sms_is_capped_per_phone_number(client):
    statuses = [signup(client, email=f"child{i}@test.com").status_code for i in range(6)]
    assert statuses == [200, 200, 200, 200, 200, 429]


def test_resend_reaches_a_phone_only_guardian(client, db_session, caplog):
    response = signup(client)
    db_session.query(User).update({User.consent_otp_sent_at: None})
    db_session.commit()
    caplog.clear()
    with caplog.at_level(logging.INFO):
        assert client.post("/api/auth/resend-consent", headers=auth(response)).status_code == 200
    assert "SMS to +233241234567" in caplog.text


def test_changing_the_only_guardian_phone_needs_new_consent(client, caplog):
    with caplog.at_level(logging.INFO):
        response = signup(client)
    code = re.search(r"share this code with them: (\d{6})", caplog.text).group(1)
    headers = auth(response)
    client.post("/api/auth/verify-consent", json={"code": code}, headers=headers)

    client.put("/api/profile/me", json={"guardian_phone": "0551234567"}, headers=headers)
    assert client.get("/api/auth/me", headers=headers).json()["user"]["consent_verified"] is False


def test_changing_digest_phone_keeps_consent_when_an_email_is_verified(client, caplog):
    with caplog.at_level(logging.INFO):
        response = signup(client, guardian_phone="", guardian_email="p@test.com")
    code = re.search(r"verification code is: (\d{6})", caplog.text).group(1)
    headers = auth(response)
    client.post("/api/auth/verify-consent", json={"code": code}, headers=headers)

    client.put("/api/profile/me", json={"guardian_phone": "0551234567"}, headers=headers)
    assert client.get("/api/auth/me", headers=headers).json()["user"]["consent_verified"] is True


def test_resaving_the_guardian_email_in_other_case_keeps_consent(client, caplog):
    with caplog.at_level(logging.INFO):
        response = signup(client, guardian_phone="", guardian_email="p@test.com")
    code = re.search(r"verification code is: (\d{6})", caplog.text).group(1)
    headers = auth(response)
    client.post("/api/auth/verify-consent", json={"code": code}, headers=headers)

    client.put("/api/profile/me", json={"guardian_email": "P@test.com"}, headers=headers)
    assert client.get("/api/auth/me", headers=headers).json()["user"]["consent_verified"] is True
