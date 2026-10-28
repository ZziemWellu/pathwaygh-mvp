import hashlib
import hmac
import json
from datetime import datetime, timedelta

import pytest

import modules.licence.service as licence
import modules.tutor.router as tutor_router
from models.certificate import Certificate
from models.course import Course, Lesson
from models.payment_transaction import PaymentTransaction
from models.school import School
from models.school_licence import SchoolLicence
from models.user import User
from modules.school.digest import eligible_admins_for_digest
from tests.conftest import register_user
from tests.test_payment import _FakePaystackResponse, _fake_initialize_success, _fake_verify

SECRET = "sk_test_fake"


def _register(client, email):
    data = register_user(client, email=email, country="GH")
    return {"Authorization": f"Bearer {data['token']}"}, data["user"]


def _create_school(client, email):
    headers, user = _register(client, email)
    response = client.post("/api/school/create", json={"name": "Licence School"}, headers=headers)
    assert response.status_code == 200
    return headers, user, response.json()["school"]


def _join(client, email, join_code):
    headers, user = _register(client, email)
    return client.post("/api/school/join", json={"join_code": join_code}, headers=headers), headers, user


def _end_trial(db_session, school_id):
    db_session.query(SchoolLicence).filter(SchoolLicence.school_id == school_id).delete()
    db_session.commit()


def _add_period(db_session, school_id, kind="term", seats=22, starts_at=None, ends_at=None, price=3000):
    now = licence.utcnow()
    row = SchoolLicence(
        school_id=school_id,
        kind=kind,
        seats=seats,
        price_per_seat_minor=price,
        currency="GHS",
        starts_at=starts_at or now - timedelta(days=10),
        ends_at=ends_at or now + timedelta(days=50),
    )
    db_session.add(row)
    db_session.commit()
    return row


def _paystack(monkeypatch, verify=None):
    monkeypatch.setenv("PAYSTACK_SECRET_KEY", SECRET)
    monkeypatch.setattr("modules.payment.providers.paystack.requests.post", _fake_initialize_success)
    if verify:
        monkeypatch.setattr("modules.payment.providers.paystack.requests.get", verify)


# --- Academic periods -------------------------------------------------------

@pytest.mark.parametrize(
    "moment, start, end",
    [
        (datetime(2026, 10, 28), datetime(2026, 9, 1), datetime(2027, 1, 1)),
        (datetime(2027, 2, 14), datetime(2027, 1, 1), datetime(2027, 5, 1)),
        (datetime(2027, 8, 31, 23), datetime(2027, 5, 1), datetime(2027, 9, 1)),
    ],
)
def test_terms_are_sep_dec_jan_apr_may_aug(moment, start, end):
    assert licence.term_bounds(moment) == (start, end)


def test_academic_year_runs_september_to_august():
    assert licence.year_bounds(datetime(2026, 10, 1)) == (datetime(2026, 9, 1), datetime(2027, 9, 1))
    assert licence.year_bounds(datetime(2027, 3, 1)) == (datetime(2026, 9, 1), datetime(2027, 9, 1))


def test_buying_late_in_a_period_also_covers_the_next_one():
    # Mid-term: just this term.
    assert licence.period_end("term", datetime(2026, 10, 28)) == datetime(2027, 1, 1)
    # Under 30 days left: this term and the next.
    assert licence.period_end("term", datetime(2026, 12, 10)) == datetime(2027, 5, 1)
    assert licence.period_end("year", datetime(2026, 10, 28)) == datetime(2027, 9, 1)
    # Under 60 days left in the year: the next year too.
    assert licence.period_end("year", datetime(2027, 7, 15)) == datetime(2028, 9, 1)


def test_valid_until_is_the_inclusive_last_day():
    assert licence.last_day(datetime(2027, 1, 1)) == "2026-12-31"


# --- Plans --------------------------------------------------------------------

def test_a_new_school_starts_on_a_free_first_term_with_full_features(client):
    headers, _, school = _create_school(client, "lic_trial@test.com")
    _join(client, "lic_trial_student@test.com", school["join_code"])

    data = client.get("/api/school/dashboard", headers=headers).json()
    assert data["licence"]["plan"] == "trial"
    assert data["licence"]["premium"] is True
    assert data["licence"]["seat_limit"] is None
    assert data["licence"]["valid_until"] is not None
    assert all("quizzes_taken" in row for row in data["roster"])


def test_the_free_plan_keeps_the_roster_but_hides_per_student_stats(client, db_session):
    headers, _, school = _create_school(client, "lic_free@test.com")
    _join(client, "lic_free_student@test.com", school["join_code"])
    _end_trial(db_session, school["id"])

    data = client.get("/api/school/dashboard", headers=headers).json()
    assert data["licence"]["plan"] == "free"
    assert data["licence"]["seat_limit"] == licence.FREE_STUDENT_LIMIT
    assert {row["full_name"] for row in data["roster"]}  # still listed
    assert all("quizzes_taken" not in row for row in data["roster"])
    assert data["summary"]["student_count"] == 2  # summary stays free


def test_free_plan_blocks_joining_past_the_student_limit(client, db_session, monkeypatch):
    monkeypatch.setattr(licence, "FREE_STUDENT_LIMIT", 1)
    _, _, school = _create_school(client, "lic_limit@test.com")
    _end_trial(db_session, school["id"])

    first, _, _ = _join(client, "lic_limit_1@test.com", school["join_code"])
    assert first.status_code == 200
    second, _, user = _join(client, "lic_limit_2@test.com", school["join_code"])
    assert second.status_code == 403
    assert "free plan" in second.json()["detail"]
    # Turned away from the school, not from learning: still unlinked.
    assert db_session.query(User).filter(User.id == user["id"]).first().school_id is None


def test_paid_plan_blocks_joining_once_every_seat_is_used(client, db_session):
    _, _, school = _create_school(client, "lic_seats@test.com")
    _end_trial(db_session, school["id"])
    _add_period(db_session, school["id"], seats=1)

    assert _join(client, "lic_seats_1@test.com", school["join_code"])[0].status_code == 200
    blocked = _join(client, "lic_seats_2@test.com", school["join_code"])[0]
    assert blocked.status_code == 403
    assert "seats" in blocked.json()["detail"]


def test_top_up_seats_add_to_the_running_period(client, db_session):
    headers, _, school = _create_school(client, "lic_topup_seats@test.com")
    _end_trial(db_session, school["id"])
    period = _add_period(db_session, school["id"], seats=22)
    _add_period(db_session, school["id"], kind="top_up", seats=5, ends_at=period.ends_at)

    status = client.get("/api/payment/quote", headers=headers).json()["licence"]
    assert status["plan"] == "paid"
    assert status["seat_limit"] == 27


def test_an_expired_licence_keeps_features_for_the_grace_period_then_goes_free(db_session, client):
    _, _, school_out = _create_school(client, "lic_grace@test.com")
    _end_trial(db_session, school_out["id"])
    school = db_session.query(School).filter(School.id == school_out["id"]).first()
    now = licence.utcnow()
    _add_period(db_session, school.id, starts_at=now - timedelta(days=100), ends_at=now - timedelta(days=3))

    grace = licence.licence_status(db_session, school)
    assert grace["plan"] == "grace"
    assert grace["premium"] is True
    assert grace["grace_until"] is not None

    later = licence.licence_status(db_session, school, now=now + timedelta(days=licence.GRACE_DAYS))
    assert later["plan"] == "free"
    assert later["premium"] is False


# --- Pricing ------------------------------------------------------------------

def test_quote_offers_a_term_and_a_cheaper_year(client):
    headers, _, _ = _create_school(client, "lic_quote@test.com")
    data = client.get("/api/payment/quote", headers=headers).json()
    term, year = data["options"]
    assert (term["kind"], term["amount_minor_units"]) == ("term", 20 * 3000)
    assert (year["kind"], year["amount_minor_units"]) == ("year", 20 * 8000)
    assert year["amount_minor_units"] < 3 * term["amount_minor_units"]


def test_large_schools_get_the_volume_rate(client, db_session, monkeypatch):
    _, _, school_out = _create_school(client, "lic_volume@test.com")
    school = db_session.query(School).filter(School.id == school_out["id"]).first()
    monkeypatch.setattr(licence, "student_count", lambda db, school_id: 600)

    term = licence.quote_period(db_session, school, "term")
    assert term["price_per_student_minor"] == 2500
    assert term["amount_minor_units"] == 600 * 2500
    assert term["seats"] == 660


def test_paying_during_the_free_term_buys_the_next_term_not_an_overlap(client, db_session):
    _, _, school_out = _create_school(client, "lic_after_trial@test.com")
    school = db_session.query(School).filter(School.id == school_out["id"]).first()
    trial = db_session.query(SchoolLicence).filter(SchoolLicence.school_id == school.id).one()

    quote = licence.quote_period(db_session, school, "term")
    assert quote["starts_at"] == trial.ends_at
    assert quote["ends_at"] > trial.ends_at


def test_top_up_is_charged_only_for_the_rest_of_the_period(client, db_session):
    _, _, school_out = _create_school(client, "lic_topup_price@test.com")
    _end_trial(db_session, school_out["id"])
    school = db_session.query(School).filter(School.id == school_out["id"]).first()
    now = licence.utcnow()
    # Exactly half of a GHS 30 period left -> GHS 15 a seat.
    _add_period(db_session, school.id, starts_at=now - timedelta(days=50), ends_at=now + timedelta(days=50))

    quote = licence.quote_top_up(db_session, school, 4, now=now)
    assert quote["price_per_student_minor"] == 1500
    assert quote["amount_minor_units"] == 6000


def test_top_up_needs_an_active_paid_period(client):
    headers, _, _ = _create_school(client, "lic_topup_none@test.com")
    response = client.post(
        "/api/payment/initialize", json={"provider": "paystack", "plan": "top_up", "extra_seats": 3}, headers=headers
    )
    assert response.status_code == 400


# --- Payment confirmation -----------------------------------------------------

def _initialize(client, headers, plan="year"):
    response = client.post("/api/payment/initialize", json={"provider": "paystack", "plan": plan}, headers=headers)
    assert response.status_code == 200
    return response.json()


def test_a_confirmed_payment_activates_the_licence_exactly_once(client, db_session, monkeypatch):
    _paystack(monkeypatch, verify=_fake_verify(amount=160000))
    headers, _, school = _create_school(client, "lic_activate@test.com")
    _end_trial(db_session, school["id"])
    reference = _initialize(client, headers)["reference"]

    first = client.get(f"/api/payment/verify/{reference}", headers=headers).json()
    second = client.get(f"/api/payment/verify/{reference}", headers=headers).json()
    assert first["status"] == "success"
    assert first["licence"]["plan"] == "paid"
    assert first["licence"]["seat_limit"] == 22
    assert second["licence"] == first["licence"]
    assert db_session.query(SchoolLicence).filter(SchoolLicence.kind == "year").count() == 1


def test_a_payment_for_less_than_quoted_grants_nothing(client, db_session, monkeypatch):
    _paystack(monkeypatch, verify=_fake_verify(amount=100))
    headers, _, school = _create_school(client, "lic_mismatch@test.com")
    _end_trial(db_session, school["id"])
    reference = _initialize(client, headers)["reference"]

    data = client.get(f"/api/payment/verify/{reference}", headers=headers).json()
    assert data["status"] == "amount_mismatch"
    assert data["licence"]["plan"] == "free"
    assert db_session.query(SchoolLicence).count() == 0


def test_a_failed_payment_grants_nothing(client, db_session, monkeypatch):
    _paystack(monkeypatch, verify=_fake_verify(status="failed"))
    headers, _, school = _create_school(client, "lic_failed@test.com")
    _end_trial(db_session, school["id"])
    reference = _initialize(client, headers)["reference"]

    assert client.get(f"/api/payment/verify/{reference}", headers=headers).json()["status"] == "failed"
    assert db_session.query(SchoolLicence).count() == 0


def _webhook(client, payload, secret=SECRET, signature=None):
    raw = json.dumps(payload).encode()
    signature = signature or hmac.new(secret.encode(), raw, hashlib.sha512).hexdigest()
    return client.post(
        "/api/payment/webhook/paystack",
        content=raw,
        headers={"x-paystack-signature": signature, "Content-Type": "application/json"},
    )


def test_webhook_rejects_a_bad_signature(client, monkeypatch):
    monkeypatch.setenv("PAYSTACK_SECRET_KEY", SECRET)
    response = _webhook(client, {"event": "charge.success", "data": {"reference": "x"}}, signature="nope")
    assert response.status_code == 401


def test_webhook_activates_the_licence_even_if_the_admin_never_returns(client, db_session, monkeypatch):
    _paystack(monkeypatch, verify=_fake_verify(amount=160000))
    headers, _, school = _create_school(client, "lic_webhook@test.com")
    _end_trial(db_session, school["id"])
    reference = _initialize(client, headers)["reference"]

    response = _webhook(client, {"event": "charge.success", "data": {"reference": reference}})
    assert response.status_code == 200
    assert response.json()["status"] == "success"
    # Replayed delivery: still one licence.
    assert _webhook(client, {"event": "charge.success", "data": {"reference": reference}}).status_code == 200
    assert db_session.query(SchoolLicence).filter(SchoolLicence.kind == "year").count() == 1


def test_webhook_outcome_comes_from_paystack_not_the_event_body(client, db_session, monkeypatch):
    """A validly signed event can't grant a licence on its own say-so - the
    outcome is re-read from Paystack's verify API."""
    _paystack(monkeypatch, verify=_fake_verify(status="abandoned"))
    headers, _, school = _create_school(client, "lic_webhook_verify@test.com")
    _end_trial(db_session, school["id"])
    reference = _initialize(client, headers)["reference"]

    response = _webhook(client, {"event": "charge.success", "data": {"reference": reference, "status": "success"}})
    assert response.json()["status"] == "abandoned"
    assert db_session.query(SchoolLicence).count() == 0


def test_webhook_acknowledges_events_it_does_not_handle(client, monkeypatch):
    monkeypatch.setenv("PAYSTACK_SECRET_KEY", SECRET)
    assert _webhook(client, {"event": "transfer.success", "data": {}}).json()["ignored"] == "transfer.success"
    assert _webhook(client, {"event": "charge.success", "data": {"reference": "pay_unknown"}}).status_code == 200


def test_webhook_is_closed_when_payments_are_not_configured(client, monkeypatch):
    monkeypatch.delenv("PAYSTACK_SECRET_KEY", raising=False)
    assert _webhook(client, {"event": "charge.success"}).status_code == 503


def test_verify_survives_a_provider_error_without_granting(client, db_session, monkeypatch):
    def _error(*args, **kwargs):
        return _FakePaystackResponse({"status": False, "message": "down"}, ok=False)

    _paystack(monkeypatch, verify=_error)
    headers, _, school = _create_school(client, "lic_verify_error@test.com")
    _end_trial(db_session, school["id"])
    reference = _initialize(client, headers)["reference"]

    assert client.get(f"/api/payment/verify/{reference}", headers=headers).status_code == 502
    assert db_session.query(PaymentTransaction).one().status == "pending"
    assert db_session.query(SchoolLicence).count() == 0


# --- What the licence unlocks ---------------------------------------------------

def test_csv_export_is_licensed_and_formula_safe(client, db_session):
    headers, _, school = _create_school(client, "lic_csv@test.com")
    _, student_headers, _ = _join(client, "lic_csv_student@test.com", school["join_code"])
    client.put("/api/profile/me", json={"full_name": "=HYPERLINK(1)"}, headers=student_headers)

    response = client.get("/api/school/dashboard/export.csv", headers=headers)
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/csv")
    assert "'=HYPERLINK(1)" in response.text

    _end_trial(db_session, school["id"])
    assert client.get("/api/school/dashboard/export.csv", headers=headers).status_code == 402


def test_school_digest_goes_only_to_licensed_schools(client, db_session):
    headers, admin, school = _create_school(client, "lic_digest@test.com")
    client.put("/api/profile/me", json={"phone": "+233241234567", "school_digest_whatsapp_opt_in": True}, headers=headers)
    db_admin = db_session.query(User).filter(User.id == admin["id"]).first()
    assert db_admin in eligible_admins_for_digest(db_session)

    _end_trial(db_session, school["id"])
    assert db_admin not in eligible_admins_for_digest(db_session)


class _FakeModels:
    def generate_content(self, **kwargs):
        return type("R", (), {"text": "ok"})()


def _tutor_limit_calls(client, monkeypatch, headers):
    calls = []
    monkeypatch.setattr(tutor_router, "get_gemini_client", lambda: type("C", (), {"models": _FakeModels()})())
    monkeypatch.setattr(tutor_router, "hit_per_account", lambda *a, **k: calls.append(a))
    assert client.post("/api/tutor/chat", json={"message": "hi"}, headers=headers).status_code == 200
    return calls


def test_licensed_school_students_skip_the_standard_tutor_allowance(client, db_session, monkeypatch):
    _, _, school = _create_school(client, "lic_tutor@test.com")
    _, student_headers, _ = _join(client, "lic_tutor_student@test.com", school["join_code"])
    assert _tutor_limit_calls(client, monkeypatch, student_headers) == []

    _end_trial(db_session, school["id"])
    calls = _tutor_limit_calls(client, monkeypatch, student_headers)
    assert calls and calls[0][0] == licence.TUTOR_LIMIT_FREE


def test_certificates_carry_the_school_name_only_for_licensed_schools(client, db_session):
    _, _, school = _create_school(client, "lic_cert@test.com")
    _, student_headers, _ = _join(client, "lic_cert_student@test.com", school["join_code"])

    def complete(slug):
        course = Course(slug=slug, title="Cert", description="d", level="jhs")
        db_session.add(course)
        db_session.flush()
        lesson = Lesson(course_id=course.id, slug=f"{slug}-1", title="L", lesson_type="video", order_index=0)
        db_session.add(lesson)
        db_session.commit()
        client.post(f"/api/learn/lessons/{lesson.slug}/progress", json={"watched": True}, headers=student_headers)
        return db_session.query(Certificate).filter(Certificate.course_id == course.id).one()

    assert complete("lic-cert-a").school_name == "Licence School"
    _end_trial(db_session, school["id"])
    assert complete("lic-cert-b").school_name is None
