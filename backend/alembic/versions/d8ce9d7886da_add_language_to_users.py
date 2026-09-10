"""add language to users

Revision ID: d8ce9d7886da
Revises: 388d71461c99
Create Date: 2026-09-09 18:36:23.494819

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd8ce9d7886da'
down_revision: Union[str, None] = '388d71461c99'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("language", sa.String(3), nullable=False, server_default=sa.text("'en'")))


def downgrade() -> None:
    op.drop_column("users", "language")
