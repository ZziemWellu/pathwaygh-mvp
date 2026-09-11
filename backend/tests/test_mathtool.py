import asyncio

from modules.tutor.mathtool import compute_math, looks_like_math


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
