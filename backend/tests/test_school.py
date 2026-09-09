from models.course import Course, Lesson
from models.quiz_attempt import QuizAttempt
from tests.conftest import register_user


def _seed_two_lesson_course(db_session, slug="school-course"):
    course = Course(slug=slug, title="School Course", level="jhs")
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


def test_create_requires_auth(client):
    response = client.post("/api/school/create", json={"name": "Test School"})
    assert response.status_code == 401


def test_create_school_makes_creator_admin(client):
    headers, _ = _register(client, "creator@test.com")
    response = client.post("/api/school/create", json={"name": "Test School"}, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["school"]["name"] == "Test School"
    code = data["school"]["join_code"]
    assert len(code) == 6
    assert code.isupper()

    me = client.get("/api/school/me", headers=headers).json()
    assert me["is_school_admin"] is True
    assert me["school"]["join_code"] == code


def test_cannot_create_twice(client):
    headers, _ = _register(client, "double_create@test.com")
    client.post("/api/school/create", json={"name": "First"}, headers=headers)
    response = client.post("/api/school/create", json={"name": "Second"}, headers=headers)
    assert response.status_code == 400


def test_join_with_valid_code(client):
    admin_headers, _ = _register(client, "admin1@test.com")
    create = client.post("/api/school/create", json={"name": "Joinable School"}, headers=admin_headers)
    code = create.json()["school"]["join_code"]

    student_headers, _ = _register(client, "student1@test.com")
    join = client.post("/api/school/join", json={"join_code": code}, headers=student_headers)
    assert join.status_code == 200

    me = client.get("/api/school/me", headers=student_headers).json()
    assert me["school"]["join_code"] == code
    assert me["is_school_admin"] is False


def test_join_with_invalid_code(client):
    headers, _ = _register(client, "student2@test.com")
    response = client.post("/api/school/join", json={"join_code": "ZZZZZZ"}, headers=headers)
    assert response.status_code == 404


def test_cannot_join_twice(client):
    admin_headers, _ = _register(client, "admin2@test.com")
    create = client.post("/api/school/create", json={"name": "School B"}, headers=admin_headers)
    code = create.json()["school"]["join_code"]

    student_headers, _ = _register(client, "student3@test.com")
    client.post("/api/school/join", json={"join_code": code}, headers=student_headers)
    second_join = client.post("/api/school/join", json={"join_code": code}, headers=student_headers)
    assert second_join.status_code == 400


def test_dashboard_forbidden_for_non_admin_member(client):
    admin_headers, _ = _register(client, "admin3@test.com")
    create = client.post("/api/school/create", json={"name": "School C"}, headers=admin_headers)
    code = create.json()["school"]["join_code"]

    student_headers, _ = _register(client, "student4@test.com")
    client.post("/api/school/join", json={"join_code": code}, headers=student_headers)

    response = client.get("/api/school/dashboard", headers=student_headers)
    assert response.status_code == 403


def test_dashboard_forbidden_for_unlinked_user(client):
    headers, _ = _register(client, "unlinked@test.com")
    response = client.get("/api/school/dashboard", headers=headers)
    assert response.status_code == 403


def test_dashboard_isolates_rosters_between_schools(client, db_session):
    course, lesson1, lesson2 = _seed_two_lesson_course(db_session, slug="iso-course")

    # School A: admin + 2 students, one of whom has real progress and a quiz score.
    admin_a_headers, admin_a = _register(client, "admin_a@test.com")
    create_a = client.post("/api/school/create", json={"name": "School A"}, headers=admin_a_headers)
    code_a = create_a.json()["school"]["join_code"]

    student_a1_headers, student_a1 = _register(client, "student_a1@test.com")
    client.post("/api/school/join", json={"join_code": code_a}, headers=student_a1_headers)
    client.post(f"/api/learn/courses/{course.slug}/enroll", headers=student_a1_headers)
    client.post(f"/api/learn/lessons/{lesson1.slug}/progress", json={"watched": True}, headers=student_a1_headers)
    db_session.add(QuizAttempt(user_id=student_a1["id"], quiz_id="q1", score=80, total_questions=5))
    db_session.commit()

    student_a2_headers, student_a2 = _register(client, "student_a2@test.com")
    client.post("/api/school/join", json={"join_code": code_a}, headers=student_a2_headers)

    # School B: admin + 1 student, isolated from School A.
    admin_b_headers, admin_b = _register(client, "admin_b@test.com")
    create_b = client.post("/api/school/create", json={"name": "School B"}, headers=admin_b_headers)
    code_b = create_b.json()["school"]["join_code"]
    student_b_headers, student_b = _register(client, "student_b@test.com")
    client.post("/api/school/join", json={"join_code": code_b}, headers=student_b_headers)

    dashboard_a = client.get("/api/school/dashboard", headers=admin_a_headers).json()
    roster_a_ids = {r["id"] for r in dashboard_a["roster"]}
    assert roster_a_ids == {admin_a["id"], student_a1["id"], student_a2["id"]}
    assert student_b["id"] not in roster_a_ids
    assert dashboard_a["summary"]["student_count"] == 3
    # Only student_a1 has any quiz/lesson activity, so the averages should
    # reflect exactly their numbers, not be diluted by the other two.
    assert dashboard_a["summary"]["average_quiz_score"] == 80
    assert dashboard_a["summary"]["average_completion_rate"] == 50

    dashboard_b = client.get("/api/school/dashboard", headers=admin_b_headers).json()
    roster_b_ids = {r["id"] for r in dashboard_b["roster"]}
    assert roster_b_ids == {admin_b["id"], student_b["id"]}
    assert admin_a["id"] not in roster_b_ids and student_a1["id"] not in roster_b_ids


def test_dashboard_query_count_stays_flat_as_roster_grows(client, db_session, engine):
    from sqlalchemy import event

    admin_headers, admin = _register(client, "admin_scale@test.com")
    create = client.post("/api/school/create", json={"name": "Scale School"}, headers=admin_headers)
    code = create.json()["school"]["join_code"]

    def _query_count_for_n_students(n):
        for i in range(n):
            headers, _ = _register(client, f"scale_student_{n}_{i}@test.com")
            client.post("/api/school/join", json={"join_code": code}, headers=headers)

        queries = []
        def _counter(conn, cursor, statement, parameters, context, executemany):
            queries.append(statement)
        event.listen(engine, "before_cursor_execute", _counter)
        try:
            response = client.get("/api/school/dashboard", headers=admin_headers)
            assert response.status_code == 200
        finally:
            event.remove(engine, "before_cursor_execute", _counter)
        return len(queries)

    count_small = _query_count_for_n_students(2)
    count_larger = _query_count_for_n_students(5)
    # Query count should not grow with roster size - allow a small constant
    # slack for the extra registration calls' own queries not being isolated
    # perfectly, but it must stay in the same small ballpark, not scale 1:1
    # with the number of students added between the two calls.
    assert count_larger < count_small + 5
