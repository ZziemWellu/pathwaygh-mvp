from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from core.database import Base


class SchoolLicence(Base):
    """One period of a school's licence: the free first-term trial, a paid
    term or year, or extra seats bought on top of an active paid period.
    A school's current plan is derived from these rows (see
    modules/licence/service.py), never stored as a flag, so the history of
    what was granted and paid for stays intact.

    Datetimes are naive UTC; ends_at is exclusive (a term ending 31 Dec
    has ends_at = 1 Jan 00:00)."""

    __tablename__ = "school_licences"

    id = Column(Integer, primary_key=True)
    school_id = Column(Integer, ForeignKey("schools.id"), nullable=False, index=True)

    # "trial" | "term" | "year" | "top_up"
    kind = Column(String(20), nullable=False)

    # Seats this row adds. None for a trial, which has no seat cap.
    seats = Column(Integer, nullable=True)
    price_per_seat_minor = Column(Integer, nullable=True)
    currency = Column(String(3), nullable=True)

    starts_at = Column(DateTime, nullable=False)
    ends_at = Column(DateTime, nullable=False, index=True)

    # The payment that bought it (unique: a payment activates at most one
    # licence, however many times verify/webhook fire for it).
    transaction_id = Column(Integer, ForeignKey("payment_transactions.id"), nullable=True, unique=True)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    school = relationship("School")
    transaction = relationship("PaymentTransaction")
