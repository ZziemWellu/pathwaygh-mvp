"""hardening: session versions, DB-backed active quizzes, FK indexes

- users.token_version: embedded in JWTs; bumped on password reset so every
  older session stops working.
- active_quizzes: in-progress practice quizzes, previously a per-process
  dict that broke with more than one API worker.
- indexes on 18 foreign-key columns that had none (Postgres doesn't index
  FKs automatically), e.g. quiz history by user, lessons by course.

Revision ID: b8c9d0e1f2a3
Revises: a7b8c9d0e1f2
Create Date: 2026-10-28 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'b8c9d0e1f2a3'
down_revision: Union[str, None] = 'a7b8c9d0e1f2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# (table, column) - index name follows SQLAlchemy's index=True convention.
FK_INDEXES = [
    ('users', 'school_id'),
    ('certificates', 'course_id'),
    ('enrollments', 'course_id'),
    ('flashcards', 'user_id'),
    ('lessons', 'course_id'),
    ('peer_questions', 'user_id'),
    ('plans', 'user_id'),
    ('quiz_attempts', 'user_id'),
    ('schools', 'parent_consent_attested_by_id'),
    ('schools', 'created_by_id'),
    ('exercise_results', 'lesson_id'),
    ('exercise_results', 'user_id'),
    ('exercises', 'lesson_id'),
    ('lesson_progress', 'lesson_id'),
    ('payment_transactions', 'initiated_by_id'),
    ('payment_transactions', 'school_id'),
    ('peer_answers', 'user_id'),
    ('peer_answers', 'question_id'),
]


def upgrade() -> None:
    op.add_column('users', sa.Column('token_version', sa.Integer(), nullable=False, server_default='0'))

    op.create_table(
        'active_quizzes',
        sa.Column('id', sa.String(length=32), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('data', sa.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_active_quizzes_user_id', 'active_quizzes', ['user_id'])
    op.create_index('ix_active_quizzes_created_at', 'active_quizzes', ['created_at'])

    for table, column in FK_INDEXES:
        op.create_index(f'ix_{table}_{column}', table, [column])


def downgrade() -> None:
    for table, column in reversed(FK_INDEXES):
        op.drop_index(f'ix_{table}_{column}', table_name=table)

    op.drop_index('ix_active_quizzes_created_at', table_name='active_quizzes')
    op.drop_index('ix_active_quizzes_user_id', table_name='active_quizzes')
    op.drop_table('active_quizzes')

    op.drop_column('users', 'token_version')
