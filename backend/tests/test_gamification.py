from datetime import timedelta

from models.gamification import EarnedAchievement, today_utc
from models.user import User
from modules.gamification.service import (
    _record_activity,
    award_for_lesson_completed,
    award_for_quiz_completed,
    get_or_create_profile,
)
from tests.conftest import register_user


def _register(client, email):
    data = register_user(client, email=email, country="GH")
    return {"Authorization": f"Bearer {data['token']}"}, data["user"]


def _join_a_school(client, email):
    """Registers a fresh user and enrolls them in a fresh school via the
    real create/join endpoints, so created_by_id and the school_id FK are
    set the same way production data would be - not a raw School()
    construction that would skip required fields."""
    admin_headers, _ = _register(client, f"admin_{email}")
    school = client.post("/api/school/create", json={"name": "Gamify Test School"}, headers=admin_headers).json()["school"]
    headers, user = _register(client, email)
    client.post("/api/school/join", json={"join_code": school["join_code"]}, headers=headers)
    return headers, user


# --- service.py -----------------------------------------------------------


def _user_id(db_session, n):
    """A real user row for service-level tests. Profiles reference users by
    foreign key - Postgres enforces it (SQLite doesn't by default, which is
    how bare ids like user_id=1 used to pass)."""
    user = User(email=f"gamer{n}@test.com", full_name=f"Gamer {n}", password_hash="x", guardian_email="g@test.com")
    db_session.add(user)
    db_session.flush()
    return user.id


def test_get_or_create_profile_creates_once(db_session):
    uid = _user_id(db_session, 1)
    profile1 = get_or_create_profile(db_session, user_id=uid)
    profile2 = get_or_create_profile(db_session, user_id=uid)
    assert profile1.id == profile2.id


def test_streak_starts_at_one_on_first_activity(db_session):
    uid = _user_id(db_session, 2)
    profile = get_or_create_profile(db_session, user_id=uid)
    _record_activity(profile)
    assert profile.current_streak_days == 1
    assert profile.longest_streak_days == 1
    assert profile.last_activity_date == today_utc()


def test_streak_does_not_double_count_same_day(db_session):
    uid = _user_id(db_session, 3)
    profile = get_or_create_profile(db_session, user_id=uid)
    _record_activity(profile)
    _record_activity(profile)
    assert profile.current_streak_days == 1


def test_streak_continues_on_consecutive_day(db_session):
    uid = _user_id(db_session, 4)
    profile = get_or_create_profile(db_session, user_id=uid)
    profile.current_streak_days = 5
    profile.longest_streak_days = 5
    profile.last_activity_date = today_utc() - timedelta(days=1)

    _record_activity(profile)

    assert profile.current_streak_days == 6
    assert profile.longest_streak_days == 6


def test_streak_resets_after_a_gap(db_session):
    uid = _user_id(db_session, 5)
    profile = get_or_create_profile(db_session, user_id=uid)
    profile.current_streak_days = 10
    profile.longest_streak_days = 10
    profile.last_activity_date = today_utc() - timedelta(days=3)

    _record_activity(profile)

    assert profile.current_streak_days == 1
    assert profile.longest_streak_days == 10  # longest is a high-water mark, never reset


# --- achievements ----------------------------------------------------------


def test_first_quiz_achievement_unlocks_via_the_real_endpoint(client, db_session):
    headers, user = _register(client, "gamify_first_quiz@test.com")
    start = client.post("/api/practice/quiz/start", json={"subject_id": "mathematics", "question_count": 1}, headers=headers)
    quiz = start.json()
    submit = client.post(
        "/api/practice/quiz/submit",
        json={"quiz_id": quiz["id"], "answers": {"0": "not-a-real-answer"}, "time_spent": 20},
        headers=headers,
    )
    assert submit.status_code == 200
    gamification = submit.json()["gamification"]
    assert gamification is not None
    assert gamification["xp_awarded"] == 5  # base XP only, the one answer was wrong
    unlocked_ids = {a["id"] for a in gamification["new_achievements"]}
    assert "first_quiz" in unlocked_ids

    earned = db_session.query(EarnedAchievement).filter(EarnedAchievement.user_id == user["id"]).all()
    assert any(e.achievement_id == "first_quiz" for e in earned)


def test_high_scorer_achievement_requires_a_perfect_score(client):
    from tests.test_practice import KNOWN_ANSWERS

    headers, user = _register(client, "gamify_perfect@test.com")
    start = client.post("/api/practice/quiz/start", json={"subject_id": "mathematics", "question_count": 2}, headers=headers)
    quiz = start.json()
    answers = {str(i): KNOWN_ANSWERS[q["id"]] for i, q in enumerate(quiz["questions"])}
    submit = client.post(
        "/api/practice/quiz/submit", json={"quiz_id": quiz["id"], "answers": answers, "time_spent": 20}, headers=headers
    )
    gamification = submit.json()["gamification"]
    unlocked_ids = {a["id"] for a in gamification["new_achievements"]}
    assert "high_scorer" in unlocked_ids
    assert gamification["xp_awarded"] == 5 + 2  # base + 1 per correct answer


def test_achievement_is_only_awarded_once(client):
    headers, _ = _register(client, "gamify_once@test.com")
    for _ in range(2):
        start = client.post("/api/practice/quiz/start", json={"subject_id": "mathematics", "question_count": 1}, headers=headers)
        quiz = start.json()
        submit = client.post(
            "/api/practice/quiz/submit",
            json={"quiz_id": quiz["id"], "answers": {"0": "not-a-real-answer"}, "time_spent": 20},
            headers=headers,
        )
        gamification = submit.json()["gamification"]
        unlocked_ids = {a["id"] for a in gamification["new_achievements"]}
        if _:
            assert "first_quiz" not in unlocked_ids  # already earned on the first quiz


def test_first_lesson_achievement_unlocks_via_the_real_endpoint(client, db_session):
    from models.course import Course, Lesson

    headers, user = _register(client, "gamify_first_lesson@test.com")
    course = Course(slug="gamify-course", title="Gamify Course", level="jhs")
    db_session.add(course)
    db_session.flush()
    lesson = Lesson(course_id=course.id, slug="gamify-lesson-1", title="Lesson 1", lesson_type="video", order_index=0)
    db_session.add(lesson)
    db_session.commit()

    client.post(f"/api/learn/courses/{course.slug}/enroll", headers=headers)
    response = client.post(f"/api/learn/lessons/{lesson.slug}/progress", json={"watched": True}, headers=headers)
    assert response.status_code == 200
    gamification = response.json()["gamification"]
    assert gamification["xp_awarded"] == 10
    assert "first_lesson" in {a["id"] for a in gamification["new_achievements"]}

    # Re-marking the same lesson watched again must not award XP twice.
    response2 = client.post(f"/api/learn/lessons/{lesson.slug}/progress", json={"watched": True}, headers=headers)
    assert response2.json()["gamification"] is None


# --- router.py --------------------------------------------------------------


def test_get_profile_creates_a_profile_on_first_call(client):
    headers, _ = _register(client, "gamify_profile@test.com")
    response = client.get("/api/gamification/profile", headers=headers)
    assert response.status_code == 200
    body = response.json()
    assert body["xp_points"] == 0
    assert body["current_streak_days"] == 0
    assert body["achievements_total"] > 0


def test_get_achievements_lists_all_definitions_with_earned_flags(client):
    headers, _ = _register(client, "gamify_achievements_list@test.com")
    response = client.get("/api/gamification/achievements", headers=headers)
    assert response.status_code == 200
    achievements = response.json()["achievements"]
    assert len(achievements) > 0
    assert all(a["earned"] is False for a in achievements)


def test_leaderboard_opt_in_requires_a_display_name(client):
    headers, _ = _register(client, "gamify_optin_no_name@test.com")
    response = client.patch("/api/gamification/leaderboard-opt-in", json={"opt_in": True}, headers=headers)
    assert response.status_code == 400


def test_leaderboard_opt_in_succeeds_with_a_display_name(client):
    headers, _ = _register(client, "gamify_optin@test.com")
    response = client.patch(
        "/api/gamification/leaderboard-opt-in", json={"opt_in": True, "display_name": "MathWizard"}, headers=headers
    )
    assert response.status_code == 200
    assert response.json()["leaderboard_display_name"] == "MathWizard"


def test_leaderboard_is_empty_without_a_school(client):
    headers, _ = _register(client, "gamify_no_school@test.com")
    response = client.get("/api/gamification/leaderboard", headers=headers)
    assert response.status_code == 200
    assert response.json()["leaderboard"] == []


def test_leaderboard_never_exposes_full_name_only_the_chosen_display_name(client, db_session):
    headers, user = _join_a_school(client, "gamify_school_student@test.com")
    db_user = db_session.query(User).filter(User.id == user["id"]).first()

    client.patch(
        "/api/gamification/leaderboard-opt-in", json={"opt_in": True, "display_name": "SecretAgent"}, headers=headers
    )
    award_for_quiz_completed(db_session, db_user, correct_count=3)
    db_session.commit()

    response = client.get("/api/gamification/leaderboard", headers=headers)
    leaderboard = response.json()["leaderboard"]
    assert len(leaderboard) == 1
    assert leaderboard[0]["display_name"] == "SecretAgent"
    assert db_user.full_name not in str(response.json())


def test_leaderboard_excludes_students_who_have_not_opted_in(client, db_session):
    headers, user = _join_a_school(client, "gamify_not_opted_in@test.com")
    db_user = db_session.query(User).filter(User.id == user["id"]).first()
    award_for_lesson_completed(db_session, db_user)
    db_session.commit()

    response = client.get("/api/gamification/leaderboard", headers=headers)
    assert response.json()["leaderboard"] == []
