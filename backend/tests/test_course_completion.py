from models.course import Course, Lesson
from models.gamification import EarnedAchievement


def _course(db, slug="done-course", lessons=2):
    course = Course(slug=slug, title=slug, level="jhs", country="GH")
    db.add(course)
    db.flush()
    for i in range(lessons):
        db.add(Lesson(course_id=course.id, slug=f"{slug}-{i}", title=str(i), lesson_type="text", order_index=i, content="Hi"))
    db.commit()
    return course


def _finish(client, headers, slug):
    return client.post(f"/api/learn/lessons/{slug}/progress", json={"watched": True}, headers=headers).json()


def test_only_the_last_lesson_reports_the_course_as_completed(client, db_session, auth_headers):
    _course(db_session)
    headers, _ = auth_headers
    client.post("/api/learn/courses/done-course/enroll", headers=headers)

    assert _finish(client, headers, "done-course-0")["course_completed"] is False
    assert _finish(client, headers, "done-course-1")["course_completed"] is True
    assert _finish(client, headers, "done-course-1")["course_completed"] is False


def test_progress_no_longer_mentions_certificates(client, db_session, auth_headers):
    _course(db_session)
    headers, _ = auth_headers
    client.post("/api/learn/courses/done-course/enroll", headers=headers)
    assert "certificate" not in str(_finish(client, headers, "done-course-0")).lower()


def test_finishing_a_course_still_earns_the_achievement(client, db_session, auth_headers):
    _course(db_session)
    headers, user = auth_headers
    client.post("/api/learn/courses/done-course/enroll", headers=headers)
    _finish(client, headers, "done-course-0")

    def earned():
        return {a.achievement_id for a in db_session.query(EarnedAchievement).filter(EarnedAchievement.user_id == user["id"])}

    assert "course_complete" not in earned()
    _finish(client, headers, "done-course-1")
    assert "course_complete" in earned()


def test_certificate_routes_are_gone(client, auth_headers):
    headers, _ = auth_headers
    assert client.get("/api/certificates/me", headers=headers).status_code == 404
    assert client.get("/api/certificates/verify/ABC").status_code == 404
