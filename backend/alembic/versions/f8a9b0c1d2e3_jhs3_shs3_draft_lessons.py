"""Draft JHS 3 and SHS 3 lessons (the BECE and WASSCE years) for the core
subjects, one per most-examined syllabus topic.

They were written by AI, so every course and lesson goes in as a draft
(review_status "pending_review"): students see none of it unless
SERVE_DRAFT_QUESTIONS=1, until a reviewer approves it in Content tools.

The lessons live in data/courses/drafts/*.md, in the same format as the
lesson import. A course that already exists (matched by slug) is skipped,
whole, so this never overwrites a course someone has since edited.

Revision ID: f8a9b0c1d2e3
Revises: e7f8a9b0c1d2
"""

from pathlib import Path

import sqlalchemy as sa
from alembic import op

revision = "f8a9b0c1d2e3"
down_revision = "e7f8a9b0c1d2"
branch_labels = None
depends_on = None

DRAFTS_DIR = Path(__file__).resolve().parents[2] / "data" / "courses" / "drafts"


def _lessons(text):
    """Parsed here rather than by the app's importer, so this migration keeps
    working as that code changes. Each lesson is `key: value` lines between
    two `---` lines, then its markdown body. These files use no bare `---`
    line inside a body."""
    lessons, meta, body, state = [], None, [], "start"
    for line in text.replace("\r\n", "\n").split("\n"):
        if line.strip() == "---":
            if state == "meta":
                state = "body"
                continue
            if meta is not None:
                lessons.append((meta, "\n".join(body).strip()))
            meta, body, state = {}, [], "meta"
            continue
        if state == "meta":
            key, _, value = line.partition(":")
            if key.strip():
                meta[key.strip().lower()] = value.strip()
        elif state == "body":
            body.append(line)
    if meta is not None:
        lessons.append((meta, "\n".join(body).strip()))
    return lessons


def upgrade():
    bind = op.get_bind()
    courses = sa.table(
        "courses",
        sa.column("id", sa.Integer),
        sa.column("slug", sa.String),
        sa.column("title", sa.String),
        sa.column("description", sa.Text),
        sa.column("level", sa.String),
        sa.column("country", sa.String),
        sa.column("review_status", sa.String),
    )
    lessons = sa.table(
        "lessons",
        sa.column("course_id", sa.Integer),
        sa.column("slug", sa.String),
        sa.column("title", sa.String),
        sa.column("description", sa.Text),
        sa.column("lesson_type", sa.String),
        sa.column("order_index", sa.Integer),
        sa.column("is_free_preview", sa.Boolean),
        sa.column("duration_minutes", sa.Integer),
        sa.column("content", sa.Text),
        sa.column("review_status", sa.String),
        sa.column("syllabus_topic", sa.String),
    )
    for path in sorted(DRAFTS_DIR.glob("*.md")):
        items = _lessons(path.read_text(encoding="utf-8"))
        if not items:
            continue
        first = items[0][0]
        slug = first["course"]
        if bind.execute(sa.select(courses.c.id).where(courses.c.slug == slug)).first():
            continue
        bind.execute(
            courses.insert().values(
                slug=slug,
                title=first["course_title"],
                description=first.get("course_description") or None,
                level=first["level"],
                country="GH",
                review_status="pending_review",
            )
        )
        course_id = bind.execute(sa.select(courses.c.id).where(courses.c.slug == slug)).scalar_one()
        for index, (meta, body) in enumerate(items):
            # A lesson slug used elsewhere is left alone rather than duplicated.
            if bind.execute(sa.select(lessons.c.slug).where(lessons.c.slug == meta["slug"])).first():
                continue
            bind.execute(
                lessons.insert().values(
                    course_id=course_id,
                    slug=meta["slug"],
                    title=meta["title"],
                    description=meta.get("description") or None,
                    lesson_type="text",
                    order_index=int(meta["order"]) if meta.get("order") else index,
                    is_free_preview=index == 0,
                    duration_minutes=int(meta["duration_minutes"]) if meta.get("duration_minutes") else None,
                    content=body,
                    review_status="pending_review",
                    syllabus_topic=meta.get("syllabus_topic") or None,
                )
            )


def downgrade():
    # Left in place, as with the primary courses: by now a reviewer may have
    # approved or edited them, or students may have progress on them.
    pass
