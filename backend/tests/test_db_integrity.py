import pytest
from sqlalchemy.exc import IntegrityError

from models.gamification import GamificationProfile


def test_foreign_keys_are_enforced_in_the_test_database(db_session):
    # Guards the test setup itself: SQLite skips foreign-key checks unless
    # told otherwise, which once let tests reference users that didn't
    # exist - something Postgres (production) rejects.
    db_session.add(GamificationProfile(user_id=987654))
    with pytest.raises(IntegrityError):
        db_session.flush()
    db_session.rollback()
