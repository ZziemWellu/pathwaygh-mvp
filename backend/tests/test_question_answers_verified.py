"""Every calculated question is solved again here from its wording alone,
without using the build script's code. A template with no solver fails the
test, so nothing new can go live unchecked. This exists because an earlier,
partial version of this check missed answers that integer division had
rounded: 'GH₵ 50 reduced by 25%' was marked GH₵ 38."""

import json
import math
import re
from collections import Counter
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


def mode_of(m, answer):
    counts = Counter(nums(m[1]))
    top = max(counts.values())
    modes = [v for v, c in counts.items() if c == top]
    return len(modes) == 1 and same_number(modes[0], answer)


def inequality(m, answer):
    a, b, sign, c = int(m[1]), int(m[2]), m[3], int(m[4])
    return (c - b) % a == 0 and answer == f"x {sign} {(c - b) // a}"


def distance(m, answer):
    dx, dy = int(m[3]) - int(m[1]), int(m[4]) - int(m[2])
    root = math.isqrt(dx * dx + dy * dy)
    return root * root == dx * dx + dy * dy and same_number(root, answer)


def midpoint(m, answer):
    x1, y1, x2, y2 = (int(v) for v in m.groups())
    return (x1 + x2) % 2 == 0 and (y1 + y2) % 2 == 0 and answer == f"({(x1 + x2) // 2}, {(y1 + y2) // 2})"


def magnitude(m, answer):
    a, b = int(m[1]), int(m[2])
    root = math.isqrt(a * a + b * b)
    return root * root == a * a + b * b and same_number(root, answer)


def simplest_sum(m, answer):
    total = Fraction(int(m[1]), int(m[2])) + Fraction(int(m[3]), int(m[4]))
    return same_fraction(total, answer) and answer == str(total)


def modular(op):
    def check(m, answer):
        a, b, mod = int(m[1]), int(m[2]), int(m[3])
        value = (a + b) % mod if op == "+" else (a * b) % mod
        return answer == str(value)

    return check


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
    # JHS 3 and SHS 3 additions
    (r"^What is (\d+)/(\d+) \+ (\d+)/(\d+)\? Give the answer in its simplest form\.$", simplest_sum),
    (r"^Find (\d+)% of GH₵ (\d+)\.$", lambda m, a: same_number(Fraction(int(m[1]) * int(m[2]), 100), a)),
    (r"is marked GH₵ (\d+)\. The shop gives a discount of (\d+)%\. How much does the customer pay\?$", lambda m, a: same_number(Fraction(int(m[1]) * (100 - int(m[2])), 100), a)),
    (r"buys an? .+ for GH₵ (\d+) and sells it at a (profit|loss) of (\d+)%\. What is the selling price\?$", lambda m, a: same_number(Fraction(int(m[1]) * (100 + (1 if m[2] == "profit" else -1) * int(m[3])), 100), a)),
    (r"saves GH₵ ([\d,]+) in a bank at (\d+)% simple interest per annum\. How much interest does .+ earn in (\d+) years\?$", lambda m, a: same_number(Fraction(n(m[1]) * int(m[2]) * int(m[3]), 100), a)),
    (r"^Find the area of a triangle with base (\d+) cm and height (\d+) cm\.$", lambda m, a: same_number(Fraction(int(m[1]) * int(m[2]), 2), a)),
    (r"^Find the area of a trapezium whose parallel sides are (\d+) cm and (\d+) cm long and whose height is (\d+) cm\.$", lambda m, a: same_number(Fraction((int(m[1]) + int(m[2])) * int(m[3]), 2), a)),
    (r"^Solve the inequality: (\d+)x \+ (\d+) ([<>]) (-?\d+)$", inequality),
    (r"^Find the mode of (\d[\d, ]*)\.$", mode_of),
    (r"^Find the length of an arc of a circle of radius (\d+) cm that subtends an angle of (\d+)° at the centre\.", lambda m, a: same_number(Fraction(int(m[2]), 360) * 2 * Fraction(22, 7) * int(m[1]), a)),
    (r"^Find the area of a sector of a circle of radius (\d+) cm whose angle at the centre is (\d+)°\.", lambda m, a: same_number(Fraction(int(m[2]), 360) * Fraction(22, 7) * int(m[1]) ** 2, a)),
    (r"^Find the volume of a cylinder of radius (\d+) cm and height (\d+) cm\.", lambda m, a: same_number(Fraction(22, 7) * int(m[1]) ** 2 * int(m[2]), a)),
    (r"an arc subtends an angle of (\d+)° at O\. What angle does the same arc subtend at a point on the remaining part of the circumference\?$", lambda m, a: int(m[1]) < 180 and same_number(Fraction(int(m[1]), 2), a)),
    (r"^Find the sum of the interior angles of a polygon with (\d+) sides\.$", lambda m, a: same_number((int(m[1]) - 2) * 180, a)),
    (r"^Find the size of each interior angle of a regular polygon with (\d+) sides\.$", lambda m, a: same_number(Fraction((int(m[1]) - 2) * 180, int(m[1])), a)),
    (r"^Find the distance between the points \((-?\d+), (-?\d+)\) and \((-?\d+), (-?\d+)\)\.$", distance),
    (r"^Find the midpoint of the line joining \((-?\d+), (-?\d+)\) and \((-?\d+), (-?\d+)\)\.$", midpoint),
    (r"^Evaluate (\d+) \+ (\d+) \(mod (\d+)\)\.$", modular("+")),
    (r"^Evaluate (\d+) x (\d+) \(mod (\d+)\)\.$", modular("x")),
    (r"^y varies directly as x, and y = (\d+) when x = (\d+)\. Find y when x = (\d+)\.$", lambda m, a: same_fraction(Fraction(int(m[1]), int(m[2])) * int(m[3]), a)),
    (r"^y varies inversely as x, and y = (\d+) when x = (\d+)\. Find y when x = (\d+)\.$", lambda m, a: same_fraction(Fraction(int(m[1]) * int(m[2]), int(m[3])), a)),
    (r"^Find the magnitude of the vector whose components are (-?\d+) and (-?\d+)\.$", magnitude),
    (r"^The point P\((-?\d+), (-?\d+)\) is translated by the vector \((-?\d+), (-?\d+)\)\. Find the coordinates of its image\.$", lambda m, a: a == f"({int(m[1]) + int(m[3])}, {int(m[2]) + int(m[4])})"),
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
