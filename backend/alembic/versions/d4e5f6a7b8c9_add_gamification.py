"""add gamification

Revision ID: d4e5f6a7b8c9
Revises: c3d4e5f6a7b8
Create Date: 2026-09-29 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'd4e5f6a7b8c9'
down_revision: Union[str, None] = 'c3d4e5f6a7b8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('gamification_profiles',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('user_id', sa.Integer(), nullable=False),
    sa.Column('xp_points', sa.Integer(), nullable=False),
    sa.Column('current_streak_days', sa.Integer(), nullable=False),
    sa.Column('longest_streak_days', sa.Integer(), nullable=False),
    sa.Column('last_activity_date', sa.Date(), nullable=True),
    sa.Column('leaderboard_opt_in', sa.Boolean(), nullable=False),
    sa.Column('leaderboard_display_name', sa.String(length=50), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=True),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('user_id'),
    )

    op.create_table('earned_achievements',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('user_id', sa.Integer(), nullable=False),
    sa.Column('achievement_id', sa.String(length=50), nullable=False),
    sa.Column('earned_at', sa.DateTime(), nullable=True),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('user_id', 'achievement_id', name='uq_earned_achievement_user_achievement'),
    )


def downgrade() -> None:
    op.drop_table('earned_achievements')
    op.drop_table('gamification_profiles')
