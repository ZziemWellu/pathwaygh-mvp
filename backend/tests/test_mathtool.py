import asyncio

from modules.tutor.mathtool import compute_math, evaluate_expression, looks_like_math


def _run(message):
    return asyncio.run(compute_math(message))


def test_looks_like_math_detects_arithmetic():
    assert looks_like_math("what is 2+2?")
    assert looks_like_math("please solve this for me")
    assert looks_like_math("calculate the sqrt of 16")


def test_looks_like_math_rejects_plain_text():
    assert not looks_like_math("what is a noun?")
    assert not looks_like_math("tell me about photosynthesis")


def test_plain_arithmetic_is_computed_correctly():
    result = _run("what is 2+2")
    assert result is not None
    assert result["type"] == "expression"
    assert float(result["result"]) == 4.0


def test_quadratic_equation_is_solved_correctly():
    result = _run("solve x^2-5x+6=0")
    assert result is not None
    assert result["type"] == "equation"
    roots = {s.strip() for s in result["result"].split(",")}
    assert roots == {"2", "3"}


def test_non_math_message_returns_none():
    assert _run("what is a noun?") is None


def test_malformed_expression_returns_none():
    assert _run("solve 2+*/3=") is None


def test_high_degree_equation_is_rejected():
    assert _run("solve x^9+x^8+x^7+x^6+x^5=0") is None


def test_adversarial_dunder_input_is_blocked():
    # The character allowlist alone would not stop this - it's the
    # restricted global_dict that matters. Confirms it actually holds.
    assert _run("calculate __import__('os').system('echo pwned')") is None


def test_adversarial_attribute_chain_is_blocked():
    assert _run("evaluate ().__class__.__bases__[0]") is None


def test_oversized_expression_is_rejected_not_hung():
    huge = "1+" * 200 + "1"
    assert _run(f"calculate {huge}") is None


# --- evaluate_expression (used by modules/ai_questions/generator.py to
# verify an AI-generated question's self-reported answer) -----------------


def test_evaluate_expression_computes_plain_arithmetic():
    assert evaluate_expression("6+7") == 13.0
    assert evaluate_expression("3*4") == 12.0


def test_evaluate_expression_rejects_an_equation():
    assert evaluate_expression("x+5=12") is None


def test_evaluate_expression_rejects_an_expression_with_a_free_variable():
    assert evaluate_expression("x+5") is None


def test_evaluate_expression_rejects_adversarial_input():
    assert evaluate_expression("__import__('os').system('echo pwned')") is None


def test_evaluate_expression_rejects_garbage():
    assert evaluate_expression("not a math expression") is None
    assert evaluate_expression("") is None


# --- Expensive-evaluation guard: short input isn't cheap input. Before
# _is_safe_to_evaluate, "9^9^9" pinned a CPU core indefinitely (sympy
# computes integer powers exactly) and the asyncio timeout couldn't stop
# the already-running thread. Each of these must return promptly.


def test_power_tower_is_rejected_without_hanging():
    assert _run("what is 9^9^9") is None
    assert _run("what is 9**9**9") is None
    assert _run("9^9^9^9^9") is None


def test_huge_exponent_is_rejected():
    assert _run("what is 2^99999999") is None
    assert _run("solve x^99999=1") is None


def test_nested_powers_with_small_exponents_but_huge_value_are_rejected():
    assert _run("((9^999)^999)^999") is None


def test_evaluate_expression_rejects_a_power_tower():
    assert evaluate_expression("9^9^9") is None


def test_ordinary_powers_still_work():
    assert float(_run("what is 2^10")["result"]) == 1024.0
    assert float(_run("sqrt(16)+2^3")["result"]) == 12.0
    assert evaluate_expression("(10^5)^2") == 1e10
    assert evaluate_expression("2^(1/2)") is not None
