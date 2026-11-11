from models.payment_transaction import PaymentTransaction
from models.school import School
from models.school_licence import SchoolLicence
from modules.licence import service
from tests.conftest import register_user


def _school_with_payment(client, db_session):
    data = register_user(client, email="head@race-test.com", level="shs")
    headers = {"Authorization": f"Bearer {data['token']}"}
    client.post("/api/school/create", json={"name": "Race School", "country": "GH"}, headers=headers)
    school = db_session.query(School).one()
    transaction = PaymentTransaction(
        reference="pay_race0001",
        provider="paystack",
        status="success",
        amount_minor_units=60000,
        currency="GHS",
        purpose="school_licence_term",
        licence_kind="term",
        licence_seats=22,
        price_per_seat_minor=3000,
        school_id=school.id,
        initiated_by_id=data["user"]["id"],
    )
    db_session.add(transaction)
    db_session.commit()
    return transaction


def test_confirming_twice_grants_one_licence(client, db_session):
    transaction = _school_with_payment(client, db_session)
    first = service.activate_from_transaction(db_session, transaction)
    second = service.activate_from_transaction(db_session, transaction)
    assert first.id == second.id
    assert db_session.query(SchoolLicence).filter(SchoolLicence.transaction_id == transaction.id).count() == 1


def test_a_simultaneous_confirmation_returns_the_licence_instead_of_failing(client, db_session, monkeypatch):
    # The browser's return check and Paystack's webhook can both get past the
    # "already granted?" check before either saves. The second save then hits
    # the unique constraint, which must read as success, not an error.
    transaction = _school_with_payment(client, db_session)
    granted = service.activate_from_transaction(db_session, transaction)

    real = service._licence_for_transaction
    calls = {"n": 0}

    def miss_once(db, txn):
        calls["n"] += 1
        return None if calls["n"] == 1 else real(db, txn)

    monkeypatch.setattr(service, "_licence_for_transaction", miss_once)
    again = service.activate_from_transaction(db_session, transaction)

    assert again.id == granted.id
    assert db_session.query(SchoolLicence).filter(SchoolLicence.transaction_id == transaction.id).count() == 1
