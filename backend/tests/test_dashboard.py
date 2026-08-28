from models.course import Course, Lesson


def _seed_two_lesson_course(db_session):
    course = Course(slug="dash-course", title="Dashboard Course", level="jhs")
    db_session.add(course)
    db_session.flush()
    lesson1 = Lesson(course_id=course.id, slug="dash-lesson-1", title="Lesson 1", lesson_type="video", order_index=0)
    lesson2 = Lesson(course_id=course.id, slug="dash-lesson-2", title="Lesson 2", lesson_type="video", order_index=1)
    db_session.add_all([lesson1, lesson2])
    db_session.commit()
    return course, lesson1, lesson2


def test_summary_requires_auth(client):
    response = client.get("/api/dashboard/summary")
    assert response.status_code == 401


def test_summary_reflects_no_enrollment(client, auth_headers):
    headers, _ = auth_headers
    response = client.get("/api/dashboard/summary", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["overview"]["courses_enrolled"] == 0
    assert data["continue_learning"] is None


def test_summary_reflects_real_progress(client, db_session, auth_headers):
    course, lesson1, lesson2 = _seed_two_lesson_course(db_session)
    headers, _ = auth_headers

    client.post(f"/api/learn/courses/{course.slug}/enroll", headers=headers)
    client.post(f"/api/learn/lessons/{lesson1.slug}/progress", json={"watched": True}, headers=headers)

    response = client.get("/api/dashboard/summary", headers=headers)
    data = response.json()

    assert data["overview"]["courses_enrolled"] == 1
    assert data["overview"]["lessons_completed"] == 1
    assert data["overview"]["lessons_total"] == 2
    assert data["current_courses"][0]["progress"] == 50
    # The next unwatched lesson should be lesson2
    assert data["continue_learning"]["lesson_id"] == lesson2.slug
