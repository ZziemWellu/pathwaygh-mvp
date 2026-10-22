import json
from pathlib import Path

from models.quiz_attempt import QuizAttempt

QUESTIONS_FILE = Path(__file__).parent.parent / "data" / "practice" / "questions.json"


def _known_answers():
    """Build a real id -> correct-answer map from the actual question bank
    the server reads, instead of guessing which questions random.sample()
    will pick."""
    with open(QUESTIONS_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)
    answers = {}
    for subject in data["subjects"]:
        for topic in subject["topics"]:
            for q in topic["questions"]:
                answers[q["id"]] = q["correct"]
    return answers


KNOWN_ANSWERS = _known_answers()


def test_quiz_start_requires_auth(client):
    response = client.post("/api/practice/quiz/start", json={"subject_id": "mathematics", "question_count": 3})
    assert response.status_code == 401


def test_quiz_all_correct_scores_100(client, auth_headers):
    headers, _ = auth_headers
    start = client.post("/api/practice/quiz/start", json={"subject_id": "mathematics", "question_count": 3}, headers=headers)
    assert start.status_code == 200
    quiz = start.json()

    answers = {str(i): KNOWN_ANSWERS[q["id"]] for i, q in enumerate(quiz["questions"])}
    submit = client.post(
        "/api/practice/quiz/submit",
        json={"quiz_id": quiz["id"], "answers": answers, "time_spent": 30},
        headers=headers,
    )
    assert submit.status_code == 200
    result = submit.json()
    assert result["score"] == 100
    assert result["correct"] == result["total"]


def test_quiz_one_wrong_scores_partial(client, auth_headers):
    headers, _ = auth_headers
    start = client.post("/api/practice/quiz/start", json={"subject_id": "mathematics", "question_count": 3}, headers=headers)
    quiz = start.json()

    answers = {str(i): KNOWN_ANSWERS[q["id"]] for i, q in enumerate(quiz["questions"])}
    # Deliberately wrong the first answer
    answers["0"] = "not-a-real-answer"

    submit = client.post(
        "/api/practice/quiz/submit",
        json={"quiz_id": quiz["id"], "answers": answers, "time_spent": 30},
        headers=headers,
    )
    result = submit.json()
    assert result["correct"] == result["total"] - 1
    assert result["score"] < 100
    assert result["results"][0]["is_correct"] is False


def test_quiz_submit_persists_time_spent(client, auth_headers, db_session):
    headers, user = auth_headers
    start = client.post("/api/practice/quiz/start", json={"subject_id": "mathematics", "question_count": 3}, headers=headers)
    quiz = start.json()
    answers = {str(i): KNOWN_ANSWERS[q["id"]] for i, q in enumerate(quiz["questions"])}

    submit = client.post(
        "/api/practice/quiz/submit",
        json={"quiz_id": quiz["id"], "answers": answers, "time_spent": 45},
        headers=headers,
    )
    assert submit.status_code == 200

    attempt = db_session.query(QuizAttempt).filter(QuizAttempt.user_id == user["id"]).order_by(QuizAttempt.id.desc()).first()
    assert attempt is not None
    assert attempt.time_spent == 45


# --- /subjects is scoped to the student's own country. Every country's
# bank reuses the same subject names, so unscoped a Ghanaian student saw
# five indistinguishable "Mathematics" cards (GH/NG/SL/LR/GM).


def test_subjects_default_to_the_signed_in_students_country(client):
    from tests.conftest import register_user

    gh = register_user(client, email="gh_student@test.com", country="GH")
    response = client.get("/api/practice/subjects", headers={"Authorization": f"Bearer {gh['token']}"})
    subjects = response.json()["subjects"]
    assert {s["id"] for s in subjects} == {"mathematics", "english", "science"}
    names = [s["name"] for s in subjects]
    assert len(names) == len(set(names)), f"duplicate subject names shown: {names}"

    ng = register_user(client, email="ng_student@test.com", country="NG")
    response = client.get("/api/practice/subjects", headers={"Authorization": f"Bearer {ng['token']}"})
    assert {s["id"] for s in response.json()["subjects"]} == {"mathematics_ng", "english_ng", "science_ng"}


def test_explicit_country_query_still_overrides_the_default(client, auth_headers):
    headers, _ = auth_headers
    response = client.get("/api/practice/subjects?country=SL", headers=headers)
    assert {s["id"] for s in response.json()["subjects"]} == {"mathematics_sl", "english_sl", "science_sl"}


def test_anonymous_subjects_listing_is_unchanged(client):
    response = client.get("/api/practice/subjects")
    assert len(response.json()["subjects"]) == 15
