"""Draft content: written by AI or imported, and not yet checked by a teacher.

Drafts stay away from students unless SERVE_DRAFT_QUESTIONS=1 is set on
purpose (for testing), because a wrong answer or a wrong explanation teaches
a child something wrong. Admins and contributors always see drafts, so they
can review them; students who do see one are told no teacher has checked it.

The same review_status values are used for practice questions, lessons and
courses:

- "pending_review": a draft. Hidden from students unless drafts are served.
- "rejected": a reviewer turned it down. Never shown to students.
- anything else ("published" for content that predates review, "approved",
  and for questions "computed" or "teacher_reviewed"): live.
"""

import os
from typing import Optional

DRAFT = "pending_review"
REJECTED = "rejected"
APPROVED = "approved"
# Lessons and courses that existed before drafts did.
PUBLISHED = "published"


def serve_drafts() -> bool:
    return os.getenv("SERVE_DRAFT_QUESTIONS") == "1"


def is_draft(review_status: Optional[str]) -> bool:
    return review_status == DRAFT


def is_live(review_status: Optional[str]) -> bool:
    return review_status not in (DRAFT, REJECTED)


def user_reviews_content(user) -> bool:
    return bool(user is not None and (user.is_admin or getattr(user, "is_contributor", False)))


def user_sees_drafts(user) -> bool:
    """Whether this viewer (None for a signed-out visitor) may see drafts."""
    return serve_drafts() or user_reviews_content(user)


def shown_to(review_status: Optional[str], user) -> bool:
    if review_status == REJECTED:
        return user_reviews_content(user)
    if review_status == DRAFT:
        return user_sees_drafts(user)
    return True


def visible_lessons(course, user=None) -> list:
    """A course's lessons this viewer may see, in order. The default (no
    user) is what a student sees."""
    lessons = sorted(course.lessons, key=lambda lesson: lesson.order_index)
    return [lesson for lesson in lessons if shown_to(lesson.review_status, user)]


def course_is_shown(course, user=None) -> bool:
    return shown_to(course.review_status, user)
