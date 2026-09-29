from datetime import datetime, timezone

from sqlalchemy import Boolean, Column, DateTime, Integer, String

from core.database import Base


class PracticeSmsSubscriber(Base):
    """A phone-number-only opt-in for the outbound practice-SMS pilot
    (roadmap item #6, Phase 1 - see the Sept 2026 feature-phone-fallback
    scoping doc). Deliberately NOT tied to a User account: the whole
    point is reaching students who may never have been able to sign up
    for the smartphone PWA at all.

    verification_code_hash/expires_at/attempts/sent_at follow the exact
    same hashed-OTP pattern as User.consent_otp_* (see
    modules/auth/consent.py) - proving possession of the phone number
    before treating it as verified, not just accepting whatever number a
    public, unauthenticated endpoint was handed."""

    __tablename__ = "practice_sms_subscribers"

    id = Column(Integer, primary_key=True)
    phone_number = Column(String(20), unique=True, nullable=False)
    country = Column(String(2), nullable=False)
    subject_id = Column(String(100), nullable=True)
    opted_in = Column(Boolean, nullable=False, default=True)
    verified = Column(Boolean, nullable=False, default=False)
    verification_code_hash = Column(String(255), nullable=True)
    verification_code_expires_at = Column(DateTime, nullable=True)
    verification_attempts = Column(Integer, nullable=False, default=0)
    verification_code_sent_at = Column(DateTime, nullable=True)
    # The last question texted, so the next send can reveal its answer
    # before posing a new one - outbound-only (no reply capture) means
    # revealing the answer next message rather than next reply is what
    # makes this a genuine practice loop instead of a question with its
    # answer given away in the same breath.
    last_question_id = Column(String(50), nullable=True)
    last_sms_sent_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
