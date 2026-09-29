import modules.tutor.router as tutor_router
from models.skill_mastery import SkillMastery
from modules.tutor.router import LANGUAGE_INSTRUCTION, SOCRATIC_INSTRUCTION, SYSTEM_PROMPT_BY_COUNTRY
from tests.conftest import register_user


def test_gh_prompt_mentions_wassce():
    assert "WASSCE" in SYSTEM_PROMPT_BY_COUNTRY["GH"]


def test_ng_prompt_does_not_mention_wassce():
    assert "WASSCE" not in SYSTEM_PROMPT_BY_COUNTRY["NG"]
    assert "BECE" not in SYSTEM_PROMPT_BY_COUNTRY["NG"]


def test_sl_lr_gm_prompts_mention_wassce_and_are_distinct():
    """Sierra Leone, Liberia, and The Gambia all sit WASSCE under WAEC, same
    as Ghana."""
    for country in ("SL", "LR", "GM"):
        assert "WASSCE" in SYSTEM_PROMPT_BY_COUNTRY[country]

    prompts = [SYSTEM_PROMPT_BY_COUNTRY[c] for c in ("GH", "NG", "SL", "LR", "GM")]
    assert len(set(prompts)) == len(prompts)


def test_english_language_instruction_is_empty():
    assert LANGUAGE_INSTRUCTION["en"] == ""


def test_twi_and_pidgin_instructions_are_distinct_and_non_empty():
    assert LANGUAGE_INSTRUCTION["tw"].strip()
    assert LANGUAGE_INSTRUCTION["pcm"].strip()
    assert LANGUAGE_INSTRUCTION["tw"] != LANGUAGE_INSTRUCTION["pcm"]
    assert "Twi" in LANGUAGE_INSTRUCTION["tw"]
    assert "Pidgin" in LANGUAGE_INSTRUCTION["pcm"]


def test_chat_requires_auth(client):
    response = client.post("/api/tutor/chat", json={"message": "hi"})
    assert response.status_code == 401


def test_socratic_instruction_has_hint_first_behavioral_rules():
    assert "hint" in SOCRATIC_INSTRUCTION.lower()
    assert "not give the final answer immediately" in SOCRATIC_INSTRUCTION.lower()
    assert "still stuck" in SOCRATIC_INSTRUCTION.lower()


class _FakeResponse:
    text = "A helpful, hint-first reply."


class _FakeModels:
    def __init__(self):
        self.calls = []

    def generate_content(self, **kwargs):
        self.calls.append(kwargs)
        return _FakeResponse()


class _FakeGeminiClient:
    def __init__(self):
        self.models = _FakeModels()


def test_chat_wires_weak_topic_mastery_into_the_system_prompt(client, db_session, monkeypatch):
    """Regression test for the atama+-inspired prerequisite check: the
    tutor's system prompt must reflect this student's actual weak topics
    (from the same mastery data the practice quiz already tracks), not
    just the static per-country prompt."""
    data = register_user(client, email="tutor_mastery@test.com", country="GH")
    headers = {"Authorization": f"Bearer {data['token']}"}

    db_session.add(
        SkillMastery(
            user_id=data["user"]["id"],
            subject_id="mathematics",
            topic_id="algebra",
            mastery_probability=0.1,
            attempts_count=5,
        )
    )
    db_session.commit()

    fake_client = _FakeGeminiClient()
    monkeypatch.setattr(tutor_router, "get_gemini_client", lambda: fake_client)

    response = client.post(
        "/api/tutor/chat",
        json={"message": "Can you help me with equations?", "subject_id": "mathematics"},
        headers=headers,
    )
    assert response.status_code == 200

    assert len(fake_client.models.calls) == 1
    system_instruction = fake_client.models.calls[0]["config"]["system_instruction"]
    assert "weaker mastery" in system_instruction
    assert "algebra" in system_instruction.lower()


def test_chat_without_a_subject_id_does_not_touch_mastery_data(client, monkeypatch):
    data = register_user(client, email="tutor_no_subject@test.com", country="GH")
    headers = {"Authorization": f"Bearer {data['token']}"}

    fake_client = _FakeGeminiClient()
    monkeypatch.setattr(tutor_router, "get_gemini_client", lambda: fake_client)

    response = client.post("/api/tutor/chat", json={"message": "What's a good study routine?"}, headers=headers)
    assert response.status_code == 200

    system_instruction = fake_client.models.calls[0]["config"]["system_instruction"]
    assert "weaker mastery" not in system_instruction
