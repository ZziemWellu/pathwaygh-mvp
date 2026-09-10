"""add certificates table

Revision ID: 4b5cdca807dc
Revises: b12622dfef50
Create Date: 2026-09-10 17:31:44.665091

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '4b5cdca807dc'
down_revision: Union[str, None] = 'b12622dfef50'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('certificates',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('user_id', sa.Integer(), nullable=False),
    sa.Column('course_id', sa.Integer(), nullable=False),
    sa.Column('code', sa.String(length=20), nullable=False),
    sa.Column('recipient_name', sa.String(length=255), nullable=False),
    sa.Column('course_title', sa.String(length=255), nullable=False),
    sa.Column('lesson_count', sa.Integer(), nullable=False),
    sa.Column('issued_at', sa.DateTime(), nullable=True),
    sa.Column('is_revoked', sa.Boolean(), nullable=False),
    sa.ForeignKeyConstraint(['course_id'], ['courses.id'], ),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('user_id', 'course_id', name='uq_certificate_user_course')
    )
    op.create_index(op.f('ix_certificates_code'), 'certificates', ['code'], unique=True)


def downgrade() -> None:
    op.drop_index(op.f('ix_certificates_code'), table_name='certificates')
    op.drop_table('certificates')
