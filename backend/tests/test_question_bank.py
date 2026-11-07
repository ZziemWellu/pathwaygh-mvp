import csv
import json
import re
from fractions import Fraction
from pathlib import Path

import pytest

from modules.practice.mastery import load_questions
from modules.practice_sms.eligibility import _questions_for

BANK = json.loads((Path(__file__).parents[1] / "data" / "practice" / "bank_gh.json").read_text(encoding="utf-8"))
QUESTIONS = [(s["id"], t["id"], q) for s in BANK["subjects"] for t in s["topics"] for q in t["questions"]]


def signup(client, level, email):
    response = client.post(
        "/api/auth/register",
        json={"email": email, "full_name": "A", "password": "secret123", "country": "GH", "level": level, "consent_confirmed": True, "guardian_email": "g@test.com"},
    )
    return {"Authorization": f"Bearer {response.json()['token']}"}


def test_every_question_is_well_formed():
    for _, _, q in QUESTIONS:
        assert len(q["options"]) == 4 and len(set(q["options"])) == 4, q["id"]
        assert q["correct"] in q["options"], q["id"]
        assert q["explanation"].strip(), q["id"]
        assert q["difficulty"] in ("easy", "medium", "hard"), q["id"]
        assert q["review_status"] in ("computed", "pending_review", "teacher_reviewed"), q["id"]
        assert q["sub_skill"], q["id"]


def test_ids_are_unique_across_the_whole_bank():
    ids = [q["id"] for s in load_questions()["subjects"] for t in s["topics"] for q in t["questions"]]
    assert len(ids) == len(set(ids))


def test_topic_ids_are_unique_across_the_whole_bank():
    # Mastery is stored per topic id, and shared JHS topics must have merged.
    ids = [t["id"] for s in load_questions()["subjects"] for t in s["topics"]]
    assert len(ids) == len(set(ids))


def test_core_maths_reaches_the_target_at_every_level():
    subjects = {s["id"]: s for s in load_questions()["subjects"]}
    for subject_id in ("mathematics_primary", "mathematics", "core_mathematics_shs"):
        assert sum(len(t["questions"]) for t in subjects[subject_id]["topics"]) >= 300, subject_id


def test_merging_keeps_the_original_jhs_questions():
    jhs_maths = next(s for s in load_questions()["subjects"] if s["id"] == "mathematics")
    ids = {q["id"] for t in jhs_maths["topics"] for q in t["questions"]}
    assert "math_001" in ids and "jm_alg_001" in ids


# Independent of the build script's own arithmetic: re-solve templates from
# the question text and compare with the stored answer.
def _number(text):
    return int(text.replace(",", ""))


CHECKS = [
    (r"^What is ([\d,]+) \+ ([\d,]+)\?$", lambda m: _number(m[1]) + _number(m[2]), _number),
    (r"^What is ([\d,]+) - ([\d,]+)\?$", lambda m: _number(m[1]) - _number(m[2]), _number),
    (r"^What is (\d+) x (\d+)\?$", lambda m: int(m[1]) * int(m[2]), int),
    (r"^What is (\d+) ÷ (\d+)\?$", lambda m: int(m[1]) // int(m[2]), int),
    (r"^What is (\d+)% of (\d+)\?$", lambda m: int(m[1]) * int(m[2]) // 100, int),
    (r"^What is (\d+)/(\d+) of (\d+)\?$", lambda m: int(m[3]) * int(m[1]) // int(m[2]), int),
    (r"^Solve for x: (\d+)x \+ (\d+) = (\d+)$", lambda m: (int(m[3]) - int(m[2])) / int(m[1]), lambda a: int(a.split("= ")[1])),
    (r"^Solve for x: (\d+)x - (\d+) = (\d+)$", lambda m: (int(m[3]) + int(m[2])) / int(m[1]), lambda a: int(a.split("= ")[1])),
    (r"^Two angles of a triangle are (\d+)° and (\d+)°", lambda m: 180 - int(m[1]) - int(m[2]), lambda a: int(a.rstrip("°"))),
    (r"^Two angles on a straight line are (\d+)°", lambda m: 180 - int(m[1]), lambda a: int(a.rstrip("°"))),
    (r"^Evaluate: log base (\d+) of ([\d,]+)$", lambda m: _log(int(m[1]), _number(m[2])), int),
]


def _log(base, n):
    power = 0
    while n > 1:
        n //= base
        power += 1
    return power


def test_stored_answers_match_an_independent_recalculation():
    checked = 0
    for _, _, q in QUESTIONS:
        for pattern, solve, parse in CHECKS:
            match = re.match(pattern, q["question"])
            if match:
                assert solve(match) == parse(q["correct"]), q["id"]
                checked += 1
    assert checked > 200


def test_fraction_and_interest_answers_recalculate():
    checked = 0
    for _, _, q in QUESTIONS:
        match = re.match(r"^What is (\d+)/(\d+) \+ (\d+)/(\d+)\?$", q["question"])
        if match:
            assert Fraction(int(match[1]) + int(match[3]), int(match[2])) == Fraction(q["correct"]), q["id"]
            checked += 1
        match = re.match(r"^Find the simple interest on GH₵ ([\d,]+) at (\d+)% per annum for (\d+) year", q["question"])
        if match:
            interest = _number(match[1]) * int(match[2]) * int(match[3]) // 100
            assert q["correct"] == f"GH₵ {interest:,}", q["id"]
            checked += 1
    assert checked > 20


@pytest.mark.parametrize(
    "level,expected,excluded",
    [
        ("primary", "mathematics_primary", {"mathematics", "core_mathematics_shs"}),
        ("jhs", "mathematics", {"mathematics_primary", "core_mathematics_shs"}),
        ("shs", "core_mathematics_shs", {"mathematics", "mathematics_primary"}),
    ],
)
def test_practice_subjects_follow_the_students_level(client, level, expected, excluded):
    headers = signup(client, level, f"{level}@test.com")
    ids = {s["id"] for s in client.get("/api/practice/subjects", headers=headers).json()["subjects"]}
    assert expected in ids
    assert not ids & excluded


def test_quiz_cannot_be_started_from_another_levels_bank(client):
    headers = signup(client, "jhs", "j@test.com")
    response = client.post("/api/practice/quiz/start", json={"subject_id": "core_mathematics_shs"}, headers=headers)
    assert response.status_code == 404


def test_quick_quiz_only_draws_from_the_students_level(client):
    headers = signup(client, "primary", "p@test.com")
    primary_ids = {q["id"] for s in BANK["subjects"] if "primary" in s["levels"] for t in s["topics"] for q in t["questions"]}
    response = client.post("/api/practice/quiz/start", json={"question_count": 20}, headers=headers)
    assert {q["id"] for q in response.json()["questions"]} <= primary_ids


def test_a_bank_question_can_be_answered_and_marked(client):
    headers = signup(client, "shs", "s@test.com")
    start = client.post("/api/practice/quiz/start", json={"subject_id": "core_mathematics_shs", "question_count": 3}, headers=headers).json()
    assert all(q["review_status"] == "computed" for q in start["questions"])
    submit = client.post("/api/practice/quiz/submit", json={"quiz_id": start["id"], "answers": {"0": start["questions"][0]["options"][0]}}, headers=headers)
    assert submit.status_code == 200


def test_quiz_marks_questions_awaiting_teacher_review(client):
    headers = signup(client, "shs", "e@test.com")
    start = client.post("/api/practice/quiz/start", json={"subject_id": "english_shs", "question_count": 3}, headers=headers).json()
    assert all(q["review_status"] == "pending_review" for q in start["questions"])


def test_sms_practice_leaves_out_unreviewed_and_level_specific_questions():
    ids = {q["id"] for q in _questions_for("GH", None)}
    statuses = {q.get("review_status") for q in _questions_for("GH", None)}
    assert "pending_review" not in statuses
    assert not any(i.startswith(("pm_", "sm_")) for i in ids)


def test_review_csv_lists_every_written_question():
    path = Path(__file__).parents[1] / "data" / "practice" / "bank_gh_for_teacher_review.csv"
    with open(path, encoding="utf-8-sig", newline="") as f:
        rows = sum(1 for _ in csv.reader(f)) - 1
    assert rows == sum(q["review_status"] == "pending_review" for _, _, q in QUESTIONS)
