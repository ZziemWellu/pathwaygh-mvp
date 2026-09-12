import logging
from datetime import datetime, timedelta

from models.course import Course, Lesson
from models.user import User
from modules.school.digest import build_school_digest_text, eligible_admins_for_digest
from tests.conftest import register_user

DIGEST_SECRET = "test-school-digest-secret"


def _register(client, email):
    data = register_user(client, email=email)
    return {"Authorization": f"Bearer {data['token']}"}, data["user"]


def _create_school_with_admin(client, email="school_digest_admin@test.com", phone="+233241234567", opt_in=True):
    headers, admin = _register(client, email)
    client.post("/api/school/create", json={"name": "Digest Test School"}, headers=headers)
    client.put("/api/profile/me", json={"phone": phone, "school_digest_whatsapp_opt_in": opt_in}, headers=headers)
    return headers, admin


def _seed_student_with_progress(client, db_session, admin_headers, email="school_digest_student@test.com"):
    headers, student = _register(client, email)
    join = admin_headers  # reuse admin's headers to fetch join code
    school = client.get("/api/school/me", headers=join).json()["school"]
    client.post("/api/school/join", json={"join_code": school["join_code"]}, headers=headers)

    course = Course(slug="school-digest-course", title="Digest Course", level="jhs")
    db_session.add(course)
    db_session.flush()
    lesson1 = Lesson(course_id=course.id, slug="school-digest-lesson-1", title="Lesson 1", lesson_type="video", order_index=0)
    lesson2 = Lesson(course_id=course.id, slug="school-digest-lesson-2", title="Lesson 2", lesson_type="video", order_index=1)
    db_session.add_all([lesson1, lesson2])
    db_session.commit()

    client.post(f"/api/learn/courses/{course.slug}/enroll", headers=headers)
    client.post(f"/api/learn/lessons/{lesson1.slug}/progress", json={"watched": True}, headers=headers)
    return headers, student


def test_build_school_digest_text_none_for_no_students(client, db_session):
    headers, admin = _create_school_with_admin(client)
    db_admin = db_session.query(User).filter(User.id == admin["id"]).first()
    assert build_school_digest_text(db_session, db_admin) is None


def test_build_school_digest_text_reflects_real_progress(client, db_session):
    admin_headers, admin = _create_school_with_admin(client, email="school_digest_admin2@test.com")
    _seed_student_with_progress(client, db_session, admin_headers, email="school_digest_student2@test.com")

    db_admin = db_session.query(User).filter(User.id == admin["id"]).first()
    text = build_school_digest_text(db_session, db_admin)

    assert text is not None
    assert "Students: 1" in text  # the joined student, not the admin
    assert "Average lesson completion: 50%" in text


def test_eligible_admins_excludes_non_admin(client, db_session):
    # opt_in=True and a valid phone, but never became a school admin (no
    # /api/school/create call) - isolates this exclusion from the
    # separate opt-in/phone checks covered by other tests.
    headers, user = _register(client, "school_digest_notadmin@test.com")
    client.put("/api/profile/me", json={"phone": "+233241234567", "school_digest_whatsapp_opt_in": True}, headers=headers)
    db_user = db_session.query(User).filter(User.id == user["id"]).first()
    assert db_user not in eligible_admins_for_digest(db_session)


def test_eligible_admins_excludes_opted_out(client, db_session):
    headers, admin = _create_school_with_admin(client, email="school_digest_optout@test.com", opt_in=False)
    db_admin = db_session.query(User).filter(User.id == admin["id"]).first()
    assert db_admin not in eligible_admins_for_digest(db_session)


def test_eligible_admins_excludes_within_cooldown(client, db_session):
    headers, admin = _create_school_with_admin(client, email="school_digest_cooldown@test.com")
    db_admin = db_session.query(User).filter(User.id == admin["id"]).first()
    db_admin.last_school_digest_sent_at = datetime.utcnow() - timedelta(days=1)
    db_session.commit()
    assert db_admin not in eligible_admins_for_digest(db_session)


def test_eligible_admins_includes_after_cooldown(client, db_session):
    headers, admin = _create_school_with_admin(client, email="school_digest_past_cooldown@test.com")
    db_admin = db_session.query(User).filter(User.id == admin["id"]).first()
    db_admin.last_school_digest_sent_at = datetime.utcnow() - timedelta(days=7)
    db_session.commit()
    assert db_admin in eligible_admins_for_digest(db_session)


def test_send_school_digests_requires_secret_configured(client, monkeypatch):
    monkeypatch.delenv("DIGEST_TRIGGER_SECRET", raising=False)
    response = client.post("/api/school/send-digests", headers={"X-Digest-Secret": "anything"})
    assert response.status_code == 503


def test_send_school_digests_rejects_wrong_secret(client, monkeypatch):
    monkeypatch.setenv("DIGEST_TRIGGER_SECRET", DIGEST_SECRET)
    response = client.post("/api/school/send-digests", headers={"X-Digest-Secret": "wrong"})
    assert response.status_code == 401


def test_send_school_digests_sends_to_eligible_and_skips_empty_school(client, db_session, monkeypatch, caplog):
    caplog.set_level(logging.INFO)
    monkeypatch.setenv("DIGEST_TRIGGER_SECRET", DIGEST_SECRET)

    admin_headers, admin = _create_school_with_admin(client, email="school_digest_e2e@test.com")
    _seed_student_with_progress(client, db_session, admin_headers, email="school_digest_e2e_student@test.com")

    # Eligible (opted-in, phone set) but a school with only the admin - no
    # students - should be skipped, not sent and not counted as failed.
    _create_school_with_admin(client, email="school_digest_e2e_empty@test.com")

    response = client.post("/api/school/send-digests", headers={"X-Digest-Secret": DIGEST_SECRET})
    assert response.status_code == 200
    body = response.json()
    assert body["sent"] == 1
    assert body["skipped"] == 1
    assert body["failed"] == 0
    assert "Average lesson completion" in caplog.text

    db_admin = db_session.query(User).filter(User.id == admin["id"]).first()
    assert db_admin.last_school_digest_sent_at is not None


def test_send_school_digests_respects_cooldown_on_repeat_call(client, db_session, monkeypatch):
    monkeypatch.setenv("DIGEST_TRIGGER_SECRET", DIGEST_SECRET)
    admin_headers, admin = _create_school_with_admin(client, email="school_digest_repeat@test.com")
    _seed_student_with_progress(client, db_session, admin_headers, email="school_digest_repeat_student@test.com")

    first = client.post("/api/school/send-digests", headers={"X-Digest-Secret": DIGEST_SECRET})
    assert first.json()["sent"] == 1

    second = client.post("/api/school/send-digests", headers={"X-Digest-Secret": DIGEST_SECRET})
    assert second.json()["sent"] == 0
