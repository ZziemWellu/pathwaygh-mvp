from models.course import Course, Exercise, Lesson


def _seed_lesson_with_exercises(db_session):
    course = Course(slug="ex-course", title="Exercise Course", level="jhs")
    db_session.add(course)
    db_session.flush()
    lesson = Lesson(course_id=course.id, slug="ex-lesson", title="Exercise Lesson", lesson_type="text", content="body")
    db_session.add(lesson)
    db_session.flush()
    db_session.add_all(
        [
            Exercise(lesson_id=lesson.id, question="1+1?", options=["1", "2", "3"], correct_index=1, order_index=0),
            Exercise(lesson_id=lesson.id, question="2+2?", options=["3", "4", "5"], correct_index=1, order_index=1),
        ]
    )
    db_session.commit()
    return lesson


def test_correct_index_never_exposed_before_submission(client, db_session):
    lesson = _seed_lesson_with_exercises(db_session)
    response = client.get(f"/api/learn/lessons/{lesson.slug}")
    assert response.status_code == 200
    for exercise in response.json()["exercises"]:
        assert "correct_index" not in exercise


def test_all_correct_submission_scores_100(client, db_session, auth_headers):
    lesson = _seed_lesson_with_exercises(db_session)
    headers, _ = auth_headers

    detail = client.get(f"/api/learn/lessons/{lesson.slug}", headers=headers).json()
    exercise_ids = [e["id"] for e in detail["exercises"]]

    answers = {str(eid): 1 for eid in exercise_ids}  # correct_index is 1 for both seeded exercises
    response = client.post(f"/api/learn/lessons/{lesson.slug}/exercises/submit", json={"answers": answers}, headers=headers)
    assert response.status_code == 200
    result = response.json()
    assert result["score"] == 100
    assert result["correct_count"] == 2
    assert all(r["is_correct"] for r in result["results"])


def test_mixed_submission_scores_exactly(client, db_session, auth_headers):
    lesson = _seed_lesson_with_exercises(db_session)
    headers, _ = auth_headers

    detail = client.get(f"/api/learn/lessons/{lesson.slug}", headers=headers).json()
    exercise_ids = [e["id"] for e in detail["exercises"]]

    # First correct (index 1), second wrong (index 0 instead of 1)
    answers = {str(exercise_ids[0]): 1, str(exercise_ids[1]): 0}
    response = client.post(f"/api/learn/lessons/{lesson.slug}/exercises/submit", json={"answers": answers}, headers=headers)
    result = response.json()
    assert result["score"] == 50
    assert result["correct_count"] == 1
    by_id = {r["exercise_id"]: r for r in result["results"]}
    assert by_id[exercise_ids[0]]["is_correct"] is True
    assert by_id[exercise_ids[1]]["is_correct"] is False
    assert by_id[exercise_ids[1]]["correct_index"] == 1  # revealed only after grading


def test_submit_requires_auth(client, db_session):
    lesson = _seed_lesson_with_exercises(db_session)
    response = client.post(f"/api/learn/lessons/{lesson.slug}/exercises/submit", json={"answers": {}})
    assert response.status_code == 401
