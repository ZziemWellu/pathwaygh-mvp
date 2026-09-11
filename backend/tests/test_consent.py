import logging
import re
from datetime import datetime, timedelta

import pytest

from models.user import User
from modules.auth.consent import can_resend, issue_consent_otp, verify_consent_otp
from tests.conftest import register_user


def _register(client, email, country="GH", guardian_email="guardian@test.com"):
    data = register_user(client, email=email, country=country, guardian_email=guardian_email)
    return {"Authorization": f"Bearer {data['token']}"}, data["user"]


def _extract_otp_code(caplog) -> str:
    """The dev-fallback path in core/email.py logs the plaintext code
    (since SMTP isn't configured in tests) - this is the only way to
    recover it, since it's otherwise only ever stored hashed."""
    for record in caplog.records:
        match = re.search(r"Your verification code is: (\d{6})", record.message)
        if match:
            return match.group(1)
    raise AssertionError("No OTP code found in logs")


def test_register_without_consent_field_rejected(client):
    response = client.post(
        "/api/auth/register",
        json={"email": "no_consent@test.com", "full_name": "A", "password": "secret123", "country": "GH", "guardian_email": "g@test.com"},
    )
    assert response.status_code == 422


def test_register_with_consent_false_rejected(client):
    response = client.post(
        "/api/auth/register",
        json={
            "email": "consent_false@test.com",
            "full_name": "A",
            "password": "secret123",
            "country": "GH",
            "consent_confirmed": False,
            "guardian_email": "g@test.com",
        },
    )
    assert response.status_code == 400
    assert "consent" in response.json()["detail"].lower()


def test_register_without_guardian_email_rejected(client):
    response = client.post(
        "/api/auth/register",
        json={
            "email": "no_guardian@test.com",
            "full_name": "A",
            "password": "secret123",
            "country": "GH",
            "consent_confirmed": True,
        },
    )
    assert response.status_code == 422


def test_register_with_guardian_email_matching_own_email_rejected(client):
    response = client.post(
        "/api/auth/register",
        json={
            "email": "same_email@test.com",
            "full_name": "A",
            "password": "secret123",
            "country": "GH",
            "consent_confirmed": True,
            "guardian_email": "same_email@test.com",
        },
    )
    assert response.status_code == 400
    assert "different" in response.json()["detail"].lower()


def test_register_does_not_verify_consent_immediately(client):
    headers, user = _register(client, "consent_pending@test.com", guardian_email="parent@test.com")
    assert user["guardian_email"] == "parent@test.com"
    assert user["consent_verified"] is False

    profile = client.get("/api/profile/me", headers=headers).json()
    assert profile["consent_given_at"] is None
    assert profile["consent_version"] is None
    assert profile["guardian_email"] == "parent@test.com"


def test_verify_consent_with_correct_code_succeeds(client, caplog):
    caplog.set_level(logging.INFO)
    headers, _ = _register(client, "verify_ok@test.com")
    code = _extract_otp_code(caplog)

    response = client.post("/api/auth/verify-consent", json={"code": code}, headers=headers)
    assert response.status_code == 200
    assert response.json()["user"]["consent_verified"] is True

    profile = client.get("/api/profile/me", headers=headers).json()
    assert profile["consent_given_at"] is not None
    assert profile["consent_version"] == "2026-09-v1"


def test_verify_consent_with_wrong_code_increments_attempts_and_fails(client, caplog):
    caplog.set_level(logging.INFO)
    headers, _ = _register(client, "verify_wrong@test.com")
    real_code = _extract_otp_code(caplog)
    wrong_code = "000000" if real_code != "000000" else "111111"

    response = client.post("/api/auth/verify-consent", json={"code": wrong_code}, headers=headers)
    assert response.status_code == 400

    # The real code still works afterward - one wrong guess doesn't burn
    # the correct code, only counts against the attempt limit.
    response = client.post("/api/auth/verify-consent", json={"code": real_code}, headers=headers)
    assert response.status_code == 200


def test_verify_consent_locks_out_after_max_attempts(client, caplog):
    caplog.set_level(logging.INFO)
    headers, _ = _register(client, "verify_lockout@test.com")
    real_code = _extract_otp_code(caplog)
    wrong_code = "000000" if real_code != "000000" else "111111"

    for _ in range(5):
        client.post("/api/auth/verify-consent", json={"code": wrong_code}, headers=headers)

    response = client.post("/api/auth/verify-consent", json={"code": real_code}, headers=headers)
    assert response.status_code == 400
    assert "too many" in response.json()["detail"].lower()


def test_verify_consent_after_already_verified_has_no_pending_code(client, caplog):
    caplog.set_level(logging.INFO)
    headers, _ = _register(client, "verify_twice@test.com")
    code = _extract_otp_code(caplog)
    first = client.post("/api/auth/verify-consent", json={"code": code}, headers=headers)
    assert first.status_code == 200

    # verify_consent_otp clears the OTP fields on success, so re-submitting
    # the same (now-consumed) code hits the "no pending code" branch, not
    # a wrong-code mismatch.
    second = client.post("/api/auth/verify-consent", json={"code": code}, headers=headers)
    assert second.status_code == 400
    assert "no pending" in second.json()["detail"].lower()


def test_resend_consent_before_cooldown_rejected(client):
    headers, _ = _register(client, "resend_cooldown@test.com")
    response = client.post("/api/auth/resend-consent", headers=headers)
    assert response.status_code == 400
    assert "wait" in response.json()["detail"].lower()


def test_resend_consent_issues_new_code_after_cooldown(client, db_session, caplog):
    caplog.set_level(logging.INFO)
    headers, user = _register(client, "resend_ok@test.com")
    old_code = _extract_otp_code(caplog)

    db_user = db_session.query(User).filter(User.id == user["id"]).first()
    db_user.consent_otp_sent_at = datetime.utcnow() - timedelta(seconds=61)
    db_session.commit()

    caplog.clear()
    response = client.post("/api/auth/resend-consent", headers=headers)
    assert response.status_code == 200
    new_code = _extract_otp_code(caplog)
    assert new_code != old_code

    # The old code no longer works - resending issues a fresh one, not an
    # additional valid one.
    verify_old = client.post("/api/auth/verify-consent", json={"code": old_code}, headers=headers)
    assert verify_old.status_code == 400

    verify_new = client.post("/api/auth/verify-consent", json={"code": new_code}, headers=headers)
    assert verify_new.status_code == 200


def test_resend_consent_after_already_verified_rejected(client, caplog):
    caplog.set_level(logging.INFO)
    headers, _ = _register(client, "resend_verified@test.com")
    code = _extract_otp_code(caplog)
    client.post("/api/auth/verify-consent", json={"code": code}, headers=headers)

    response = client.post("/api/auth/resend-consent", headers=headers)
    assert response.status_code == 400
    assert "already verified" in response.json()["detail"].lower()


def test_expired_code_rejected(client, db_session, caplog):
    caplog.set_level(logging.INFO)
    headers, user = _register(client, "expired@test.com")
    code = _extract_otp_code(caplog)

    db_user = db_session.query(User).filter(User.id == user["id"]).first()
    db_user.consent_otp_expires_at = datetime.utcnow() - timedelta(minutes=1)
    db_session.commit()

    response = client.post("/api/auth/verify-consent", json={"code": code}, headers=headers)
    assert response.status_code == 400
    assert "expired" in response.json()["detail"].lower()


def test_profile_update_changing_guardian_email_requires_reverification(client, caplog):
    caplog.set_level(logging.INFO)
    headers, _ = _register(client, "update_guardian@test.com", guardian_email="p1@test.com")
    code = _extract_otp_code(caplog)
    client.post("/api/auth/verify-consent", json={"code": code}, headers=headers)

    before = client.get("/api/profile/me", headers=headers).json()
    assert before["consent_given_at"] is not None

    caplog.clear()
    update = client.put("/api/profile/me", json={"guardian_email": "p2@test.com"}, headers=headers)
    assert update.status_code == 200

    after = client.get("/api/profile/me", headers=headers).json()
    assert after["guardian_email"] == "p2@test.com"
    # This is an intentional behavior change from the old self-attested
    # model: changing the guardian contact always resets verification,
    # since a previously-verified status must never silently carry over
    # to a brand-new, never-confirmed address.
    assert after["consent_given_at"] is None
    assert after["consent_version"] is None

    new_code = _extract_otp_code(caplog)
    verify = client.post("/api/auth/verify-consent", json={"code": new_code}, headers=headers)
    assert verify.status_code == 200


def test_profile_update_guardian_email_matching_own_email_rejected(client):
    headers, user = _register(client, "update_guardian_self@test.com")
    response = client.put("/api/profile/me", json={"guardian_email": user["email"]}, headers=headers)
    assert response.status_code == 400


def test_profile_update_without_changing_guardian_email_leaves_consent_untouched(client, caplog):
    caplog.set_level(logging.INFO)
    headers, _ = _register(client, "update_other_field@test.com", guardian_email="p3@test.com")
    code = _extract_otp_code(caplog)
    client.post("/api/auth/verify-consent", json={"code": code}, headers=headers)
    before = client.get("/api/profile/me", headers=headers).json()

    update = client.put("/api/profile/me", json={"bio": "hello"}, headers=headers)
    assert update.status_code == 200

    after = client.get("/api/profile/me", headers=headers).json()
    assert after["consent_given_at"] == before["consent_given_at"]
    assert after["guardian_email"] == before["guardian_email"]


def _bare_user(guardian_email="guardian@test.com") -> User:
    """A User instance with no DB round trip - issue_consent_otp/
    verify_consent_otp/can_resend only mutate attributes, so they're
    testable directly without a session."""
    return User(email="student@test.com", full_name="Student", password_hash="x", guardian_email=guardian_email)


def test_issue_consent_otp_sets_hash_and_expiry_not_plaintext(caplog):
    caplog.set_level(logging.INFO)
    user = _bare_user()
    issue_consent_otp(user)

    assert user.consent_otp_hash is not None
    code = re.search(r"Your verification code is: (\d{6})", caplog.text).group(1)
    assert code not in user.consent_otp_hash
    assert user.consent_otp_expires_at is not None
    assert user.consent_otp_attempts == 0
    assert user.consent_otp_sent_at is not None


def test_verify_consent_otp_service_accepts_correct_code(caplog):
    caplog.set_level(logging.INFO)
    user = _bare_user()
    issue_consent_otp(user)
    code = re.search(r"Your verification code is: (\d{6})", caplog.text).group(1)

    verify_consent_otp(user, code)

    assert user.consent_given_at is not None
    assert user.consent_otp_hash is None


def test_verify_consent_otp_service_rejects_wrong_code(caplog):
    caplog.set_level(logging.INFO)
    user = _bare_user()
    issue_consent_otp(user)

    with pytest.raises(Exception):
        verify_consent_otp(user, "000000")
    assert user.consent_otp_attempts == 1
    assert user.consent_given_at is None


def test_can_resend_false_immediately_after_issuing(caplog):
    caplog.set_level(logging.INFO)
    user = _bare_user()
    issue_consent_otp(user)
    assert can_resend(user) is False


def test_can_resend_true_when_no_code_ever_issued():
    user = _bare_user()
    assert can_resend(user) is True


def test_school_consent_requires_school_admin(client):
    admin_headers, _ = _register(client, "consent_school_admin@test.com")
    create = client.post("/api/school/create", json={"name": "Consent Test School"}, headers=admin_headers)
    code = create.json()["school"]["join_code"]

    student_headers, _ = _register(client, "consent_school_student@test.com")
    client.post("/api/school/join", json={"join_code": code}, headers=student_headers)

    response = client.patch("/api/school/consent", json={"attested": True}, headers=student_headers)
    assert response.status_code == 403


def test_school_consent_requires_school_link(client):
    headers, _ = _register(client, "consent_unlinked@test.com")
    response = client.patch("/api/school/consent", json={"attested": True}, headers=headers)
    assert response.status_code == 403


def test_school_consent_toggle_persists_and_stamps_audit_fields(client):
    admin_headers, _ = _register(client, "consent_toggle_admin@test.com")
    client.post("/api/school/create", json={"name": "Toggle Test School"}, headers=admin_headers)

    attest = client.patch("/api/school/consent", json={"attested": True}, headers=admin_headers)
    assert attest.status_code == 200
    assert attest.json()["school"]["parent_consent_attested"] is True
    assert attest.json()["school"]["parent_consent_attested_at"] is not None

    # Re-fetch in a separate request to prove it actually persisted, not
    # just echoed back in the PATCH response.
    me = client.get("/api/school/me", headers=admin_headers).json()
    assert me["school"]["parent_consent_attested"] is True

    unattest = client.patch("/api/school/consent", json={"attested": False}, headers=admin_headers)
    assert unattest.json()["school"]["parent_consent_attested"] is False
    assert unattest.json()["school"]["parent_consent_attested_at"] is None


def test_school_out_propagates_consent_field_at_all_call_sites(client):
    admin_headers, admin = _register(client, "consent_propagate_admin@test.com")
    create = client.post("/api/school/create", json={"name": "Propagate Test School"}, headers=admin_headers)
    assert create.json()["school"]["parent_consent_attested"] is False

    client.patch("/api/school/consent", json={"attested": True}, headers=admin_headers)
    code = client.get("/api/school/me", headers=admin_headers).json()["school"]["join_code"]

    me = client.get("/api/school/me", headers=admin_headers).json()
    assert me["school"]["parent_consent_attested"] is True

    student_headers, _ = _register(client, "consent_propagate_student@test.com")
    join = client.post("/api/school/join", json={"join_code": code}, headers=student_headers)
    assert join.json()["school"]["parent_consent_attested"] is True

    dashboard = client.get("/api/school/dashboard", headers=admin_headers).json()
    assert dashboard["school"]["parent_consent_attested"] is True
