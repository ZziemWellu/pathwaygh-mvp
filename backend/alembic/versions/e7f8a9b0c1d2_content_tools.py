"""Content tools: draft flags on courses and lessons, syllabus tags, the
contributor role, database-backed practice questions, the content review
audit log and students' problem reports.

Every existing course and lesson becomes "published", so nothing students
see today disappears.

Revision ID: e7f8a9b0c1d2
Revises: a4b5c6d7e8f9
"""

import sqlalchemy as sa
from alembic import op

revision = "e7f8a9b0c1d2"
down_revision = "a4b5c6d7e8f9"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("users", sa.Column("is_contributor", sa.Boolean(), nullable=False, server_default=sa.false()))
    op.add_column("courses", sa.Column("review_status", sa.String(length=20), nullable=False, server_default="published"))
    op.add_column("lessons", sa.Column("review_status", sa.String(length=20), nullable=False, server_default="published"))
    op.add_column("lessons", sa.Column("syllabus_topic", sa.String(length=120), nullable=True))
    op.add_column("lessons", sa.Column("attribution", sa.Text(), nullable=True))
    op.create_index("ix_lessons_syllabus_topic", "lessons", ["syllabus_topic"])

    op.create_table(
        "content_questions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("question_id", sa.String(length=80), nullable=False),
        sa.Column("subject_id", sa.String(length=80), nullable=False),
        sa.Column("topic_id", sa.String(length=80), nullable=False),
        sa.Column("topic_name", sa.String(length=255), nullable=False),
        sa.Column("syllabus_topic", sa.String(length=120), nullable=True),
        sa.Column("question", sa.Text(), nullable=False),
        sa.Column("correct", sa.Text(), nullable=False),
        sa.Column("options", sa.JSON(), nullable=False),
        sa.Column("explanation", sa.Text(), nullable=False),
        sa.Column("difficulty", sa.String(length=10), nullable=False),
        sa.Column("sub_skill", sa.String(length=80), nullable=True),
        sa.Column("review_status", sa.String(length=20), nullable=False, server_default="pending_review"),
        sa.Column("licence", sa.String(length=40), nullable=False, server_default="original"),
        sa.Column("attribution", sa.Text(), nullable=True),
        sa.Column("created_by_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
    )
    op.create_index("ix_content_questions_question_id", "content_questions", ["question_id"], unique=True)
    op.create_index("ix_content_questions_subject_id", "content_questions", ["subject_id"])
    op.create_index("ix_content_questions_syllabus_topic", "content_questions", ["syllabus_topic"])

    op.create_table(
        "content_reviews",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("item_type", sa.String(length=20), nullable=False),
        sa.Column("item_id", sa.String(length=255), nullable=False),
        sa.Column("action", sa.String(length=20), nullable=False),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("note", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
    )
    op.create_index("ix_content_reviews_item", "content_reviews", ["item_type", "item_id"])
    op.create_index("ix_content_reviews_user_id", "content_reviews", ["user_id"])
    op.create_index("ix_content_reviews_created_at", "content_reviews", ["created_at"])

    op.create_table(
        "content_reports",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("item_type", sa.String(length=20), nullable=False),
        sa.Column("item_id", sa.String(length=255), nullable=False),
        sa.Column("reason", sa.String(length=30), nullable=False),
        sa.Column("details", sa.Text(), nullable=True),
        sa.Column("reporter_user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="open"),
        sa.Column("resolved_by_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("resolved_at", sa.DateTime(), nullable=True),
        sa.Column("resolution_note", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
    )
    op.create_index("ix_content_reports_item", "content_reports", ["item_type", "item_id"])
    op.create_index("ix_content_reports_reporter_user_id", "content_reports", ["reporter_user_id"])
    op.create_index("ix_content_reports_status", "content_reports", ["status"])
    op.create_index("ix_content_reports_created_at", "content_reports", ["created_at"])


def downgrade():
    op.drop_table("content_reports")
    op.drop_table("content_reviews")
    op.drop_table("content_questions")
    op.drop_index("ix_lessons_syllabus_topic", table_name="lessons")
    op.drop_column("lessons", "attribution")
    op.drop_column("lessons", "syllabus_topic")
    op.drop_column("lessons", "review_status")
    op.drop_column("courses", "review_status")
    op.drop_column("users", "is_contributor")
