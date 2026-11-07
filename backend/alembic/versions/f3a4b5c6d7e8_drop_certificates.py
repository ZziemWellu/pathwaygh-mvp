"""Remove certificates entirely. The platform no longer offers them.

This deletes every certificate ever issued. Nightly database backups keep them
for 30 days after this runs. A downgrade restores the empty table, not the rows.

Revision ID: f3a4b5c6d7e8
Revises: e2f3a4b5c6d7
"""

import sqlalchemy as sa
from alembic import op

revision = "f3a4b5c6d7e8"
down_revision = "e2f3a4b5c6d7"
branch_labels = None
depends_on = None


def upgrade():
    op.drop_index("ix_certificates_code", table_name="certificates")
    op.drop_table("certificates")


def downgrade():
    op.create_table(
        "certificates",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("course_id", sa.Integer(), nullable=False),
        sa.Column("code", sa.String(length=20), nullable=False),
        sa.Column("recipient_name", sa.String(length=255), nullable=False),
        sa.Column("course_title", sa.String(length=255), nullable=False),
        sa.Column("lesson_count", sa.Integer(), nullable=False),
        sa.Column("issued_at", sa.DateTime(), nullable=True),
        sa.Column("is_revoked", sa.Boolean(), nullable=False),
        sa.Column("school_name", sa.String(length=255), nullable=True),
        sa.ForeignKeyConstraint(["course_id"], ["courses.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "course_id", name="uq_certificate_user_course"),
    )
    op.create_index("ix_certificates_code", "certificates", ["code"], unique=True)
