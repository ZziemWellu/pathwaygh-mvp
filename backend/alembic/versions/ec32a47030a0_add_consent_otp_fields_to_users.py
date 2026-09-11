"""add consent otp fields to users

Revision ID: ec32a47030a0
Revises: e277ed8c677e
Create Date: 2026-09-11 21:46:56.245206

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'ec32a47030a0'
down_revision: Union[str, None] = 'e277ed8c677e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Note: the 'schools.created_at' nullability drift that autogenerate
    # also detected here is unrelated pre-existing schema drift (seen
    # repeatedly this session) - trimmed, not part of this migration.
    op.add_column('users', sa.Column('consent_otp_hash', sa.String(length=255), nullable=True))
    op.add_column('users', sa.Column('consent_otp_expires_at', sa.DateTime(), nullable=True))
    op.add_column('users', sa.Column('consent_otp_attempts', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('users', sa.Column('consent_otp_sent_at', sa.DateTime(), nullable=True))
    op.alter_column('users', 'consent_otp_attempts', server_default=None)


def downgrade() -> None:
    op.drop_column('users', 'consent_otp_sent_at')
    op.drop_column('users', 'consent_otp_attempts')
    op.drop_column('users', 'consent_otp_expires_at')
    op.drop_column('users', 'consent_otp_hash')
