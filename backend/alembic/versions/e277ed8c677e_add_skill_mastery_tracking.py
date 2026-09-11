"""add skill mastery tracking

Revision ID: e277ed8c677e
Revises: 4b5cdca807dc
Create Date: 2026-09-11 02:58:11.913238

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'e277ed8c677e'
down_revision: Union[str, None] = '4b5cdca807dc'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('skill_masteries',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('user_id', sa.Integer(), nullable=False),
    sa.Column('subject_id', sa.String(length=100), nullable=False),
    sa.Column('topic_id', sa.String(length=100), nullable=False),
    sa.Column('mastery_probability', sa.Float(), nullable=False),
    sa.Column('attempts_count', sa.Integer(), nullable=False),
    sa.Column('last_updated', sa.DateTime(), nullable=True),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('user_id', 'subject_id', 'topic_id', name='uq_mastery_user_subject_topic')
    )


def downgrade() -> None:
    op.drop_table('skill_masteries')
