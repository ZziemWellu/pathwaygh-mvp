from models.course import Course, Lesson


def _seed_course(db_session):
    course = Course(slug="test-course", title="Test Course", description="d", level="jhs")
    db_session.add(course)
    db_session.flush()
    lesson = Lesson(course_id=course.id, slug="test-lesson", title="Test Lesson", lesson_type="video", order_index=0)
    db_session.add(lesson)
    db_session.commit()
    return course, lesson


def test_course_listing(client, db_session):
    _seed_course(db_session)
    response = client.get("/api/learn/courses")
    assert response.status_code == 200
    slugs = [c["id"] for c in response.json()]
    assert "test-course" in slugs


def test_enroll_requires_auth(client, db_session):
    _seed_course(db_session)
    response = client.post("/api/learn/courses/test-course/enroll")
    assert response.status_code == 401


def test_enroll_then_course_detail_shows_enrolled(client, db_session, auth_headers):
    _seed_course(db_session)
    headers, _ = auth_headers

    response = client.post("/api/learn/courses/test-course/enroll", headers=headers)
    assert response.status_code == 200

    detail = client.get("/api/learn/courses/test-course", headers=headers)
    assert detail.status_code == 200
    assert detail.json()["enrolled"] is True


def test_lesson_progress_persists(client, db_session, auth_headers):
    _seed_course(db_session)
    headers, _ = auth_headers

    response = client.post("/api/learn/lessons/test-lesson/progress", json={"watched": True}, headers=headers)
    assert response.status_code == 200
    assert response.json()["watched"] is True

    lesson = client.get("/api/learn/lessons/test-lesson", headers=headers)
    assert lesson.json()["watched"] is True
