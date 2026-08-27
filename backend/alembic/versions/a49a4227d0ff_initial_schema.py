"""initial schema

Revision ID: a49a4227d0ff
Revises: 
Create Date: 2026-08-27 01:24:17.559020

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a49a4227d0ff'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("full_name", sa.String(255), nullable=False),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("avatar_filename", sa.String(255), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("school", sa.String(255), nullable=True),
        sa.Column("grade", sa.String(50), nullable=True),
        sa.Column("bio", sa.Text(), nullable=True),
        sa.Column("phone", sa.String(50), nullable=True),
        sa.Column("location", sa.String(255), nullable=True),
        sa.Column("interests", sa.JSON(), nullable=False, server_default="[]"),
        sa.Column("goals", sa.JSON(), nullable=False, server_default="[]"),
        sa.Column("subjects", sa.JSON(), nullable=False, server_default="[]"),
        sa.Column("saved_careers", sa.JSON(), nullable=False, server_default="[]"),
        sa.Column("saved_universities", sa.JSON(), nullable=False, server_default="[]"),
        sa.Column("saved_scholarships", sa.JSON(), nullable=False, server_default="[]"),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    op.create_table(
        "courses",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("slug", sa.String(255), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("level", sa.String(50), nullable=False),
    )
    op.create_index("ix_courses_slug", "courses", ["slug"], unique=True)

    op.create_table(
        "lessons",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("course_id", sa.Integer(), sa.ForeignKey("courses.id"), nullable=False),
        sa.Column("slug", sa.String(255), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("lesson_type", sa.String(20), nullable=False, server_default="video"),
        sa.Column("order_index", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("is_free_preview", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("duration_minutes", sa.Integer(), nullable=True),
        sa.Column("video_url", sa.String(500), nullable=True),
        sa.Column("video_provider", sa.String(20), nullable=True),
        sa.Column("duration_seconds", sa.Integer(), nullable=True),
    )
    op.create_index("ix_lessons_slug", "lessons", ["slug"])

    op.create_table(
        "enrollments",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("course_id", sa.Integer(), sa.ForeignKey("courses.id"), nullable=False),
        sa.Column("enrolled_at", sa.DateTime(), nullable=True),
        sa.UniqueConstraint("user_id", "course_id", name="uq_enrollment_user_course"),
    )

    op.create_table(
        "lesson_progress",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("lesson_id", sa.Integer(), sa.ForeignKey("lessons.id"), nullable=False),
        sa.Column("watched", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("watched_at", sa.DateTime(), nullable=True),
        sa.UniqueConstraint("user_id", "lesson_id", name="uq_progress_user_lesson"),
    )

    op.create_table(
        "quiz_attempts",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("quiz_id", sa.String(100), nullable=False),
        sa.Column("score", sa.Integer(), nullable=False),
        sa.Column("total_questions", sa.Integer(), nullable=False),
        sa.Column("answers", sa.JSON(), nullable=True),
        sa.Column("completed_at", sa.DateTime(), nullable=True),
    )

    op.create_table(
        "plans",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("slug", sa.String(100), nullable=False),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("data", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
    )
    op.create_index("ix_plans_slug", "plans", ["slug"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_plans_slug", table_name="plans")
    op.drop_table("plans")
    op.drop_table("quiz_attempts")
    op.drop_table("lesson_progress")
    op.drop_table("enrollments")
    op.drop_index("ix_lessons_slug", table_name="lessons")
    op.drop_table("lessons")
    op.drop_index("ix_courses_slug", table_name="courses")
    op.drop_table("courses")
    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")
