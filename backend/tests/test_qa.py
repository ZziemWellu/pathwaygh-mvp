from models.peer_answer import PeerAnswer
from models.peer_question import PeerQuestion
from models.user import User
from tests.conftest import register_user


def _register(client, email):
    data = register_user(client, email=email, country="GH")
    return {"Authorization": f"Bearer {data['token']}"}, data["user"]


def _admin_headers(client, db_session, email="qa_admin@test.com"):
    data = register_user(client, email=email, country="GH")
    user = db_session.query(User).filter(User.email == email).first()
    user.is_admin = True
    db_session.commit()
    return {"Authorization": f"Bearer {data['token']}"}


# --- posting questions/answers ---------------------------------------------


def test_create_question_requires_auth(client):
    response = client.post("/api/qa/questions", json={"body": "How do I factorize x^2-5x+6?"})
    assert response.status_code == 401


def test_create_a_clean_question_is_immediately_visible(client):
    headers, _ = _register(client, "qa_clean@test.com")
    response = client.post(
        "/api/qa/questions", json={"subject_id": "mathematics", "body": "How do I factorize x^2-5x+6?"}, headers=headers
    )
    assert response.status_code == 200
    body = response.json()
    assert body["pending_review"] is False

    listing = client.get("/api/qa/questions").json()
    assert any(q["id"] == body["question"]["id"] for q in listing["questions"])


def test_create_question_rejects_blank_body(client):
    headers, _ = _register(client, "qa_blank@test.com")
    response = client.post("/api/qa/questions", json={"body": "   "}, headers=headers)
    assert response.status_code == 400


def test_a_question_with_profanity_is_held_for_review_not_shown_publicly(client, db_session):
    headers, user = _register(client, "qa_profane@test.com")
    response = client.post("/api/qa/questions", json={"body": "This fucking homework is impossible"}, headers=headers)
    assert response.status_code == 200
    assert response.json()["pending_review"] is True

    listing = client.get("/api/qa/questions").json()
    assert listing["questions"] == []

    db_question = db_session.query(PeerQuestion).filter(PeerQuestion.user_id == user["id"]).first()
    assert db_question.status == "pending_review"
    assert db_question.moderation_reason is not None


def test_a_question_with_a_phone_number_is_held_for_review(client):
    headers, _ = _register(client, "qa_phone@test.com")
    response = client.post(
        "/api/qa/questions", json={"body": "Anyone free to help? Call me on 0241234567"}, headers=headers
    )
    assert response.json()["pending_review"] is True


def test_the_author_can_still_see_their_own_pending_question_by_id(client):
    headers, _ = _register(client, "qa_author_view@test.com")
    created = client.post("/api/qa/questions", json={"body": "Contact me at me@example.com please"}, headers=headers)
    question_id = created.json()["question"]["id"]

    response = client.get(f"/api/qa/questions/{question_id}", headers=headers)
    assert response.status_code == 200


def test_a_stranger_cannot_see_someone_elses_pending_question(client):
    headers1, _ = _register(client, "qa_pending_owner@test.com")
    headers2, _ = _register(client, "qa_pending_stranger@test.com")
    created = client.post("/api/qa/questions", json={"body": "Contact me at me@example.com please"}, headers=headers1)
    question_id = created.json()["question"]["id"]

    response = client.get(f"/api/qa/questions/{question_id}", headers=headers2)
    assert response.status_code == 404


def test_create_answer_on_a_visible_question(client):
    headers, _ = _register(client, "qa_answer@test.com")
    created = client.post("/api/qa/questions", json={"body": "How do I factorize x^2-5x+6?"}, headers=headers)
    question_id = created.json()["question"]["id"]

    response = client.post(f"/api/qa/questions/{question_id}/answers", json={"body": "(x-2)(x-3)"}, headers=headers)
    assert response.status_code == 200
    assert response.json()["pending_review"] is False

    fetched = client.get(f"/api/qa/questions/{question_id}", headers=headers).json()
    assert len(fetched["answers"]) == 1


def test_answering_a_nonexistent_question_is_404(client):
    headers, _ = _register(client, "qa_answer_404@test.com")
    response = client.post("/api/qa/questions/99999/answers", json={"body": "hi"}, headers=headers)
    assert response.status_code == 404


def test_an_answer_with_profanity_is_held_for_review(client, db_session):
    headers, user = _register(client, "qa_answer_profane@test.com")
    created = client.post("/api/qa/questions", json={"body": "How do I factorize x^2-5x+6?"}, headers=headers)
    question_id = created.json()["question"]["id"]

    response = client.post(
        f"/api/qa/questions/{question_id}/answers", json={"body": "this is fucking easy"}, headers=headers
    )
    assert response.json()["pending_review"] is True

    fetched = client.get(f"/api/qa/questions/{question_id}", headers=headers).json()
    # the author can still see their own pending answer
    assert len(fetched["answers"]) == 1

    stranger_headers, _ = _register(client, "qa_answer_profane_stranger@test.com")
    fetched_as_stranger = client.get(f"/api/qa/questions/{question_id}", headers=stranger_headers).json()
    assert fetched_as_stranger["answers"] == []


# --- reporting ---------------------------------------------------------


def test_report_question_requires_auth(client):
    response = client.post("/api/qa/questions/1/report")
    assert response.status_code == 401


def test_reporting_a_nonexistent_question_is_404(client):
    headers, _ = _register(client, "qa_report_404@test.com")
    response = client.post("/api/qa/questions/99999/report", headers=headers)
    assert response.status_code == 404


def test_reporting_the_same_question_twice_is_rejected(client):
    headers1, _ = _register(client, "qa_report_owner@test.com")
    headers2, _ = _register(client, "qa_report_twice@test.com")
    created = client.post("/api/qa/questions", json={"body": "A clean question here"}, headers=headers1)
    question_id = created.json()["question"]["id"]

    first = client.post(f"/api/qa/questions/{question_id}/report", headers=headers2)
    second = client.post(f"/api/qa/questions/{question_id}/report", headers=headers2)
    assert first.status_code == 200
    assert second.status_code == 400


def test_a_question_is_auto_hidden_after_reaching_the_community_flag_threshold(client, db_session):
    headers, _ = _register(client, "qa_flag_owner@test.com")
    created = client.post("/api/qa/questions", json={"body": "A clean question that gets reported"}, headers=headers)
    question_id = created.json()["question"]["id"]

    for i in range(3):
        reporter_headers, _ = _register(client, f"qa_flag_reporter_{i}@test.com")
        response = client.post(f"/api/qa/questions/{question_id}/report", headers=reporter_headers)
        assert response.status_code == 200

    listing = client.get("/api/qa/questions").json()
    assert not any(q["id"] == question_id for q in listing["questions"])

    db_question = db_session.query(PeerQuestion).filter(PeerQuestion.id == question_id).first()
    assert db_question.status == "pending_review"
    assert db_question.flagged_count == 3


def test_reporting_below_the_threshold_does_not_hide_the_question(client):
    headers, _ = _register(client, "qa_flag_owner2@test.com")
    created = client.post("/api/qa/questions", json={"body": "Another clean question"}, headers=headers)
    question_id = created.json()["question"]["id"]

    reporter_headers, _ = _register(client, "qa_flag_reporter_one@test.com")
    client.post(f"/api/qa/questions/{question_id}/report", headers=reporter_headers)

    listing = client.get("/api/qa/questions").json()
    assert any(q["id"] == question_id for q in listing["questions"])


def test_report_answer_requires_auth(client):
    response = client.post("/api/qa/answers/1/report")
    assert response.status_code == 401


def test_reporting_a_nonexistent_answer_is_404(client):
    headers, _ = _register(client, "qa_report_answer_404@test.com")
    response = client.post("/api/qa/answers/99999/report", headers=headers)
    assert response.status_code == 404


# --- admin moderation queue ----------------------------------------------


def test_admin_endpoints_require_admin(client):
    headers, _ = _register(client, "qa_not_admin@test.com")
    response = client.get("/api/qa/admin/pending", headers=headers)
    assert response.status_code == 403


def test_admin_can_see_pending_questions_and_answers(client, db_session):
    headers, _ = _register(client, "qa_pending_content@test.com")
    client.post("/api/qa/questions", json={"body": "Email me at test@example.com please"}, headers=headers)
    admin_headers = _admin_headers(client, db_session)

    response = client.get("/api/qa/admin/pending", headers=admin_headers)
    assert response.status_code == 200
    body = response.json()
    assert len(body["questions"]) == 1
    assert body["questions"][0]["moderation_reason"] is not None


def test_admin_sees_the_reasons_reporters_gave_not_just_the_count(client, db_session):
    headers, _ = _register(client, "qa_report_reason_owner@test.com")
    created = client.post("/api/qa/questions", json={"body": "A clean question"}, headers=headers)
    question_id = created.json()["question"]["id"]

    reporter1, _ = _register(client, "qa_report_reason_1@test.com")
    reporter2, _ = _register(client, "qa_report_reason_2@test.com")
    reporter3, _ = _register(client, "qa_report_reason_3@test.com")
    client.post(f"/api/qa/questions/{question_id}/report", json={"reason": "This looks like spam"}, headers=reporter1)
    client.post(f"/api/qa/questions/{question_id}/report", json={"reason": "Off-topic"}, headers=reporter2)
    # A third, reason-less report - crosses COMMUNITY_FLAG_THRESHOLD (3)
    # so the question actually reaches pending_review and shows up below;
    # report_reasons must still only include the two that gave one.
    client.post(f"/api/qa/questions/{question_id}/report", headers=reporter3)

    admin_headers = _admin_headers(client, db_session, email="qa_report_reason_admin@test.com")
    response = client.get("/api/qa/admin/pending", headers=admin_headers)
    body = response.json()

    assert len(body["questions"]) == 1
    assert set(body["questions"][0]["report_reasons"]) == {"This looks like spam", "Off-topic"}


def test_admin_can_approve_a_pending_question(client, db_session):
    headers, _ = _register(client, "qa_approve@test.com")
    created = client.post("/api/qa/questions", json={"body": "Email me at test@example.com please"}, headers=headers)
    question_id = created.json()["question"]["id"]
    admin_headers = _admin_headers(client, db_session)

    response = client.post(f"/api/qa/admin/questions/{question_id}/approve", headers=admin_headers)
    assert response.status_code == 200

    listing = client.get("/api/qa/questions").json()
    assert any(q["id"] == question_id for q in listing["questions"])


def test_admin_can_remove_a_pending_question(client, db_session):
    headers, _ = _register(client, "qa_remove@test.com")
    created = client.post("/api/qa/questions", json={"body": "Email me at test@example.com please"}, headers=headers)
    question_id = created.json()["question"]["id"]
    admin_headers = _admin_headers(client, db_session)

    response = client.post(f"/api/qa/admin/questions/{question_id}/remove", headers=admin_headers)
    assert response.status_code == 200

    db_question = db_session.query(PeerQuestion).filter(PeerQuestion.id == question_id).first()
    assert db_question.status == "removed"

    # even the author can no longer see a removed question
    fetched = client.get(f"/api/qa/questions/{question_id}", headers=headers)
    assert fetched.status_code == 404


def test_admin_can_approve_a_pending_answer(client, db_session):
    headers, _ = _register(client, "qa_answer_approve@test.com")
    created = client.post("/api/qa/questions", json={"body": "A clean question"}, headers=headers)
    question_id = created.json()["question"]["id"]
    answer = client.post(
        f"/api/qa/questions/{question_id}/answers", json={"body": "call me on 0241234567"}, headers=headers
    )
    answer_id = answer.json()["answer"]["id"]
    admin_headers = _admin_headers(client, db_session)

    response = client.post(f"/api/qa/admin/answers/{answer_id}/approve", headers=admin_headers)
    assert response.status_code == 200

    db_answer = db_session.query(PeerAnswer).filter(PeerAnswer.id == answer_id).first()
    assert db_answer.status == "visible"


def test_admin_can_remove_a_pending_answer(client, db_session):
    headers, _ = _register(client, "qa_answer_remove@test.com")
    created = client.post("/api/qa/questions", json={"body": "A clean question"}, headers=headers)
    question_id = created.json()["question"]["id"]
    answer = client.post(
        f"/api/qa/questions/{question_id}/answers", json={"body": "call me on 0241234567"}, headers=headers
    )
    answer_id = answer.json()["answer"]["id"]
    admin_headers = _admin_headers(client, db_session)

    response = client.post(f"/api/qa/admin/answers/{answer_id}/remove", headers=admin_headers)
    assert response.status_code == 200

    db_answer = db_session.query(PeerAnswer).filter(PeerAnswer.id == answer_id).first()
    assert db_answer.status == "removed"
