"""add school admin whatsapp digest fields to users

Revision ID: 381843079582
Revises: 5bd91168809a
Create Date: 2026-09-12 02:03:55.258412

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '381843079582'
down_revision: Union[str, None] = '5bd91168809a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Note: the 'schools.created_at' nullability drift that autogenerate
    # also detected here is unrelated pre-existing schema drift (seen
    # repeatedly this session) - trimmed, not part of this migration.
    op.add_column('users', sa.Column('school_digest_whatsapp_opt_in', sa.Boolean(), nullable=False, server_default=sa.false()))
    op.add_column('users', sa.Column('last_school_digest_sent_at', sa.DateTime(), nullable=True))
    op.alter_column('users', 'school_digest_whatsapp_opt_in', server_default=None)


def downgrade() -> None:
    op.drop_column('users', 'last_school_digest_sent_at')
    op.drop_column('users', 'school_digest_whatsapp_opt_in')
