"""Content tools: draft gating, bulk import, the contributor role and its
audit trail, problem reports and the syllabus coverage report."""

import json
from pathlib import Path

import pytest

from models.content import ContentQuestion, ContentReview
from models.course import Course, Lesson
from models.user import User
from modules.content.importer import normalise_licence, parse_lessons_markdown, parse_questions_csv, question_template
from modules.content.syllabus import syllabus, topic_index
from modules.practice.mastery import load_questions
from tests.conftest import register_user

BACKEND = Path(__file__).resolve().parents[1]


def headers_for(data):
    return {"Authorization": f"Bearer {data['token']}"}


def make_user(client, db_session, email, level="jhs", **flags):
    data = register_user(client, email=email, level=level)
    if flags:
        db_session.query(User).filter(User.email == email).update(flags)
        db_session.commit()
    return headers_for(data)


@pytest.fixture()
def drafts_hidden(monkeypatch):
    monkeypatch.setenv("SERVE_DRAFT_QUESTIONS", "0")


@pytest.fixture()
def admin(client, db_session):
    return make_user(client, db_session, "admin@test.com", is_admin=True)


def _course(db_session, slug="jhs3-maths", status="published", lesson_status="published", level="jhs"):
    course = Course(slug=slug, title="JHS 3 Maths", level=level, country="GH", review_status=status)
    db_session.add(course)
    db_session.flush()
    db_session.add(Lesson(course_id=course.id, slug=f"{slug}-1", title="Ratio", lesson_type="text", content="# Ratio\n\nSharing.", review_status=lesson_status))
    db_session.commit()
    return course


QUESTIONS_CSV = (
    "question_id,subject_id,topic_id,topic_name,syllabus_topic,question,correct_answer,wrong_answer_1,wrong_answer_2,wrong_answer_3,explanation,difficulty,sub_skill,licence,attribution\n"
    "imp_vocab_001,english,vocabulary_jhs,,jhs3.english.reading.vocabulary,Which word means the same as 'rapid'?,fast,slow,late,heavy,'Rapid' means fast.,easy,synonyms,original,\n"
    ",english,jhs_letters,Letter writing,jhs3.english.writing.letter-writing,Where does the writer's address go in an informal letter?,top right corner,bottom left corner,after the signature,in the first paragraph,In an informal letter the writer's address goes in the top right corner.,easy,,CC BY 4.0,Example Book by A. Writer (CC BY 4.0)\n"
)


def _upload(client, headers, path, name, text, **params):
    return client.post(path, params=params, files={"file": (name, text.encode("utf-8"), "text/plain")}, headers=headers)


# ------------------------------------------------------------ Draft gating

def test_draft_lessons_and_courses_are_hidden_from_students(client, db_session, drafts_hidden):
    _course(db_session, "live-course", lesson_status="published")
    _course(db_session, "draft-course", status="pending_review", lesson_status="pending_review")
    live = db_session.query(Course).filter(Course.slug == "live-course").one()
    db_session.add(Lesson(course_id=live.id, slug="live-course-2", title="Draft", lesson_type="text", content="x" * 50, order_index=1, review_status="pending_review"))
    db_session.commit()
    student = make_user(client, db_session, "s@test.com")

    slugs = [c["id"] for c in client.get("/api/learn/courses", headers=student).json()]
    assert "live-course" in slugs and "draft-course" not in slugs
    course = client.get("/api/learn/courses/live-course", headers=student).json()
    assert [lesson["id"] for lesson in course["lessons"]] == ["live-course-1"]
    assert course["lesson_count"] == 1
    assert client.get("/api/learn/courses/draft-course", headers=student).status_code == 404
    assert client.get("/api/learn/lessons/live-course-2", headers=student).status_code == 404
    assert client.post("/api/learn/lessons/live-course-2/progress", json={"watched": True}, headers=student).status_code == 404

    # Finishing the live lesson finishes the course: the hidden draft doesn't count.
    client.post("/api/learn/courses/live-course/enroll", headers=student)
    done = client.post("/api/learn/lessons/live-course-1/progress", json={"watched": True}, headers=student).json()
    assert done["course_completed"] is True


def test_reviewers_always_see_drafts_and_students_see_them_only_when_served(client, db_session, admin, monkeypatch):
    _course(db_session, "draft-course", status="pending_review", lesson_status="pending_review")
    student = make_user(client, db_session, "s@test.com")
    lesson = client.get("/api/learn/lessons/draft-course-1", headers=admin).json()
    assert lesson["is_draft"] is True

    monkeypatch.setenv("SERVE_DRAFT_QUESTIONS", "0")
    assert client.get("/api/learn/lessons/draft-course-1", headers=student).status_code == 404
    monkeypatch.setenv("SERVE_DRAFT_QUESTIONS", "1")
    shown = client.get("/api/learn/lessons/draft-course-1", headers=student).json()
    assert shown["is_draft"] is True  # the page says a teacher hasn't checked it


def test_home_never_suggests_a_draft_course(client, db_session, drafts_hidden):
    # "A..." sorts first, so without the gate Home would pick the draft.
    draft = _course(db_session, "draft-course", status="pending_review", lesson_status="pending_review")
    draft.title = "A draft course"
    _course(db_session, "live-course")
    db_session.commit()
    student = make_user(client, db_session, "s@test.com")
    step = client.get("/api/dashboard/summary", headers=student).json()["next_step"]
    assert step["kind"] == "start" and step["course_id"] == "live-course"


def test_a_draft_question_reaches_students_only_once_approved(client, db_session, admin, drafts_hidden):
    contributor = make_user(client, db_session, "teacher@test.com", is_contributor=True)
    student = make_user(client, db_session, "s@test.com")
    payload = {
        "subject_id": "english",
        "topic_id": "jhs_letters",
        "topic_name": "Letter writing",
        "syllabus_topic": "jhs3.english.writing.letter-writing",
        "question": "Which ending suits a letter to a friend?",
        "correct": "Your friend, Ama",
        "wrong": ["Yours faithfully, Ama", "To whom it may concern", "Dear Sir"],
        "explanation": "A letter to a friend has an informal ending such as 'Your friend'.",
        "difficulty": "easy",
    }
    created = client.post("/api/content/questions", json=payload, headers=contributor)
    assert created.status_code == 200, created.text
    question_id = created.json()["question"]["id"]

    def topics():
        subjects = client.get("/api/practice/subjects", headers=student).json()["subjects"]
        return {t["id"] for s in subjects for t in s["topics"]}

    assert "jhs_letters" not in topics()
    # The author can't approve their own question.
    own = client.post(f"/api/content/questions/{question_id}/review", json={"decision": "approve"}, headers=contributor)
    assert own.status_code == 403
    approved = client.post(f"/api/content/questions/{question_id}/review", json={"decision": "approve", "note": "Checked"}, headers=admin)
    assert approved.status_code == 200
    assert approved.json()["question"]["review_status"] == "approved"
    assert "jhs_letters" in topics()

    # Who approved what, and when, is on record.
    actions = [(r.action, r.user_id is not None) for r in db_session.query(ContentReview).filter(ContentReview.item_id == question_id).order_by(ContentReview.id)]
    assert actions == [("created", True), ("approved", True)]
    history = client.get(f"/api/content/questions/{question_id}", headers=admin).json()["history"]
    assert [h["action"] for h in history] == ["created", "approved"] and history[1]["note"] == "Checked"

    # Editing sends it back to review.
    edited = client.put(f"/api/content/questions/{question_id}", json={**payload, "question": "Which ending suits a letter to your friend?"}, headers=admin)
    assert edited.json()["question"]["review_status"] == "pending_review"
    assert "jhs_letters" not in topics()


def test_reviewers_can_approve_or_withdraw_questions_in_the_json_bank(client, db_session, admin, drafts_hidden):
    bank = load_questions(review=True)
    draft = next(q for s in bank["subjects"] if s["id"] == "english" for t in s["topics"] for q in t["questions"] if q.get("review_status") == "pending_review")
    computed = next(q for s in bank["subjects"] if s["id"] == "mathematics" for t in s["topics"] for q in t["questions"] if q.get("review_status") == "computed")

    def live_ids():
        return {q["id"] for s in load_questions(db_session)["subjects"] for t in s["topics"] for q in t["questions"]}

    assert draft["id"] not in live_ids() and computed["id"] in live_ids()
    assert client.post(f"/api/content/questions/{draft['id']}/review", json={"decision": "approve"}, headers=admin).status_code == 200
    assert client.post(f"/api/content/questions/{computed['id']}/review", json={"decision": "reject", "note": "Reported"}, headers=admin).status_code == 200
    assert draft["id"] in live_ids() and computed["id"] not in live_ids()
    # Already live: nothing to approve.
    other = next(q for s in bank["subjects"] if s["id"] == "mathematics" for t in s["topics"] for q in t["questions"] if q.get("review_status") == "computed" and q["id"] != computed["id"])
    assert client.post(f"/api/content/questions/{other['id']}/review", json={"decision": "approve"}, headers=admin).status_code == 400
    # JSON-bank questions are changed in the build script, not here.
    assert client.put(f"/api/content/questions/{draft['id']}", json={"subject_id": "english", "topic_id": "grammar", "question": "Which?", "correct": "a", "wrong": ["b", "c", "d"], "explanation": "abc"}, headers=admin).status_code == 400


# ------------------------------------------------------------ Permissions

def test_content_tools_are_for_admins_and_contributors_only(client, db_session):
    student = make_user(client, db_session, "s@test.com")
    for path in ("/api/content/coverage", "/api/content/questions", "/api/content/lessons", "/api/content/reports", "/api/content/templates/questions.csv"):
        assert client.get(path, headers=student).status_code == 403, path
    contributor = make_user(client, db_session, "teacher@test.com", is_contributor=True)
    assert client.get("/api/content/coverage", headers=contributor).status_code == 200
    # Bulk import and choosing contributors are for admins.
    assert _upload(client, contributor, "/api/content/import/questions", "q.csv", QUESTIONS_CSV).status_code == 403
    assert client.post("/api/content/contributors", json={"identifier": "s@test.com"}, headers=contributor).status_code == 403


def test_an_admin_chooses_contributors_and_it_is_logged(client, db_session, admin):
    register_user(client, email="teacher@test.com")
    response = client.post("/api/content/contributors", json={"identifier": "teacher@test.com"}, headers=admin)
    assert response.status_code == 200 and response.json()["is_contributor"] is True
    assert [c["email"] for c in client.get("/api/content/contributors", headers=admin).json()["contributors"]] == ["teacher@test.com"]
    me = client.post("/api/auth/login", json={"email": "teacher@test.com", "password": "secret123"}).json()
    assert me["user"]["is_contributor"] is True
    assert db_session.query(ContentReview).filter(ContentReview.item_type == "user", ContentReview.action == "contributor_on").count() == 1
    assert client.post("/api/content/contributors", json={"identifier": "nobody@test.com"}, headers=admin).status_code == 404


# ------------------------------------------------------------ Bulk import

def test_importing_questions_adds_drafts(client, db_session, admin):
    dry = _upload(client, admin, "/api/content/import/questions", "q.csv", QUESTIONS_CSV, dry_run="true")
    assert dry.json() == {"success": True, "dry_run": True, "count": 2}
    assert db_session.query(ContentQuestion).count() == 0

    response = _upload(client, admin, "/api/content/import/questions", "q.csv", QUESTIONS_CSV)
    assert response.status_code == 200, response.text
    rows = db_session.query(ContentQuestion).order_by(ContentQuestion.id).all()
    assert [r.review_status for r in rows] == ["pending_review", "pending_review"]
    assert rows[0].question_id == "imp_vocab_001" and rows[1].question_id.startswith("cq_english_")
    assert rows[1].licence == "CC BY 4.0" and "Example Book" in rows[1].attribution
    assert set(rows[0].options) == {"fast", "slow", "late", "heavy"}
    assert db_session.query(ContentReview).filter(ContentReview.action == "imported").count() == 2
    # Importing the same ids again is refused.
    again = _upload(client, admin, "/api/content/import/questions", "q.csv", QUESTIONS_CSV)
    assert again.status_code == 400 and "already used" in json.dumps(again.json())


def test_one_bad_row_rejects_the_whole_file_with_line_numbers(client, db_session, admin):
    bad = QUESTIONS_CSV + (
        ",english,vocabulary_jhs,,,Pick the odd one out.,a,a,b,c,Because.,easy,,,\n"  # line 4: duplicate options
        ",english,vocabulary_jhs,,,From the 2019 past questions: what is a noun?,a word,b,c,d,x,easy,,,\n"  # line 5
        ",english,vocabulary_jhs,,,Which?,a,b,c,d,x,extreme,,CC BY-NC 4.0,Someone\n"  # line 6
        ",history,vocabulary_jhs,,nowhere.topic,Which?,a,b,c,d,x,easy,,,\n"  # line 7
        ",mathematics,vocabulary_jhs,,,Which one?,a,b,c,d,x,easy,,,\n"  # line 8: topic of another subject
    )
    response = _upload(client, admin, "/api/content/import/questions", "q.csv", bad)
    assert response.status_code == 400
    detail = response.json()["detail"]
    assert "Nothing was imported" in detail["message"]
    lines = {e["line"] for e in detail["errors"]}
    assert lines == {4, 5, 6, 7, 8}
    messages = " ".join(e["message"] for e in detail["errors"])
    for expected in ("all be different", "past question", "difficulty", "never NC or ND", "isn't a practice subject", "isn't in the syllabus map", "belongs to subject"):
        assert expected in messages, expected
    assert db_session.query(ContentQuestion).count() == 0


def test_question_csv_needs_the_template_headings(client, admin):
    response = _upload(client, admin, "/api/content/import/questions", "q.csv", "question,answer\nWhat?,This\n")
    assert response.status_code == 400
    assert response.json()["detail"]["errors"][0]["line"] == 1


def test_the_downloadable_templates_are_valid(client, db_session, admin):
    csv_text = client.get("/api/content/templates/questions.csv", headers=admin).text
    assert parse_questions_csv(csv_text.encode(), load_questions(review=True), set()).errors == []
    md = client.get("/api/content/templates/lessons.md", headers=admin).text
    result = parse_lessons_markdown(md.encode(), set(), {})
    assert result.errors == [] and len(result.items) == 2
    assert csv_text == question_template()


LESSONS_MD = """---
slug: jhs3-maths-ratio
title: Sharing in a ratio
course: jhs3-mathematics
course_title: JHS 3 Mathematics
level: jhs
syllabus_topic: jhs3.maths.number.ratio-proportion
duration_minutes: 10
---
# Sharing in a ratio

Ama and Kofi share GH₵ 60 in the ratio 2:1. There are 3 parts, so one part is GH₵ 20.

---

A horizontal rule like the one above stays part of the lesson.
---
slug: jhs3-maths-ratio-2
title: Ratio word problems
course: jhs3-mathematics
licence: CC BY-SA 4.0
attribution: Open Maths by A. Teacher, openmaths.example
---
# Ratio word problems

More practice sharing amounts in a ratio, with prices in cedis.
"""


def test_importing_lessons_creates_draft_courses_and_lessons(client, db_session, admin, drafts_hidden):
    response = _upload(client, admin, "/api/content/import/lessons", "l.md", LESSONS_MD)
    assert response.status_code == 200, response.text
    assert response.json()["new_courses"] == 1
    course = db_session.query(Course).filter(Course.slug == "jhs3-mathematics").one()
    assert course.review_status == "pending_review" and course.level == "jhs"
    lessons = sorted(course.lessons, key=lambda lesson: lesson.order_index)
    assert [lesson.slug for lesson in lessons] == ["jhs3-maths-ratio", "jhs3-maths-ratio-2"]
    assert all(lesson.review_status == "pending_review" for lesson in lessons)
    assert "horizontal rule" in lessons[0].content
    assert lessons[0].syllabus_topic == "jhs3.maths.number.ratio-proportion"
    assert lessons[1].attribution == "Open Maths by A. Teacher, openmaths.example (CC BY-SA 4.0)"

    student = make_user(client, db_session, "s@test.com")
    assert client.get("/api/learn/courses/jhs3-mathematics", headers=student).status_code == 404
    # Approving the course and one lesson makes exactly that lesson visible.
    assert client.post(f"/api/content/courses/{course.id}/review", json={"decision": "approve"}, headers=admin).status_code == 200
    assert client.post(f"/api/content/lessons/{lessons[0].id}/review", json={"decision": "approve"}, headers=admin).status_code == 200
    shown = client.get("/api/learn/courses/jhs3-mathematics", headers=student).json()
    assert [lesson["id"] for lesson in shown["lessons"]] == ["jhs3-maths-ratio"]


def test_lesson_markdown_errors_carry_line_numbers(client, db_session, admin):
    _course(db_session, "shs-course", level="shs")
    bad = """---
slug: Bad Slug
title: One
course: shs-course
level: jhs
colour: blue
---
Too short.
---
title: Two
course: new-course
---
This body is long enough to count as a lesson body for the check.
"""
    response = _upload(client, admin, "/api/content/import/lessons", "l.md", bad)
    assert response.status_code == 400
    errors = response.json()["detail"]["errors"]
    by_line = {}
    for e in errors:
        by_line.setdefault(e["line"], []).append(e["message"])
    assert any("slug may only use" in m for m in by_line[2])
    assert any("is a shs course" in m for m in by_line[5])
    assert any("unknown detail" in m for m in by_line[6])
    assert any("too short" in m for m in by_line[8])
    assert any("slug is missing" in m for m in by_line[9])
    assert any("course_title and level are needed" in m for m in by_line[11])
    assert db_session.query(Lesson).filter(Lesson.slug.like("%two%")).count() == 0


def test_licences():
    assert normalise_licence("") == "original"
    assert normalise_licence("cc by 4.0") == "CC BY 4.0"
    assert normalise_licence("CC-BY-SA") == "CC BY-SA"
    assert normalise_licence("CC0") == "CC 0"
    assert normalise_licence("Public domain") == "public domain"
    for refused in ("CC BY-NC 4.0", "CC BY-NC-SA", "CC BY-ND", "CC BY-NC-ND 3.0", "All rights reserved", "Khan Academy"):
        assert normalise_licence(refused) is None, refused


# ------------------------------------------------------------ Contributor lessons

def test_contributors_draft_lessons_and_someone_else_approves(client, db_session, admin, drafts_hidden):
    _course(db_session, "live-course")
    teacher = make_user(client, db_session, "teacher@test.com", is_contributor=True)
    other = make_user(client, db_session, "teacher2@test.com", is_contributor=True)
    body = {"course_slug": "live-course", "slug": "live-course-percent", "title": "Percentages", "content": "# Percentages\n\nPer cent means out of one hundred. " * 2, "syllabus_topic": "jhs3.maths.number.fractions-percentages"}
    created = client.post("/api/content/lessons", json=body, headers=teacher)
    assert created.status_code == 200, created.text
    lesson_id = created.json()["lesson"]["id"]
    assert created.json()["lesson"]["review_status"] == "pending_review"
    assert client.post(f"/api/content/lessons/{lesson_id}/review", json={"decision": "approve"}, headers=teacher).status_code == 403
    assert client.post(f"/api/content/lessons/{lesson_id}/review", json={"decision": "approve"}, headers=other).status_code == 200
    student = make_user(client, db_session, "s@test.com")
    assert client.get("/api/learn/lessons/live-course-percent", headers=student).status_code == 200
    queue = client.get("/api/content/lessons", headers=admin).json()
    assert all(lesson["review_status"] == "pending_review" for lesson in queue["lessons"])
    assert client.post("/api/content/lessons", json={**body, "slug": "x-past", "content": "These are past papers from 2019. " * 3}, headers=teacher).status_code == 400


# ------------------------------------------------------------ Reports

def test_students_report_problems_and_reviewers_resolve_them(client, db_session, admin):
    _course(db_session, "live-course")
    student = make_user(client, db_session, "s@test.com")
    question_id = load_questions()["subjects"][0]["topics"][0]["questions"][0]["id"]

    first = client.post("/api/content/reports", json={"item_type": "question", "item_id": question_id, "reason": "wrong_answer", "details": "B is right"}, headers=student)
    assert first.json() == {"success": True, "already_reported": False}
    again = client.post("/api/content/reports", json={"item_type": "question", "item_id": question_id, "reason": "wrong_answer"}, headers=student)
    assert again.json()["already_reported"] is True
    lesson = client.post("/api/content/reports", json={"item_type": "lesson", "item_id": "live-course-1", "reason": "unclear"}, headers=student)
    assert lesson.status_code == 200
    assert client.post("/api/content/reports", json={"item_type": "lesson", "item_id": "nope", "reason": "unclear"}, headers=student).status_code == 404
    assert client.post("/api/content/reports", json={"item_type": "question", "item_id": question_id, "reason": "because"}, headers=student).status_code == 422
    assert client.post("/api/content/reports", json={"item_type": "question", "item_id": question_id, "reason": "unclear"}).status_code in (401, 403)

    queue = client.get("/api/content/reports", headers=admin).json()["reports"]
    assert len(queue) == 2
    by_type = {r["item_type"]: r for r in queue}
    assert by_type["question"]["item"]["id"] == question_id and by_type["question"]["details"] == "B is right"
    assert by_type["lesson"]["item"]["title"] == "Ratio"
    assert "reporter" not in json.dumps(queue)  # reporters stay anonymous

    assert client.post(f"/api/content/reports/{by_type['question']['id']}/resolve", json={"status": "resolved", "note": "Fixed"}, headers=admin).status_code == 200
    assert len(client.get("/api/content/reports", headers=admin).json()["reports"]) == 1
    assert client.get("/api/content/reports?status=resolved", headers=admin).json()["reports"][0]["resolution_note"] == "Fixed"


# ------------------------------------------------------------ Coverage and syllabus

def _coverage_topics(client, headers):
    report = client.get("/api/content/coverage", headers=headers).json()
    return report, {t["id"]: t for level in report["levels"] for s in level["subjects"] for st in s["strands"] for t in st["topics"]}


def test_coverage_counts_live_and_draft_items_per_topic(client, db_session, admin):
    _, before = _coverage_topics(client, admin)
    _upload(client, admin, "/api/content/import/questions", "q.csv", QUESTIONS_CSV)
    _course(db_session, "jhs3-course")
    db_session.query(Lesson).filter(Lesson.slug == "jhs3-course-1").update({Lesson.syllabus_topic: "jhs3.maths.number.ratio-proportion"})
    db_session.commit()
    report, topics = _coverage_topics(client, admin)
    assert [level["id"] for level in report["levels"]] == ["jhs3", "shs3"]
    letters, letters_before = topics["jhs3.english.writing.letter-writing"], before["jhs3.english.writing.letter-writing"]
    assert letters["questions"]["draft"] == letters_before["questions"]["draft"] + 1
    assert letters["questions"]["live"] == letters_before["questions"]["live"] == 0
    assert "no approved questions" in letters["gaps"]
    ratio = topics["jhs3.maths.number.ratio-proportion"]
    assert ratio["lessons"] == {"live": 1, "draft": 0} and ratio["questions"]["live"] >= 10
    assert "no lesson" not in ratio["gaps"]
    assert report["unknown_tags"] == []


def test_syllabus_map_is_well_formed():
    data = syllabus()
    ids = [t for t in topic_index()]
    assert len(ids) == len(set(ids))
    for level in data["levels"]:
        for subject in level["subjects"]:
            assert subject["sources"] and all(key in data["sources"] for key in subject["sources"])
            for strand in subject["strands"]:
                assert strand["id"].startswith(subject["id"] + ".")
                for topic in strand["topics"]:
                    assert topic["id"].startswith(strand["id"] + ".")
                    assert topic["priority"] in (1, 2, 3)
                    # Nothing could be checked against the official documents yet.
                    assert topic["provisional"] is True
    for source in data["sources"].values():
        assert source["url"].startswith("https://") and source["checked"] is False


def test_every_syllabus_tag_in_the_bank_is_in_the_map():
    index = topic_index()
    tags = {q["syllabus"] for s in load_questions(review=True)["subjects"] for t in s["topics"] for q in t["questions"] if q.get("syllabus")}
    assert tags and tags <= set(index)
