"""
Deterministic math pre-computation for the AI tutor.

The result is computed with sympy BEFORE the Gemini call and injected
into the prompt as grounding context ("this calculation is X - guide the
student toward it, don't contradict it"), rather than trusting the LLM's
own arithmetic (a documented failure mode even at much larger scale) or
using true bidirectional function-calling (unnecessary complexity here).

Security note: sympy's expression parser uses eval() internally. The
character allowlist below is a cheap first-pass reject and a DoS guard
(rejects garbage and absurd expressions before they reach the parser) -
it is NOT the sandbox. The actual sandbox is the restricted
`global_dict={"__builtins__": {}, **_SAFE_NAMES}` passed to parse_expr,
which stops the parser's eval() from resolving names to real Python
builtins. Both are required together; neither alone is sufficient.
"""

import asyncio
import re
from typing import Optional

from sympy import Eq, Float, Integer, Symbol, cos, log, sin, solve, sqrt, tan
from sympy.parsing.sympy_parser import (
    convert_xor,
    implicit_multiplication_application,
    parse_expr,
    standard_transformations,
)

MAX_EXPRESSION_LENGTH = 80
MAX_EQUATION_DEGREE = 4

ALLOWED_CHARS = re.compile(r"^[0-9x\s\+\-\*/\^\(\)=\.a-z]+$")
# Matches only actual math tokens - digits, the variable x, operators, and
# the specific known function names - NOT arbitrary English words. Using a
# plain a-z range here (as ALLOWED_CHARS above does) would let filler words
# like "what is" chain into the same run as the digits next to them, since
# letters and spaces are both "allowed" characters with nothing to break the
# run between them.
_CANDIDATE_CHARS = re.compile(r"(?:sqrt|sin|cos|tan|log|[0-9x\s\+\-\*/\^\(\)=\.])+", re.IGNORECASE)
MATH_HINT = re.compile(
    r"[0-9].*[\+\-\*/\^=]|[\+\-\*/\^=].*[0-9]|\bsolve\b|\bsqrt\b|\bcalculate\b|\bequation\b|\bevaluate\b",
    re.IGNORECASE,
)

_SAFE_NAMES = {
    "x": Symbol("x"),
    "sqrt": sqrt,
    "sin": sin,
    "cos": cos,
    "tan": tan,
    "log": log,
    # Integer/Float aren't reachable from user input (the candidate
    # character/keyword allowlist above admits no way to type "Integer" or
    # "Float" literally) - they're required because sympy's own
    # auto_number transformation rewrites numeric literals like "2" into
    # `Integer(2)` calls internally, and needs these names resolvable in
    # the eval namespace to do so.
    "Integer": Integer,
    "Float": Float,
}
_GLOBAL_DICT = {"__builtins__": {}, **_SAFE_NAMES}
_TRANSFORMATIONS = standard_transformations + (implicit_multiplication_application, convert_xor)


def looks_like_math(message: str) -> bool:
    return bool(MATH_HINT.search(message))


def _extract_candidate(message: str) -> Optional[str]:
    runs = _CANDIDATE_CHARS.findall(message)
    if not runs:
        return None
    candidate = max(runs, key=len).strip().lower()
    if not candidate or len(candidate) > MAX_EXPRESSION_LENGTH:
        return None
    if not ALLOWED_CHARS.match(candidate):
        return None
    if not any(c.isdigit() for c in candidate):
        # Pure letters/symbols with no numbers isn't a computable expression.
        return None
    return candidate


def _degree_of(expr) -> int:
    try:
        return expr.as_poly(Symbol("x")).degree() if expr.free_symbols else 0
    except Exception:
        return 0


def _compute_sync(candidate: str) -> Optional[dict]:
    try:
        if "=" in candidate:
            lhs_str, rhs_str = candidate.split("=", 1)
            lhs = parse_expr(lhs_str, transformations=_TRANSFORMATIONS, global_dict=_GLOBAL_DICT)
            rhs = parse_expr(rhs_str, transformations=_TRANSFORMATIONS, global_dict=_GLOBAL_DICT)
            if max(_degree_of(lhs), _degree_of(rhs)) > MAX_EQUATION_DEGREE:
                return None
            solutions = solve(Eq(lhs, rhs), Symbol("x"))
            if not solutions:
                return None
            return {
                "expression": candidate,
                "type": "equation",
                "result": ", ".join(str(s) for s in solutions),
            }

        expr = parse_expr(candidate, transformations=_TRANSFORMATIONS, global_dict=_GLOBAL_DICT)
        if expr.free_symbols:
            # Nothing to evaluate to a number - e.g. a bare "x + 1" with no "=".
            return None
        return {"expression": candidate, "type": "expression", "result": str(expr.evalf())}
    except Exception:
        return None


async def compute_math(message: str) -> Optional[dict]:
    if not looks_like_math(message):
        return None
    candidate = _extract_candidate(message)
    if not candidate:
        return None
    try:
        return await asyncio.wait_for(asyncio.to_thread(_compute_sync, candidate), timeout=2.0)
    except Exception:
        return None
