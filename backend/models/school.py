from datetime import datetime, timezone

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String

from core.database import Base


class School(Base):
    __tablename__ = "schools"

    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False)
    country = Column(String(2), nullable=False, default="GH")
    join_code = Column(String(16), nullable=False, unique=True, index=True)
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Institutional attestation that the school has already collected
    # parental/guardian consent for its enrolled minors as part of its own
    # enrollment process - an alternative to individual sign-up consent.
    parent_consent_attested = Column(Boolean, nullable=False, default=False)
    parent_consent_attested_at = Column(DateTime, nullable=True)
    parent_consent_attested_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
