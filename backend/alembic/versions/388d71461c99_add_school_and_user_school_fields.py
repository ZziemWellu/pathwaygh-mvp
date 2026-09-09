"""add school and user school fields

Revision ID: 388d71461c99
Revises: d9cfb63b28d2
Create Date: 2026-09-09 03:33:20.599032

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '388d71461c99'
down_revision: Union[str, None] = 'd9cfb63b28d2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "schools",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("country", sa.String(2), nullable=False, server_default=sa.text("'GH'")),
        sa.Column("join_code", sa.String(16), nullable=False),
        sa.Column("created_by_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_schools_join_code", "schools", ["join_code"], unique=True)
    op.add_column("users", sa.Column("school_id", sa.Integer(), sa.ForeignKey("schools.id"), nullable=True))
    op.add_column("users", sa.Column("is_school_admin", sa.Boolean(), nullable=False, server_default=sa.false()))


def downgrade() -> None:
    op.drop_column("users", "is_school_admin")
    op.drop_column("users", "school_id")
    op.drop_index("ix_schools_join_code", table_name="schools")
    op.drop_table("schools")
