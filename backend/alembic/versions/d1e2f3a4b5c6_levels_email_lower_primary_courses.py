"""Student level, one account per email whatever its case, school-choice
draft, and the first primary-level courses.

Revision ID: d1e2f3a4b5c6
Revises: c9d0e1f2a3b4
"""

import json
from pathlib import Path

import sqlalchemy as sa
from alembic import op

revision = "d1e2f3a4b5c6"
down_revision = "c9d0e1f2a3b4"
branch_labels = None
depends_on = None

COURSES_DIR = Path(__file__).resolve().parents[2] / "data" / "courses" / "primary"


def _seed_primary_courses(bind):
    # Written here rather than through the ORM models, so this keeps working
    # as those models change. Safe if a course was already imported by hand.
    courses = sa.table(
        "courses",
        sa.column("id", sa.Integer),
        sa.column("slug", sa.String),
        sa.column("title", sa.String),
        sa.column("description", sa.Text),
        sa.column("level", sa.String),
        sa.column("country", sa.String),
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
    )
    for path in sorted(COURSES_DIR.glob("*.json")):
        course = json.loads(path.read_text(encoding="utf-8"))
        if bind.execute(sa.select(courses.c.id).where(courses.c.slug == course["slug"])).first():
            continue
        bind.execute(
            courses.insert().values(
                slug=course["slug"],
                title=course["title"],
                description=course["description"],
                level=course["level"],
                country=course["country"],
            )
        )
        course_id = bind.execute(sa.select(courses.c.id).where(courses.c.slug == course["slug"])).scalar_one()
        for index, lesson in enumerate(course["lessons"]):
            bind.execute(
                lessons.insert().values(
                    course_id=course_id,
                    slug=lesson["id"],
                    title=lesson["title"],
                    description=lesson.get("description"),
                    lesson_type="text",
                    order_index=index,
                    is_free_preview=lesson.get("is_free_preview", False),
                    duration_minutes=lesson.get("duration_minutes"),
                    content=lesson["content"],
                )
            )


def upgrade():
    op.add_column("users", sa.Column("level", sa.String(length=10), nullable=True))
    op.create_index("ix_users_level", "users", ["level"])
    op.add_column("users", sa.Column("school_choice_draft", sa.JSON(), nullable=True))

    bind = op.get_bind()
    # Existing students who already chose a grade keep what they chose.
    bind.execute(sa.text("UPDATE users SET level = 'jhs' WHERE lower(grade) LIKE 'jhs%'"))
    bind.execute(sa.text("UPDATE users SET level = 'shs' WHERE lower(grade) LIKE 'shs%'"))

    duplicates = bind.execute(
        sa.text("SELECT lower(email) FROM users GROUP BY lower(email) HAVING count(*) > 1")
    ).fetchall()
    if duplicates:
        # Two real accounts differ only by case. Neither can be merged or
        # dropped automatically: fail the deploy, which leaves production
        # running as it was, rather than guess. No addresses in this message
        # since it ends up in deploy logs.
        raise RuntimeError(f"{len(duplicates)} email(s) have accounts differing only by case - resolve before migrating")
    bind.execute(sa.text("UPDATE users SET email = lower(email), guardian_email = lower(guardian_email)"))
    op.create_index("uq_users_email_lower", "users", [sa.text("lower(email)")], unique=True)

    _seed_primary_courses(bind)


def downgrade():
    # The primary courses are left in place: students may have enrolled.
    op.drop_index("uq_users_email_lower", table_name="users")
    op.drop_column("users", "school_choice_draft")
    op.drop_index("ix_users_level", table_name="users")
    op.drop_column("users", "level")
