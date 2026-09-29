import logging
import re
from datetime import datetime, timedelta

from models.practice_sms_subscriber import PracticeSmsSubscriber
from modules.practice_sms.eligibility import build_practice_sms_text, eligible_subscribers_for_practice_sms

DIGEST_SECRET = "test-digest-secret"


def _extract_code(caplog_text: str) -> str:
    match = re.search(r"Your PathwayGH practice code is (\d{6})", caplog_text)
    assert match, f"no verification code found in log output: {caplog_text}"
    return match.group(1)


# --- /subscribe, /verify, /resend-code, /unsubscribe -----------------------


def test_subscribe_rejects_a_country_with_no_wired_up_provider(client):
    response = client.post(
        "/api/practice-sms/subscribe", json={"phone_number": "+23276000001", "country": "SL"}
    )
    assert response.status_code == 503


def test_subscribe_creates_an_unverified_subscriber_and_sends_a_code(client, db_session, caplog):
    caplog.set_level(logging.INFO)
    response = client.post(
        "/api/practice-sms/subscribe",
        json={"phone_number": "+233241234567", "country": "GH", "subject_id": "mathematics"},
    )
    assert response.status_code == 200
    assert response.json() == {"success": True, "already_verified": False}

    subscriber = db_session.query(PracticeSmsSubscriber).filter(PracticeSmsSubscriber.phone_number == "+233241234567").first()
    assert subscriber is not None
    assert subscriber.verified is False
    assert subscriber.verification_code_hash is not None
    assert "Your PathwayGH practice code is" in caplog.text


def test_subscribe_again_within_the_resend_cooldown_is_rejected(client):
    client.post("/api/practice-sms/subscribe", json={"phone_number": "+233241234568", "country": "GH"})
    response = client.post("/api/practice-sms/subscribe", json={"phone_number": "+233241234568", "country": "GH"})
    assert response.status_code == 400


def test_verify_with_the_correct_code_marks_the_subscriber_verified(client, db_session, caplog):
    caplog.set_level(logging.INFO)
    client.post("/api/practice-sms/subscribe", json={"phone_number": "+233241234569", "country": "GH"})
    code = _extract_code(caplog.text)

    response = client.post("/api/practice-sms/verify", json={"phone_number": "+233241234569", "code": code})
    assert response.status_code == 200

    subscriber = db_session.query(PracticeSmsSubscriber).filter(PracticeSmsSubscriber.phone_number == "+233241234569").first()
    assert subscriber.verified is True
    assert subscriber.verification_code_hash is None


def test_verify_with_the_wrong_code_is_rejected(client):
    client.post("/api/practice-sms/subscribe", json={"phone_number": "+233241234570", "country": "GH"})
    response = client.post("/api/practice-sms/verify", json={"phone_number": "+233241234570", "code": "000000"})
    assert response.status_code == 400


def test_verify_for_an_unknown_number_is_404(client):
    response = client.post("/api/practice-sms/verify", json={"phone_number": "+233200000000", "code": "123456"})
    assert response.status_code == 404


def test_resend_code_when_already_verified_is_rejected(client, caplog):
    caplog.set_level(logging.INFO)
    client.post("/api/practice-sms/subscribe", json={"phone_number": "+233241234571", "country": "GH"})
    code = _extract_code(caplog.text)
    client.post("/api/practice-sms/verify", json={"phone_number": "+233241234571", "code": code})

    response = client.post("/api/practice-sms/resend-code", json={"phone_number": "+233241234571"})
    assert response.status_code == 400


def test_unsubscribe_sets_opted_in_false(client, db_session, caplog):
    caplog.set_level(logging.INFO)
    client.post("/api/practice-sms/subscribe", json={"phone_number": "+233241234572", "country": "GH"})
    code = _extract_code(caplog.text)
    client.post("/api/practice-sms/verify", json={"phone_number": "+233241234572", "code": code})

    response = client.post("/api/practice-sms/unsubscribe", json={"phone_number": "+233241234572"})
    assert response.status_code == 200

    subscriber = db_session.query(PracticeSmsSubscriber).filter(PracticeSmsSubscriber.phone_number == "+233241234572").first()
    assert subscriber.opted_in is False


# --- eligibility.py ----------------------------------------------------


def test_eligible_subscribers_excludes_unverified(db_session):
    db_session.add(PracticeSmsSubscriber(phone_number="+233241111111", country="GH", verified=False, opted_in=True))
    db_session.commit()
    assert eligible_subscribers_for_practice_sms(db_session) == []


def test_eligible_subscribers_excludes_opted_out(db_session):
    db_session.add(PracticeSmsSubscriber(phone_number="+233241111112", country="GH", verified=True, opted_in=False))
    db_session.commit()
    assert eligible_subscribers_for_practice_sms(db_session) == []


def test_eligible_subscribers_excludes_within_cooldown(db_session):
    db_session.add(
        PracticeSmsSubscriber(
            phone_number="+233241111113",
            country="GH",
            verified=True,
            opted_in=True,
            last_sms_sent_at=datetime.utcnow() - timedelta(hours=1),
        )
    )
    db_session.commit()
    assert eligible_subscribers_for_practice_sms(db_session) == []


def test_eligible_subscribers_includes_after_cooldown(db_session):
    subscriber = PracticeSmsSubscriber(
        phone_number="+233241111114",
        country="GH",
        verified=True,
        opted_in=True,
        last_sms_sent_at=datetime.utcnow() - timedelta(days=2),
    )
    db_session.add(subscriber)
    db_session.commit()
    assert subscriber in eligible_subscribers_for_practice_sms(db_session)


def test_build_practice_sms_text_returns_none_when_no_content_for_country_subject(db_session):
    subscriber = PracticeSmsSubscriber(phone_number="+233241111115", country="GH", subject_id="not-a-real-subject")
    assert build_practice_sms_text(subscriber) is None


def test_build_practice_sms_text_poses_a_question_with_lettered_options(db_session):
    subscriber = PracticeSmsSubscriber(phone_number="+233241111116", country="GH", subject_id="mathematics")
    result = build_practice_sms_text(subscriber)
    assert result is not None
    text, question_id = result
    assert "New practice question:" in text
    assert "A)" in text and "B)" in text
    assert question_id


def test_build_practice_sms_text_reveals_the_previous_answer_first(db_session):
    subscriber = PracticeSmsSubscriber(phone_number="+233241111117", country="GH", subject_id="mathematics", last_question_id="math_009")
    result = build_practice_sms_text(subscriber)
    assert result is not None
    text, _ = result
    assert text.startswith("Last answer:")


# --- /send-batch ---------------------------------------------------------


def test_send_batch_requires_secret_configured(client, monkeypatch):
    monkeypatch.delenv("DIGEST_TRIGGER_SECRET", raising=False)
    response = client.post("/api/practice-sms/send-batch", headers={"X-Digest-Secret": "anything"})
    assert response.status_code == 503


def test_send_batch_rejects_wrong_secret(client, monkeypatch):
    monkeypatch.setenv("DIGEST_TRIGGER_SECRET", DIGEST_SECRET)
    response = client.post("/api/practice-sms/send-batch", headers={"X-Digest-Secret": "wrong"})
    assert response.status_code == 401


def test_send_batch_sends_to_eligible_subscribers_and_updates_state(client, db_session, monkeypatch):
    monkeypatch.setenv("DIGEST_TRIGGER_SECRET", DIGEST_SECRET)
    subscriber = PracticeSmsSubscriber(
        phone_number="+233241111118", country="GH", subject_id="mathematics", verified=True, opted_in=True
    )
    db_session.add(subscriber)
    db_session.commit()

    response = client.post("/api/practice-sms/send-batch", headers={"X-Digest-Secret": DIGEST_SECRET})
    assert response.status_code == 200
    body = response.json()
    assert body["sent"] == 1
    assert body["skipped"] == 0
    assert body["failed"] == 0

    db_session.refresh(subscriber)
    assert subscriber.last_question_id is not None
    assert subscriber.last_sms_sent_at is not None


def test_send_batch_skips_a_subscriber_with_no_matching_content(client, db_session, monkeypatch):
    monkeypatch.setenv("DIGEST_TRIGGER_SECRET", DIGEST_SECRET)
    db_session.add(
        PracticeSmsSubscriber(
            phone_number="+233241111119", country="GH", subject_id="not-a-real-subject", verified=True, opted_in=True
        )
    )
    db_session.commit()

    response = client.post("/api/practice-sms/send-batch", headers={"X-Digest-Secret": DIGEST_SECRET})
    body = response.json()
    assert body["sent"] == 0
    assert body["skipped"] == 1


def test_send_batch_reports_failure_honestly_for_an_unintegrated_country(client, db_session, monkeypatch):
    """A subscriber's country can only have reached the table via
    /subscribe, which already gates on SUPPORTED_COUNTRIES - but this
    confirms send-batch itself doesn't silently swallow a
    ProviderNotIntegrated country if one ever ends up in the table
    (e.g. a supported-country list change that leaves old rows behind)."""
    monkeypatch.setenv("DIGEST_TRIGGER_SECRET", DIGEST_SECRET)
    db_session.add(
        PracticeSmsSubscriber(phone_number="+23276000002", country="SL", subject_id=None, verified=True, opted_in=True)
    )
    db_session.commit()

    response = client.post("/api/practice-sms/send-batch", headers={"X-Digest-Secret": DIGEST_SECRET})
    body = response.json()
    assert body["failed"] == 1
