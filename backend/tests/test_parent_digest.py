import logging
from datetime import datetime, timedelta

from models.course import Course, Lesson
from models.user import User
from modules.parent.digest import build_digest_text, eligible_users_for_digest
from tests.conftest import register_user

DIGEST_SECRET = "test-digest-secret"


def _seed_course_and_progress(client, db_session, headers):
    course = Course(slug="digest-course", title="Digest Course", level="jhs")
    db_session.add(course)
    db_session.flush()
    lesson1 = Lesson(course_id=course.id, slug="digest-lesson-1", title="Lesson 1", lesson_type="video", order_index=0)
    lesson2 = Lesson(course_id=course.id, slug="digest-lesson-2", title="Lesson 2", lesson_type="video", order_index=1)
    db_session.add_all([lesson1, lesson2])
    db_session.commit()

    client.post(f"/api/learn/courses/{course.slug}/enroll", headers=headers)
    client.post(f"/api/learn/lessons/{lesson1.slug}/progress", json={"watched": True}, headers=headers)


def _make_student_below_mastery(client, headers):
    """Submits a wrong answer to a real quiz so BKT drives mastery for that
    topic below 0.5 - drives both a real QuizAttempt and a real weak
    SkillMastery row through the actual practice flow, not a fabricated one."""
    start = client.post("/api/practice/quiz/start", json={"subject_id": "mathematics", "question_count": 1}, headers=headers)
    quiz = start.json()
    client.post(
        "/api/practice/quiz/submit",
        json={"quiz_id": quiz["id"], "answers": {"0": "not-a-real-answer"}, "time_spent": 30},
        headers=headers,
    )


def _register_with_guardian_phone(client, email, guardian_phone="+233241234567", opt_in=True):
    data = register_user(client, email=email)
    headers = {"Authorization": f"Bearer {data['token']}"}
    client.put("/api/profile/me", json={"guardian_phone": guardian_phone, "guardian_whatsapp_opt_in": opt_in}, headers=headers)
    return headers, data["user"]


def test_build_digest_text_none_for_no_activity(client, db_session):
    headers, user = _register_with_guardian_phone(client, "digest_none@test.com")
    db_user = db_session.query(User).filter(User.id == user["id"]).first()
    assert build_digest_text(db_session, db_user) is None


def test_build_digest_text_reflects_real_progress(client, db_session):
    headers, user = _register_with_guardian_phone(client, "digest_progress@test.com")
    _seed_course_and_progress(client, db_session, headers)

    db_user = db_session.query(User).filter(User.id == user["id"]).first()
    text = build_digest_text(db_session, db_user)

    assert text is not None
    assert "Lessons completed: 1/2" in text


def test_build_digest_text_mentions_weak_topic(client, db_session):
    headers, user = _register_with_guardian_phone(client, "digest_weak@test.com")
    _make_student_below_mastery(client, headers)

    db_user = db_session.query(User).filter(User.id == user["id"]).first()
    text = build_digest_text(db_session, db_user)

    assert text is not None
    assert "Quizzes taken: 1" in text
    assert "Could use more practice on" in text


def test_eligible_users_excludes_no_phone(client, db_session):
    data = register_user(client, email="digest_nophone@test.com")
    db_user = db_session.query(User).filter(User.id == data["user"]["id"]).first()
    assert db_user not in eligible_users_for_digest(db_session)


def test_eligible_users_excludes_opted_out(client, db_session):
    headers, user = _register_with_guardian_phone(client, "digest_optout@test.com", opt_in=False)
    db_user = db_session.query(User).filter(User.id == user["id"]).first()
    assert db_user not in eligible_users_for_digest(db_session)


def test_eligible_users_excludes_within_cooldown(client, db_session):
    headers, user = _register_with_guardian_phone(client, "digest_cooldown@test.com")
    db_user = db_session.query(User).filter(User.id == user["id"]).first()
    db_user.last_digest_sent_at = datetime.utcnow() - timedelta(days=1)
    db_session.commit()
    assert db_user not in eligible_users_for_digest(db_session)


def test_eligible_users_includes_after_cooldown(client, db_session):
    headers, user = _register_with_guardian_phone(client, "digest_past_cooldown@test.com")
    db_user = db_session.query(User).filter(User.id == user["id"]).first()
    db_user.last_digest_sent_at = datetime.utcnow() - timedelta(days=7)
    db_session.commit()
    assert db_user in eligible_users_for_digest(db_session)


def test_send_digests_requires_secret_configured(client, monkeypatch):
    monkeypatch.delenv("DIGEST_TRIGGER_SECRET", raising=False)
    response = client.post("/api/parent/send-digests", headers={"X-Digest-Secret": "anything"})
    assert response.status_code == 503


def test_send_digests_rejects_wrong_secret(client, monkeypatch):
    monkeypatch.setenv("DIGEST_TRIGGER_SECRET", DIGEST_SECRET)
    response = client.post("/api/parent/send-digests", headers={"X-Digest-Secret": "wrong"})
    assert response.status_code == 401


def test_send_digests_sends_to_eligible_and_skips_inactive(client, db_session, monkeypatch, caplog):
    caplog.set_level(logging.INFO)
    monkeypatch.setenv("DIGEST_TRIGGER_SECRET", DIGEST_SECRET)

    headers, user = _register_with_guardian_phone(client, "digest_e2e@test.com")
    _seed_course_and_progress(client, db_session, headers)
    # Eligible (phone + opt-in) but with zero activity - should be skipped,
    # not sent and not counted as failed.
    _register_with_guardian_phone(client, "digest_e2e_inactive@test.com")

    response = client.post("/api/parent/send-digests", headers={"X-Digest-Secret": DIGEST_SECRET})
    assert response.status_code == 200
    body = response.json()
    assert body["sent"] == 1
    assert body["skipped"] == 1
    assert body["failed"] == 0
    assert "Lessons completed: 1/2" in caplog.text

    db_user = db_session.query(User).filter(User.id == user["id"]).first()
    assert db_user.last_digest_sent_at is not None


def test_send_digests_respects_cooldown_on_repeat_call(client, db_session, monkeypatch):
    monkeypatch.setenv("DIGEST_TRIGGER_SECRET", DIGEST_SECRET)
    headers, user = _register_with_guardian_phone(client, "digest_repeat@test.com")
    _seed_course_and_progress(client, db_session, headers)

    first = client.post("/api/parent/send-digests", headers={"X-Digest-Secret": DIGEST_SECRET})
    assert first.json()["sent"] == 1

    second = client.post("/api/parent/send-digests", headers={"X-Digest-Secret": DIGEST_SECRET})
    assert second.json()["sent"] == 0
