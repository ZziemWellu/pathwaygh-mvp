from datetime import timedelta

from models.flashcard import Flashcard, today_utc
from modules.flashcards.spaced_repetition import DEFAULT_EASE_FACTOR, MIN_EASE_FACTOR, review
from tests.conftest import register_user


def _register(client, email):
    data = register_user(client, email=email, country="GH")
    return {"Authorization": f"Bearer {data['token']}"}, data["user"]


# --- spaced_repetition.py (pure SM-2 math) ------------------------------


def test_first_good_review_sets_interval_to_one_day():
    result = review("good", DEFAULT_EASE_FACTOR, 0, 0)
    assert result.interval_days == 1
    assert result.repetitions == 1


def test_second_good_review_sets_interval_to_six_days():
    first = review("good", DEFAULT_EASE_FACTOR, 0, 0)
    second = review("good", first.ease_factor, first.interval_days, first.repetitions)
    assert second.interval_days == 6
    assert second.repetitions == 2


def test_third_good_review_multiplies_interval_by_ease_factor():
    first = review("good", DEFAULT_EASE_FACTOR, 0, 0)
    second = review("good", first.ease_factor, first.interval_days, first.repetitions)
    third = review("good", second.ease_factor, second.interval_days, second.repetitions)
    assert third.interval_days == round(second.interval_days * second.ease_factor)
    assert third.repetitions == 3


def test_again_resets_repetitions_and_schedules_tomorrow():
    first = review("good", DEFAULT_EASE_FACTOR, 0, 0)
    second = review("good", first.ease_factor, first.interval_days, first.repetitions)
    lapsed = review("again", second.ease_factor, second.interval_days, second.repetitions)
    assert lapsed.repetitions == 0
    assert lapsed.interval_days == 1


def test_easy_increases_ease_factor_more_than_good():
    easy = review("easy", DEFAULT_EASE_FACTOR, 0, 0)
    good = review("good", DEFAULT_EASE_FACTOR, 0, 0)
    assert easy.ease_factor > good.ease_factor


def test_again_decreases_ease_factor():
    result = review("again", DEFAULT_EASE_FACTOR, 0, 0)
    assert result.ease_factor < DEFAULT_EASE_FACTOR


def test_ease_factor_never_drops_below_the_floor():
    ease = DEFAULT_EASE_FACTOR
    interval = 0
    reps = 0
    for _ in range(20):
        result = review("again", ease, interval, reps)
        ease, interval, reps = result.ease_factor, result.interval_days, result.repetitions
    assert ease >= MIN_EASE_FACTOR


def test_unknown_rating_raises():
    import pytest

    with pytest.raises(ValueError):
        review("terrible", DEFAULT_EASE_FACTOR, 0, 0)


# --- router.py -----------------------------------------------------------


def test_create_flashcard_requires_auth(client):
    response = client.post("/api/flashcards", json={"front": "Q", "back": "A"})
    assert response.status_code == 401


def test_create_flashcard_is_due_immediately(client):
    headers, _ = _register(client, "flash_create@test.com")
    response = client.post("/api/flashcards", json={"front": "Capital of Ghana?", "back": "Accra"}, headers=headers)
    assert response.status_code == 200
    card = response.json()["card"]
    assert card["due_date"] == today_utc().isoformat()

    due = client.get("/api/flashcards/due", headers=headers)
    assert due.json()["total_due"] == 1


def test_create_flashcard_rejects_blank_fields(client):
    headers, _ = _register(client, "flash_blank@test.com")
    response = client.post("/api/flashcards", json={"front": "  ", "back": "A"}, headers=headers)
    assert response.status_code == 400


def test_list_flashcards_only_returns_the_caller_own_cards(client):
    headers1, _ = _register(client, "flash_owner1@test.com")
    headers2, _ = _register(client, "flash_owner2@test.com")
    client.post("/api/flashcards", json={"front": "Q1", "back": "A1"}, headers=headers1)

    response = client.get("/api/flashcards", headers=headers2)
    assert response.json()["cards"] == []


def test_review_flashcard_advances_due_date_and_awards_xp(client):
    headers, _ = _register(client, "flash_review@test.com")
    card = client.post("/api/flashcards", json={"front": "Q", "back": "A"}, headers=headers).json()["card"]

    response = client.post(f"/api/flashcards/{card['id']}/review", json={"rating": "good"}, headers=headers)
    assert response.status_code == 200
    body = response.json()
    assert body["card"]["repetitions"] == 1
    assert body["card"]["due_date"] == (today_utc() + timedelta(days=1)).isoformat()
    assert body["gamification"]["xp_awarded"] == 2


def test_review_flashcard_rejects_an_unknown_rating(client):
    headers, _ = _register(client, "flash_bad_rating@test.com")
    card = client.post("/api/flashcards", json={"front": "Q", "back": "A"}, headers=headers).json()["card"]

    response = client.post(f"/api/flashcards/{card['id']}/review", json={"rating": "meh"}, headers=headers)
    assert response.status_code == 400


def test_review_someone_elses_flashcard_is_404(client):
    headers1, _ = _register(client, "flash_other1@test.com")
    headers2, _ = _register(client, "flash_other2@test.com")
    card = client.post("/api/flashcards", json={"front": "Q", "back": "A"}, headers=headers1).json()["card"]

    response = client.post(f"/api/flashcards/{card['id']}/review", json={"rating": "good"}, headers=headers2)
    assert response.status_code == 404


def test_a_freshly_reviewed_card_no_longer_shows_as_due_today(client):
    headers, _ = _register(client, "flash_due_after_review@test.com")
    card = client.post("/api/flashcards", json={"front": "Q", "back": "A"}, headers=headers).json()["card"]
    client.post(f"/api/flashcards/{card['id']}/review", json={"rating": "good"}, headers=headers)

    due = client.get("/api/flashcards/due", headers=headers)
    assert due.json()["total_due"] == 0


def test_delete_flashcard_removes_it(client, db_session):
    headers, user = _register(client, "flash_delete@test.com")
    card = client.post("/api/flashcards", json={"front": "Q", "back": "A"}, headers=headers).json()["card"]

    response = client.delete(f"/api/flashcards/{card['id']}", headers=headers)
    assert response.status_code == 200
    assert db_session.query(Flashcard).filter(Flashcard.id == card["id"]).first() is None


def test_delete_someone_elses_flashcard_is_404(client):
    headers1, _ = _register(client, "flash_delete_other1@test.com")
    headers2, _ = _register(client, "flash_delete_other2@test.com")
    card = client.post("/api/flashcards", json={"front": "Q", "back": "A"}, headers=headers1).json()["card"]

    response = client.delete(f"/api/flashcards/{card['id']}", headers=headers2)
    assert response.status_code == 404


def test_flashcard_habit_achievement_unlocks_at_five_reviews(client):
    headers, _ = _register(client, "flash_habit@test.com")
    last_response = None
    for i in range(5):
        card = client.post("/api/flashcards", json={"front": f"Q{i}", "back": f"A{i}"}, headers=headers).json()["card"]
        last_response = client.post(f"/api/flashcards/{card['id']}/review", json={"rating": "good"}, headers=headers)

    unlocked_ids = {a["id"] for a in last_response.json()["gamification"]["new_achievements"]}
    assert "flashcard_habit" in unlocked_ids
