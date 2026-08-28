"""add exercises, exercise_results, lesson content

Revision ID: 30b7b897cec6
Revises: adde01599ab5
Create Date: 2026-08-28 01:00:08.158794

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '30b7b897cec6'
down_revision: Union[str, None] = 'adde01599ab5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("lessons", sa.Column("content", sa.Text(), nullable=True))

    op.create_table(
        "exercises",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("lesson_id", sa.Integer(), sa.ForeignKey("lessons.id"), nullable=False),
        sa.Column("question", sa.Text(), nullable=False),
        sa.Column("options", sa.JSON(), nullable=False),
        sa.Column("correct_index", sa.Integer(), nullable=False),
        sa.Column("explanation", sa.Text(), nullable=True),
        sa.Column("order_index", sa.Integer(), nullable=False, server_default="0"),
    )

    op.create_table(
        "exercise_results",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("lesson_id", sa.Integer(), sa.ForeignKey("lessons.id"), nullable=False),
        sa.Column("score", sa.Integer(), nullable=False),
        sa.Column("correct_count", sa.Integer(), nullable=False),
        sa.Column("total_questions", sa.Integer(), nullable=False),
        sa.Column("completed_at", sa.DateTime(), nullable=True),
    )


def downgrade() -> None:
    op.drop_table("exercise_results")
    op.drop_table("exercises")
    op.drop_column("lessons", "content")
