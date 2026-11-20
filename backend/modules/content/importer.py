"""Parsing and checking bulk imports: practice questions as CSV, lessons as
markdown. A file goes in whole or not at all. Every problem is reported with
its line number, so an admin can fix the file and upload it again.

Everything imported starts as a draft (review_status "pending_review") and
stays away from students until a reviewer approves it."""

import csv
import io
import re
from dataclasses import dataclass, field
from typing import Optional

from core.levels import STUDENT_LEVELS
from modules.content.syllabus import is_topic

MAX_FILE_BYTES = 2 * 1024 * 1024
MAX_QUESTIONS = 2000
MAX_LESSONS = 200
DIFFICULTIES = ("easy", "medium", "hard")

QUESTION_COLUMNS = [
    "question_id",
    "subject_id",
    "topic_id",
    "topic_name",
    "syllabus_topic",
    "question",
    "correct_answer",
    "wrong_answer_1",
    "wrong_answer_2",
    "wrong_answer_3",
    "explanation",
    "difficulty",
    "sub_skill",
    "licence",
    "attribution",
]
REQUIRED_QUESTION_COLUMNS = ("subject_id", "topic_id", "question", "correct_answer", "wrong_answer_1", "wrong_answer_2", "wrong_answer_3", "explanation", "difficulty")

LESSON_KEYS = ("slug", "title", "course", "course_title", "course_description", "level", "description", "syllabus_topic", "order", "duration_minutes", "licence", "attribution")

def question_template() -> str:
    """The CSV headings and one example row (replace it with your own)."""
    out = io.StringIO()
    writer = csv.writer(out, lineterminator="\n")
    writer.writerow(QUESTION_COLUMNS)
    writer.writerow(
        [
            "",
            "english",
            "vocabulary_jhs",
            "Vocabulary",
            "jhs3.english.reading.vocabulary",
            "Choose the word closest in meaning to 'enormous': The farmer harvested an enormous yam.",
            "huge",
            "tiny",
            "ripe",
            "heavy",
            "'Enormous' means very big, so 'huge' is closest in meaning.",
            "easy",
            "synonyms",
            "original",
            "",
        ]
    )
    return out.getvalue()

# Words students must never see from us: these are practice in the exam
# style, never "past questions", and the app awards no certificates.
BANNED = [
    (re.compile(r"past\s+(exam\s+)?(question|paper)s?", re.I), 'is called a past question or past paper: call it practice in the BECE/WASSCE style instead'),
    (re.compile(r"certif", re.I), 'mentions certificates or certification, which the app must not'),
]

ID_RE = re.compile(r"^[a-z0-9][a-z0-9_]{1,78}$")
SLUG_RE = re.compile(r"^[a-z0-9][a-z0-9-]{1,200}$")


@dataclass
class ImportResult:
    items: list = field(default_factory=list)
    errors: list = field(default_factory=list)
    new_courses: list = field(default_factory=list)

    def error(self, line: int, message: str) -> None:
        self.errors.append({"line": line, "message": message})


def normalise_licence(value: str) -> Optional[str]:
    """'CC BY 4.0' -> 'CC BY 4.0'; None if the licence isn't one we can use.
    Schools pay for the app, so this is commercial use: NonCommercial (NC)
    and NoDerivatives (ND) material is never allowed."""
    text = " ".join((value or "").strip().split())
    if not text or text.lower() == "original":
        return "original"
    upper = text.upper().replace("_", "-")
    if re.search(r"\bNC\b|\bND\b|NON-?COMMERCIAL|NO-?DERIV", upper):
        return None
    if upper in ("PUBLIC DOMAIN", "PD"):
        return "public domain"
    match = re.fullmatch(r"CC[ -]?(BY-SA|BY|0)(?: (\d\.\d))?", upper)
    if match:
        kind, version = match.groups()
        return f"CC {kind}" + (f" {version}" if version else "")
    return None


def _check_text(result: ImportResult, line: int, label: str, text: str) -> None:
    for pattern, message in BANNED:
        if pattern.search(text or ""):
            result.error(line, f"{label} {message}")


def _check_licence(result: ImportResult, line: int, licence: str, attribution: str) -> Optional[str]:
    normalised = normalise_licence(licence)
    if normalised is None:
        result.error(line, f'licence "{licence}" can\'t be used: only original work, CC BY, CC BY-SA, CC0 or public domain (never NC or ND)')
        return None
    if normalised != "original" and not (attribution or "").strip():
        result.error(line, "attribution is required for reused material: title, author, source and licence")
    return normalised


def _decode(raw: bytes, result: ImportResult) -> Optional[str]:
    if len(raw) > MAX_FILE_BYTES:
        result.error(0, f"the file is larger than {MAX_FILE_BYTES // (1024 * 1024)} MB")
        return None
    try:
        return raw.decode("utf-8-sig")
    except UnicodeDecodeError:
        result.error(0, "the file isn't UTF-8 text; in Excel use 'Save as: CSV UTF-8'")
        return None


def parse_questions_csv(raw: bytes, bank: dict, existing_ids: set) -> ImportResult:
    """`bank` is the whole question bank (load_questions(review=True)), for
    checking subjects, topics and ids; `existing_ids` any database ids."""
    result = ImportResult()
    text = _decode(raw, result)
    if text is None:
        return result

    subjects = {s["id"]: s for s in bank.get("subjects", [])}
    topic_owner = {t["id"]: s["id"] for s in bank.get("subjects", []) for t in s["topics"]}
    topic_names = {t["id"]: t["name"] for s in bank.get("subjects", []) for t in s["topics"]}
    bank_ids = {q["id"] for s in bank.get("subjects", []) for t in s["topics"] for q in t["questions"]}
    taken = bank_ids | set(existing_ids)
    seen_ids, seen_questions = {}, {}
    new_topic_owner = {}

    reader = csv.DictReader(io.StringIO(text))
    header = [h.strip() for h in (reader.fieldnames or [])]
    missing = [c for c in REQUIRED_QUESTION_COLUMNS if c not in header]
    unknown = [c for c in header if c and c not in QUESTION_COLUMNS]
    if missing:
        result.error(1, f"missing column(s): {', '.join(missing)}. Download the template for the exact headings")
    if unknown:
        result.error(1, f"unknown column(s): {', '.join(unknown)}")
    if missing or unknown:
        return result
    reader.fieldnames = header

    line_end = reader.line_num
    for row in reader:
        line = line_end + 1
        line_end = reader.line_num
        if None in row:
            result.error(line, "this row has more cells than there are columns")
            continue
        cell = {k: (v or "").strip() for k, v in row.items()}
        if not any(cell.values()):
            continue
        if len(result.items) + 1 > MAX_QUESTIONS:
            result.error(line, f"a file may hold at most {MAX_QUESTIONS} questions")
            break
        errors_before = len(result.errors)

        for column in REQUIRED_QUESTION_COLUMNS:
            if not cell[column]:
                result.error(line, f"{column} is empty")

        subject_id, topic_id = cell["subject_id"], cell["topic_id"]
        if subject_id and subject_id not in subjects:
            result.error(line, f'subject_id "{subject_id}" isn\'t a practice subject')
        if topic_id and not ID_RE.match(topic_id):
            result.error(line, "topic_id may only use lower-case letters, digits and _")
        owner = topic_owner.get(topic_id) or new_topic_owner.get(topic_id)
        if topic_id and owner and subject_id and owner != subject_id:
            result.error(line, f'topic_id "{topic_id}" belongs to subject "{owner}", not "{subject_id}"')
        if topic_id and topic_id not in topic_names and not cell["topic_name"]:
            result.error(line, f'topic_id "{topic_id}" is new, so topic_name is needed')
        if topic_id and subject_id and not owner:
            new_topic_owner[topic_id] = subject_id

        question_id = cell["question_id"]
        if question_id:
            if not ID_RE.match(question_id):
                result.error(line, "question_id may only use lower-case letters, digits and _ (2 to 79 characters)")
            elif question_id in taken:
                result.error(line, f'question_id "{question_id}" is already used')
            elif question_id in seen_ids:
                result.error(line, f'question_id "{question_id}" is also on line {seen_ids[question_id]}')
            else:
                seen_ids[question_id] = line

        options = [cell["correct_answer"], cell["wrong_answer_1"], cell["wrong_answer_2"], cell["wrong_answer_3"]]
        if all(options) and len({o.casefold() for o in options}) < 4:
            result.error(line, "the correct answer and the three wrong answers must all be different")
        if cell["difficulty"] and cell["difficulty"].lower() not in DIFFICULTIES:
            result.error(line, "difficulty must be easy, medium or hard")
        if cell["syllabus_topic"] and not is_topic(cell["syllabus_topic"]):
            result.error(line, f'syllabus_topic "{cell["syllabus_topic"]}" isn\'t in the syllabus map')
        key = (subject_id, cell["question"].casefold())
        if cell["question"] and key in seen_questions:
            result.error(line, f"the same question is also on line {seen_questions[key]}")
        seen_questions.setdefault(key, line)
        for label in ("question", "correct_answer", "wrong_answer_1", "wrong_answer_2", "wrong_answer_3", "explanation", "topic_name"):
            _check_text(result, line, label, cell[label])
        if len(cell["question"]) > 2000 or len(cell["explanation"]) > 4000:
            result.error(line, "question or explanation is too long")
        licence = _check_licence(result, line, cell["licence"], cell["attribution"])

        if len(result.errors) == errors_before:
            result.items.append(
                {
                    "line": line,
                    "question_id": question_id or None,
                    "subject_id": subject_id,
                    "topic_id": topic_id,
                    "topic_name": topic_names.get(topic_id) or cell["topic_name"],
                    "syllabus_topic": cell["syllabus_topic"] or None,
                    "question": cell["question"],
                    "correct": cell["correct_answer"],
                    "wrong": options[1:],
                    "explanation": cell["explanation"],
                    "difficulty": cell["difficulty"].lower(),
                    "sub_skill": cell["sub_skill"] or None,
                    "licence": licence,
                    "attribution": cell["attribution"] or None,
                }
            )
    if not result.items and not result.errors:
        result.error(0, "the file has no questions in it")
    return result


LESSON_TEMPLATE = """\
---
slug: jhs3-maths-ratio-sharing
title: Sharing in a ratio
course: jhs3-mathematics
course_title: JHS 3 Mathematics
level: jhs
description: Split an amount of money in a given ratio.
syllabus_topic: jhs3.maths.number.ratio-proportion
order: 1
duration_minutes: 10
licence: original
attribution:
---
# Sharing in a ratio

Explain the idea in short paragraphs, with a Ghanaian example.

## Worked example

Ama and Kofi share GH₵ 60 in the ratio 2:1. ...

## Try it

...

*(Answer: ...)*
---
slug: the-next-lesson
title: The next lesson
course: jhs3-mathematics
---
Each lesson starts with its own block between two --- lines. Only slug,
title and course are required; course_title and level are needed when the
course is new. The licence is original, CC BY, CC BY-SA, CC0 or public
domain, and reused material needs an attribution.
"""


def _split_lessons(text: str):
    """Yields (front-matter start line, {key: value}, body, body start line).
    A lesson is a block of `key: value` lines between two `---` lines,
    followed by its markdown body."""
    lines = text.replace("\r\n", "\n").split("\n")
    i = 0
    while i < len(lines) and not lines[i].strip():
        i += 1
    if i < len(lines) and lines[i].strip() != "---":
        yield i + 1, None, None, None
        return
    while i < len(lines):
        start = i + 1
        i += 1
        meta, meta_lines = {}, {}
        closed = False
        while i < len(lines):
            if lines[i].strip() == "---":
                closed = True
                i += 1
                break
            raw = lines[i]
            if raw.strip():
                key, sep, value = raw.partition(":")
                key = key.strip().lower()
                meta[key] = value.strip() if sep else None
                meta_lines[key] = i + 1
            i += 1
        if not closed:
            yield start, {"__unclosed__": True}, "", i
            return
        body_start = i + 1
        body = []
        while i < len(lines) and not (lines[i].strip() == "---" and _starts_front_matter(lines, i)):
            body.append(lines[i])
            i += 1
        yield start, {**meta, "__lines__": meta_lines}, "\n".join(body).strip(), body_start


FRONT_MATTER_LINE = re.compile(r"^[a-z_]+\s*:")


def _starts_front_matter(lines, i) -> bool:
    """A `---` line begins the next lesson only if what follows, up to the
    next `---`, is all `key: value` lines including a slug, title or course.
    Otherwise it is a horizontal rule in the lesson body."""
    found = False
    for j in range(i + 1, min(i + 2 + 2 * len(LESSON_KEYS), len(lines))):
        stripped = lines[j].strip()
        if stripped == "---":
            return found
        if not stripped:
            continue
        if not FRONT_MATTER_LINE.match(stripped):
            return False
        found = found or stripped.split(":", 1)[0].strip() in ("slug", "title", "course")
    return False


def parse_lessons_markdown(raw: bytes, existing_lesson_slugs: set, courses: dict) -> ImportResult:
    """`courses` maps existing course slugs to their level."""
    result = ImportResult()
    text = _decode(raw, result)
    if text is None:
        return result
    seen_slugs = {}
    new_courses = {}
    for start, meta, body, body_start in _split_lessons(text):
        if meta is None:
            result.error(start, "a lesson must start with a line holding only ---, then its details (slug, title, course), then another ---")
            break
        if meta.get("__unclosed__"):
            result.error(start, "this lesson's details have no closing --- line")
            break
        if len(result.items) + 1 > MAX_LESSONS:
            result.error(start, f"a file may hold at most {MAX_LESSONS} lessons")
            break
        lines = meta.pop("__lines__")
        errors_before = len(result.errors)
        for key in meta:
            if key not in LESSON_KEYS:
                result.error(lines[key], f'unknown detail "{key}"; allowed: {", ".join(LESSON_KEYS)}')
            elif meta[key] is None:
                result.error(lines[key], f'"{key}" needs a colon, as in "{key}: value"')
        values = {key: (value or "").strip() for key, value in meta.items()}
        get = values.get

        for key in ("slug", "title", "course"):
            if not get(key):
                result.error(start, f"{key} is missing")
        slug, course = get("slug"), get("course")
        if slug and not SLUG_RE.match(slug):
            result.error(lines.get("slug", start), "slug may only use lower-case letters, digits and -")
        elif slug in existing_lesson_slugs:
            result.error(lines.get("slug", start), f'a lesson with slug "{slug}" already exists')
        elif slug in seen_slugs:
            result.error(lines.get("slug", start), f'slug "{slug}" is also used by the lesson on line {seen_slugs[slug]}')
        elif slug:
            seen_slugs[slug] = start
        if course and not SLUG_RE.match(course):
            result.error(lines.get("course", start), "course may only use lower-case letters, digits and -")
        level = (get("level") or "").lower()
        if course and course not in courses and course not in new_courses:
            if not get("course_title") or not level:
                result.error(lines.get("course", start), f'course "{course}" doesn\'t exist yet, so course_title and level are needed')
            elif level not in STUDENT_LEVELS:
                result.error(lines.get("level", start), f"level must be one of {', '.join(STUDENT_LEVELS)}")
            else:
                new_courses[course] = {"slug": course, "title": get("course_title"), "description": get("course_description") or None, "level": level}
        elif level and course in courses and courses[course] != level:
            result.error(lines.get("level", start), f'course "{course}" is a {courses[course]} course, not {level}')
        if get("syllabus_topic") and not is_topic(get("syllabus_topic")):
            result.error(lines["syllabus_topic"], f'syllabus_topic "{get("syllabus_topic")}" isn\'t in the syllabus map')
        numbers = {}
        for key in ("order", "duration_minutes"):
            if get(key):
                if not get(key).isdigit():
                    result.error(lines[key], f"{key} must be a whole number")
                else:
                    numbers[key] = int(get(key))
        if len(body) < 40:
            result.error(body_start, "the lesson body is missing or too short")
        for label, value in (("title", get("title")), ("description", get("description")), ("course_title", get("course_title")), ("body", body)):
            _check_text(result, start if label != "body" else body_start, label, value)
        licence = _check_licence(result, lines.get("licence", start), get("licence"), get("attribution"))

        if len(result.errors) == errors_before:
            result.items.append(
                {
                    "line": start,
                    "slug": slug,
                    "title": get("title"),
                    "course": course,
                    "description": get("description") or None,
                    "syllabus_topic": get("syllabus_topic") or None,
                    "order": numbers.get("order"),
                    "duration_minutes": numbers.get("duration_minutes"),
                    "licence": licence,
                    "attribution": get("attribution") or None,
                    "content": body,
                }
            )
    if not result.items and not result.errors:
        result.error(0, "the file has no lessons in it")
    result.new_courses = list(new_courses.values())
    return result
