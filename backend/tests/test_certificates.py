from models.certificate import Certificate
from models.course import Course, Lesson
from models.progress import LessonProgress
from tests.conftest import register_user


def _seed_two_lesson_course(db_session, slug="cert-course"):
    course = Course(slug=slug, title="Certificate Course", description="d", level="jhs")
    db_session.add(course)
    db_session.flush()
    lesson1 = Lesson(course_id=course.id, slug=f"{slug}-lesson-1", title="Lesson 1", lesson_type="video", order_index=0)
    lesson2 = Lesson(course_id=course.id, slug=f"{slug}-lesson-2", title="Lesson 2", lesson_type="video", order_index=1)
    db_session.add_all([lesson1, lesson2])
    db_session.commit()
    return course, lesson1, lesson2


def _register(client, email):
    data = register_user(client, email=email, country="GH")
    return {"Authorization": f"Bearer {data['token']}"}, data["user"]


def test_completing_all_lessons_issues_exactly_one_certificate(client, db_session):
    headers, user = _register(client, "cert_complete@test.com")
    course, lesson1, lesson2 = _seed_two_lesson_course(db_session)

    first = client.post(f"/api/learn/lessons/{lesson1.slug}/progress", json={"watched": True}, headers=headers)
    assert first.status_code == 200
    assert first.json()["certificate_issued"] is False
    assert db_session.query(Certificate).count() == 0

    second = client.post(f"/api/learn/lessons/{lesson2.slug}/progress", json={"watched": True}, headers=headers)
    assert second.status_code == 200
    assert second.json()["certificate_issued"] is True
    assert second.json()["certificate_code"] is not None
    assert db_session.query(Certificate).count() == 1


def test_remarking_watched_lesson_does_not_duplicate_certificate(client, db_session):
    headers, _ = _register(client, "cert_remark@test.com")
    course, lesson1, lesson2 = _seed_two_lesson_course(db_session, slug="cert-remark-course")
    client.post(f"/api/learn/lessons/{lesson1.slug}/progress", json={"watched": True}, headers=headers)
    client.post(f"/api/learn/lessons/{lesson2.slug}/progress", json={"watched": True}, headers=headers)
    assert db_session.query(Certificate).count() == 1

    again = client.post(f"/api/learn/lessons/{lesson2.slug}/progress", json={"watched": True}, headers=headers)
    assert again.json()["certificate_issued"] is False
    assert db_session.query(Certificate).count() == 1


def test_verify_works_with_no_authorization_header(client, db_session):
    headers, user = _register(client, "cert_verify@test.com")
    course, lesson1, lesson2 = _seed_two_lesson_course(db_session, slug="cert-verify-course")
    client.post(f"/api/learn/lessons/{lesson1.slug}/progress", json={"watched": True}, headers=headers)
    complete = client.post(f"/api/learn/lessons/{lesson2.slug}/progress", json={"watched": True}, headers=headers)
    code = complete.json()["certificate_code"]

    response = client.get(f"/api/certificates/verify/{code}")
    assert response.status_code == 200
    data = response.json()
    assert data["valid"] is True
    assert data["certificate"]["course_title"] == "Certificate Course"
    assert data["certificate"]["recipient_name"] == user["full_name"]
    assert "user_id" not in data["certificate"]
    assert "email" not in data["certificate"]


def test_verify_unknown_code_returns_valid_false_not_404(client):
    response = client.get("/api/certificates/verify/NOTAREALCODE12")
    assert response.status_code == 200
    assert response.json() == {"success": True, "valid": False}


def test_verify_accepts_dash_grouped_code(client, db_session):
    headers, _ = _register(client, "cert_dash@test.com")
    course, lesson1, lesson2 = _seed_two_lesson_course(db_session, slug="cert-dash-course")
    client.post(f"/api/learn/lessons/{lesson1.slug}/progress", json={"watched": True}, headers=headers)
    complete = client.post(f"/api/learn/lessons/{lesson2.slug}/progress", json={"watched": True}, headers=headers)
    # Format as the frontend would display it (dash-grouped), and lowercase
    # it too - verify must normalize both.
    raw = complete.json()["certificate_code"]
    grouped = "-".join(raw[i : i + 4] for i in range(0, len(raw), 4)).lower()

    response = client.get(f"/api/certificates/verify/{grouped}")
    assert response.json()["valid"] is True


def test_retroactive_issuance_via_check_endpoint(client, db_session):
    headers, user = _register(client, "cert_retro@test.com")
    course, lesson1, lesson2 = _seed_two_lesson_course(db_session, slug="cert-retro-course")
    # Simulate pre-feature completion: insert LessonProgress rows directly,
    # bypassing the progress endpoint entirely.
    db_session.add(LessonProgress(user_id=user["id"], lesson_id=lesson1.id, watched=True))
    db_session.add(LessonProgress(user_id=user["id"], lesson_id=lesson2.id, watched=True))
    db_session.commit()
    assert db_session.query(Certificate).count() == 0

    first = client.post(f"/api/certificates/check/{course.slug}", headers=headers)
    assert first.status_code == 200
    assert first.json()["complete"] is True
    assert first.json()["issued"] is True
    code = first.json()["certificate"]["code"]

    second = client.post(f"/api/certificates/check/{course.slug}", headers=headers)
    assert second.json()["issued"] is False
    assert second.json()["certificate"]["code"] == code


def test_check_requires_auth(client, db_session):
    course, _, _ = _seed_two_lesson_course(db_session, slug="cert-noauth-course")
    response = client.post(f"/api/certificates/check/{course.slug}")
    assert response.status_code == 401


def test_zero_lesson_course_never_completes(client, db_session):
    headers, _ = _register(client, "cert_zero@test.com")
    course = Course(slug="cert-zero-course", title="Empty Course", description="d", level="jhs")
    db_session.add(course)
    db_session.commit()

    response = client.post(f"/api/certificates/check/{course.slug}", headers=headers)
    assert response.json()["complete"] is False
    assert response.json()["issued"] is False
    assert db_session.query(Certificate).count() == 0


def test_me_returns_only_callers_own_certificates(client, db_session):
    headers_a, _ = _register(client, "cert_owner_a@test.com")
    headers_b, _ = _register(client, "cert_owner_b@test.com")
    course, lesson1, lesson2 = _seed_two_lesson_course(db_session, slug="cert-owner-course")

    client.post(f"/api/learn/lessons/{lesson1.slug}/progress", json={"watched": True}, headers=headers_a)
    client.post(f"/api/learn/lessons/{lesson2.slug}/progress", json={"watched": True}, headers=headers_a)

    me_a = client.get("/api/certificates/me", headers=headers_a).json()
    assert len(me_a["certificates"]) == 1

    me_b = client.get("/api/certificates/me", headers=headers_b).json()
    assert len(me_b["certificates"]) == 0
