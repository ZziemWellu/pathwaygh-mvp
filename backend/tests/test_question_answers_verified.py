"""Every calculated question is solved again here from its wording alone,
without using the build script's code. A template with no solver fails the
test, so nothing new can go live unchecked. This exists because an earlier,
partial version of this check missed answers that integer division had
rounded: 'GH₵ 50 reduced by 25%' was marked GH₵ 38."""

import json
import math
import re
from fractions import Fraction
from pathlib import Path

BANK = json.loads((Path(__file__).parents[1] / "data" / "practice" / "bank_gh.json").read_text(encoding="utf-8"))
COMPUTED = [q for s in BANK["subjects"] for t in s["topics"] for q in t["questions"] if q["review_status"] == "computed"]


def n(text):
    return int(text.replace(",", ""))


def num(answer):
    """The number in an answer such as 'GH₵ 1,200', '45°' or 'x = 7'."""
    return float(re.search(r"-?[\d,]+(?:\.\d+)?", answer).group().replace(",", ""))


def fr(answer):
    return Fraction(answer)


def same_number(expected, answer):
    return math.isclose(float(expected), num(answer), abs_tol=1e-9)


def same_fraction(expected, answer):
    return Fraction(expected) == fr(answer)


def solve_quadratic(m, answer):
    middle = int(m[1].replace(" ", ""))
    last = int(m[2].replace(" ", ""))
    roots = [int(r) for r in re.findall(r"-?\d+", answer)]
    return all(r * r + middle * r + last == 0 for r in roots) and len(set(roots)) == 2


def solve_simultaneous(m, answer):
    x, y = (int(v) for v in re.findall(r"-?\d+", answer))
    return x + y == int(m[1]) and int(m[2]) * x + int(m[3]) * y == int(m[4])


def standard_form(m, answer):
    mantissa, power = re.fullmatch(r"(\d+\.\d) x 10\^(\d+)", answer).groups()
    return math.isclose(float(mantissa) * 10 ** int(power), n(m[1])) and 1 <= float(mantissa) < 10


def surd(m, answer):
    outer, inner = re.fullmatch(r"(\d+)√(\d+)", answer).groups()
    return int(outer) ** 2 * int(inner) == int(m[1])


def trig(m, answer):
    o, a, h = int(m[1]), int(m[2]), int(m[3])
    assert o * o + a * a == h * h
    return Fraction({"sin": Fraction(o, h), "cos": Fraction(a, h), "tan": Fraction(o, a)}[m[4]]) == fr(answer)


def freq_mean(m, answer):
    pairs = re.findall(r"score (\d+) \(frequency (\d+)\)", m[0])
    return Fraction(sum(int(s) * int(f) for s, f in pairs), sum(int(f) for _, f in pairs)) == fr(answer)


def lcm(a, b):
    return a * b // math.gcd(a, b)


def nums(text):
    return [int(v) for v in text.split(", ")]


# (pattern, check(match, stored answer) -> bool)
SOLVERS = [
    (r"^What is ([\d,]+) \+ ([\d,]+)\?$", lambda m, a: same_number(n(m[1]) + n(m[2]), a)),
    (r"^What is ([\d,]+) - ([\d,]+)\?$", lambda m, a: same_number(n(m[1]) - n(m[2]), a)),
    (r"^What is (\d+) x (\d+)\?$", lambda m, a: same_number(int(m[1]) * int(m[2]), a)),
    (r"^What is (\d+) ÷ (\d+)\?$", lambda m, a: int(m[1]) % int(m[2]) == 0 and same_number(int(m[1]) / int(m[2]), a)),
    (r"^What is the value of the digit (\d) in the (\w+) place of ([\d,]+)\?$", lambda m, a: same_number(int(m[1]) * {"thousands": 1000, "hundreds": 100, "tens": 10, "ones": 1}[m[2]], a) and str(n(m[3]))[{"thousands": 0, "hundreds": 1, "tens": 2, "ones": 3}[m[2]]] == m[1]),
    (r"^Round (\d+) to the nearest 10\.$", lambda m, a: same_number((int(m[1]) + 5) // 10 * 10, a)),
    (r"^What is (\d+)/(\d+) \+ (\d+)/(\d+)\?$", lambda m, a: same_fraction(Fraction(int(m[1]), int(m[2])) + Fraction(int(m[3]), int(m[4])), a)),
    (r"^What is (\d+)/(\d+) of (\d+)\?$", lambda m, a: same_fraction(Fraction(int(m[1]), int(m[2])) * int(m[3]), a)),
    (r"^What is (\d+\.\d) \+ (\d+\.\d)\?$", lambda m, a: same_number(round(float(m[1]) + float(m[2]), 1), a)),
    (r"^What is (\d+)% of (\d+)\?$", lambda m, a: same_number(Fraction(int(m[1]) * int(m[2]), 100), a)),
    (r"^A rectangle is (\d+) m long and (\d+) m wide\. What is its perimeter\?$", lambda m, a: same_number(2 * (int(m[1]) + int(m[2])), a)),
    (r"^A rectangle is (\d+) cm long and (\d+) cm wide\. What is its area\?$", lambda m, a: same_number(int(m[1]) * int(m[2]), a)),
    (r"^How many centimetres are in (\d+) metres\?$", lambda m, a: same_number(int(m[1]) * 100, a)),
    (r"^How many grams are in (\d+) kilograms\?$", lambda m, a: same_number(int(m[1]) * 1000, a)),
    (r"^How many minutes are in (\d+) hours\?$", lambda m, a: same_number(int(m[1]) * 60, a)),
    (r"^How many metres are in (\d+) kilometres\?$", lambda m, a: same_number(int(m[1]) * 1000, a)),
    (r"buys a book for GH₵ (\d+) and pays with GH₵ (\d+)\.", lambda m, a: same_number(int(m[2]) - int(m[1]), a)),
    (r"shares (\d+) .* equally among (\d+) friends\.", lambda m, a: int(m[1]) % int(m[2]) == 0 and same_number(int(m[1]) / int(m[2]), a)),
    (r"^There are (\d+) baskets with (\d+) ", lambda m, a: same_number(int(m[1]) * int(m[2]), a)),
    (r"^Find the LCM of (\d+) and (\d+)\.$", lambda m, a: same_number(lcm(int(m[1]), int(m[2])), a)),
    (r"^Find the HCF of (\d+) and (\d+)\.$", lambda m, a: same_number(math.gcd(int(m[1]), int(m[2])), a)),
    (r"^Simplify: \(?(-?\d+)\)? - (\d+) \+ (\d+)$", lambda m, a: same_number(int(m[1]) - int(m[2]) + int(m[3]), a)),
    (r"^Simplify using BODMAS: (\d+) \+ (\d+) x (\d+)$", lambda m, a: same_number(int(m[1]) + int(m[2]) * int(m[3]), a)),
    (r"^The price of a bag was GH₵ (\d+)\. It was (increased|reduced) by (\d+)%", lambda m, a: same_number(int(m[1]) * Fraction(100 + (1 if m[2] == "increased" else -1) * int(m[3]), 100), a)),
    (r"share GH₵ (\d+) in the ratio (\d+):(\d+)\. How much does (\w+) get", lambda m, a: same_number(Fraction(int(m[1]) * int(m[2]), int(m[2]) + int(m[3])), a)),
    (r"^Write ([\d,]+) in standard form\.$", lambda m, a: standard_form(m, a)),
    (r"^Solve for x: (\d+)x \+ (\d+) = (\d+)$", lambda m, a: same_number(Fraction(int(m[3]) - int(m[2]), int(m[1])), a)),
    (r"^Solve for x: (\d+)x - (\d+) = (\d+)$", lambda m, a: same_number(Fraction(int(m[3]) + int(m[2]), int(m[1])), a)),
    (r"^If x = (\d+), find the value of (\d+)x \+ (\d+)\.$", lambda m, a: same_number(int(m[2]) * int(m[1]) + int(m[3]), a)),
    (r"^Simplify: (\d+)x \+ (\d+)x - (\d+)x$", lambda m, a: a == f"{int(m[1]) + int(m[2]) - int(m[3])}x"),
    (r"^Expand: (\d+)\((\d+)x \+ (\d+)\)$", lambda m, a: a == f"{int(m[1]) * int(m[2])}x + {int(m[1]) * int(m[3])}"),
    (r"^Two angles of a triangle are (\d+)° and (\d+)°", lambda m, a: same_number(180 - int(m[1]) - int(m[2]), a)),
    (r"^Two angles on a straight line are (\d+)°", lambda m, a: same_number(180 - int(m[1]), a)),
    (r"^Find the area of a circle of radius ([\d.]+) cm", lambda m, a: same_number(Fraction(22, 7) * Fraction(m[1]) ** 2, a)),
    (r"^Find the circumference of a circle of radius ([\d.]+) cm", lambda m, a: same_number(2 * Fraction(22, 7) * Fraction(m[1]), a)),
    (r"shorter sides of (\d+) cm and (\d+) cm\.", lambda m, a: same_number(math.isqrt(int(m[1]) ** 2 + int(m[2]) ** 2), a) and math.isqrt(int(m[1]) ** 2 + int(m[2]) ** 2) ** 2 == int(m[1]) ** 2 + int(m[2]) ** 2),
    (r"^Find the volume of a cuboid measuring (\d+) cm by (\d+) cm by (\d+) cm", lambda m, a: same_number(int(m[1]) * int(m[2]) * int(m[3]), a)),
    (r"^Find the mean of (\d[\d, ]*)\.$", lambda m, a: same_number(Fraction(sum(nums(m[1])), len(nums(m[1]))), a)),
    (r"^Find the median of (\d[\d, ]*)\.$", lambda m, a: same_number(sorted(nums(m[1]))[len(nums(m[1])) // 2], a)),
    (r"^Find the range of (\d[\d, ]*)\.$", lambda m, a: same_number(max(nums(m[1])) - min(nums(m[1])), a)),
    (r"^A bag holds (\d+) red and (\d+) blue balls\. One ball", lambda m, a: same_fraction(Fraction(int(m[1]), int(m[1]) + int(m[2])), a)),
    (r"^Solve: x² ([+-] \d+)x ([+-] \d+) = 0$", solve_quadratic),
    (r"^Solve: x \+ y = (\d+) and (\d+)x \+ (\d+)y = (\d+)$", solve_simultaneous),
    (r"^Simplify: (\d+)\^(\d+) x \1\^(\d+)$", lambda m, a: a == f"{m[1]}^{int(m[2]) + int(m[3])}"),
    (r"^Simplify: \((\d+)\^(\d+)\)\^(\d+)$", lambda m, a: a == f"{m[1]}^{int(m[2]) * int(m[3])}"),
    (r"^Evaluate: log base (\d+) of ([\d,]+)$", lambda m, a: int(m[1]) ** int(a) == n(m[2])),
    (r"^Simplify: √(\d+)$", surd),
    (r"^Find the simple interest on GH₵ ([\d,]+) at (\d+)% per annum for (\d+) year", lambda m, a: same_number(Fraction(n(m[1]) * int(m[2]) * int(m[3]), 100), a)),
    (r"^GH₵ ([\d,]+) is saved at (\d+)% compound interest per annum\. What is the amount after 2 years\?$", lambda m, a: same_number(n(m[1]) * Fraction(100 + int(m[2]), 100) ** 2, a)),
    (r"buys goods for GH₵ (\d+) and sells them for GH₵ (\d+)\.", lambda m, a: same_number(Fraction(int(m[2]) - int(m[1]), int(m[1])) * 100, a)),
    (r"^Convert ([01]+) base two to base ten\.$", lambda m, a: same_number(int(m[1], 2), a)),
    (r"^Convert (\d+) base ten to base two\.$", lambda m, a: int(a, 2) == int(m[1])),
    (r"arithmetic progression is (\d+) and the common difference is (\d+)\. Find term number (\d+)\.", lambda m, a: same_number(int(m[1]) + (int(m[3]) - 1) * int(m[2]), a)),
    (r"geometric progression is (\d+) and the common ratio is (\d+)\. Find term number (\d+)\.", lambda m, a: same_number(int(m[1]) * int(m[2]) ** (int(m[3]) - 1), a)),
    (r"opposite angle θ is (\d+) cm, the adjacent side is (\d+) cm and the hypotenuse is (\d+) cm\. Find (sin|cos|tan) θ\.", trig),
    (r"In a class of (\d+) students, .*?(\d+) study Biology and (\d+) study Chemistry\.", lambda m, a: same_number(int(m[2]) + int(m[3]) - int(m[1]), a)),
    (r"^Find the gradient of the line through \((-?\d+), (-?\d+)\) and \((-?\d+), (-?\d+)\)\.$", lambda m, a: same_fraction(Fraction(int(m[4]) - int(m[2]), int(m[3]) - int(m[1])), a)),
    (r"^Find the mean of: score.*$", freq_mean),
    (r"^A bag holds (\d+) red and (\d+) blue balls\. Two are picked", lambda m, a: same_fraction(Fraction(int(m[1]), int(m[1]) + int(m[2])) * Fraction(int(m[1]) - 1, int(m[1]) + int(m[2]) - 1), a)),
]


def test_every_calculated_answer_is_right():
    wrong, unsolved = [], []
    for question in COMPUTED:
        for pattern, check in SOLVERS:
            match = re.search(pattern, question["question"])
            if match:
                try:
                    right = check(match, question["correct"])
                except ZeroDivisionError as e:
                    raise AssertionError(question) from e
                if not right:
                    wrong.append((question["id"], question["question"], question["correct"]))
                break
        else:
            unsolved.append(question["question"])
    assert not wrong, wrong[:10]
    assert not unsolved, f"{len(unsolved)} questions have no independent solver, e.g. {unsolved[:5]}"


def test_no_wrong_option_is_also_correct():
    # A wrong option equal to the answer in another form, like 2/4 and 1/2,
    # would mark a right answer wrong.
    for question in COMPUTED:
        assert len(set(question["options"])) == 4, question["id"]
        if re.fullmatch(r"-?\d+(/\d+)?", question["correct"]):
            try:
                values = [Fraction(v) for v in question["options"]]
            except ValueError:
                continue
            assert len(set(values)) == 4, question["id"]


def test_the_three_questions_that_were_once_wrong_stay_fixed():
    for q in COMPUTED:
        assert not re.search(r"GH₵ 50\. It was (increased|reduced) by 25%", q["question"])
        assert "buys goods for GH₵ 50 and sells them for GH₵ 62" not in q["question"]
