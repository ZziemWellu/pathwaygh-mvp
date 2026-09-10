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
