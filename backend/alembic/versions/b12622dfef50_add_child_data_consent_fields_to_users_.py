"""add child-data consent fields to users and schools

Revision ID: b12622dfef50
Revises: 33f00a35293d
Create Date: 2026-09-10 15:50:31.976189

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'b12622dfef50'
down_revision: Union[str, None] = '33f00a35293d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('schools', sa.Column('parent_consent_attested', sa.Boolean(), nullable=False, server_default=sa.false()))
    op.add_column('schools', sa.Column('parent_consent_attested_at', sa.DateTime(), nullable=True))
    op.add_column('schools', sa.Column('parent_consent_attested_by_id', sa.Integer(), nullable=True))
    op.create_foreign_key('fk_schools_parent_consent_attested_by_id', 'schools', 'users', ['parent_consent_attested_by_id'], ['id'])
    op.add_column('users', sa.Column('guardian_email', sa.String(length=255), nullable=True))
    op.add_column('users', sa.Column('consent_given_at', sa.DateTime(), nullable=True))
    op.add_column('users', sa.Column('consent_version', sa.String(length=20), nullable=True))


def downgrade() -> None:
    op.drop_column('users', 'consent_version')
    op.drop_column('users', 'consent_given_at')
    op.drop_column('users', 'guardian_email')
    op.drop_constraint('fk_schools_parent_consent_attested_by_id', 'schools', type_='foreignkey')
    op.drop_column('schools', 'parent_consent_attested_by_id')
    op.drop_column('schools', 'parent_consent_attested_at')
    op.drop_column('schools', 'parent_consent_attested')
