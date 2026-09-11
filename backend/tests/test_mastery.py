from models.skill_mastery import SkillMastery
from modules.practice.mastery import DEFAULT_PRIOR, allocate_adaptive_slots, load_questions, update_mastery
from tests.conftest import register_user
from tests.test_practice import KNOWN_ANSWERS


def _register(client, email):
    data = register_user(client, email=email, country="GH")
    return {"Authorization": f"Bearer {data['token']}"}, data["user"]


def _find_subject_with_multiple_topics(country="GH"):
    data = load_questions()
    for subject in data["subjects"]:
        if subject.get("country") == country and len(subject.get("topics", [])) >= 2:
            return subject
    return None


# --- Pure BKT math -----------------------------------------------------


def test_correct_answer_increases_mastery():
    prior = 0.3
    assert update_mastery(prior, True, 4) > prior


def test_incorrect_answer_increases_mastery_less_than_a_correct_one_would():
    prior = 0.3
    correct_result = update_mastery(prior, True, 4)
    incorrect_result = update_mastery(prior, False, 4)
    assert incorrect_result < correct_result


def test_mastery_always_stays_within_unit_interval():
    for prior in (0.0, 0.1, 0.5, 0.9, 1.0):
        for is_correct in (True, False):
            for num_options in (1, 2, 4, 6):
                result = update_mastery(prior, is_correct, num_options)
                assert 0.0 <= result <= 1.0


def test_consistent_correct_answers_trend_upward_but_never_reach_one():
    prob = DEFAULT_PRIOR
    history = [prob]
    for _ in range(15):
        prob = update_mastery(prob, True, 4)
        history.append(prob)
    assert all(b >= a - 1e-9 for a, b in zip(history, history[1:]))
    assert history[-1] > 0.9
    assert history[-1] < 1.0


# --- Pure adaptive slot allocation --------------------------------------


def test_weaker_topic_gets_more_slots():
    counts = {"weak": 10, "strong": 10}
    masteries = {"weak": 0.1, "strong": 0.9}
    result = allocate_adaptive_slots(counts, masteries, 5)
    assert result["weak"] > result["strong"]
    assert sum(result.values()) == 5


def test_slots_sum_exactly_to_total_when_availability_is_sufficient():
    counts = {"a": 10, "b": 10, "c": 10}
    masteries = {"a": 0.2, "b": 0.5, "c": 0.8}
    result = allocate_adaptive_slots(counts, masteries, 7)
    assert sum(result.values()) == 7


def test_single_topic_gets_all_slots():
    result = allocate_adaptive_slots({"only": 10}, {}, 5)
    assert result["only"] == 5


def test_equal_mastery_splits_as_evenly_as_possible():
    result = allocate_adaptive_slots({"a": 10, "b": 10}, {"a": 0.3, "b": 0.3}, 4)
    assert result["a"] == 2
    assert result["b"] == 2


def test_allocation_respects_availability_cap_and_redistributes_leftover():
    counts = {"scarce": 1, "plenty": 10}
    masteries = {"scarce": 0.1, "plenty": 0.9}
    result = allocate_adaptive_slots(counts, masteries, 5)
    assert result["scarce"] == 1
    assert sum(result.values()) == 5


def test_allocation_never_exceeds_total_available_questions():
    result = allocate_adaptive_slots({"a": 2, "b": 1}, {}, 10)
    assert sum(result.values()) == 3


# --- Integration via the real endpoints ---------------------------------


def _take_quiz(client, headers, subject_id, topic=None, question_count=3):
    payload = {"subject_id": subject_id, "question_count": question_count}
    if topic:
        payload["topic"] = topic
    start = client.post("/api/practice/quiz/start", json=payload, headers=headers)
    assert start.status_code == 200
    quiz = start.json()
    answers = {str(i): KNOWN_ANSWERS[q["id"]] for i, q in enumerate(quiz["questions"])}
    submit = client.post(
        "/api/practice/quiz/submit",
        json={"quiz_id": quiz["id"], "answers": answers, "time_spent": 20},
        headers=headers,
    )
    assert submit.status_code == 200
    return quiz, submit.json()


def test_quiz_submission_creates_skill_mastery_rows_for_touched_topics_only(client, db_session):
    headers, _ = _register(client, "mastery_create@test.com")
    _take_quiz(client, headers, "mathematics")

    rows = db_session.query(SkillMastery).all()
    assert len(rows) > 0
    for row in rows:
        assert row.subject_id == "mathematics"
        assert row.attempts_count > 0
        assert 0.0 <= row.mastery_probability <= 1.0


def test_repeated_correct_answers_increase_mastery_across_quizzes(client):
    headers, _ = _register(client, "mastery_trend@test.com")
    _take_quiz(client, headers, "mathematics", question_count=3)
    first_stats = client.get("/api/practice/statistics", headers=headers).json()
    first_mastery = {m["topic_id"]: m["mastery_probability"] for m in first_stats["topic_mastery"]}

    _take_quiz(client, headers, "mathematics", question_count=3)
    second_stats = client.get("/api/practice/statistics", headers=headers).json()
    second_mastery = {m["topic_id"]: m["mastery_probability"] for m in second_stats["topic_mastery"]}

    assert len(second_mastery) > 0
    for topic_id, mastery in second_mastery.items():
        assert mastery >= first_mastery.get(topic_id, DEFAULT_PRIOR)


def test_explicit_topic_filter_still_restricts_selection_to_that_topic(client):
    subject = _find_subject_with_multiple_topics()
    if not subject:
        import pytest

        pytest.skip("No subject with multiple topics in the current question bank")

    headers, _ = _register(client, "mastery_explicit_topic@test.com")
    target_topic = subject["topics"][0]["id"]
    quiz, _ = _take_quiz(client, headers, subject["id"], topic=target_topic, question_count=2)

    valid_ids = {q["id"] for q in subject["topics"][0]["questions"]}
    for q in quiz["questions"]:
        assert q["id"] in valid_ids


def test_adaptive_selection_favors_the_weaker_of_two_topics(client, db_session):
    subject = _find_subject_with_multiple_topics()
    if not subject:
        import pytest

        pytest.skip("No subject with multiple topics in the current question bank")

    headers, user = _register(client, "mastery_adaptive@test.com")
    weak_topic_id = subject["topics"][0]["id"]
    strong_topic_id = subject["topics"][1]["id"]

    # Pre-seed a strong mastery for one topic and leave the other at the
    # default prior, then confirm a subsequent quiz-start (no explicit
    # topic filter - the real-world path) favors the weaker one.
    db_session.add(
        SkillMastery(user_id=user["id"], subject_id=subject["id"], topic_id=strong_topic_id, mastery_probability=0.95, attempts_count=5)
    )
    db_session.add(
        SkillMastery(user_id=user["id"], subject_id=subject["id"], topic_id=weak_topic_id, mastery_probability=0.05, attempts_count=5)
    )
    db_session.commit()

    total_available = len(subject["topics"][0]["questions"]) + len(subject["topics"][1]["questions"])
    count = min(total_available, 4)
    start = client.post(
        "/api/practice/quiz/start", json={"subject_id": subject["id"], "question_count": count}, headers=headers
    )
    quiz = start.json()

    weak_ids = {q["id"] for q in subject["topics"][0]["questions"]}
    strong_ids = {q["id"] for q in subject["topics"][1]["questions"]}
    weak_count = sum(1 for q in quiz["questions"] if q["id"] in weak_ids)
    strong_count = sum(1 for q in quiz["questions"] if q["id"] in strong_ids)
    assert weak_count >= strong_count


def test_dashboard_summary_includes_weak_topics_without_breaking_weak_subjects(client):
    headers, _ = _register(client, "mastery_dashboard@test.com")
    _take_quiz(client, headers, "mathematics")

    response = client.get("/api/dashboard/summary", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "weak_subjects" in data
    assert "weak_topics" in data
    assert isinstance(data["weak_topics"], list)


def test_statistics_includes_topic_mastery_even_with_no_attempts(client):
    headers, _ = _register(client, "mastery_zero_state@test.com")
    response = client.get("/api/practice/statistics", headers=headers)
    assert response.status_code == 200
    assert response.json()["topic_mastery"] == []
