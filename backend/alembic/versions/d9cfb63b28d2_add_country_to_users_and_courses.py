"""add country to users and courses

Revision ID: d9cfb63b28d2
Revises: bab08e0479e0
Create Date: 2026-09-08 21:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd9cfb63b28d2'
down_revision: Union[str, None] = 'bab08e0479e0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("country", sa.String(2), nullable=False, server_default=sa.text("'GH'")))
    op.add_column("courses", sa.Column("country", sa.String(2), nullable=False, server_default=sa.text("'GH'")))


def downgrade() -> None:
    op.drop_column("courses", "country")
    op.drop_column("users", "country")
