"""Remove the leftover 'Certificate Manual Test Course' from the live catalogue.

It was created by hand to test certificates, and any student could see it.
Matched by exact slug, so no real course can be affected. Its lessons and any
progress on them go with it. A downgrade doesn't bring it back.

Revision ID: a4b5c6d7e8f9
Revises: f3a4b5c6d7e8
"""

import sqlalchemy as sa
from alembic import op

revision = "a4b5c6d7e8f9"
down_revision = "f3a4b5c6d7e8"
branch_labels = None
depends_on = None

SLUG = "cert-verify-manual-course"


def upgrade():
    bind = op.get_bind()
    course_id = bind.execute(sa.text("SELECT id FROM courses WHERE slug = :slug"), {"slug": SLUG}).scalar()
    if course_id is None:
        return
    lessons = "SELECT id FROM lessons WHERE course_id = :course_id"
    for statement in (
        f"DELETE FROM exercise_results WHERE lesson_id IN ({lessons})",
        f"DELETE FROM exercises WHERE lesson_id IN ({lessons})",
        f"DELETE FROM lesson_progress WHERE lesson_id IN ({lessons})",
        "DELETE FROM enrollments WHERE course_id = :course_id",
        "DELETE FROM lessons WHERE course_id = :course_id",
        "DELETE FROM courses WHERE id = :course_id",
    ):
        bind.execute(sa.text(statement), {"course_id": course_id})


def downgrade():
    pass
