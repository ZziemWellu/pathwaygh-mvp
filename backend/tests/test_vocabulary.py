from datetime import date

from models.vocabulary_progress import VocabularyProgress
from modules.vocabulary.service import find_word, load_words, word_of_the_day
from tests.conftest import register_user


def _register(client, email):
    data = register_user(client, email=email, country="GH")
    return {"Authorization": f"Bearer {data['token']}"}, data["user"]


# --- service.py -------------------------------------------------------


def test_load_words_returns_real_content():
    words = load_words()
    assert len(words) > 0
    for word in words:
        assert word["word"]
        assert word["definition"]
        assert len(word["synonyms"]) > 0
        assert len(word["antonyms"]) > 0


def test_word_of_the_day_is_deterministic_for_a_given_date():
    d = date(2026, 3, 15)
    assert word_of_the_day(d)["id"] == word_of_the_day(d)["id"]


def test_word_of_the_day_rotates_across_the_bank():
    words = load_words()
    seen = {word_of_the_day(date(2026, 1, 1 + i))["id"] for i in range(len(words))}
    # Consecutive days should not all land on the same single word - a
    # real rotation, not an accidental constant.
    assert len(seen) > 1


def test_find_word_returns_none_for_unknown_id():
    assert find_word("not-a-real-word") is None


# --- router.py --------------------------------------------------------


def test_word_of_the_day_requires_auth(client):
    response = client.get("/api/vocabulary/word-of-the-day")
    assert response.status_code == 401


def test_word_of_the_day_returns_real_content_and_learned_false_initially(client):
    headers, _ = _register(client, "vocab_wod@test.com")
    response = client.get("/api/vocabulary/word-of-the-day", headers=headers)
    assert response.status_code == 200
    body = response.json()
    assert body["word"]["word"]
    assert body["learned"] is False


def test_mark_word_learned_awards_xp_and_persists(client, db_session):
    headers, user = _register(client, "vocab_learn@test.com")
    word = word_of_the_day()

    response = client.post(f"/api/vocabulary/{word['id']}/learned", headers=headers)
    assert response.status_code == 200
    body = response.json()
    assert body["already_learned"] is False
    assert body["gamification"]["xp_awarded"] == 3

    row = (
        db_session.query(VocabularyProgress)
        .filter(VocabularyProgress.user_id == user["id"], VocabularyProgress.word_id == word["id"])
        .first()
    )
    assert row is not None


def test_marking_the_same_word_learned_twice_does_not_double_award_xp(client):
    headers, _ = _register(client, "vocab_double@test.com")
    word = word_of_the_day()

    first = client.post(f"/api/vocabulary/{word['id']}/learned", headers=headers)
    second = client.post(f"/api/vocabulary/{word['id']}/learned", headers=headers)

    assert first.json()["already_learned"] is False
    assert second.json()["already_learned"] is True
    assert second.json()["gamification"] is None


def test_mark_unknown_word_learned_is_404(client):
    headers, _ = _register(client, "vocab_unknown@test.com")
    response = client.post("/api/vocabulary/not-a-real-word/learned", headers=headers)
    assert response.status_code == 404


def test_word_of_the_day_reflects_learned_true_after_marking(client):
    headers, _ = _register(client, "vocab_reflect@test.com")
    word = word_of_the_day()
    client.post(f"/api/vocabulary/{word['id']}/learned", headers=headers)

    response = client.get("/api/vocabulary/word-of-the-day", headers=headers)
    assert response.json()["learned"] is True


def test_progress_endpoint_counts_learned_words(client):
    headers, _ = _register(client, "vocab_progress@test.com")
    words = load_words()[:3]
    for word in words:
        client.post(f"/api/vocabulary/{word['id']}/learned", headers=headers)

    response = client.get("/api/vocabulary/progress", headers=headers)
    body = response.json()
    assert body["words_learned"] == 3
    assert set(body["word_ids"]) == {w["id"] for w in words}


def test_wordsmith_achievement_unlocks_at_five_words(client):
    headers, _ = _register(client, "vocab_wordsmith@test.com")
    words = load_words()[:5]
    last_response = None
    for word in words:
        last_response = client.post(f"/api/vocabulary/{word['id']}/learned", headers=headers)

    unlocked_ids = {a["id"] for a in last_response.json()["gamification"]["new_achievements"]}
    assert "wordsmith" in unlocked_ids
