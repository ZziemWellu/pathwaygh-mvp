from datetime import datetime, timezone

from sqlalchemy import JSON, Column, DateTime, ForeignKey, Integer, String

from core.database import Base


class ActiveQuiz(Base):
    """A practice quiz that has been started but not yet submitted.

    Holds the correct answers server-side between /quiz/start and
    /quiz/submit. This used to be a module-level dict, which broke as soon
    as the API ran more than one worker process (the VPS runs two): a quiz
    started on one worker could not be submitted to the other, and every
    in-progress quiz vanished on a restart or deploy.
    """

    __tablename__ = "active_quizzes"

    id = Column(String(32), primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    data = Column(JSON, nullable=False)
    created_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None), index=True)
