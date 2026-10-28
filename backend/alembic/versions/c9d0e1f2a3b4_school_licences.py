"""school licences: trial/term/year periods, licence purchases, certificate school name

- school_licences: one row per licence period a school holds (free
  first-term trial, paid term or year, extra seats).
- payment_transactions: what a licence purchase buys (kind, seats, price
  per seat), fixed at quote time.
- certificates.school_name: printed on certificates from licensed schools.
- Backfill: every existing school gets the same free first term a new
  school gets, so nobody loses a feature the day this ships.

Revision ID: c9d0e1f2a3b4
Revises: b8c9d0e1f2a3
Create Date: 2026-10-28 12:00:00.000000

"""
from datetime import datetime, timedelta, timezone
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'c9d0e1f2a3b4'
down_revision: Union[str, None] = 'b8c9d0e1f2a3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _trial_end(now: datetime) -> datetime:
    # Same rule as modules/licence/service.py's period_end("trial", ...),
    # inlined so this migration never changes if that code does: end of the
    # current Sep-Dec / Jan-Apr / May-Aug term, rolling into the next term
    # when fewer than 30 days are left.
    def term_end(moment):
        start_month = max(m for m in (1, 5, 9) if m <= moment.month)
        if start_month == 9:
            return datetime(moment.year + 1, 1, 1)
        return datetime(moment.year, start_month + 4, 1)

    end = term_end(now)
    if end - now < timedelta(days=30):
        end = term_end(end)
    return end


def upgrade() -> None:
    op.create_table(
        'school_licences',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('school_id', sa.Integer(), nullable=False),
        sa.Column('kind', sa.String(length=20), nullable=False),
        sa.Column('seats', sa.Integer(), nullable=True),
        sa.Column('price_per_seat_minor', sa.Integer(), nullable=True),
        sa.Column('currency', sa.String(length=3), nullable=True),
        sa.Column('starts_at', sa.DateTime(), nullable=False),
        sa.Column('ends_at', sa.DateTime(), nullable=False),
        sa.Column('transaction_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['school_id'], ['schools.id']),
        sa.ForeignKeyConstraint(['transaction_id'], ['payment_transactions.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('transaction_id'),
    )
    op.create_index('ix_school_licences_school_id', 'school_licences', ['school_id'])
    op.create_index('ix_school_licences_ends_at', 'school_licences', ['ends_at'])

    op.add_column('payment_transactions', sa.Column('licence_kind', sa.String(length=20), nullable=True))
    op.add_column('payment_transactions', sa.Column('licence_seats', sa.Integer(), nullable=True))
    op.add_column('payment_transactions', sa.Column('price_per_seat_minor', sa.Integer(), nullable=True))
    op.add_column('certificates', sa.Column('school_name', sa.String(length=255), nullable=True))

    now = datetime.now(timezone.utc).replace(tzinfo=None)
    op.execute(
        sa.text(
            "INSERT INTO school_licences (school_id, kind, starts_at, ends_at, created_at) "
            "SELECT id, 'trial', :now, :ends, :now FROM schools"
        ).bindparams(now=now, ends=_trial_end(now))
    )


def downgrade() -> None:
    op.drop_column('certificates', 'school_name')
    op.drop_column('payment_transactions', 'price_per_seat_minor')
    op.drop_column('payment_transactions', 'licence_seats')
    op.drop_column('payment_transactions', 'licence_kind')
    op.drop_index('ix_school_licences_ends_at', table_name='school_licences')
    op.drop_index('ix_school_licences_school_id', table_name='school_licences')
    op.drop_table('school_licences')
