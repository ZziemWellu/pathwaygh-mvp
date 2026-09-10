"""add time_spent to quiz_attempts

Revision ID: 33f00a35293d
Revises: d8ce9d7886da
Create Date: 2026-09-10 01:56:58.597878

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '33f00a35293d'
down_revision: Union[str, None] = 'd8ce9d7886da'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('quiz_attempts', sa.Column('time_spent', sa.Integer(), nullable=True))


def downgrade() -> None:
    op.drop_column('quiz_attempts', 'time_spent')
