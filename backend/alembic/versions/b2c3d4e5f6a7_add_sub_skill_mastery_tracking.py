"""add sub skill mastery tracking

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-09-29 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'b2c3d4e5f6a7'
down_revision: Union[str, None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('sub_skill_masteries',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('user_id', sa.Integer(), nullable=False),
    sa.Column('subject_id', sa.String(length=100), nullable=False),
    sa.Column('topic_id', sa.String(length=100), nullable=False),
    sa.Column('sub_skill', sa.String(length=100), nullable=False),
    sa.Column('mastery_probability', sa.Float(), nullable=False),
    sa.Column('attempts_count', sa.Integer(), nullable=False),
    sa.Column('last_updated', sa.DateTime(), nullable=True),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('user_id', 'subject_id', 'topic_id', 'sub_skill', name='uq_subskill_mastery_user_subject_topic_subskill')
    )


def downgrade() -> None:
    op.drop_table('sub_skill_masteries')
