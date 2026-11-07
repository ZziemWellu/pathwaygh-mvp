"""Accounts without an email (username login), temporary passwords for
school-issued logins, and an audit trail for level corrections.

Revision ID: e2f3a4b5c6d7
Revises: d1e2f3a4b5c6
"""

import sqlalchemy as sa
from alembic import op

revision = "e2f3a4b5c6d7"
down_revision = "d1e2f3a4b5c6"
branch_labels = None
depends_on = None


def upgrade():
    op.alter_column("users", "email", existing_type=sa.String(length=255), nullable=True)
    op.add_column("users", sa.Column("username", sa.String(length=30), nullable=True))
    op.create_index("uq_users_username_lower", "users", [sa.text("lower(username)")], unique=True)
    op.add_column(
        "users",
        sa.Column("must_change_password", sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    op.create_table(
        "level_changes",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("changed_by_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True),
        sa.Column("from_level", sa.String(length=10), nullable=True),
        sa.Column("to_level", sa.String(length=10), nullable=False),
        sa.Column("reason", sa.String(length=255), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )


def downgrade():
    op.drop_table("level_changes")
    op.drop_column("users", "must_change_password")
    op.drop_index("uq_users_username_lower", table_name="users")
    op.drop_column("users", "username")
    # Fails if email-less accounts exist, which is right: they can't be kept
    # under the old schema, and silently deleting children's accounts is worse.
    op.alter_column("users", "email", existing_type=sa.String(length=255), nullable=False)
