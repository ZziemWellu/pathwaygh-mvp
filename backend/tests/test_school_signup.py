import pytest

from models.school import School
from models.school_licence import SchoolLicence
from models.user import User


def school_signup(client, **overrides):
    body = {
        "school_name": "Accra Academy",
        "full_name": "Ama Mensah",
        "role": "headteacher",
        "email": "head@school.test",
        "phone": "024 123 4567",
        "password": "password123",
        "country": "GH",
        "authorised": True,
    }
    body.update(overrides)
    return client.post("/api/school/register", json=body)


def test_signup_creates_the_school_and_makes_the_person_its_admin(client, db_session):
    response = school_signup(client)
    assert response.status_code == 200, response.text
    user = response.json()["user"]
    assert user["is_school_admin"] is True
    assert user["level"] is None
    assert user["guardian_email"] is None

    school = db_session.query(School).one()
    assert school.name == "Accra Academy"
    assert school.created_by_id == user["id"]
    stored = db_session.get(User, user["id"])
    assert stored.school_id == school.id
    assert stored.phone == "+233241234567"
    assert stored.school == "Accra Academy"


def test_new_school_gets_its_free_first_term(client, db_session):
    school_signup(client)
    assert db_session.query(SchoolLicence).filter(SchoolLicence.kind == "trial").count() == 1


def test_the_admin_is_signed_in_and_lands_on_school_tools(client):
    token = school_signup(client).json()["token"]
    headers = {"Authorization": f"Bearer {token}"}
    assert client.get("/api/school/dashboard", headers=headers).status_code == 200
    assert client.get("/api/dashboard/summary", headers=headers).json()["next_step"] == {"kind": "school_admin"}


def test_no_consent_code_is_sent_for_an_adult(client, caplog):
    school_signup(client)
    assert "verification code" not in caplog.text
    assert "share this code" not in caplog.text


def test_must_confirm_authorisation(client):
    assert school_signup(client, authorised=False).status_code == 400


@pytest.mark.parametrize("overrides", [{"email": "HEAD@school.test"}, {"email": "head@school.test", "school_name": "Other"}])
def test_an_email_already_in_use_is_refused(client, overrides):
    school_signup(client)
    response = school_signup(client, **overrides)
    assert response.status_code == 400
    assert "already has an account" in response.json()["detail"]


def test_a_student_email_cannot_be_reused_for_a_school(client):
    from tests.conftest import register_user

    register_user(client, email="kid@test.com")
    assert school_signup(client, email="kid@test.com").status_code == 400


def test_phone_must_belong_to_the_country(client):
    assert school_signup(client, phone="+14155552671").status_code == 400


@pytest.mark.parametrize("field", ["school_name", "full_name", "email", "password"])
def test_required_fields(client, field):
    body_without = {field: ""}
    assert school_signup(client, **body_without).status_code in (400, 422)


def test_unknown_role_is_rejected(client):
    assert school_signup(client, role="pupil").status_code == 422
