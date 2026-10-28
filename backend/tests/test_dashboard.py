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


# --- next_step: Home leads with one clear action ------------------------


def _set_grade(client, headers, grade):
    response = client.put("/api/profile/me", json={"grade": grade}, headers=headers)
    assert response.status_code == 200, response.text


def test_next_step_asks_for_level_when_grade_unknown(client, auth_headers):
    headers, _ = auth_headers
    data = client.get("/api/dashboard/summary", headers=headers).json()
    assert data["next_step"] == {"kind": "choose_level"}


def test_next_step_starts_first_course_at_students_level(client, db_session, auth_headers):
    course, lesson1, _ = _seed_two_lesson_course(db_session)  # level "jhs"
    headers, _ = auth_headers
    _set_grade(client, headers, "JHS 2")
    step = client.get("/api/dashboard/summary", headers=headers).json()["next_step"]
    assert step["kind"] == "start"
    assert step["course_id"] == course.slug
    assert step["lesson_id"] == lesson1.slug
    assert step["lesson_number"] == 1
    assert step["lessons_total"] == 2


def test_next_step_does_not_recommend_another_levels_course(client, db_session, auth_headers):
    _seed_two_lesson_course(db_session)  # only a JHS course exists
    headers, _ = auth_headers
    _set_grade(client, headers, "SHS 1")
    step = client.get("/api/dashboard/summary", headers=headers).json()["next_step"]
    assert step == {"kind": "practice", "level": "shs"}


def test_next_step_continues_an_enrolled_course(client, db_session, auth_headers):
    course, lesson1, lesson2 = _seed_two_lesson_course(db_session)
    headers, _ = auth_headers
    client.post(f"/api/learn/courses/{course.slug}/enroll", headers=headers)
    client.post(f"/api/learn/lessons/{lesson1.slug}/progress", json={"watched": True}, headers=headers)
    step = client.get("/api/dashboard/summary", headers=headers).json()["next_step"]
    assert step["kind"] == "continue"
    assert step["lesson_id"] == lesson2.slug
    assert step["lesson_number"] == 2


def test_level_from_grade():
    from modules.dashboard.router import level_from_grade

    assert level_from_grade("JHS 3") == "jhs"
    assert level_from_grade("shs 1") == "shs"
    assert level_from_grade("University") == "university"
    assert level_from_grade("") is None
    assert level_from_grade(None) is None
    assert level_from_grade("Primary 6") is None


# --- week: Monday-Sunday activity reconstructed from the streak ----------


def test_week_is_seven_days_from_monday_with_today_marked(client, auth_headers):
    from datetime import date

    headers, _ = auth_headers
    week = client.get("/api/dashboard/summary", headers=headers).json()["week"]
    assert len(week) == 7
    assert date.fromisoformat(week[0]["date"]).weekday() == 0
    assert sum(1 for d in week if d["is_today"]) == 1
    assert not any(d["active"] for d in week)


def test_week_marks_active_days_after_activity(client, db_session, auth_headers):
    course, lesson1, _ = _seed_two_lesson_course(db_session)
    headers, _ = auth_headers
    client.post(f"/api/learn/courses/{course.slug}/enroll", headers=headers)
    client.post(f"/api/learn/lessons/{lesson1.slug}/progress", json={"watched": True}, headers=headers)
    week = client.get("/api/dashboard/summary", headers=headers).json()["week"]
    today = next(d for d in week if d["is_today"])
    assert today["active"] is True
