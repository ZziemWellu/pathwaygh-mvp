from models.payment_transaction import PaymentTransaction
from models.school import School
from tests.conftest import register_user


def _register(client, email, country="GH"):
    data = register_user(client, email=email, country=country)
    return {"Authorization": f"Bearer {data['token']}"}, data["user"]


def _create_school_admin(client, email, country="GH"):
    headers, user = _register(client, email, country=country)
    response = client.post("/api/school/create", json={"name": "Test School"}, headers=headers)
    assert response.status_code == 200
    school = response.json()["school"]
    return headers, user, school


def _join_school(client, email, join_code, country="GH"):
    headers, user = _register(client, email, country=country)
    response = client.post("/api/school/join", json={"join_code": join_code}, headers=headers)
    assert response.status_code == 200
    return headers, user


class _FakePaystackResponse:
    def __init__(self, payload, ok=True):
        self._payload = payload
        self.ok = ok
        self.text = str(payload)

    def json(self):
        return self._payload


def _fake_initialize_success(*args, **kwargs):
    return _FakePaystackResponse(
        {
            "status": True,
            "message": "Authorization URL created",
            "data": {
                "authorization_url": "https://checkout.paystack.com/fake123",
                "access_code": "fake_access_code",
                "reference": kwargs["json"]["reference"],
            },
        }
    )


def _fake_verify_success(*args, **kwargs):
    return _FakePaystackResponse(
        {"status": True, "message": "Verification successful", "data": {"status": "success"}}
    )


def _fake_verify_failed(*args, **kwargs):
    return _FakePaystackResponse(
        {"status": True, "message": "Verification successful", "data": {"status": "failed"}}
    )


def test_initialize_requires_auth(client):
    response = client.post("/api/payment/initialize", json={})
    assert response.status_code == 401


def test_initialize_requires_school_admin(client):
    headers, _ = _register(client, "not_admin@test.com")
    response = client.post("/api/payment/initialize", json={}, headers=headers)
    assert response.status_code == 403


def test_initialize_computes_amount_server_side_from_real_student_count(client, monkeypatch):
    """The amount is never accepted from the client - it must be derived
    from the school's actual enrolled-student count and the documented
    GHS 80/student/year price, even if a request tried to smuggle its own
    amount in the body."""
    monkeypatch.setattr("modules.payment.providers.paystack.requests.post", _fake_initialize_success)
    monkeypatch.setenv("PAYSTACK_SECRET_KEY", "sk_test_fake")

    admin_headers, _, school = _create_school_admin(client, "payment_admin@test.com")
    _join_school(client, "payment_student1@test.com", school["join_code"])
    _join_school(client, "payment_student2@test.com", school["join_code"])

    # Extraneous fields (an attempted amount override) must simply be
    # ignored by Pydantic/the endpoint - it isn't part of the request
    # schema at all.
    response = client.post(
        "/api/payment/initialize", json={"provider": "paystack", "amount_minor_units": 1}, headers=admin_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert data["currency"] == "GHS"
    # 2 students * GHS 80.00 (8000 pesewas) = 16000, not the smuggled "1".
    assert data["amount_minor_units"] == 16000
    assert data["checkout_url"] == "https://checkout.paystack.com/fake123"


def test_initialize_with_zero_students_still_bills_for_at_least_one(client, monkeypatch):
    monkeypatch.setattr("modules.payment.providers.paystack.requests.post", _fake_initialize_success)
    monkeypatch.setenv("PAYSTACK_SECRET_KEY", "sk_test_fake")

    admin_headers, _, _ = _create_school_admin(client, "payment_solo_admin@test.com")

    response = client.post("/api/payment/initialize", json={"provider": "paystack"}, headers=admin_headers)
    assert response.status_code == 200
    assert response.json()["amount_minor_units"] == 8000


def test_initialize_rejects_a_country_with_no_documented_price(client, db_session):
    admin_headers, _, school_out = _create_school_admin(client, "payment_sl_admin@test.com", country="SL")
    # register_user's country selection sets the user's own country, but
    # a school's own country is independently stored on the School row -
    # force it to a country with no price entry to exercise the guard.
    school = db_session.query(School).filter(School.id == school_out["id"]).first()
    school.country = "SL"
    db_session.commit()

    response = client.post("/api/payment/initialize", json={"provider": "paystack"}, headers=admin_headers)
    assert response.status_code == 400
    assert "no institutional license price" in response.json()["detail"].lower()


def test_initialize_with_an_unintegrated_provider_fails_honestly_not_silently(client):
    admin_headers, _, _ = _create_school_admin(client, "payment_flutterwave_admin@test.com")
    response = client.post("/api/payment/initialize", json={"provider": "flutterwave"}, headers=admin_headers)
    assert response.status_code == 503
    assert "not yet integrated" in response.json()["detail"].lower()


def test_verify_updates_stored_transaction_status(client, monkeypatch):
    monkeypatch.setattr("modules.payment.providers.paystack.requests.post", _fake_initialize_success)
    monkeypatch.setattr("modules.payment.providers.paystack.requests.get", _fake_verify_success)
    monkeypatch.setenv("PAYSTACK_SECRET_KEY", "sk_test_fake")

    admin_headers, _, _ = _create_school_admin(client, "payment_verify_admin@test.com")
    initialize = client.post("/api/payment/initialize", json={"provider": "paystack"}, headers=admin_headers)
    reference = initialize.json()["reference"]

    verify = client.get(f"/api/payment/verify/{reference}", headers=admin_headers)
    assert verify.status_code == 200
    assert verify.json()["status"] == "success"


def test_verify_reflects_a_failed_transaction_too(client, monkeypatch):
    monkeypatch.setattr("modules.payment.providers.paystack.requests.post", _fake_initialize_success)
    monkeypatch.setattr("modules.payment.providers.paystack.requests.get", _fake_verify_failed)
    monkeypatch.setenv("PAYSTACK_SECRET_KEY", "sk_test_fake")

    admin_headers, _, _ = _create_school_admin(client, "payment_failed_admin@test.com")
    initialize = client.post("/api/payment/initialize", json={"provider": "paystack"}, headers=admin_headers)
    reference = initialize.json()["reference"]

    verify = client.get(f"/api/payment/verify/{reference}", headers=admin_headers)
    assert verify.status_code == 200
    assert verify.json()["status"] == "failed"


def test_verify_rejects_a_transaction_belonging_to_another_school(client, monkeypatch):
    monkeypatch.setattr("modules.payment.providers.paystack.requests.post", _fake_initialize_success)
    monkeypatch.setenv("PAYSTACK_SECRET_KEY", "sk_test_fake")

    admin_a_headers, _, _ = _create_school_admin(client, "payment_school_a_admin@test.com")
    admin_b_headers, _, _ = _create_school_admin(client, "payment_school_b_admin@test.com")

    initialize = client.post("/api/payment/initialize", json={"provider": "paystack"}, headers=admin_a_headers)
    reference = initialize.json()["reference"]

    verify = client.get(f"/api/payment/verify/{reference}", headers=admin_b_headers)
    assert verify.status_code == 403


def test_verify_requires_school_admin(client):
    headers, _ = _register(client, "payment_not_admin_verify@test.com")
    response = client.get("/api/payment/verify/pay_nonexistent", headers=headers)
    assert response.status_code == 403


def test_a_failed_paystack_call_marks_the_transaction_failed_not_silently_lost(client, db_session, monkeypatch):
    def _fake_error(*args, **kwargs):
        return _FakePaystackResponse({"status": False, "message": "Invalid key"}, ok=False)

    monkeypatch.setattr("modules.payment.providers.paystack.requests.post", _fake_error)
    monkeypatch.setenv("PAYSTACK_SECRET_KEY", "sk_test_fake")

    admin_headers, _, _ = _create_school_admin(client, "payment_error_admin@test.com")
    response = client.post("/api/payment/initialize", json={"provider": "paystack"}, headers=admin_headers)
    assert response.status_code == 502

    transactions = db_session.query(PaymentTransaction).all()
    assert len(transactions) == 1
    assert transactions[0].status == "failed"
