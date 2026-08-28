# The practice router falls back to a small built-in question bank when
# data/practice/questions.json doesn't exist (see modules/practice/router.py).
# Correct answers for that fallback bank, used to build deterministic test
# submissions regardless of the random sampling order.
KNOWN_ANSWERS = {
    "math_001": "4",  # What is 2 + 2?
    "math_002": "9",  # What is 3 x 3?
    "math_003": "4",  # What is the square root of 16?
}


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
