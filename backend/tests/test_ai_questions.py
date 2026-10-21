import modules.ai_questions.router as ai_questions_router
from modules.ai_questions.generator import GeneratedMathQuestion, _verify, generate_math_question
from tests.conftest import register_user


def _register(client, email):
    data = register_user(client, email=email, country="GH")
    return {"Authorization": f"Bearer {data['token']}"}, data["user"]


def _question(correct="13", verification_expression="6+7", options=None):
    return GeneratedMathQuestion(
        question="What is 6 + 7?",
        options=options or ["11", "12", "13", "14"],
        correct=correct,
        explanation="6 + 7 = 13",
        verification_expression=verification_expression,
    )


# --- _verify (pure) -----------------------------------------------------


def test_verify_accepts_a_correctly_verified_question():
    assert _verify(_question()) is True


def test_verify_rejects_when_verification_expression_does_not_match_correct():
    assert _verify(_question(verification_expression="6+6")) is False  # evaluates to 12, not 13


def test_verify_rejects_when_correct_is_not_among_the_options():
    assert _verify(_question(correct="99")) is False


def test_verify_rejects_when_correct_is_not_numeric():
    assert _verify(_question(correct="thirteen", options=["11", "12", "thirteen", "14"])) is False


def test_verify_rejects_a_question_without_exactly_four_options():
    assert _verify(_question(options=["11", "12", "13"])) is False


def test_verify_rejects_an_unsafe_or_unparseable_verification_expression():
    assert _verify(_question(verification_expression="__import__('os')")) is False


# --- generate_math_question (retry loop) --------------------------------


class _FakeResponse:
    def __init__(self, parsed=None):
        self.parsed = parsed


class _FakeModels:
    def __init__(self, responses):
        self._responses = list(responses)
        self.calls = 0

    def generate_content(self, **kwargs):
        self.calls += 1
        item = self._responses.pop(0)
        if isinstance(item, Exception):
            raise item
        return _FakeResponse(parsed=item)


class _FakeGeminiClient:
    def __init__(self, responses):
        self.models = _FakeModels(responses)


def test_generate_returns_the_first_verified_candidate():
    client = _FakeGeminiClient([_question()])
    result = generate_math_question(client, topic=None, difficulty="medium")
    assert result is not None
    assert result["correct"] == "13"
    assert "verification_expression" not in result  # internal-only, never shown to the student
    assert client.models.calls == 1


def test_generate_retries_after_a_bad_candidate_then_succeeds():
    bad = _question(verification_expression="6+6")
    good = _question()
    client = _FakeGeminiClient([bad, good])
    result = generate_math_question(client, topic="algebra", difficulty="easy")
    assert result is not None
    assert client.models.calls == 2


def test_generate_gives_up_after_the_retry_budget_is_exhausted():
    bad = _question(verification_expression="6+6")
    client = _FakeGeminiClient([bad, bad, bad])
    result = generate_math_question(client, topic=None, difficulty="hard")
    assert result is None


def test_generate_tolerates_a_gemini_call_exception_and_retries():
    client = _FakeGeminiClient([RuntimeError("boom"), _question()])
    result = generate_math_question(client, topic=None, difficulty="medium")
    assert result is not None


# --- router.py ------------------------------------------------------------


def test_generate_requires_auth(client):
    response = client.post("/api/ai-questions/generate", json={})
    assert response.status_code == 401


def test_generate_503_when_gemini_is_not_configured(client, monkeypatch):
    headers, _ = _register(client, "ai_q_no_key@test.com")
    monkeypatch.setattr(ai_questions_router, "get_gemini_client", lambda: None)

    response = client.post("/api/ai-questions/generate", json={}, headers=headers)
    assert response.status_code == 503


def test_generate_502_when_no_verified_question_could_be_produced(client, monkeypatch):
    headers, _ = _register(client, "ai_q_fail@test.com")
    monkeypatch.setattr(ai_questions_router, "get_gemini_client", lambda: object())

    def _always_fails(*args, **kwargs):
        return None

    monkeypatch.setattr(ai_questions_router, "generate_math_question", _always_fails)

    response = client.post("/api/ai-questions/generate", json={}, headers=headers)
    assert response.status_code == 502


def test_generate_returns_a_verified_question_end_to_end(client, monkeypatch):
    headers, _ = _register(client, "ai_q_success@test.com")
    fake_client = _FakeGeminiClient([_question()])
    monkeypatch.setattr(ai_questions_router, "get_gemini_client", lambda: fake_client)

    response = client.post(
        "/api/ai-questions/generate", json={"topic": "algebra", "difficulty": "easy"}, headers=headers
    )
    assert response.status_code == 200
    body = response.json()
    assert body["tracked"] is False
    assert body["question"]["correct"] == "13"
    assert len(body["question"]["options"]) == 4
