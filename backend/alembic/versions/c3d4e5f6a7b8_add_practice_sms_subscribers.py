"""add practice sms subscribers

Revision ID: c3d4e5f6a7b8
Revises: b2c3d4e5f6a7
Create Date: 2026-09-29 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'c3d4e5f6a7b8'
down_revision: Union[str, None] = 'b2c3d4e5f6a7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('practice_sms_subscribers',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('phone_number', sa.String(length=20), nullable=False),
    sa.Column('country', sa.String(length=2), nullable=False),
    sa.Column('subject_id', sa.String(length=100), nullable=True),
    sa.Column('opted_in', sa.Boolean(), nullable=False),
    sa.Column('verified', sa.Boolean(), nullable=False),
    sa.Column('verification_code_hash', sa.String(length=255), nullable=True),
    sa.Column('verification_code_expires_at', sa.DateTime(), nullable=True),
    sa.Column('verification_attempts', sa.Integer(), nullable=False),
    sa.Column('verification_code_sent_at', sa.DateTime(), nullable=True),
    sa.Column('last_question_id', sa.String(length=50), nullable=True),
    sa.Column('last_sms_sent_at', sa.DateTime(), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=True),
    sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_practice_sms_subscribers_phone_number'), 'practice_sms_subscribers', ['phone_number'], unique=True)


def downgrade() -> None:
    op.drop_index(op.f('ix_practice_sms_subscribers_phone_number'), table_name='practice_sms_subscribers')
    op.drop_table('practice_sms_subscribers')
