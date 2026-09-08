from modules.tutor.router import SYSTEM_PROMPT_BY_COUNTRY


def test_gh_prompt_mentions_wassce():
    assert "WASSCE" in SYSTEM_PROMPT_BY_COUNTRY["GH"]


def test_ng_prompt_does_not_mention_wassce():
    assert "WASSCE" not in SYSTEM_PROMPT_BY_COUNTRY["NG"]
    assert "BECE" not in SYSTEM_PROMPT_BY_COUNTRY["NG"]


def test_chat_requires_auth(client):
    response = client.post("/api/tutor/chat", json={"message": "hi"})
    assert response.status_code == 401
