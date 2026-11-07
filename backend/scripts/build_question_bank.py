"""
Builds the Ghana question bank: data/practice/bank_gh.json, plus a CSV of the
questions that still need a teacher to read them.

Maths questions are generated from templates, so each answer is calculated
rather than written by hand (review_status "computed"), and every one carries
its working. English and science are hand-written in question_bank_written.py
and stay "pending_review" until a teacher has checked them.

Same seed, same bank. Re-run after changing a template or a written question:
    python scripts/build_question_bank.py
"""

import csv
import json
import math
import random
import sys
from fractions import Fraction
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

import question_bank_written as written  # noqa: E402

DATA_DIR = Path(__file__).resolve().parents[1] / "data" / "practice"
BANK_FILE = DATA_DIR / "bank_gh.json"
REVIEW_CSV = DATA_DIR / "bank_gh_for_teacher_review.csv"
DECISIONS_FILE = DATA_DIR / "bank_gh_teacher_decisions.json"

NAMES = ["Ama", "Kofi", "Akosua", "Kwame", "Esi", "Yaw", "Abena", "Kojo", "Adjoa", "Fuseini", "Selorm", "Naa"]
ITEMS = ["oranges", "mangoes", "exercise books", "pencils", "eggs", "tubers of yam"]
RNG = random.Random(2026)


class Retry(Exception):
    """A text-answer template's wrong answers collided, so pick new numbers."""


def options_for(correct, wrongs, fmt=str):
    """Exactly four different options, with the wrong ones nudged apart if a
    template's mistakes happen to coincide with each other or the answer."""
    answer = fmt(correct)
    chosen = []
    for w in wrongs:
        text = fmt(w)
        if text != answer and text not in chosen:
            chosen.append(text)
    if len(chosen) < 3 and isinstance(correct, str):
        raise Retry
    bump = 1
    while len(chosen) < 3:
        candidate = fmt(correct + bump)
        if candidate != answer and candidate not in chosen:
            chosen.append(candidate)
        bump += 1
    options = [answer, *chosen[:3]]
    RNG.shuffle(options)
    return answer, options


def q(question, correct, wrongs, explanation, difficulty, fmt=str):
    answer, options = options_for(correct, wrongs, fmt)
    return {"question": question, "options": options, "correct": answer, "explanation": explanation, "difficulty": difficulty}


def frac(x):
    x = Fraction(x)
    return str(x.numerator) if x.denominator == 1 else f"{x.numerator}/{x.denominator}"


def _simplified(top, bottom):
    simplest = frac(Fraction(top, bottom))
    plain = f"{top}/{bottom}"
    return plain if plain == simplest else f"{plain}, which simplifies to {simplest}"


def collect(generator, limit):
    """Runs a question template until it has `limit` different questions, or
    stops finding new ones."""
    found = {}
    misses = 0
    while len(found) < limit and misses < limit * 40:
        try:
            item = generator()
        except Retry:
            misses += 1
            continue
        if item["question"] in found:
            misses += 1
        else:
            found[item["question"]] = item
    return list(found.values())


R = RNG.randint
C = RNG.choice


# ---------------------------------------------------------------- Primary

def p_add_20():
    a, b = R(1, 10), R(1, 9)
    return q(f"What is {a} + {b}?", a + b, [a + b + 1, a + b - 1 if a + b > 1 else a + b + 2, a + b + 2], f"Count on {b} from {a}: {a} + {b} = {a + b}.", "easy")


def p_sub_20():
    a, b = R(5, 20), R(1, 4)
    return q(f"What is {a} - {b}?", a - b, [a - b + 1, a - b - 1, a + b], f"Count back {b} from {a}: {a} - {b} = {a - b}.", "easy")


def p_add_100():
    a, b = R(11, 60), R(11, 39)
    return q(f"What is {a} + {b}?", a + b, [a + b + 10, a + b - 10, a + b + 1], f"Add the tens, then the ones: {a} + {b} = {a + b}.", "easy")


def p_sub_100():
    a, b = R(30, 99), R(11, 29)
    return q(f"What is {a} - {b}?", a - b, [a - b + 10, a - b - 10, a - b + 1], f"{a} - {b} = {a - b}. Check: {a - b} + {b} = {a}.", "easy")


def p_tables():
    a, b = C([2, 5, 10]), R(1, 10)
    return q(f"What is {a} x {b}?", a * b, [a * b + a, a * b + 1, a + b + 1 if a + b == a * b else a + b], f"Count in {a}s, {b} times: {a} x {b} = {a * b}.", "easy")


def p_add():
    a, b = R(100, 8999), R(100, 999)
    return q(f"What is {a:,} + {b:,}?", a + b, [a + b + 10, a + b - 10, a + b + 100], f"Add the columns: {a:,} + {b:,} = {a + b:,}.", "easy", lambda v: f"{v:,}")


def p_sub():
    a, b = R(500, 9999), R(100, 499)
    return q(f"What is {a:,} - {b:,}?", a - b, [a - b + 10, a - b - 10, a + b], f"{a:,} - {b:,} = {a - b:,}. Check: {a - b:,} + {b:,} = {a:,}.", "easy", lambda v: f"{v:,}")


def p_mul():
    a, b = R(2, 12), R(2, 12)
    return q(f"What is {a} x {b}?", a * b, [a * b + a, a * b - b, a + b], f"{a} x {b} = {a * b}.", "easy")


def p_mul2():
    a, b = R(12, 99), R(2, 9)
    return q(f"What is {a} x {b}?", a * b, [a * b + 10, a * b - 10, a + b], f"{a} x {b} = {a * b}.", "medium")


def p_div():
    b, c = R(2, 12), R(2, 15)
    a = b * c
    return q(f"What is {a} ÷ {b}?", c, [c + 1, c - 1 if c > 1 else c + 2, a - b], f"{a} ÷ {b} = {c}, because {c} x {b} = {a}.", "easy")


def p_place():
    n = R(1000, 9999)
    digits = str(n)
    i = R(0, 3)
    place = ["thousands", "hundreds", "tens", "ones"][i]
    value = int(digits[i]) * 10 ** (3 - i)
    if int(digits[i]) == 0:
        return p_place()
    digit = int(digits[i])
    return q(f"What is the value of the digit {digit} in the {place} place of {n:,}?", value, [digit, value * 10, value // 10 if value >= 10 else digit + 1], f"{digit} in the {place} place is worth {value:,}.", "medium", lambda v: f"{v:,}")


def p_round():
    n = R(101, 989)
    answer = round(n / 10) * 10 if n % 10 != 5 else (n // 10 + 1) * 10
    return q(f"Round {n} to the nearest 10.", answer, [answer + 10, answer - 10, n], f"Look at the ones digit. {n} is closest to {answer}.", "medium")


def p_frac_add():
    d = R(3, 12)
    a, b = R(1, d - 2) if d > 3 else 1, 1
    answer = Fraction(a + b, d)
    return q(f"What is {a}/{d} + {b}/{d}?", answer, [Fraction(a + b, 2 * d), Fraction(a * b, d), Fraction(a + b + 1, d)], f"Same bottom number, so add the tops: {a} + {b} = {a + b}. That gives {_simplified(a + b, d)}.", "medium", frac)


def p_frac_of():
    d = C([2, 3, 4, 5, 6, 8, 10])
    n = R(1, d - 1)
    whole = d * R(2, 12)
    answer = whole // d * n
    return q(f"What is {n}/{d} of {whole}?", answer, [whole // d, whole - answer + 1, answer + d], f"{whole} ÷ {d} = {whole // d}, then {whole // d} x {n} = {answer}.", "medium")


def p_decimal_add():
    a, b = R(11, 95), R(11, 95)
    answer = (a + b) / 10
    return q(f"What is {a / 10:.1f} + {b / 10:.1f}?", answer, [answer + 1, answer - 0.1, answer + 0.1], f"Line up the decimal points: {a / 10:.1f} + {b / 10:.1f} = {answer:.1f}.", "medium", lambda v: f"{v:.1f}")


def p_percent():
    p = C([10, 20, 25, 50])
    whole = C([20, 40, 60, 80, 100, 120, 200, 400])
    answer = whole * p // 100
    return q(f"What is {p}% of {whole}?", answer, [whole - answer + 5, answer + 10, p], f"{p}% means {p} out of 100: {whole} x {p} ÷ 100 = {answer}.", "medium")


def p_perimeter():
    a, b = R(2, 30), R(2, 30)
    return q(f"A rectangle is {a} m long and {b} m wide. What is its perimeter?", 2 * (a + b), [a * b + 1 if a * b == 2 * (a + b) else a * b, a + b, 2 * (a + b) + 2], f"Perimeter = {a} + {b} + {a} + {b} = {2 * (a + b)} m.", "medium", lambda v: f"{v} m")


def p_area():
    a, b = R(2, 25), R(2, 25)
    return q(f"A rectangle is {a} cm long and {b} cm wide. What is its area?", a * b, [2 * (a + b) + 1 if a * b == 2 * (a + b) else 2 * (a + b), a + b, a * b + a], f"Area = length x width = {a} x {b} = {a * b} square cm.", "medium", lambda v: f"{v} square cm")


def p_convert():
    kind = R(0, 3)
    if kind == 0:
        m = R(2, 40)
        return q(f"How many centimetres are in {m} metres?", m * 100, [m * 10, m * 1000, m + 100], f"1 m = 100 cm, so {m} x 100 = {m * 100} cm.", "easy", lambda v: f"{v} cm")
    if kind == 1:
        k = R(2, 40)
        return q(f"How many grams are in {k} kilograms?", k * 1000, [k * 100, k * 10, k + 1000], f"1 kg = 1,000 g, so {k} x 1,000 = {k * 1000:,} g.", "easy", lambda v: f"{v:,} g")
    if kind == 2:
        h = R(2, 12)
        return q(f"How many minutes are in {h} hours?", h * 60, [h * 100, h * 30, h * 24], f"1 hour = 60 minutes, so {h} x 60 = {h * 60} minutes.", "easy", lambda v: f"{v} minutes")
    km = R(2, 40)
    return q(f"How many metres are in {km} kilometres?", km * 1000, [km * 100, km * 10, km + 1000], f"1 km = 1,000 m, so {km} x 1,000 = {km * 1000:,} m.", "easy", lambda v: f"{v:,} m")


def p_change():
    name = C(NAMES)
    price, paid = R(2, 45), C([50, 100, 200])
    return q(f"{name} buys a book for GH₵ {price} and pays with GH₵ {paid}. How much change should {name} get?", paid - price, [paid - price + 1, paid - price - 1, paid + price], f"Change = {paid} - {price} = GH₵ {paid - price}.", "easy", lambda v: f"GH₵ {v}")


def p_share():
    name, item = C(NAMES), C(ITEMS)
    people, each = R(2, 9), R(2, 15)
    total = people * each
    return q(f"{name} shares {total} {item} equally among {people} friends. How many does each friend get?", each, [each + 1, each - 1 if each > 1 else each + 2, total - people], f"{total} ÷ {people} = {each}.", "medium")


def p_rows():
    item = C(ITEMS)
    rows, per = R(3, 12), R(3, 12)
    return q(f"There are {rows} baskets with {per} {item} in each. How many {item} are there altogether?", rows * per, [rows + per, rows * per + per, rows * per - rows], f"{rows} x {per} = {rows * per}.", "medium")


# -------------------------------------------------------------------- JHS

def j_lcm():
    a, b = R(2, 15), R(2, 15)
    if a == b:
        return j_lcm()
    answer = a * b // math.gcd(a, b)
    return q(f"Find the LCM of {a} and {b}.", answer, [a * b + 1 if a * b == answer else a * b, math.gcd(a, b), answer + a], f"The lowest number that both {a} and {b} divide into is {answer}.", "medium")


def j_hcf():
    k, a, b = R(2, 12), R(2, 9), R(2, 9)
    if math.gcd(a, b) != 1 or a == b:
        return j_hcf()
    x, y = k * a, k * b
    return q(f"Find the HCF of {x} and {y}.", k, [k * 2, x * y // k, k + 1], f"{x} = {k} x {a} and {y} = {k} x {b}, so the highest common factor is {k}.", "medium")


def j_integers():
    a, b, c = R(-20, 20), R(1, 20), R(1, 20)
    answer = a - b + c
    return q(f"Simplify: {f'({a})' if a < 0 else a} - {b} + {c}", answer, [a + b + c, a - b - c, -answer if answer else 3], f"Work left to right: {a} - {b} = {a - b}, then {a - b} + {c} = {answer}.", "medium")


def j_bodmas():
    a, b, c = R(2, 20), R(2, 9), R(2, 9)
    answer = a + b * c
    return q(f"Simplify using BODMAS: {a} + {b} x {c}", answer, [(a + b) * c, a * b + c, a + b + c], f"Multiply first: {b} x {c} = {b * c}, then {a} + {b * c} = {answer}.", "medium")


def j_percent_change():
    price, pct = C([40, 50, 80, 100, 120, 150, 200, 250, 400, 500]), C([10, 20, 25, 50])
    if price * pct % 100:
        return j_percent_change()
    up = R(0, 1) == 1
    change = price * pct // 100
    answer = price + change if up else price - change
    word = "increased" if up else "reduced"
    sign = "+" if up else "-"
    return q(f"The price of a bag was GH₵ {price}. It was {word} by {pct}%. What is the new price?", answer, [price - change if up else price + change, change, price + pct if up else price - pct], f"{pct}% of {price} = {change}. New price = {price} {sign} {change} = GH₵ {answer}.", "medium", lambda v: f"GH₵ {v}")


def j_ratio():
    a, b, unit = R(1, 7), R(1, 7), R(2, 15)
    if a == b or math.gcd(a, b) != 1:
        return j_ratio()
    total = (a + b) * unit
    x, y = C(NAMES), C(NAMES)
    if x == y:
        return j_ratio()
    return q(f"{x} and {y} share GH₵ {total} in the ratio {a}:{b}. How much does {x} get?", a * unit, [b * unit, total // 2 if total // 2 != a * unit else a * unit + 1, unit], f"Total parts = {a + b}. One part = {total} ÷ {a + b} = {unit}. {x} gets {a} x {unit} = GH₵ {a * unit}.", "medium", lambda v: f"GH₵ {v}")


def j_standard_form():
    m, e = R(11, 99), R(2, 6)
    n = m * 10 ** (e - 1)
    return q(f"Write {n:,} in standard form.", f"{m / 10:.1f} x 10^{e}", [f"{m} x 10^{e}", f"{m / 10:.1f} x 10^{e + 1}", f"{m / 10:.1f} x 10^{e - 1}"], f"Move the decimal point {e} places: {n:,} = {m / 10:.1f} x 10^{e}.", "medium", lambda v: v)


def j_linear():
    x, a, b = R(1, 15), R(2, 9), R(1, 20)
    c = a * x + b
    return q(f"Solve for x: {a}x + {b} = {c}", x, [x + 1, c - b, x + a], f"{a}x = {c} - {b} = {c - b}, so x = {c - b} ÷ {a} = {x}.", "medium", lambda v: f"x = {v}")


def j_linear_sub():
    x, a, b = R(3, 20), R(2, 9), R(1, 15)
    c = a * x - b
    return q(f"Solve for x: {a}x - {b} = {c}", x, [x - 1, c + b, x + 2], f"{a}x = {c} + {b} = {c + b}, so x = {c + b} ÷ {a} = {x}.", "medium", lambda v: f"x = {v}")


def j_substitute():
    a, b, x = R(2, 9), R(1, 15), R(2, 9)
    answer = a * x + b
    return q(f"If x = {x}, find the value of {a}x + {b}.", answer, [a + x + b, a * x - b, a * (x + b)], f"{a} x {x} + {b} = {a * x} + {b} = {answer}.", "easy")


def j_like_terms():
    a, b, c = R(2, 12), R(2, 12), R(1, 9)
    return q(f"Simplify: {a}x + {b}x - {c}x", (a + b - c), [a + b + c, a - b - c, a * b - c], f"Collect the x terms: {a} + {b} - {c} = {a + b - c}.", "easy", lambda v: f"{v}x")


def j_expand():
    a, b, c = R(2, 9), R(1, 9), R(1, 9)
    return q(f"Expand: {a}({b}x + {c})", f"{a * b}x + {a * c}", [f"{a * b}x + {c}", f"{a + b}x + {a + c}", f"{b}x + {a * c}"], f"Multiply each term by {a}: {a} x {b}x = {a * b}x and {a} x {c} = {a * c}.", "medium", lambda v: v)


def j_triangle():
    a, b = R(20, 80), R(20, 70)
    return q(f"Two angles of a triangle are {a}° and {b}°. Find the third angle.", 180 - a - b, [360 - a - b, a + b, 90 - abs(a - b) if 90 - abs(a - b) > 0 else 45], f"Angles in a triangle add up to 180°: 180 - {a} - {b} = {180 - a - b}°.", "easy", lambda v: f"{v}°")


def j_straight():
    a = R(15, 165)
    return q(f"Two angles on a straight line are {a}° and x. Find x.", 180 - a, [360 - a, 90 - a if a < 90 else a - 90, a], f"Angles on a straight line add up to 180°: x = 180 - {a} = {180 - a}°.", "easy", lambda v: f"{v}°")


def j_circle():
    r = C([7, 14, 21, 28, 35, 42, 3.5])
    area = Fraction(22, 7) * Fraction(r) ** 2
    circ = 2 * Fraction(22, 7) * Fraction(r)
    if R(0, 1):
        return q(f"Find the area of a circle of radius {r} cm. (Take π = 22/7)", float(area), [float(circ), float(area) * 2, float(area) / 2], f"Area = πr² = 22/7 x {r} x {r} = {float(area):g} square cm.", "medium", lambda v: f"{v:g} square cm")
    return q(f"Find the circumference of a circle of radius {r} cm. (Take π = 22/7)", float(circ), [float(circ) / 2, float(circ) * 2, float(area)], f"Circumference = 2πr = 2 x 22/7 x {r} = {float(circ):g} cm.", "medium", lambda v: f"{v:g} cm")


def j_pythagoras():
    (a, b, c), k = C([(3, 4, 5), (5, 12, 13), (8, 15, 17), (7, 24, 25)]), R(1, 6)
    a, b, c = a * k, b * k, c * k
    return q(f"A right-angled triangle has shorter sides of {a} cm and {b} cm. Find the longest side.", c, [a + b, c + 1, b - a if b - a != c else c + 2], f"c² = {a}² + {b}² = {a * a} + {b * b} = {c * c}, so c = {c} cm.", "medium", lambda v: f"{v} cm")


def j_volume():
    a, b, c = R(2, 15), R(2, 12), R(2, 10)
    return q(f"Find the volume of a cuboid measuring {a} cm by {b} cm by {c} cm.", a * b * c, [a + b + c, 2 * (a * b + b * c + a * c), a * b], f"Volume = {a} x {b} x {c} = {a * b * c} cubic cm.", "medium", lambda v: f"{v} cubic cm")


def j_mean():
    values = sorted(R(2, 30) for _ in range(4))
    total = sum(values)
    extra = 5 * R(3, 20) - total
    if extra < 1 or extra > 60:
        return j_mean()
    data = [*values, extra]
    RNG.shuffle(data)
    answer = sum(data) // 5
    return q(f"Find the mean of {', '.join(map(str, data))}.", answer, [sum(data), sorted(data)[2] if sorted(data)[2] != answer else answer + 1, answer + 2], f"Add them: {sum(data)}. Divide by 5: {sum(data)} ÷ 5 = {answer}.", "easy")


def j_median():
    data = RNG.sample(range(1, 60), 5)
    answer = sorted(data)[2]
    return q(f"Find the median of {', '.join(map(str, data))}.", answer, [data[2] if data[2] != answer else answer + 1, max(data), sum(data) // 5 if sum(data) // 5 != answer else answer + 2], f"Put them in order: {', '.join(map(str, sorted(data)))}. The middle value is {answer}.", "easy")


def j_range():
    data = RNG.sample(range(1, 90), 6)
    answer = max(data) - min(data)
    return q(f"Find the range of {', '.join(map(str, data))}.", answer, [max(data), min(data), max(data) + min(data)], f"Range = highest - lowest = {max(data)} - {min(data)} = {answer}.", "easy")


def j_probability():
    red, blue = R(1, 9), R(1, 9)
    total = red + blue
    return q(f"A bag holds {red} red and {blue} blue balls. One ball is picked at random. What is the probability that it is red?", Fraction(red, total), [Fraction(blue, total) if red != blue else Fraction(1, total), Fraction(1, total + 1), Fraction(red, total + 1)], f"Probability = red balls ÷ all balls = {_simplified(red, total)}.", "medium", frac)


# -------------------------------------------------------------------- SHS

def s_quadratic():
    a, b = R(-9, 9), R(-9, 9)
    if a == 0 or b == 0 or a == b:
        return s_quadratic()
    s, p = -(a + b), a * b
    middle = f"+ {s}x" if s > 0 else (f"- {-s}x" if s < 0 else "")
    if not middle:
        return s_quadratic()
    end = f"+ {p}" if p > 0 else f"- {-p}"
    lo, hi = sorted((a, b))
    return q(f"Solve: x² {middle} {end} = 0", f"x = {lo} or x = {hi}", [f"x = {-hi} or x = {-lo}", f"x = {lo} or x = {-hi}", f"x = {lo - 1} or x = {hi + 1}"], f"Find two numbers that multiply to {p} and add to {s}: they are {-a} and {-b}. So (x {'-' if a > 0 else '+'} {abs(a)})(x {'-' if b > 0 else '+'} {abs(b)}) = 0, giving x = {a} or x = {b}.", "hard", lambda v: v)


def s_simultaneous():
    x, y = R(1, 9), R(1, 9)
    a, b = R(1, 5), R(1, 5)
    if a == b:
        return s_simultaneous()
    e1, e2 = x + y, a * x + b * y
    return q(f"Solve: x + y = {e1} and {a}x + {b}y = {e2}", f"x = {x}, y = {y}", [f"x = {y}, y = {x}" if x != y else f"x = {x + 1}, y = {y - 1}", f"x = {x + 1}, y = {y + 1}", f"x = {x + 2}, y = {y - 2}"], f"From the first, y = {e1} - x. Substitute: {a}x + {b}({e1} - x) = {e2}, so {a - b}x = {e2 - b * e1}, x = {x}. Then y = {e1} - {x} = {y}.", "hard", lambda v: v)


def s_indices():
    base, m, n = R(2, 5), R(2, 6), R(1, 4)
    if R(0, 1):
        return q(f"Simplify: {base}^{m} x {base}^{n}", f"{base}^{m + n}", [f"{base}^{m * n}", f"{base * 2}^{m + n}", f"{base}^{abs(m - n) + 1 if m + n == abs(m - n) else abs(m - n)}"], f"Same base, so add the powers: {m} + {n} = {m + n}.", "medium", lambda v: v)
    return q(f"Simplify: ({base}^{m})^{n + 1}", f"{base}^{m * (n + 1)}", [f"{base}^{m + n + 2 if m + n + 1 == m * (n + 1) else m + n + 1}", f"{base * (n + 1)}^{m}", f"{base}^{m * (n + 1) + 1}"], f"Power of a power, so multiply: {m} x {n + 1} = {m * (n + 1)}.", "medium", lambda v: v)


def s_logs():
    base, power = C([2, 3, 5, 10]), R(1, 5)
    n = base ** power
    return q(f"Evaluate: log base {base} of {n:,}", power, [power + 1, n // base if n // base != power else power + 2, base], f"{base}^{power} = {n:,}, so the log is {power}.", "medium")


def s_surds():
    k, n = R(2, 9), C([2, 3, 5, 6, 7])
    return q(f"Simplify: √{k * k * n}", f"{k}√{n}", [f"{n}√{k}", f"{k * n}", f"{k}√{n + 1}"], f"√{k * k * n} = √({k * k} x {n}) = {k}√{n}.", "medium", lambda v: v)


def s_simple_interest():
    p, r, t = C([200, 400, 500, 800, 1000, 1500, 2000, 5000]), C([5, 10, 12, 15, 20]), R(1, 5)
    i = p * r * t // 100
    return q(f"Find the simple interest on GH₵ {p:,} at {r}% per annum for {t} year{'s' if t > 1 else ''}.", i, [p + i, i + p * r // 100, p * r // 100 + 1 if t == 1 else p * r // 100], f"I = PRT/100 = {p:,} x {r} x {t} ÷ 100 = GH₵ {i:,}.", "medium", lambda v: f"GH₵ {v:,}")


def s_compound():
    p, r = C([1000, 2000, 4000, 5000, 10000]), C([10, 20])
    amount = p * (100 + r) ** 2 // 10000
    simple = p + 2 * p * r // 100
    return q(f"GH₵ {p:,} is saved at {r}% compound interest per annum. What is the amount after 2 years?", amount, [simple, amount - p, p + p * r // 100], f"Year 1: {p:,} x 1.{r // 10}0 = {p * (100 + r) // 100:,}. Year 2: {p * (100 + r) // 100:,} x 1.{r // 10}0 = GH₵ {amount:,}.", "hard", lambda v: f"GH₵ {v:,}")


def s_profit():
    cost, pct = C([50, 100, 200, 250, 400, 500, 800, 1000]), C([10, 20, 25, 40, 50])
    if cost * pct % 100:
        return s_profit()
    profit = cost * pct // 100
    return q(f"A trader buys goods for GH₵ {cost} and sells them for GH₵ {cost + profit}. What is the percentage profit?", pct, [profit, pct + 5, 100 - pct], f"Profit = {profit}. Percentage profit = {profit} ÷ {cost} x 100 = {pct}%.", "medium", lambda v: f"{v}%")


def s_bases():
    n = R(5, 60)
    if R(0, 1):
        return q(f"Convert {bin(n)[2:]} base two to base ten.", n, [n + 1, n - 1, n * 2], f"Add the place values of the 1s in {bin(n)[2:]}: the result is {n}.", "medium")
    return q(f"Convert {n} base ten to base two.", bin(n)[2:], [bin(n + 1)[2:], bin(n - 1)[2:], bin(n * 2 + 1)[2:]], f"Divide by 2 repeatedly and read the remainders upwards: {n} = {bin(n)[2:]} in base two.", "medium", lambda v: v)


def s_ap():
    a, d, n = R(1, 15), R(2, 9), R(5, 30)
    answer = a + (n - 1) * d
    return q(f"The first term of an arithmetic progression is {a} and the common difference is {d}. Find term number {n}.", answer, [a + n * d, a * n + d, answer - d + 1], f"T_n = a + (n - 1)d = {a} + {n - 1} x {d} = {answer}.", "medium")


def s_gp():
    a, r, n = R(1, 5), R(2, 3), R(3, 7)
    answer = a * r ** (n - 1)
    return q(f"The first term of a geometric progression is {a} and the common ratio is {r}. Find term number {n}.", answer, [a * r ** n, a + (n - 1) * r, answer + r], f"T_n = ar^(n - 1) = {a} x {r}^{n - 1} = {answer}.", "medium")


def s_trig():
    (o, a, h), k = C([(3, 4, 5), (5, 12, 13), (8, 15, 17)]), R(1, 4)
    o, a, h = o * k, a * k, h * k
    ratio, fn = C([("sin", Fraction(o, h)), ("cos", Fraction(a, h)), ("tan", Fraction(o, a))])
    wrong = [Fraction(h, o), Fraction(a, o), Fraction(o, h) if ratio != "sin" else Fraction(a, h)]
    return q(f"In a right-angled triangle, the side opposite angle θ is {o} cm, the adjacent side is {a} cm and the hypotenuse is {h} cm. Find {ratio} θ.", fn, wrong, f"SOH CAH TOA gives {ratio} θ = {frac(fn)}.", "medium", frac)


def s_sets():
    only_a, only_b, both = R(3, 25), R(3, 25), R(2, 20)
    a, b = only_a + both, only_b + both
    total = only_a + only_b + both
    return q(f"In a class of {total} students, each studying at least one of two subjects, {a} study Biology and {b} study Chemistry. How many study both?", both, [a + b, total - a, both + 1], f"Both = {a} + {b} - {total} = {both}.", "medium")


def s_gradient():
    x1, y1, m, dx = R(-6, 6), R(-6, 6), R(-5, 5), R(1, 6)
    if m == 0:
        return s_gradient()
    x2, y2 = x1 + dx, y1 + m * dx
    return q(f"Find the gradient of the line through ({x1}, {y1}) and ({x2}, {y2}).", m, [-m, Fraction(1, m), m + 1], f"Gradient = ({y2} - ({y1})) ÷ ({x2} - ({x1})) = {y2 - y1} ÷ {dx} = {m}.", "medium", frac)


def s_mean_freq():
    scores = sorted(RNG.sample(range(1, 11), 3))
    freqs = [R(1, 8) for _ in scores]
    total, n = sum(s * f for s, f in zip(scores, freqs, strict=True)), sum(freqs)
    answer = Fraction(total, n)
    table = ", ".join(f"score {s} (frequency {f})" for s, f in zip(scores, freqs, strict=True))
    return q(f"Find the mean of: {table}. Give your answer as a fraction or whole number.", answer, [Fraction(sum(scores), 3) if Fraction(sum(scores), 3) != answer else answer + 1, answer + 1, Fraction(total, n + 1)], f"Sum of score x frequency = {total}. Total frequency = {n}. Mean = {total}/{n} = {frac(answer)}.", "hard", frac)


def s_prob_two():
    red, blue = R(2, 8), R(2, 8)
    t = red + blue
    answer = Fraction(red, t) * Fraction(red - 1, t - 1)
    return q(f"A bag holds {red} red and {blue} blue balls. Two are picked without replacement. What is the probability that both are red?", answer, [Fraction(red, t) ** 2, Fraction(red, t), Fraction(blue, t) * Fraction(blue - 1, t - 1) if red != blue else Fraction(1, t)], f"{red}/{t} x {red - 1}/{t - 1} = {frac(answer)}.", "hard", frac)


# ----------------------------------------------------------------- Assembly

# The first primary class each template suits, roughly following Ghana's
# standards-based curriculum. A teacher should check these along with the rest.
MIN_CLASS = {
    "p_add_20": 1, "p_sub_20": 1, "p_add_100": 2, "p_sub_100": 2, "p_tables": 2,
    "p_add": 4, "p_sub": 4, "p_mul": 3, "p_mul2": 4, "p_div": 3, "p_place": 4, "p_round": 4,
    "p_frac_add": 4, "p_frac_of": 5, "p_decimal_add": 5, "p_percent": 6,
    "p_perimeter": 4, "p_area": 5, "p_convert": 4, "p_change": 3, "p_share": 4, "p_rows": 3,
}
# Written primary questions assume a child who can read on their own.
WRITTEN_PRIMARY_MIN_CLASS = 3

# The skill each template practises, for sub-skill mastery. JHS names match the
# ones already used in questions.json.
SUB_SKILLS = {
    "p_add_20": "addition", "p_sub_20": "subtraction", "p_add_100": "addition", "p_sub_100": "subtraction",
    "p_tables": "multiplication",
    "p_add": "addition", "p_sub": "subtraction", "p_mul": "multiplication", "p_mul2": "multiplication",
    "p_div": "division", "p_place": "place_value", "p_round": "rounding", "p_frac_add": "adding_fractions",
    "p_frac_of": "fraction_of_an_amount", "p_decimal_add": "decimals", "p_percent": "percentages",
    "p_perimeter": "perimeter_and_area", "p_area": "perimeter_and_area", "p_convert": "units",
    "p_change": "money", "p_share": "sharing", "p_rows": "multiplication",
    "j_lcm": "factors_and_multiples", "j_hcf": "factors_and_multiples", "j_integers": "integers",
    "j_bodmas": "order_of_operations", "j_percent_change": "percentages", "j_ratio": "ratio",
    "j_standard_form": "standard_form", "j_linear": "linear_equations", "j_linear_sub": "linear_equations",
    "j_substitute": "substitution", "j_like_terms": "simplification", "j_expand": "simplification",
    "j_triangle": "angles", "j_straight": "angles", "j_circle": "circles", "j_pythagoras": "pythagoras",
    "j_volume": "volume", "j_mean": "averages", "j_median": "averages", "j_range": "averages",
    "j_probability": "probability",
    "s_quadratic": "quadratic_equations", "s_simultaneous": "simultaneous_equations", "s_indices": "indices_and_roots",
    "s_logs": "logarithms", "s_surds": "surds", "s_simple_interest": "interest", "s_compound": "interest",
    "s_profit": "profit_and_loss", "s_bases": "number_bases", "s_ap": "sequences", "s_gp": "sequences",
    "s_trig": "trigonometry", "s_gradient": "coordinate_geometry", "s_sets": "sets", "s_mean_freq": "averages",
    "s_prob_two": "probability",
}


def finish(generators, prefix, per_template):
    """Questions from a topic's templates, with ids, in a stable order."""
    questions = []
    seen = set()
    for generator in generators:
        for item in collect(generator, per_template):
            if item["question"] not in seen:
                seen.add(item["question"])
                item["sub_skill"] = SUB_SKILLS[generator.__name__]
                if generator.__name__ in MIN_CLASS:
                    item["min_class"] = MIN_CLASS[generator.__name__]
                questions.append(item)
    for index, item in enumerate(questions, 1):
        item["id"] = f"{prefix}_{index:03d}"
        item["review_status"] = "computed"
    return questions


def teacher_decisions():
    return json.loads(DECISIONS_FILE.read_text(encoding="utf-8")) if DECISIONS_FILE.exists() else {}


def written_topics(source, prefix, min_class=None):
    decisions = teacher_decisions()
    topics = []
    for (topic_id, topic_name), rows in source.items():
        questions = []
        for index, (question, correct, wrongs, explanation, difficulty) in enumerate(rows, 1):
            options = [correct, *wrongs]
            RNG.shuffle(options)
            question_id = f"{prefix}_{topic_id}_{index:03d}"
            decision = decisions.get(question_id)
            if decision == "rejected":
                continue
            questions.append(
                {
                    "id": question_id,
                    "question": question,
                    "options": options,
                    "correct": correct,
                    "explanation": explanation,
                    "difficulty": difficulty,
                    "review_status": "teacher_reviewed" if decision == "approved" else "pending_review",
                    # Written topics are narrow enough to be their own skill.
                    "sub_skill": topic_name.lower().replace(" and ", "_and_").replace(" ", "_"),
                    **({"min_class": min_class} if min_class else {}),
                }
            )
        topics.append({"id": topic_id, "name": topic_name, "questions": questions})
    return topics


def subject(subject_id, name, icon, levels, topics, sms=False):
    entry = {"id": subject_id, "name": name, "icon": icon, "country": "GH", "levels": levels, "topics": topics}
    if not sms:
        entry["sms"] = False
    return entry


def build():
    return {
        "subjects": [
            subject("mathematics_primary", "Primary Mathematics", "\U0001F4D0", ["primary"], [
                {"id": "p_number", "name": "Number and Operations", "questions": finish([p_add_20, p_sub_20, p_add_100, p_sub_100, p_tables, p_add, p_sub, p_mul, p_mul2, p_div, p_place, p_round], "pm_num", 25)},
                {"id": "p_fractions", "name": "Fractions, Decimals and Percentages", "questions": finish([p_frac_add, p_frac_of, p_decimal_add, p_percent], "pm_frac", 25)},
                {"id": "p_measure", "name": "Measurement", "questions": finish([p_perimeter, p_area, p_convert], "pm_meas", 30)},
                {"id": "p_word", "name": "Word Problems", "questions": finish([p_change, p_share, p_rows], "pm_word", 25)},
            ]),
            subject("english_primary", "Primary English", "\U0001F4DD", ["primary"], written_topics(written.PRIMARY_ENGLISH, "pe", WRITTEN_PRIMARY_MIN_CLASS)),
            subject("science_primary", "Primary Science", "\U0001F52C", ["primary"], written_topics(written.PRIMARY_SCIENCE, "ps", WRITTEN_PRIMARY_MIN_CLASS)),
            # These three add to the existing JHS banks in questions.json.
            subject("mathematics", "Mathematics", "\U0001F4D0", ["jhs"], [
                {"id": "algebra", "name": "Algebra", "questions": finish([j_linear, j_linear_sub, j_substitute, j_like_terms, j_expand], "jm_alg", 25)},
                {"id": "geometry", "name": "Geometry", "questions": finish([j_triangle, j_straight, j_circle, j_pythagoras, j_volume], "jm_geo", 18)},
                {"id": "j_number", "name": "Number", "questions": finish([j_lcm, j_hcf, j_integers, j_bodmas, j_percent_change, j_ratio, j_standard_form], "jm_num", 15)},
                {"id": "j_statistics", "name": "Statistics and Probability", "questions": finish([j_mean, j_median, j_range, j_probability], "jm_sta", 12)},
            ], sms=True),
            subject("english", "English Language", "\U0001F4DD", ["jhs"], written_topics(written.JHS_ENGLISH, "je"), sms=True),
            subject("science", "Science", "\U0001F52C", ["jhs"], written_topics(written.JHS_SCIENCE, "js"), sms=True),
            subject("core_mathematics_shs", "SHS Core Mathematics", "\U0001F4D0", ["shs"], [
                {"id": "s_algebra", "name": "Algebra", "questions": finish([s_quadratic, s_simultaneous, s_indices, s_logs, s_surds], "sm_alg", 25)},
                {"id": "s_commercial", "name": "Commercial Arithmetic", "questions": finish([s_simple_interest, s_compound, s_profit], "sm_com", 22)},
                {"id": "s_number", "name": "Number Bases and Sequences", "questions": finish([s_bases, s_ap, s_gp], "sm_num", 22)},
                {"id": "s_geometry", "name": "Trigonometry and Coordinate Geometry", "questions": finish([s_trig, s_gradient], "sm_geo", 15)},
                {"id": "s_statistics", "name": "Sets, Statistics and Probability", "questions": finish([s_sets, s_mean_freq, s_prob_two], "sm_sta", 15)},
            ]),
            subject("english_shs", "SHS English Language", "\U0001F4DD", ["shs"], written_topics(written.SHS_ENGLISH, "se")),
            subject("integrated_science_shs", "SHS Integrated Science", "\U0001F52C", ["shs"], written_topics(written.SHS_SCIENCE, "si")),
        ]
    }


def main():
    bank = build()
    BANK_FILE.write_text(json.dumps(bank, ensure_ascii=False, indent=1) + "\n", encoding="utf-8", newline="\n")
    # utf-8-sig so Excel shows GH₵ and ° properly.
    with open(REVIEW_CSV, "w", encoding="utf-8-sig", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["id", "subject", "topic", "question", "correct answer", "wrong answer 1", "wrong answer 2", "wrong answer 3", "explanation", "teacher approved? (yes/no)", "teacher's correction"])
        for s in bank["subjects"]:
            for t in s["topics"]:
                for item in t["questions"]:
                    if item["review_status"] == "pending_review":
                        wrong = [o for o in item["options"] if o != item["correct"]]
                        writer.writerow([item["id"], s["name"], t["name"], item["question"], item["correct"], *wrong, item["explanation"], "", ""])
    for s in bank["subjects"]:
        print(f"{s['name']}: {sum(len(t['questions']) for t in s['topics'])}")


if __name__ == "__main__":
    main()
