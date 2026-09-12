"""add guardian whatsapp digest fields to users

Revision ID: 5bd91168809a
Revises: ec32a47030a0
Create Date: 2026-09-11 23:02:13.476653

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '5bd91168809a'
down_revision: Union[str, None] = 'ec32a47030a0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Note: the 'schools.created_at' nullability drift that autogenerate
    # also detected here is unrelated pre-existing schema drift (seen
    # repeatedly this session) - trimmed, not part of this migration.
    op.add_column('users', sa.Column('guardian_phone', sa.String(length=20), nullable=True))
    op.add_column('users', sa.Column('guardian_whatsapp_opt_in', sa.Boolean(), nullable=False, server_default=sa.false()))
    op.add_column('users', sa.Column('last_digest_sent_at', sa.DateTime(), nullable=True))
    op.alter_column('users', 'guardian_whatsapp_opt_in', server_default=None)


def downgrade() -> None:
    op.drop_column('users', 'last_digest_sent_at')
    op.drop_column('users', 'guardian_whatsapp_opt_in')
    op.drop_column('users', 'guardian_phone')
