from datetime import datetime, timedelta, timezone

from models.course import Course, Lesson
from models.enrollment import Enrollment
from models.progress import LessonProgress
from models.quiz_attempt import QuizAttempt
from models.user import User
from tests.conftest import register_user


def _admin_headers(client, db_session, email="impact_admin@test.com"):
    data = register_user(client, email=email, country="GH")
    user = db_session.query(User).filter(User.email == email).first()
    user.is_admin = True
    db_session.commit()
    return {"Authorization": f"Bearer {data['token']}"}


def _seed_two_lesson_course(db_session, slug="impact-course"):
    course = Course(slug=slug, title="Impact Course", level="jhs")
    db_session.add(course)
    db_session.flush()
    lesson1 = Lesson(course_id=course.id, slug=f"{slug}-lesson-1", title="Lesson 1", lesson_type="video", order_index=0)
    lesson2 = Lesson(course_id=course.id, slug=f"{slug}-lesson-2", title="Lesson 2", lesson_type="video", order_index=1)
    db_session.add_all([lesson1, lesson2])
    db_session.commit()
    return course, lesson1, lesson2


def _register(client, email, country="GH"):
    data = register_user(client, email=email, country=country)
    return {"Authorization": f"Bearer {data['token']}"}, data["user"]


def test_overview_forbidden_for_non_admin(client):
    headers, _ = _register(client, "not_admin@test.com")
    response = client.get("/api/impact/overview", headers=headers)
    assert response.status_code == 403


def test_trends_forbidden_for_non_admin(client):
    headers, _ = _register(client, "not_admin2@test.com")
    response = client.get("/api/impact/trends", headers=headers)
    assert response.status_code == 403


def test_export_forbidden_for_non_admin(client):
    headers, _ = _register(client, "not_admin3@test.com")
    response = client.get("/api/impact/export", headers=headers)
    assert response.status_code == 403


def test_overview_zero_state(client, db_session):
    admin_headers = _admin_headers(client, db_session)
    response = client.get("/api/impact/overview", headers=admin_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["totals"]["student_count"] == 0
    assert data["totals"]["school_count"] == 0
    assert data["totals"]["average_completion_rate"] == 0
    assert data["totals"]["average_quiz_score"] == 0
    assert data["by_school"] == []
    assert data["by_country"] == []


def test_overview_totals_across_two_schools(client, db_session):
    admin_headers = _admin_headers(client, db_session)
    course, lesson1, lesson2 = _seed_two_lesson_course(db_session, slug="impact-two-school")

    # School A (Ghana): 2 students, both with a quiz attempt and time_spent.
    school_a_admin_headers, _ = _register(client, "impact_school_a_admin@test.com", country="GH")
    create_a = client.post("/api/school/create", json={"name": "Impact School A"}, headers=school_a_admin_headers)
    code_a = create_a.json()["school"]["join_code"]

    student_a1_headers, student_a1 = _register(client, "impact_student_a1@test.com", country="GH")
    client.post("/api/school/join", json={"join_code": code_a}, headers=student_a1_headers)
    client.post(f"/api/learn/courses/{course.slug}/enroll", headers=student_a1_headers)
    client.post(f"/api/learn/lessons/{lesson1.slug}/progress", json={"watched": True}, headers=student_a1_headers)
    db_session.add(QuizAttempt(user_id=student_a1["id"], quiz_id="q1", score=80, total_questions=5, time_spent=60))

    student_a2_headers, student_a2 = _register(client, "impact_student_a2@test.com", country="GH")
    client.post("/api/school/join", json={"join_code": code_a}, headers=student_a2_headers)
    db_session.add(QuizAttempt(user_id=student_a2["id"], quiz_id="q2", score=60, total_questions=5, time_spent=120))
    db_session.commit()

    # School B (Nigeria): 1 student with a higher quiz score.
    school_b_admin_headers, _ = _register(client, "impact_school_b_admin@test.com", country="NG")
    create_b = client.post("/api/school/create", json={"name": "Impact School B"}, headers=school_b_admin_headers)
    code_b = create_b.json()["school"]["join_code"]

    student_b_headers, student_b = _register(client, "impact_student_b@test.com", country="NG")
    client.post("/api/school/join", json={"join_code": code_b}, headers=student_b_headers)
    db_session.add(QuizAttempt(user_id=student_b["id"], quiz_id="q3", score=90, total_questions=5, time_spent=90))
    db_session.commit()

    response = client.get("/api/impact/overview", headers=admin_headers)
    assert response.status_code == 200
    data = response.json()

    assert data["totals"]["school_count"] == 2
    # 1 school admin + 2 students in school A, 1 school admin + 1 student in
    # school B - every non-admin registered user counts toward platform reach.
    assert data["totals"]["student_count"] == 5

    by_school = {row["school_name"]: row for row in data["by_school"]}
    assert by_school["Impact School A"]["student_count"] == 3
    assert by_school["Impact School A"]["average_quiz_score"] == 70  # mean of 80, 60
    assert by_school["Impact School B"]["student_count"] == 2
    assert by_school["Impact School B"]["average_quiz_score"] == 90

    by_country = {row["country"]: row for row in data["by_country"]}
    assert by_country["GH"]["student_count"] == 3
    assert by_country["NG"]["student_count"] == 2


def test_overview_includes_unschooled_students_as_no_school_bucket(client, db_session):
    admin_headers = _admin_headers(client, db_session)
    _register(client, "impact_unschooled@test.com", country="GH")

    response = client.get("/api/impact/overview", headers=admin_headers)
    data = response.json()

    no_school_rows = [row for row in data["by_school"] if row["school_id"] is None]
    assert len(no_school_rows) == 1
    assert no_school_rows[0]["school_name"] == "No school (individual learners)"
    assert no_school_rows[0]["student_count"] == 1
    assert data["totals"]["student_count"] == 1
    assert data["totals"]["school_count"] == 0


def test_overview_average_quiz_time_ignores_null_time_spent(client, db_session):
    admin_headers = _admin_headers(client, db_session)
    _, student = _register(client, "impact_time_student@test.com", country="GH")

    # One legacy attempt with no time_spent (simulating a pre-migration row)
    # and two real ones - the null one must not be treated as 0.
    db_session.add(QuizAttempt(user_id=student["id"], quiz_id="q1", score=50, total_questions=5, time_spent=None))
    db_session.add(QuizAttempt(user_id=student["id"], quiz_id="q2", score=50, total_questions=5, time_spent=60))
    db_session.add(QuizAttempt(user_id=student["id"], quiz_id="q3", score=50, total_questions=5, time_spent=120))
    db_session.commit()

    response = client.get("/api/impact/overview", headers=admin_headers)
    data = response.json()
    assert data["totals"]["average_quiz_time_seconds"] == 90


def test_trends_buckets_by_month_with_zero_fill(client, db_session):
    admin_headers = _admin_headers(client, db_session)
    _, student = _register(client, "impact_trend_student@test.com", country="GH")
    course, lesson1, _ = _seed_two_lesson_course(db_session, slug="impact-trend-course")

    now = datetime.now(timezone.utc).replace(tzinfo=None)
    two_months_ago = (now.replace(day=1) - timedelta(days=32)).replace(day=1)
    one_month_ago = (now.replace(day=1) - timedelta(days=1)).replace(day=1)

    db_session.add(Enrollment(user_id=student["id"], course_id=course.id, enrolled_at=two_months_ago))
    db_session.add(
        LessonProgress(user_id=student["id"], lesson_id=lesson1.id, watched=True, watched_at=one_month_ago)
    )
    db_session.add(QuizAttempt(user_id=student["id"], quiz_id="q1", score=70, total_questions=5, completed_at=one_month_ago))
    db_session.commit()

    response = client.get("/api/impact/trends", headers=admin_headers, params={"months": 3})
    assert response.status_code == 200
    data = response.json()
    assert len(data["series"]) == 3

    two_months_ago_key = f"{two_months_ago.year:04d}-{two_months_ago.month:02d}"
    one_month_ago_key = f"{one_month_ago.year:04d}-{one_month_ago.month:02d}"
    current_month_key = f"{now.year:04d}-{now.month:02d}"

    series_by_month = {row["month"]: row for row in data["series"]}
    assert series_by_month[two_months_ago_key]["enrollments"] == 1
    assert series_by_month[one_month_ago_key]["lessons_completed"] == 1
    assert series_by_month[one_month_ago_key]["quizzes_taken"] == 1
    assert series_by_month[one_month_ago_key]["average_quiz_score"] == 70
    # The current month has no seeded activity - it must still appear as an
    # explicit zero row, not be omitted from the series.
    assert series_by_month[current_month_key]["enrollments"] == 0
    assert series_by_month[current_month_key]["quizzes_taken"] == 0


def test_trends_excludes_rows_older_than_window(client, db_session):
    admin_headers = _admin_headers(client, db_session)
    _, student = _register(client, "impact_old_row_student@test.com", country="GH")
    course, _, _ = _seed_two_lesson_course(db_session, slug="impact-old-course")

    now = datetime.now(timezone.utc).replace(tzinfo=None)
    long_ago = now.replace(year=now.year - 2)
    db_session.add(Enrollment(user_id=student["id"], course_id=course.id, enrolled_at=long_ago))
    db_session.commit()

    response = client.get("/api/impact/trends", headers=admin_headers, params={"months": 3})
    data = response.json()
    assert sum(row["enrollments"] for row in data["series"]) == 0


def test_export_matches_overview_numbers(client, db_session):
    admin_headers = _admin_headers(client, db_session)
    _, student = _register(client, "impact_export_student@test.com", country="GH")
    db_session.add(QuizAttempt(user_id=student["id"], quiz_id="q1", score=80, total_questions=5, time_spent=60))
    db_session.commit()

    overview = client.get("/api/impact/overview", headers=admin_headers).json()
    export = client.get("/api/impact/export", headers=admin_headers)

    assert export.status_code == 200
    assert export.headers["content-type"].startswith("text/csv")
    body = export.content.decode("utf-8")
    totals = overview["totals"]
    assert f"Total Students,{totals['student_count']}" in body
    assert f"Average Quiz Score (%),{totals['average_quiz_score']}" in body
    assert f"Average Time per Quiz (seconds),{totals['average_quiz_time_seconds']}" in body


def test_export_escapes_formula_like_school_names(client, db_session):
    admin_headers = _admin_headers(client, db_session)
    school_admin_headers, _ = _register(client, "impact_formula_admin@test.com", country="GH")
    client.post("/api/school/create", json={"name": "=2+2"}, headers=school_admin_headers)

    export = client.get("/api/impact/export", headers=admin_headers)
    body = export.content.decode("utf-8")
    assert "'=2+2" in body
    # The raw, unescaped value must never appear as its own CSV field (i.e.
    # immediately after a field-delimiting comma or newline) - only the
    # quote-prefixed, neutralized form is acceptable.
    assert ",=2+2" not in body
    assert "\n=2+2" not in body


def test_overview_query_count_stays_flat_as_students_grow(client, db_session, engine):
    from sqlalchemy import event

    admin_headers = _admin_headers(client, db_session, email="impact_scale_admin@test.com")

    def _query_count_for_n_students(n):
        for i in range(n):
            _register(client, f"impact_scale_student_{n}_{i}@test.com")

        queries = []

        def _counter(conn, cursor, statement, parameters, context, executemany):
            queries.append(statement)

        event.listen(engine, "before_cursor_execute", _counter)
        try:
            response = client.get("/api/impact/overview", headers=admin_headers)
            assert response.status_code == 200
        finally:
            event.remove(engine, "before_cursor_execute", _counter)
        return len(queries)

    count_small = _query_count_for_n_students(2)
    count_larger = _query_count_for_n_students(5)
    assert count_larger < count_small + 5
