from models.course import Course, Lesson


def _seed_course(db_session, **overrides):
    defaults = dict(slug="test-course", title="Test Course", description="d", level="jhs")
    defaults.update(overrides)
    course = Course(**defaults)
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


def test_course_listing_defaults_to_gh_country(client, db_session):
    _seed_course(db_session)
    response = client.get("/api/learn/courses")
    assert response.json()[0]["country"] == "GH"


def test_course_listing_filters_by_country(client, db_session):
    _seed_course(db_session, slug="gh-course", country="GH")
    _seed_course(db_session, slug="ng-course", country="NG")

    gh_only = client.get("/api/learn/courses", params={"country": "GH"})
    ng_only = client.get("/api/learn/courses", params={"country": "NG"})
    unfiltered = client.get("/api/learn/courses")

    assert [c["id"] for c in gh_only.json()] == ["gh-course"]
    assert [c["id"] for c in ng_only.json()] == ["ng-course"]
    assert {c["id"] for c in unfiltered.json()} == {"gh-course", "ng-course"}


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


# --- course list carries progress, length and the next lesson -----------


def test_course_list_reports_progress_duration_and_next_lesson(client, db_session, auth_headers):
    from models.course import Course, Lesson

    course = Course(slug="prog-course", title="Progress Course", level="shs")
    db_session.add(course)
    db_session.flush()
    l1 = Lesson(course_id=course.id, slug="prog-1", title="One", lesson_type="video", order_index=0, duration_minutes=30, is_free_preview=True)
    l2 = Lesson(course_id=course.id, slug="prog-2", title="Two", lesson_type="video", order_index=1, duration_minutes=45)
    db_session.add_all([l1, l2])
    db_session.commit()
    headers, _ = auth_headers

    item = next(c for c in client.get("/api/learn/courses", headers=headers).json() if c["id"] == "prog-course")
    assert item["duration_minutes"] == 75
    assert item["progress"] == 0
    assert item["next_lesson"] == {"id": "prog-1", "title": "One", "is_free_preview": True}

    client.post("/api/learn/courses/prog-course/enroll", headers=headers)
    client.post("/api/learn/lessons/prog-1/progress", json={"watched": True}, headers=headers)
    item = next(c for c in client.get("/api/learn/courses", headers=headers).json() if c["id"] == "prog-course")
    assert item["lessons_completed"] == 1
    assert item["progress"] == 50
    assert item["next_lesson"]["id"] == "prog-2"


def test_course_duration_is_none_when_any_lesson_lacks_one(client, db_session):
    from models.course import Course, Lesson

    course = Course(slug="partial-course", title="Partial", level="jhs")
    db_session.add(course)
    db_session.flush()
    db_session.add_all([
        Lesson(course_id=course.id, slug="p-1", title="A", lesson_type="video", order_index=0, duration_minutes=20),
        Lesson(course_id=course.id, slug="p-2", title="B", lesson_type="video", order_index=1),
    ])
    db_session.commit()
    item = next(c for c in client.get("/api/learn/courses").json() if c["id"] == "partial-course")
    assert item["duration_minutes"] is None
