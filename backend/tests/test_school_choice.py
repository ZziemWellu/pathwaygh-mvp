import pytest

from modules.school_choice.router import SchoolChoice, check_choices


def row(name, category="C", mode="boarding", programme="General Science"):
    return SchoolChoice(school=name, category=category, mode=mode, programme=programme)


def valid_list():
    return [
        row("A one", "A", "boarding"),
        row("A two", "A", "day"),
        row("B one", "B", "boarding"),
        row("B two", "B", "boarding"),
        row("B three", "B", "day"),
        row("C one", "C", "boarding"),
        row("C two", "C", "boarding"),
        row("C three", "C", "day"),
    ]


def signup(client, level="jhs", country="GH", email="s@test.com"):
    response = client.post(
        "/api/auth/register",
        json={"email": email, "full_name": "A", "password": "secret123", "country": country, "level": level, "consent_confirmed": True, "guardian_email": "g@test.com"},
    )
    return {"Authorization": f"Bearer {response.json()['token']}"}


def test_a_list_following_the_2026_rules_is_complete():
    check = check_choices(valid_list())
    assert check["complete"] is True
    assert check["errors"] == []
    assert check["counts"] == {"total": 8, "A": 2, "B": 3, "C": 3, "boarding": 5, "day": 3}


def test_a_list_with_only_category_c_is_allowed():
    choices = [row(f"C{i}", "C", "boarding" if i < 5 else "day") for i in range(8)]
    assert check_choices(choices)["complete"] is True


def test_three_category_a_schools_is_an_error():
    choices = valid_list()
    choices[2].category = "A"
    errors = check_choices(choices)["errors"]
    assert any("at most 2 Category A" in e for e in errors)


def test_four_category_b_schools_is_an_error():
    choices = valid_list()
    choices[5].category = "B"
    assert any("at most 3 Category B" in e for e in check_choices(choices)["errors"])


def test_six_boarding_schools_is_an_error():
    choices = valid_list()
    choices[7].mode = "boarding"
    assert any("at most 5 boarding" in e for e in check_choices(choices)["errors"])


def test_four_day_schools_is_an_error():
    choices = valid_list()
    choices[0].mode = "day"
    assert any("at most 3 day" in e for e in check_choices(choices)["errors"])


def test_the_same_school_twice_is_an_error_whatever_its_case_or_spacing():
    choices = valid_list()
    choices[7].school = "  a   ONE "
    assert any("more than once" in e for e in check_choices(choices)["errors"])


def test_a_partial_list_gets_reminders_not_errors():
    check = check_choices([row("Only one"), SchoolChoice()])
    assert check["valid"] is True
    assert check["complete"] is False
    assert check["errors"] == []
    assert check["reminders"] == ["Add 7 more schools to reach 8."]


def test_unfinished_rows_get_a_reminder():
    choices = valid_list()
    choices[0].programme = ""
    choices[1].category = None
    assert any("for 2 schools" in r for r in check_choices(choices)["reminders"])


def test_rules_name_their_source_and_year(client):
    rules = client.get("/api/school-choice/rules").json()["rules"]
    assert rules["year"] == 2026
    assert rules["source_url"].startswith("https://")


def test_draft_saves_and_comes_back(client):
    headers = signup(client)
    choices = [c.model_dump() for c in valid_list()]
    saved = client.put("/api/school-choice/draft", json={"choices": choices}, headers=headers)
    assert saved.status_code == 200
    assert saved.json()["check"]["complete"] is True
    loaded = client.get("/api/school-choice/draft", headers=headers).json()
    assert loaded["choices"] == choices


def test_a_rule_breaking_draft_still_saves(client):
    headers = signup(client)
    choices = [c.model_dump() for c in valid_list()]
    choices[2]["category"] = "A"
    saved = client.put("/api/school-choice/draft", json={"choices": choices}, headers=headers)
    assert saved.status_code == 200
    assert saved.json()["check"]["valid"] is False
    assert client.get("/api/school-choice/draft", headers=headers).json()["choices"][2]["category"] == "A"


def test_more_than_eight_rows_is_rejected(client):
    headers = signup(client)
    choices = [row(f"S{i}").model_dump() for i in range(9)]
    assert client.put("/api/school-choice/draft", json={"choices": choices}, headers=headers).status_code == 422


def test_draft_requires_sign_in(client):
    assert client.get("/api/school-choice/draft").status_code == 401


@pytest.mark.parametrize("level,country", [("shs", "GH"), ("primary", "GH"), ("jhs", "NG")])
def test_helper_is_only_for_jhs_students_in_ghana(client, level, country):
    headers = signup(client, level=level, country=country)
    assert client.get("/api/school-choice/draft", headers=headers).status_code == 403
    assert client.put("/api/school-choice/draft", json={"choices": []}, headers=headers).status_code == 403
