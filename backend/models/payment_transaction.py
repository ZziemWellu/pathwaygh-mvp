from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from core.database import Base


class PaymentTransaction(Base):
    """The transaction log the payment-provider abstraction is built
    around (see modules/payment/providers/). No single gateway covers
    Ghana, Nigeria, Sierra Leone, Liberia, and The Gambia well, so this
    table - not any one provider's own dashboard - is the durable record
    of what was charged, to whom, and its current status, regardless of
    which provider handled it or how many providers PathwayGH ends up
    using across its 5 countries."""

    __tablename__ = "payment_transactions"

    id = Column(Integer, primary_key=True)
    reference = Column(String(100), nullable=False, unique=True, index=True)
    provider = Column(String(30), nullable=False)
    external_reference = Column(String(100), nullable=True)

    # "pending" -> "success" | "failed" | "abandoned". Set to "pending" at
    # initialize time and only ever updated by a verify call reading the
    # provider's own record of the transaction - never trusted from an
    # unverified client-side redirect alone.
    status = Column(String(20), nullable=False, default="pending")
    provider_status = Column(String(50), nullable=True)

    # Amount in the currency's minor unit (kobo/pesewas) - the same
    # convention Paystack and most African payment processors use
    # natively, and it avoids float rounding on money entirely.
    amount_minor_units = Column(Integer, nullable=False)
    currency = Column(String(3), nullable=False)

    purpose = Column(String(50), nullable=False)
    school_id = Column(Integer, ForeignKey("schools.id"), nullable=True)
    initiated_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    school = relationship("School")
    initiated_by = relationship("User")
