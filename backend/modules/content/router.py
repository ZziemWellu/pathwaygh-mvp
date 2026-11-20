"""
Content tools: the syllabus coverage report, bulk import, the contributor
role and its review queue, and students' "Report a problem".

Who may do what:
- Admins (is_admin): everything, including bulk import and choosing who is
  a contributor.
- Contributors (is_contributor, set by an admin): teachers who draft and
  review lessons and practice questions. They can't approve their own work:
  someone else has to check it.
- Any signed-in user: report a problem with a question or a lesson.

Nothing written here goes live by itself. New and edited items are drafts
(review_status "pending_review", core/drafts.py) until approved, and every
import, edit, approval and rejection is recorded in content_reviews.

Design for questions: the hand-built bank stays in JSON
(data/practice/*.json, with every calculated answer re-checked by
tests/test_question_answers_verified.py). Imported and contributed questions
live in the content_questions table and load_questions() merges them in, so
practice treats both alike. Reviewers can also approve or reject the JSON
bank's own drafts in the app: the latest decision in content_reviews
overrides the file's review_status.
"""

import uuid
from datetime import datetime, timezone
from typing import List, Literal, Optional

from fastapi import APIRouter, Depends, File, HTTPException, Request, UploadFile
from fastapi.responses import PlainTextResponse
from pydantic import BaseModel, Field, field_validator
from sqlalchemy import func
from sqlalchemy.orm import Session

from core.accounts import find_user
from core.database import get_db
from core.drafts import APPROVED, DRAFT, REJECTED, is_draft, is_live, user_reviews_content
from core.levels import STUDENT_LEVELS
from core.rate_limit import limiter
from core.security import get_current_user, require_admin
from models.content import ContentQuestion, ContentReport, ContentReview
from models.course import Course, Lesson
from models.user import User
from modules.content.importer import (
    LESSON_TEMPLATE,
    BANNED,
    normalise_licence,
    parse_lessons_markdown,
    parse_questions_csv,
    question_template,
)
from modules.content.syllabus import is_topic, syllabus, topic_index
from modules.practice.mastery import load_questions

router = APIRouter(tags=["content"])

REPORT_REASONS = ("wrong_answer", "unclear", "spelling_or_grammar", "not_for_my_level", "inappropriate", "other")
TARGET_QUESTIONS_PER_TOPIC = 10


def require_reviewer(user: User = Depends(get_current_user)) -> User:
    if not user_reviews_content(user):
        raise HTTPException(status_code=403, detail="Only admins and contributors can use the content tools")
    return user


def _audit(db: Session, item_type: str, item_id, action: str, user: Optional[User], note: Optional[str] = None) -> None:
    db.add(ContentReview(item_type=item_type, item_id=str(item_id), action=action, user_id=user.id if user else None, note=note))


def _last_author(db: Session, item_type: str, item_id) -> Optional[int]:
    row = (
        db.query(ContentReview.user_id)
        .filter(
            ContentReview.item_type == item_type,
            ContentReview.item_id == str(item_id),
            ContentReview.action.in_(("created", "imported", "edited")),
        )
        .order_by(ContentReview.id.desc())
        .first()
    )
    return row[0] if row else None


def _check_not_own_work(db: Session, user: User, item_type: str, item_id) -> None:
    """A contributor can't approve or reject what they wrote or last changed:
    the point of review is a second pair of eyes. Admins may."""
    if not user.is_admin and _last_author(db, item_type, item_id) == user.id:
        raise HTTPException(status_code=403, detail="Someone else has to review your own work")


def _check_wording(*texts: Optional[str]) -> None:
    for text in texts:
        for pattern, message in BANNED:
            if pattern.search(text or ""):
                raise HTTPException(status_code=400, detail=f"This text {message}")


def _history(db: Session, item_type: str, item_id) -> list:
    rows = (
        db.query(ContentReview, User.full_name)
        .outerjoin(User, User.id == ContentReview.user_id)
        .filter(ContentReview.item_type == item_type, ContentReview.item_id == str(item_id))
        .order_by(ContentReview.id)
        .all()
    )
    return [
        {"action": r.action, "by": name, "note": r.note, "at": r.created_at.isoformat() if r.created_at else None}
        for r, name in rows
    ]


# ============================================================
# Syllabus and coverage
# ============================================================

@router.get("/syllabus")
def get_syllabus(user: User = Depends(require_reviewer)):
    return syllabus()


def _flat_questions(db: Session) -> list:
    """Every question, rejected ones included, with its subject and topic."""
    out = []
    for subject in load_questions(db, review=True)["subjects"]:
        for topic in subject["topics"]:
            for q in topic["questions"]:
                out.append((subject, topic, q))
    return out


@router.get("/coverage")
def coverage(db: Session = Depends(get_db), user: User = Depends(require_reviewer)):
    """For each level, subject, strand and syllabus topic: how many lessons
    and practice questions exist, live and in draft, and what's missing."""
    index = topic_index()
    counts = {topic_id: {"questions": {"live": 0, "draft": 0}, "lessons": {"live": 0, "draft": 0}} for topic_id in index}
    practice_subjects = {s["practice_subject"] for level in syllabus()["levels"] for s in level["subjects"]}
    untagged_questions, unknown_tags = {}, set()

    for subject, _, q in _flat_questions(db):
        status = q.get("review_status")
        if status == REJECTED:
            continue
        tag = q.get("syllabus")
        if tag in counts:
            counts[tag]["questions"]["draft" if is_draft(status) else "live"] += 1
        else:
            if tag:
                unknown_tags.add(tag)
            if subject["id"] in practice_subjects:
                untagged_questions[subject["id"]] = untagged_questions.get(subject["id"], 0) + 1

    untagged_lessons = 0
    for lesson, course_status, course_level in (
        db.query(Lesson, Course.review_status, Course.level).join(Course, Course.id == Lesson.course_id).all()
    ):
        if lesson.review_status == REJECTED or course_status == REJECTED:
            continue
        if lesson.syllabus_topic in counts:
            live = is_live(lesson.review_status) and is_live(course_status)
            counts[lesson.syllabus_topic]["lessons"]["live" if live else "draft"] += 1
        elif course_level in ("jhs", "shs"):
            if lesson.syllabus_topic:
                unknown_tags.add(lesson.syllabus_topic)
            untagged_lessons += 1

    levels = []
    for level in syllabus()["levels"]:
        subjects = []
        for subject in level["subjects"]:
            strands = []
            totals = {"topics": 0, "topics_with_gaps": 0, "questions": {"live": 0, "draft": 0}, "lessons": {"live": 0, "draft": 0}}
            for strand in subject["strands"]:
                topics = []
                for topic in strand["topics"]:
                    c = counts[topic["id"]]
                    gaps = []
                    if not (c["lessons"]["live"] or c["lessons"]["draft"]):
                        gaps.append("no lesson")
                    elif not c["lessons"]["live"]:
                        gaps.append("lesson not yet approved")
                    total_q = c["questions"]["live"] + c["questions"]["draft"]
                    if total_q == 0:
                        gaps.append("no practice questions")
                    elif total_q < TARGET_QUESTIONS_PER_TOPIC:
                        gaps.append(f"fewer than {TARGET_QUESTIONS_PER_TOPIC} questions")
                    if total_q and not c["questions"]["live"]:
                        gaps.append("no approved questions")
                    topics.append({**{k: topic[k] for k in ("id", "name", "priority", "provisional")}, **c, "gaps": gaps})
                    totals["topics"] += 1
                    totals["topics_with_gaps"] += bool(gaps)
                    for kind in ("questions", "lessons"):
                        for state in ("live", "draft"):
                            totals[kind][state] += c[kind][state]
                strands.append({"id": strand["id"], "name": strand["name"], "provisional": strand["provisional"], "topics": topics})
            subjects.append(
                {
                    "id": subject["id"],
                    "name": subject["name"],
                    "practice_subject": subject["practice_subject"],
                    "provisional": subject["provisional"],
                    "sources": [syllabus()["sources"][key] for key in subject["sources"]],
                    "totals": totals,
                    "untagged_questions": untagged_questions.get(subject["practice_subject"], 0),
                    "strands": strands,
                }
            )
        levels.append({k: level[k] for k in ("id", "name", "level", "exam", "curriculum")} | {"subjects": subjects})

    return {
        "success": True,
        "note": syllabus()["note"],
        "target_questions_per_topic": TARGET_QUESTIONS_PER_TOPIC,
        "levels": levels,
        "untagged_lessons": untagged_lessons,
        "unknown_tags": sorted(unknown_tags),
    }


# ============================================================
# Bulk import
# ============================================================

@router.get("/templates/questions.csv", response_class=PlainTextResponse)
def questions_template(user: User = Depends(require_reviewer)):
    return PlainTextResponse(
        question_template(),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": 'attachment; filename="questions-template.csv"'},
    )


@router.get("/templates/lessons.md", response_class=PlainTextResponse)
def lessons_template(user: User = Depends(require_reviewer)):
    return PlainTextResponse(
        LESSON_TEMPLATE,
        media_type="text/markdown; charset=utf-8",
        headers={"Content-Disposition": 'attachment; filename="lessons-template.md"'},
    )


def _rejected(errors: list):
    raise HTTPException(
        status_code=400,
        detail={"message": f"Nothing was imported: fix {len(errors)} problem(s) and upload the file again.", "errors": errors},
    )


async def _read_upload(file: UploadFile) -> bytes:
    # One byte over the limit is enough to know it's too big.
    from modules.content.importer import MAX_FILE_BYTES

    return await file.read(MAX_FILE_BYTES + 1)


def _new_question_id(subject_id: str) -> str:
    return f"cq_{subject_id[:20]}_{uuid.uuid4().hex[:8]}"


@router.post("/import/questions")
async def import_questions(
    file: UploadFile = File(...),
    dry_run: bool = False,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    existing = {qid for (qid,) in db.query(ContentQuestion.question_id).all()}
    result = parse_questions_csv(await _read_upload(file), load_questions(db, review=True), existing)
    if result.errors:
        _rejected(result.errors)
    if dry_run:
        return {"success": True, "dry_run": True, "count": len(result.items)}
    for item in result.items:
        question_id = item["question_id"] or _new_question_id(item["subject_id"])
        options = [item["correct"], *item["wrong"]]
        order = sorted(range(4), key=lambda _: uuid.uuid4().hex)
        db.add(
            ContentQuestion(
                question_id=question_id,
                subject_id=item["subject_id"],
                topic_id=item["topic_id"],
                topic_name=item["topic_name"],
                syllabus_topic=item["syllabus_topic"],
                question=item["question"],
                correct=item["correct"],
                options=[options[i] for i in order],
                explanation=item["explanation"],
                difficulty=item["difficulty"],
                sub_skill=item["sub_skill"],
                review_status=DRAFT,
                licence=item["licence"],
                attribution=item["attribution"],
                created_by_id=admin.id,
            )
        )
        _audit(db, "question", question_id, "imported", admin, f"{file.filename}, line {item['line']}")
    db.commit()
    return {"success": True, "dry_run": False, "count": len(result.items)}


def _attribution(licence: str, attribution: Optional[str]) -> Optional[str]:
    if not attribution:
        return None
    return attribution if licence.lower() in attribution.lower() else f"{attribution} ({licence})"


@router.post("/import/lessons")
async def import_lessons(
    file: UploadFile = File(...),
    dry_run: bool = False,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    slugs = {slug for (slug,) in db.query(Lesson.slug).all()}
    courses = {slug: level for slug, level in db.query(Course.slug, Course.level).all()}
    result = parse_lessons_markdown(await _read_upload(file), slugs, courses)
    if result.errors:
        _rejected(result.errors)
    if dry_run:
        return {"success": True, "dry_run": True, "count": len(result.items), "new_courses": len(result.new_courses)}

    by_slug = {c.slug: c for c in db.query(Course).all()}
    for new in result.new_courses:
        course = Course(slug=new["slug"], title=new["title"], description=new["description"], level=new["level"], country="GH", review_status=DRAFT)
        db.add(course)
        db.flush()
        by_slug[course.slug] = course
        _audit(db, "course", course.slug, "imported", admin, file.filename)
    next_order = {}
    for item in result.items:
        course = by_slug[item["course"]]
        if course.id not in next_order:
            next_order[course.id] = max((lesson.order_index for lesson in course.lessons), default=-1) + 1
        order = item["order"] if item["order"] is not None else next_order[course.id]
        next_order[course.id] = max(next_order[course.id], order + 1)
        db.add(
            Lesson(
                course_id=course.id,
                slug=item["slug"],
                title=item["title"],
                description=item["description"],
                lesson_type="text",
                order_index=order,
                duration_minutes=item["duration_minutes"],
                content=item["content"],
                review_status=DRAFT,
                syllabus_topic=item["syllabus_topic"],
                attribution=_attribution(item["licence"], item["attribution"]),
            )
        )
        _audit(db, "lesson", item["slug"], "imported", admin, f"{file.filename}, line {item['line']}")
    db.commit()
    return {"success": True, "dry_run": False, "count": len(result.items), "new_courses": len(result.new_courses)}


# ============================================================
# Questions: list, write and review
# ============================================================

class QuestionIn(BaseModel):
    subject_id: str = Field(min_length=1, max_length=80)
    topic_id: str = Field(min_length=2, max_length=79, pattern=r"^[a-z0-9][a-z0-9_]+$")
    topic_name: Optional[str] = Field(default=None, max_length=255)
    syllabus_topic: Optional[str] = None
    question: str = Field(min_length=3, max_length=2000)
    correct: str = Field(min_length=1, max_length=500)
    wrong: List[str] = Field(min_length=3, max_length=3)
    explanation: str = Field(min_length=3, max_length=4000)
    difficulty: Literal["easy", "medium", "hard"] = "medium"
    sub_skill: Optional[str] = Field(default=None, max_length=80)
    licence: str = "original"
    attribution: Optional[str] = Field(default=None, max_length=1000)

    @field_validator("question", "correct", "explanation")
    @classmethod
    def _strip(cls, value: str) -> str:
        return value.strip()

    @field_validator("wrong")
    @classmethod
    def _strip_wrong(cls, value: List[str]) -> List[str]:
        return [w.strip() for w in value]


def _validate_question(db: Session, payload: QuestionIn) -> tuple:
    bank = load_questions(db, review=True)
    subjects = {s["id"]: s for s in bank["subjects"]}
    if payload.subject_id not in subjects:
        raise HTTPException(status_code=400, detail="Unknown practice subject")
    owner = next((s["id"] for s in bank["subjects"] for t in s["topics"] if t["id"] == payload.topic_id), None)
    if owner is None:
        owner = db.query(ContentQuestion.subject_id).filter(ContentQuestion.topic_id == payload.topic_id).limit(1).scalar()
    if owner and owner != payload.subject_id:
        raise HTTPException(status_code=400, detail=f"That topic belongs to another subject ({owner})")
    topic_name = next((t["name"] for t in subjects[payload.subject_id]["topics"] if t["id"] == payload.topic_id), None) or (payload.topic_name or "").strip()
    if not topic_name:
        raise HTTPException(status_code=400, detail="A new topic needs a name")
    options = [payload.correct, *payload.wrong]
    if not all(options) or len({o.casefold() for o in options}) < 4:
        raise HTTPException(status_code=400, detail="The correct answer and the three wrong answers must all be different")
    if payload.syllabus_topic and not is_topic(payload.syllabus_topic):
        raise HTTPException(status_code=400, detail="That syllabus topic isn't in the syllabus map")
    licence = normalise_licence(payload.licence)
    if licence is None:
        raise HTTPException(status_code=400, detail="Only original work, CC BY, CC BY-SA, CC0 or public domain material can be used")
    if licence != "original" and not (payload.attribution or "").strip():
        raise HTTPException(status_code=400, detail="Reused material needs an attribution")
    _check_wording(payload.question, payload.explanation, *options, topic_name)
    return topic_name, licence


def _question_row_out(subject: dict, topic: dict, q: dict) -> dict:
    return {
        "id": q["id"],
        "subject_id": subject["id"],
        "subject_name": subject["name"],
        "topic_id": topic["id"],
        "topic_name": topic["name"],
        "syllabus_topic": q.get("syllabus"),
        "question": q["question"],
        "options": q["options"],
        "correct": q["correct"],
        "explanation": q.get("explanation"),
        "difficulty": q.get("difficulty"),
        "review_status": q.get("review_status") or "published",
        "attribution": q.get("attribution"),
        # Only database questions can be edited here; the JSON bank is
        # changed through scripts/build_question_bank.py.
        "editable": q.get("source") == "database",
    }


@router.get("/questions")
def list_questions(
    status: Optional[str] = DRAFT,
    subject_id: Optional[str] = None,
    syllabus_topic: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
    user: User = Depends(require_reviewer),
):
    rows = []
    needle = (search or "").strip().casefold()
    for subject, topic, q in _flat_questions(db):
        if subject_id and subject["id"] != subject_id:
            continue
        if status == "live" and not is_live(q.get("review_status")):
            continue
        if status in (DRAFT, REJECTED) and q.get("review_status") != status:
            continue
        if syllabus_topic and q.get("syllabus") != syllabus_topic:
            continue
        if needle and needle not in q["question"].casefold() and needle != q["id"]:
            continue
        rows.append((subject, topic, q))
    limit = max(1, min(limit, 200))
    page = rows[offset : offset + limit]
    return {"success": True, "total": len(rows), "questions": [_question_row_out(*row) for row in page]}


def _find_question(db: Session, question_id: str) -> tuple:
    for subject, topic, q in _flat_questions(db):
        if q["id"] == question_id:
            return subject, topic, q
    raise HTTPException(status_code=404, detail="Question not found")


@router.get("/questions/{question_id}")
def get_question(question_id: str, db: Session = Depends(get_db), user: User = Depends(require_reviewer)):
    out = _question_row_out(*_find_question(db, question_id))
    return {"success": True, "question": out, "history": _history(db, "question", question_id)}


@router.post("/questions")
def create_question(payload: QuestionIn, db: Session = Depends(get_db), user: User = Depends(require_reviewer)):
    topic_name, licence = _validate_question(db, payload)
    question_id = _new_question_id(payload.subject_id)
    options = [payload.correct, *payload.wrong]
    order = sorted(range(4), key=lambda _: uuid.uuid4().hex)
    db.add(
        ContentQuestion(
            question_id=question_id,
            subject_id=payload.subject_id,
            topic_id=payload.topic_id,
            topic_name=topic_name,
            syllabus_topic=payload.syllabus_topic or None,
            question=payload.question,
            correct=payload.correct,
            options=[options[i] for i in order],
            explanation=payload.explanation,
            difficulty=payload.difficulty,
            sub_skill=payload.sub_skill or None,
            review_status=DRAFT,
            licence=licence,
            attribution=payload.attribution or None,
            created_by_id=user.id,
        )
    )
    _audit(db, "question", question_id, "created", user)
    db.commit()
    return get_question(question_id, db, user)


@router.put("/questions/{question_id}")
def update_question(question_id: str, payload: QuestionIn, db: Session = Depends(get_db), user: User = Depends(require_reviewer)):
    row = db.query(ContentQuestion).filter(ContentQuestion.question_id == question_id).first()
    if not row:
        _find_question(db, question_id)  # 404 if it doesn't exist at all
        raise HTTPException(status_code=400, detail="Questions in the built-in bank are changed in scripts/build_question_bank.py, not here")
    topic_name, licence = _validate_question(db, payload)
    options = [payload.correct, *payload.wrong]
    order = sorted(range(4), key=lambda _: uuid.uuid4().hex)
    row.subject_id, row.topic_id, row.topic_name = payload.subject_id, payload.topic_id, topic_name
    row.syllabus_topic = payload.syllabus_topic or None
    row.question, row.correct, row.explanation = payload.question, payload.correct, payload.explanation
    row.options = [options[i] for i in order]
    row.difficulty, row.sub_skill = payload.difficulty, payload.sub_skill or None
    row.licence, row.attribution = licence, payload.attribution or None
    # Any change needs checking again before students see it.
    row.review_status = DRAFT
    _audit(db, "question", question_id, "edited", user)
    db.commit()
    return get_question(question_id, db, user)


class ReviewIn(BaseModel):
    decision: Literal["approve", "reject"]
    note: Optional[str] = Field(default=None, max_length=2000)


@router.post("/questions/{question_id}/review")
def review_question(question_id: str, payload: ReviewIn, db: Session = Depends(get_db), user: User = Depends(require_reviewer)):
    _, _, q = _find_question(db, question_id)
    _check_not_own_work(db, user, "question", question_id)
    status = q.get("review_status")
    if payload.decision == "approve" and status not in (DRAFT, REJECTED):
        raise HTTPException(status_code=400, detail="This question is already live")
    row = db.query(ContentQuestion).filter(ContentQuestion.question_id == question_id).first()
    if row:
        row.review_status = APPROVED if payload.decision == "approve" else REJECTED
    _audit(db, "question", question_id, "approved" if payload.decision == "approve" else "rejected", user, payload.note)
    db.commit()
    return get_question(question_id, db, user)


# ============================================================
# Lessons and courses: list, write and review
# ============================================================

def _lesson_row_out(lesson: Lesson) -> dict:
    return {
        "id": lesson.id,
        "slug": lesson.slug,
        "title": lesson.title,
        "description": lesson.description,
        "content": lesson.content,
        "course": {"id": lesson.course.id, "slug": lesson.course.slug, "title": lesson.course.title, "level": lesson.course.level, "review_status": lesson.course.review_status},
        "order_index": lesson.order_index,
        "duration_minutes": lesson.duration_minutes,
        "syllabus_topic": lesson.syllabus_topic,
        "attribution": lesson.attribution,
        "review_status": lesson.review_status,
    }


@router.get("/lessons")
def list_lessons(
    status: Optional[str] = DRAFT,
    syllabus_topic: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
    user: User = Depends(require_reviewer),
):
    query = db.query(Lesson)
    if status in (DRAFT, REJECTED):
        query = query.filter(Lesson.review_status == status)
    elif status == "live":
        query = query.filter(Lesson.review_status.notin_((DRAFT, REJECTED)))
    if syllabus_topic:
        query = query.filter(Lesson.syllabus_topic == syllabus_topic)
    limit = max(1, min(limit, 200))
    total = query.count()
    lessons = query.order_by(Lesson.course_id, Lesson.order_index, Lesson.id).offset(offset).limit(limit).all()
    return {"success": True, "total": total, "lessons": [_lesson_row_out(lesson) for lesson in lessons]}


def _get_lesson(db: Session, lesson_id: int) -> Lesson:
    lesson = db.get(Lesson, lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    return lesson


@router.get("/lessons/{lesson_id}")
def get_lesson(lesson_id: int, db: Session = Depends(get_db), user: User = Depends(require_reviewer)):
    lesson = _get_lesson(db, lesson_id)
    return {"success": True, "lesson": _lesson_row_out(lesson), "history": _history(db, "lesson", lesson.slug)}


class LessonIn(BaseModel):
    course_slug: str = Field(min_length=2, max_length=255)
    slug: str = Field(min_length=2, max_length=200, pattern=r"^[a-z0-9][a-z0-9-]+$")
    title: str = Field(min_length=2, max_length=255)
    description: Optional[str] = Field(default=None, max_length=2000)
    content: str = Field(min_length=40, max_length=50000)
    syllabus_topic: Optional[str] = None
    order_index: Optional[int] = Field(default=None, ge=0, le=10000)
    duration_minutes: Optional[int] = Field(default=None, ge=1, le=600)
    licence: str = "original"
    attribution: Optional[str] = Field(default=None, max_length=1000)


def _validate_lesson(db: Session, payload: LessonIn, lesson: Optional[Lesson] = None) -> tuple:
    course = db.query(Course).filter(Course.slug == payload.course_slug).first()
    if not course:
        raise HTTPException(status_code=400, detail="No course has that slug")
    clash = db.query(Lesson).filter(Lesson.slug == payload.slug).first()
    if clash and clash is not lesson:
        raise HTTPException(status_code=400, detail="A lesson with that slug already exists")
    if payload.syllabus_topic and not is_topic(payload.syllabus_topic):
        raise HTTPException(status_code=400, detail="That syllabus topic isn't in the syllabus map")
    licence = normalise_licence(payload.licence)
    if licence is None:
        raise HTTPException(status_code=400, detail="Only original work, CC BY, CC BY-SA, CC0 or public domain material can be used")
    if licence != "original" and not (payload.attribution or "").strip():
        raise HTTPException(status_code=400, detail="Reused material needs an attribution")
    _check_wording(payload.title, payload.description, payload.content)
    return course, licence


@router.post("/lessons")
def create_lesson(payload: LessonIn, db: Session = Depends(get_db), user: User = Depends(require_reviewer)):
    course, licence = _validate_lesson(db, payload)
    order = payload.order_index if payload.order_index is not None else max((lesson.order_index for lesson in course.lessons), default=-1) + 1
    lesson = Lesson(
        course_id=course.id,
        slug=payload.slug,
        title=payload.title.strip(),
        description=payload.description,
        lesson_type="text",
        order_index=order,
        duration_minutes=payload.duration_minutes,
        content=payload.content,
        review_status=DRAFT,
        syllabus_topic=payload.syllabus_topic or None,
        attribution=_attribution(licence, payload.attribution),
    )
    db.add(lesson)
    _audit(db, "lesson", payload.slug, "created", user)
    db.commit()
    return get_lesson(lesson.id, db, user)


@router.put("/lessons/{lesson_id}")
def update_lesson(lesson_id: int, payload: LessonIn, db: Session = Depends(get_db), user: User = Depends(require_reviewer)):
    lesson = _get_lesson(db, lesson_id)
    if payload.slug != lesson.slug:
        raise HTTPException(status_code=400, detail="A lesson's slug can't change: students' progress and reports refer to it")
    course, licence = _validate_lesson(db, payload, lesson)
    lesson.course_id = course.id
    lesson.title, lesson.description, lesson.content = payload.title.strip(), payload.description, payload.content
    if payload.order_index is not None:
        lesson.order_index = payload.order_index
    lesson.duration_minutes = payload.duration_minutes
    lesson.syllabus_topic = payload.syllabus_topic or None
    lesson.attribution = _attribution(licence, payload.attribution)
    lesson.lesson_type = "text"
    lesson.review_status = DRAFT
    _audit(db, "lesson", lesson.slug, "edited", user)
    db.commit()
    return get_lesson(lesson.id, db, user)


@router.post("/lessons/{lesson_id}/review")
def review_lesson(lesson_id: int, payload: ReviewIn, db: Session = Depends(get_db), user: User = Depends(require_reviewer)):
    lesson = _get_lesson(db, lesson_id)
    _check_not_own_work(db, user, "lesson", lesson.slug)
    if payload.decision == "approve" and is_live(lesson.review_status):
        raise HTTPException(status_code=400, detail="This lesson is already live")
    lesson.review_status = APPROVED if payload.decision == "approve" else REJECTED
    _audit(db, "lesson", lesson.slug, "approved" if payload.decision == "approve" else "rejected", user, payload.note)
    db.commit()
    return get_lesson(lesson.id, db, user)


def _course_row_out(db: Session, course: Course) -> dict:
    statuses = [lesson.review_status for lesson in course.lessons]
    return {
        "id": course.id,
        "slug": course.slug,
        "title": course.title,
        "description": course.description,
        "level": course.level,
        "review_status": course.review_status,
        "lessons": len(statuses),
        "lessons_live": sum(1 for s in statuses if is_live(s)),
        "lessons_draft": sum(1 for s in statuses if is_draft(s)),
        "history": _history(db, "course", course.slug),
    }


@router.get("/courses")
def list_courses(status: Optional[str] = DRAFT, db: Session = Depends(get_db), user: User = Depends(require_reviewer)):
    query = db.query(Course)
    if status in (DRAFT, REJECTED):
        query = query.filter(Course.review_status == status)
    elif status == "live":
        query = query.filter(Course.review_status.notin_((DRAFT, REJECTED)))
    courses = query.order_by(Course.level, Course.title).all()
    return {"success": True, "courses": [_course_row_out(db, c) for c in courses]}


class CourseIn(BaseModel):
    slug: str = Field(min_length=2, max_length=200, pattern=r"^[a-z0-9][a-z0-9-]+$")
    title: str = Field(min_length=2, max_length=255)
    description: Optional[str] = Field(default=None, max_length=2000)
    level: Literal["primary", "jhs", "shs"]


@router.post("/courses")
def create_course(payload: CourseIn, db: Session = Depends(get_db), user: User = Depends(require_reviewer)):
    if payload.level not in STUDENT_LEVELS:
        raise HTTPException(status_code=400, detail="Unknown level")
    if db.query(Course).filter(Course.slug == payload.slug).first():
        raise HTTPException(status_code=400, detail="A course with that slug already exists")
    _check_wording(payload.title, payload.description)
    course = Course(slug=payload.slug, title=payload.title.strip(), description=payload.description, level=payload.level, country="GH", review_status=DRAFT)
    db.add(course)
    _audit(db, "course", payload.slug, "created", user)
    db.commit()
    return {"success": True, "course": _course_row_out(db, course)}


@router.post("/courses/{course_id}/review")
def review_course(course_id: int, payload: ReviewIn, db: Session = Depends(get_db), user: User = Depends(require_reviewer)):
    course = db.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    _check_not_own_work(db, user, "course", course.slug)
    if payload.decision == "approve" and is_live(course.review_status):
        raise HTTPException(status_code=400, detail="This course is already live")
    course.review_status = APPROVED if payload.decision == "approve" else REJECTED
    _audit(db, "course", course.slug, "approved" if payload.decision == "approve" else "rejected", user, payload.note)
    db.commit()
    return {"success": True, "course": _course_row_out(db, course)}


@router.get("/activity")
def recent_activity(limit: int = 50, db: Session = Depends(get_db), user: User = Depends(require_reviewer)):
    """The audit log, newest first: who did what to which item, and when."""
    rows = (
        db.query(ContentReview, User.full_name)
        .outerjoin(User, User.id == ContentReview.user_id)
        .order_by(ContentReview.id.desc())
        .limit(max(1, min(limit, 500)))
        .all()
    )
    return {
        "success": True,
        "activity": [
            {"item_type": r.item_type, "item_id": r.item_id, "action": r.action, "by": name, "note": r.note, "at": r.created_at.isoformat() if r.created_at else None}
            for r, name in rows
        ],
    }


# ============================================================
# Contributors
# ============================================================

def _contributor_out(user: User) -> dict:
    return {"id": user.id, "full_name": user.full_name, "email": user.email, "username": user.username}


@router.get("/contributors")
def list_contributors(db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    users = db.query(User).filter(User.is_contributor.is_(True)).order_by(User.full_name).all()
    return {"success": True, "contributors": [_contributor_out(u) for u in users]}


class ContributorIn(BaseModel):
    identifier: str = Field(min_length=3, max_length=255)
    is_contributor: bool = True


@router.post("/contributors")
def set_contributor(payload: ContributorIn, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    user = find_user(db, payload.identifier)
    if not user:
        raise HTTPException(status_code=404, detail="No account has exactly that email or username")
    user.is_contributor = payload.is_contributor
    _audit(db, "user", user.id, "contributor_on" if payload.is_contributor else "contributor_off", admin)
    db.commit()
    return {"success": True, "contributor": _contributor_out(user), "is_contributor": user.is_contributor}


# ============================================================
# Report a problem
# ============================================================

class ReportIn(BaseModel):
    item_type: Literal["question", "lesson"]
    item_id: str = Field(min_length=1, max_length=255)
    reason: Literal["wrong_answer", "unclear", "spelling_or_grammar", "not_for_my_level", "inappropriate", "other"]
    details: Optional[str] = Field(default=None, max_length=1000)


def _item_exists(db: Session, item_type: str, item_id: str) -> bool:
    if item_type == "lesson":
        return db.query(Lesson.id).filter(Lesson.slug == item_id).first() is not None
    return any(q["id"] == item_id for _, _, q in _flat_questions(db))


@router.post("/reports")
@limiter.limit("30/hour")
def report_problem(request: Request, payload: ReportIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    if not _item_exists(db, payload.item_type, payload.item_id):
        raise HTTPException(status_code=404, detail="We couldn't find that question or lesson")
    existing = (
        db.query(ContentReport)
        .filter(
            ContentReport.reporter_user_id == user.id,
            ContentReport.item_type == payload.item_type,
            ContentReport.item_id == payload.item_id,
            ContentReport.status == "open",
        )
        .first()
    )
    if existing:
        return {"success": True, "already_reported": True}
    db.add(
        ContentReport(
            item_type=payload.item_type,
            item_id=payload.item_id,
            reason=payload.reason,
            details=(payload.details or "").strip() or None,
            reporter_user_id=user.id,
        )
    )
    db.commit()
    return {"success": True, "already_reported": False}


def _report_item(db: Session, item_type: str, item_id: str, questions: dict) -> Optional[dict]:
    if item_type == "lesson":
        lesson = db.query(Lesson).filter(Lesson.slug == item_id).first()
        if not lesson:
            return None
        return {"title": lesson.title, "id": lesson.id, "course_slug": lesson.course.slug, "review_status": lesson.review_status}
    found = questions.get(item_id)
    return _question_row_out(*found) if found else None


@router.get("/reports")
def list_reports(status: str = "open", db: Session = Depends(get_db), user: User = Depends(require_reviewer)):
    """The problem-report queue. Reporters stay anonymous here: they are
    mostly children, and what matters is the content."""
    reports = db.query(ContentReport).filter(ContentReport.status == status).order_by(ContentReport.created_at.desc(), ContentReport.id.desc()).limit(500).all()
    questions = {q["id"]: (s, t, q) for s, t, q in _flat_questions(db)} if any(r.item_type == "question" for r in reports) else {}
    open_counts = dict(
        ((t, i), n)
        for t, i, n in db.query(ContentReport.item_type, ContentReport.item_id, func.count(ContentReport.id))
        .filter(ContentReport.status == "open")
        .group_by(ContentReport.item_type, ContentReport.item_id)
        .all()
    )
    return {
        "success": True,
        "reports": [
            {
                "id": r.id,
                "item_type": r.item_type,
                "item_id": r.item_id,
                "reason": r.reason,
                "details": r.details,
                "status": r.status,
                "created_at": r.created_at.isoformat() if r.created_at else None,
                "resolution_note": r.resolution_note,
                "open_reports_for_item": open_counts.get((r.item_type, r.item_id), 0),
                "item": _report_item(db, r.item_type, r.item_id, questions),
            }
            for r in reports
        ],
    }


class ResolveIn(BaseModel):
    status: Literal["resolved", "dismissed"]
    note: Optional[str] = Field(default=None, max_length=2000)


@router.post("/reports/{report_id}/resolve")
def resolve_report(report_id: int, payload: ResolveIn, db: Session = Depends(get_db), user: User = Depends(require_reviewer)):
    report = db.get(ContentReport, report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    report.status = payload.status
    report.resolution_note = payload.note
    report.resolved_by_id = user.id
    report.resolved_at = datetime.now(timezone.utc)
    db.commit()
    return {"success": True}
