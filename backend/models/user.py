from datetime import datetime, timezone

from sqlalchemy import JSON, Boolean, Column, DateTime, ForeignKey, Index, Integer, String, Text, false, text
from sqlalchemy.orm import relationship

from core.database import Base


class User(Base):
    __tablename__ = "users"
    # Emails are stored lower-case; this stops "Ama@x.com" and "ama@x.com"
    # ever being two accounts, whatever case an older row was saved in.
    __table_args__ = (
        Index("uq_users_email_lower", text("lower(email)"), unique=True),
        Index("uq_users_username_lower", text("lower(username)"), unique=True),
    )

    id = Column(Integer, primary_key=True)
    # A young pupil may have no email: they sign in with a username, and codes
    # go to their parent's phone or email (see modules/auth/password_reset.py).
    email = Column(String(255), unique=True, nullable=True, index=True)
    username = Column(String(30), nullable=True)
    # A school-issued temporary password has to be replaced at first sign-in.
    must_change_password = Column(Boolean, nullable=False, default=False, server_default=false())
    full_name = Column(String(255), nullable=False)
    password_hash = Column(String(255), nullable=False)

    # Forgot-password flow. Same shape as the guardian-consent OTP fields
    # below: only a hash is ever stored, cleared once used or replaced by
    # a newer request.
    password_reset_token_hash = Column(String(255), nullable=True)
    password_reset_expires_at = Column(DateTime, nullable=True)
    avatar_filename = Column(String(255), nullable=True)
    is_admin = Column(Boolean, nullable=False, default=False)
    country = Column(String(2), nullable=False, default="GH")
    language = Column(String(3), nullable=False, default="en")
    # primary, jhs or shs (core/levels.py). Decides which courses and question
    # banks the student sees. Null only on accounts created before sign-up
    # asked for it - those are prompted on Home.
    level = Column(String(10), nullable=True, index=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Institutional linkage. school_id/is_school_admin are the real
    # relational link to a School row; the pre-existing `school` string below
    # is separate self-reported profile text and is left untouched.
    school_id = Column(
        Integer,
        ForeignKey("schools.id", use_alter=True, name="fk_users_school_id"),
        nullable=True,
        index=True,
    )
    is_school_admin = Column(Boolean, nullable=False, default=False)
    # Session version embedded in every JWT ("ver"); incrementing it - on
    # password reset - invalidates all tokens issued before.
    token_version = Column(Integer, nullable=False, default=0, server_default="0")

    # Consent (child-data protection). Nullable and never backfilled for
    # existing users - a fabricated consent timestamp would be a false
    # attestation. consent_given_at/consent_version are only set once a
    # guardian_email is OTP-verified (see modules/auth/consent.py) - not
    # at registration time.
    guardian_email = Column(String(255), nullable=True)
    consent_given_at = Column(DateTime, nullable=True)
    consent_version = Column(String(20), nullable=True)

    # Pending guardian-consent OTP state. Cleared once verify_consent_otp
    # succeeds; consent_otp_attempts resets to 0 each time a new code is
    # issued (registration or resend).
    consent_otp_hash = Column(String(255), nullable=True)
    consent_otp_expires_at = Column(DateTime, nullable=True)
    consent_otp_attempts = Column(Integer, nullable=False, default=0)
    consent_otp_sent_at = Column(DateTime, nullable=True)

    # Guardian's phone: where the consent code goes by SMS, and the WhatsApp
    # digest's destination. If the guardian also has an email on file, the
    # email stays the verified contact and changing this phone leaves consent
    # alone; with no email, a new phone needs re-verifying.
    guardian_phone = Column(String(20), nullable=True)  # E.164, e.g. +233241234567
    guardian_whatsapp_opt_in = Column(Boolean, nullable=False, default=False)
    last_digest_sent_at = Column(DateTime, nullable=True)

    # School-admin WhatsApp digest. Reuses the existing `phone` field below
    # (this account's own number) rather than a new column - unlike
    # guardian_phone, which is necessarily a different person's number.
    # Separate cooldown from last_digest_sent_at since an admin who is also
    # a parent can legitimately receive both digests independently.
    school_digest_whatsapp_opt_in = Column(Boolean, nullable=False, default=False)
    last_school_digest_sent_at = Column(DateTime, nullable=True)

    # Draft of the student's CSSPS school choices (modules/school_choice).
    school_choice_draft = Column(JSON, nullable=True)

    # Profile fields
    school = Column(String(255), nullable=True)
    grade = Column(String(50), nullable=True)
    bio = Column(Text, nullable=True)
    phone = Column(String(50), nullable=True)
    location = Column(String(255), nullable=True)
    interests = Column(JSON, nullable=False, default=list)
    goals = Column(JSON, nullable=False, default=list)
    subjects = Column(JSON, nullable=False, default=list)
    saved_careers = Column(JSON, nullable=False, default=list)
    saved_universities = Column(JSON, nullable=False, default=list)
    saved_scholarships = Column(JSON, nullable=False, default=list)

    enrollments = relationship("Enrollment", back_populates="user", cascade="all, delete-orphan")
    lesson_progress = relationship("LessonProgress", back_populates="user", cascade="all, delete-orphan")
    quiz_attempts = relationship("QuizAttempt", back_populates="user", cascade="all, delete-orphan")
    plans = relationship("Plan", back_populates="user", cascade="all, delete-orphan")
    certificates = relationship("Certificate", back_populates="user", cascade="all, delete-orphan")
    skill_masteries = relationship("SkillMastery", back_populates="user", cascade="all, delete-orphan")
    sub_skill_masteries = relationship("SubSkillMastery", back_populates="user", cascade="all, delete-orphan")
    gamification_profile = relationship("GamificationProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    earned_achievements = relationship("EarnedAchievement", back_populates="user", cascade="all, delete-orphan")
    vocabulary_progress = relationship("VocabularyProgress", back_populates="user", cascade="all, delete-orphan")
    flashcards = relationship("Flashcard", back_populates="user", cascade="all, delete-orphan")
    peer_questions = relationship("PeerQuestion", back_populates="user", cascade="all, delete-orphan")
    peer_answers = relationship("PeerAnswer", back_populates="user", cascade="all, delete-orphan")
    peer_content_reports = relationship("PeerContentReport", back_populates="reporter", cascade="all, delete-orphan")
