"""add subject_id to quiz_attempts

Revision ID: adde01599ab5
Revises: a49a4227d0ff
Create Date: 2026-08-27 22:04:01.345637

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'adde01599ab5'
down_revision: Union[str, None] = 'a49a4227d0ff'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("quiz_attempts", sa.Column("subject_id", sa.String(100), nullable=True))


def downgrade() -> None:
    op.drop_column("quiz_attempts", "subject_id")
