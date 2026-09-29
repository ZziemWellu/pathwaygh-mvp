"""add payment transactions table

Revision ID: a1b2c3d4e5f6
Revises: f1a2b3c4d5e6
Create Date: 2026-09-30 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = 'f1a2b3c4d5e6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'payment_transactions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('reference', sa.String(length=100), nullable=False),
        sa.Column('provider', sa.String(length=30), nullable=False),
        sa.Column('external_reference', sa.String(length=100), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=False),
        sa.Column('provider_status', sa.String(length=50), nullable=True),
        sa.Column('amount_minor_units', sa.Integer(), nullable=False),
        sa.Column('currency', sa.String(length=3), nullable=False),
        sa.Column('purpose', sa.String(length=50), nullable=False),
        sa.Column('school_id', sa.Integer(), nullable=True),
        sa.Column('initiated_by_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['school_id'], ['schools.id']),
        sa.ForeignKeyConstraint(['initiated_by_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_payment_transactions_reference'), 'payment_transactions', ['reference'], unique=True)


def downgrade() -> None:
    op.drop_index(op.f('ix_payment_transactions_reference'), table_name='payment_transactions')
    op.drop_table('payment_transactions')
