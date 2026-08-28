"""add is_admin to users

Revision ID: bab08e0479e0
Revises: 30b7b897cec6
Create Date: 2026-08-28 02:04:13.497466

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'bab08e0479e0'
down_revision: Union[str, None] = '30b7b897cec6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("is_admin", sa.Boolean(), nullable=False, server_default=sa.false()))


def downgrade() -> None:
    op.drop_column("users", "is_admin")
