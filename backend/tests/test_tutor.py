from modules.tutor.router import LANGUAGE_INSTRUCTION, SOCRATIC_INSTRUCTION, SYSTEM_PROMPT_BY_COUNTRY


def test_gh_prompt_mentions_wassce():
    assert "WASSCE" in SYSTEM_PROMPT_BY_COUNTRY["GH"]


def test_ng_prompt_does_not_mention_wassce():
    assert "WASSCE" not in SYSTEM_PROMPT_BY_COUNTRY["NG"]
    assert "BECE" not in SYSTEM_PROMPT_BY_COUNTRY["NG"]


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
