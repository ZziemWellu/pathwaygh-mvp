"""The JHS 3 and SHS 3 draft materials: every most-examined syllabus topic has
a lesson and enough practice questions, everything AI-written is a draft,
and the lessons the migration inserts are exactly the ones in the files."""

import importlib.util
import json
import re
import sys
from pathlib import Path

from modules.content.importer import BANNED, parse_lessons_markdown
from modules.content.syllabus import topic_index

BACKEND = Path(__file__).resolve().parents[1]
DRAFTS = sorted((BACKEND / "data" / "courses" / "drafts").glob("*.md"))
BANK = json.loads((BACKEND / "data" / "practice" / "bank_gh.json").read_text(encoding="utf-8"))
QUESTIONS = [q for s in BANK["subjects"] for t in s["topics"] for q in t["questions"]]

sys.path.insert(0, str(BACKEND / "scripts"))
import question_bank_exam_years as exam_years  # noqa: E402

WRITTEN = [exam_years.JHS3_ENGLISH, exam_years.JHS3_SCIENCE, exam_years.JHS3_SOCIAL, exam_years.SHS3_ENGLISH, exam_years.SHS3_SCIENCE, exam_years.SHS3_SOCIAL]


def _all_lessons():
    slugs, courses, lessons = set(), {}, []
    for path in DRAFTS:
        result = parse_lessons_markdown(path.read_bytes(), slugs, courses)
        assert result.errors == [], (path.name, result.errors)
        for course in result.new_courses:
            courses[course["slug"]] = course["level"]
        slugs |= {item["slug"] for item in result.items}
        lessons.extend(result.items)
    return lessons, courses


def test_every_draft_lesson_file_is_a_valid_import():
    lessons, courses = _all_lessons()
    assert len(courses) == 8 and len(lessons) >= 50
    for lesson in lessons:
        body = lesson["content"]
        # An explanation, a worked example, and a Try it with its answer.
        assert "## Worked example" in body and "## Try it" in body and "Answer" in body.split("## Try it")[1], lesson["slug"]
        assert lesson["syllabus_topic"] in topic_index(), lesson["slug"]
        assert lesson["licence"] == "original"


def test_every_most_examined_topic_has_a_lesson_and_enough_questions():
    lessons, _ = _all_lessons()
    lesson_topics = {lesson["syllabus_topic"] for lesson in lessons}
    questions_per_topic = {}
    for q in QUESTIONS:
        if q.get("syllabus"):
            questions_per_topic[q["syllabus"]] = questions_per_topic.get(q["syllabus"], 0) + 1
    missing_lessons, short = [], []
    for topic_id, entry in topic_index().items():
        if entry["topic"]["priority"] != 1:
            continue
        if topic_id not in lesson_topics:
            missing_lessons.append(topic_id)
        if questions_per_topic.get(topic_id, 0) < 10:
            short.append((topic_id, questions_per_topic.get(topic_id, 0)))
    assert missing_lessons == [] and short == []


def test_ai_written_questions_are_all_drafts():
    written_ids = {q["id"] for q in QUESTIONS if re.match(r"^(je3|js3|jss|se3|si3|sss)_", q["id"])}
    assert len(written_ids) == sum(len(rows) for source in WRITTEN for rows in source.values())
    for q in QUESTIONS:
        if q["id"] in written_ids:
            assert q["review_status"] == "pending_review", q["id"]
            assert q["syllabus"] in topic_index(), q["id"]


def test_new_written_topics_match_their_syllabus_subject():
    practice = {s["id"]: s for s in BANK["subjects"]}
    index = topic_index()
    for source in WRITTEN:
        for topic_id, _, syllabus_id in source:
            owner = next(s["id"] for s in practice.values() if any(t["id"] == topic_id for t in s["topics"]))
            assert index[syllabus_id]["subject"]["practice_subject"] == owner, (topic_id, owner)


def test_no_draft_calls_itself_a_past_question_or_mentions_certificates():
    texts = [path.read_text(encoding="utf-8") for path in DRAFTS]
    for source in WRITTEN:
        for rows in source.values():
            texts.extend(" ".join([r[0], r[1], *r[2], r[3]]) for r in rows)
    for text in texts:
        for pattern, _ in BANNED:
            assert not pattern.search(text), text[:80]


def _migration():
    path = next((BACKEND / "alembic" / "versions").glob("f8a9b0c1d2e3_*.py"))
    spec = importlib.util.spec_from_file_location("draft_lessons_migration", path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_the_migration_reads_the_files_exactly_as_the_importer_does():
    migration = _migration()
    lessons, courses = _all_lessons()
    parsed = [item for path in DRAFTS for item in migration._lessons(path.read_text(encoding="utf-8"))]
    assert [m["slug"] for m, _ in parsed] == [lesson["slug"] for lesson in lessons]
    assert [body for _, body in parsed] == [lesson["content"] for lesson in lessons]
    assert [m.get("syllabus_topic") for m, _ in parsed] == [lesson["syllabus_topic"] for lesson in lessons]


def test_the_migration_inserts_drafts_and_skips_existing_courses(db_session):
    from models.course import Course, Lesson

    db_session.add(Course(slug="jhs3-english", title="Already here", level="jhs", country="GH"))
    db_session.commit()
    migration = _migration()

    class FakeOp:
        @staticmethod
        def get_bind():
            return db_session.connection()

    migration.op = FakeOp
    migration.upgrade()
    db_session.commit()

    kept = db_session.query(Course).filter(Course.slug == "jhs3-english").one()
    assert kept.title == "Already here" and kept.lessons == []
    maths = db_session.query(Course).filter(Course.slug == "jhs3-mathematics").one()
    assert maths.review_status == "pending_review" and maths.level == "jhs"
    lessons = db_session.query(Lesson).filter(Lesson.course_id == maths.id).order_by(Lesson.order_index).all()
    assert len(lessons) == 9 and all(lesson.review_status == "pending_review" for lesson in lessons)
    assert lessons[0].slug == "jhs3-maths-fractions-percentages" and lessons[0].syllabus_topic == "jhs3.maths.number.fractions-percentages"
    # Running it again changes nothing.
    count = db_session.query(Lesson).count()
    migration.upgrade()
    assert db_session.query(Lesson).count() == count


def test_draft_courses_stay_hidden_from_students_until_approved(client, db_session, monkeypatch):
    from models.user import User
    from tests.conftest import register_user

    migration = _migration()

    class FakeOp:
        @staticmethod
        def get_bind():
            return db_session.connection()

    migration.op = FakeOp
    migration.upgrade()
    db_session.commit()
    monkeypatch.setenv("SERVE_DRAFT_QUESTIONS", "0")
    student = {"Authorization": f"Bearer {register_user(client, email='s@test.com', level='shs')['token']}"}
    assert "shs3-core-mathematics" not in [c["id"] for c in client.get("/api/learn/courses", headers=student).json()]
    monkeypatch.setenv("SERVE_DRAFT_QUESTIONS", "1")
    assert "shs3-core-mathematics" in [c["id"] for c in client.get("/api/learn/courses", headers=student).json()]
    lesson = client.get("/api/learn/lessons/shs3-maths-sets", headers=student).json()
    assert lesson["is_draft"] is True

    # Once a reviewer approves the course and a lesson, it is live without the switch.
    admin = register_user(client, email="a@test.com")
    db_session.query(User).filter(User.email == "a@test.com").update({User.is_admin: True})
    db_session.commit()
    admin_headers = {"Authorization": f"Bearer {admin['token']}"}
    course_id = next(c["id"] for c in client.get("/api/content/courses", headers=admin_headers).json()["courses"] if c["slug"] == "shs3-core-mathematics")
    lesson_id = next(item["id"] for item in client.get("/api/content/lessons", params={"limit": 200}, headers=admin_headers).json()["lessons"] if item["slug"] == "shs3-maths-sets")
    assert client.post(f"/api/content/courses/{course_id}/review", json={"decision": "approve"}, headers=admin_headers).status_code == 200
    assert client.post(f"/api/content/lessons/{lesson_id}/review", json={"decision": "approve"}, headers=admin_headers).status_code == 200
    monkeypatch.setenv("SERVE_DRAFT_QUESTIONS", "0")
    shown = client.get("/api/learn/courses/shs3-core-mathematics", headers=student).json()
    assert [item["id"] for item in shown["lessons"]] == ["shs3-maths-sets"]
