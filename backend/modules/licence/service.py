"""
School licence rules: academic periods, pricing, and a school's current plan.

Model (from the Oct 2026 pricing research - Khan Academy, IXL, Seesaw,
Wayground, Siyavula, Ghanaian school software):
- Learning stays free for every student, always. A licence buys the
  school-level layer: unlimited students, per-student reporting and CSV
  export, the weekly WhatsApp school digest, a higher AI-tutor allowance
  for the school's students, and the school's name on certificates.
- Free plan: up to FREE_STUDENT_LIMIT students and the summary dashboard.
- Every new school gets its first term free (the trial).
- Priced per enrolled student, per term or per academic year (cheaper),
  with a minimum billed headcount, a volume rate, and SEAT_BUFFER spare
  seats included so mid-term joiners don't need a new purchase.
- After a paid period ends the school keeps everything for GRACE_DAYS,
  then drops to the free plan. Students never lose learning access.

Academic periods follow Ghana's calendar loosely enough to cover every
school's actual dates: terms are Sep-Dec, Jan-Apr, May-Aug, and the year
runs Sep-Aug. All datetimes are naive UTC, end-exclusive.
"""

import math
from datetime import datetime, timedelta, timezone
from typing import Optional

from sqlalchemy.orm import Session

from models.school import School
from models.school_licence import SchoolLicence
from models.user import User

FREE_STUDENT_LIMIT = 40
MIN_BILLED_STUDENTS = 20
SEAT_BUFFER = 0.10
GRACE_DAYS = 14
VOLUME_THRESHOLD = 500

# Buying with less than this left in the current period covers the next
# period too, so a school paying in the last weeks of term isn't charged
# full price for a few days.
TERM_ROLLOVER_DAYS = 30
YEAR_ROLLOVER_DAYS = 60

# Minor units (pesewas). Only Ghana has a decided price; other countries
# get the trial and free plan but can't buy until one is set.
PRICES = {
    "GH": {
        "currency": "GHS",
        "term": 3000,
        "year": 8000,
        "term_volume": 2500,
        "year_volume": 7000,
    },
}

PAID_KINDS = ("term", "year")
TERM_START_MONTHS = (1, 5, 9)
TUTOR_LIMIT_FREE = "20/hour"
TUTOR_LIMIT_LICENSED = "60/hour"


def utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


# --- Academic periods -------------------------------------------------------

def term_bounds(moment: datetime) -> tuple:
    """(start, end) of the term containing `moment`."""
    start_month = max(m for m in TERM_START_MONTHS if m <= moment.month)
    start = datetime(moment.year, start_month, 1)
    if start_month == 9:
        end = datetime(moment.year + 1, 1, 1)
    else:
        end = datetime(moment.year, start_month + 4, 1)
    return start, end


def year_bounds(moment: datetime) -> tuple:
    """(start, end) of the Sep-Aug academic year containing `moment`."""
    start_year = moment.year if moment.month >= 9 else moment.year - 1
    return datetime(start_year, 9, 1), datetime(start_year + 1, 9, 1)


def period_end(kind: str, starts_at: datetime) -> datetime:
    """End of a `kind` ("term"/"year"/"trial") licence starting at
    `starts_at`. A start near the end of a period rolls over to also cover
    the next one."""
    if kind == "year":
        _, end = year_bounds(starts_at)
        if end - starts_at < timedelta(days=YEAR_ROLLOVER_DAYS):
            _, end = year_bounds(end)
        return end
    _, end = term_bounds(starts_at)
    if end - starts_at < timedelta(days=TERM_ROLLOVER_DAYS):
        _, end = term_bounds(end)
    return end


def last_day(ends_at: datetime) -> str:
    """The inclusive last day of an end-exclusive period, as YYYY-MM-DD."""
    return (ends_at - timedelta(seconds=1)).date().isoformat()


# --- Current plan -----------------------------------------------------------

def student_count(db: Session, school_id: int) -> int:
    return db.query(User).filter(User.school_id == school_id, User.is_school_admin.is_(False)).count()


def _rows(db: Session, school_id: int) -> list:
    return db.query(SchoolLicence).filter(SchoolLicence.school_id == school_id).all()


def licence_status(db: Session, school: School, now: Optional[datetime] = None) -> dict:
    """The school's plan right now:
    - "trial": first-term free trial, full features, no seat cap
    - "paid": a paid term/year is running
    - "grace": the last paid period ended under GRACE_DAYS ago
    - "free": none of the above
    premium is True for every plan except "free"."""
    now = now or utcnow()
    rows = _rows(db, school.id)
    students = student_count(db, school.id)

    active = [r for r in rows if r.starts_at <= now < r.ends_at]
    active_paid = [r for r in active if r.kind in PAID_KINDS]
    paid = [r for r in rows if r.kind in PAID_KINDS]
    # Paid periods already bought for after the current one (renewals).
    upcoming = sorted((r for r in paid if r.starts_at > now), key=lambda r: r.starts_at)

    def seats_during(moment: datetime) -> int:
        return sum(r.seats or 0 for r in rows if r.kind != "trial" and r.starts_at <= moment < r.ends_at)

    if active_paid:
        ends_at = max(r.ends_at for r in active_paid)
        plan, seats = "paid", seats_during(now)
    elif any(r.kind == "trial" for r in active):
        ends_at = max(r.ends_at for r in active if r.kind == "trial")
        plan, seats = "trial", None
    else:
        ended = [r for r in paid if r.ends_at <= now]
        latest = max(ended, key=lambda r: r.ends_at) if ended else None
        if latest and now < latest.ends_at + timedelta(days=GRACE_DAYS):
            ends_at = latest.ends_at
            plan, seats = "grace", seats_during(latest.ends_at - timedelta(seconds=1))
        else:
            ends_at = None
            plan, seats = "free", FREE_STUDENT_LIMIT

    paid_through = max((r.ends_at for r in paid), default=None)
    return {
        "plan": plan,
        "premium": plan != "free",
        "students": students,
        "seat_limit": seats,
        "seats_available": None if seats is None else max(seats - students, 0),
        "valid_until": last_day(ends_at) if ends_at else None,
        "grace_until": last_day(ends_at + timedelta(days=GRACE_DAYS)) if plan == "grace" else None,
        "paid_through": last_day(paid_through) if paid_through and paid_through > now else None,
        "renewal_queued": bool(upcoming) and plan == "paid",
        "can_buy": school.country in PRICES,
    }


def is_premium(db: Session, school_id: Optional[int]) -> bool:
    if not school_id:
        return False
    school = db.query(School).filter(School.id == school_id).first()
    return bool(school) and licence_status(db, school)["premium"]


def join_block_reason(db: Session, school: School) -> Optional[str]:
    """Why a new student can't join this school right now, or None."""
    status = licence_status(db, school)
    limit = status["seat_limit"]
    if limit is None or status["students"] < limit:
        return None
    if status["plan"] == "free":
        return (
            f"{school.name} has reached the free plan's limit of {FREE_STUDENT_LIMIT} students. "
            "Ask your school admin to activate the school licence. You can keep learning on your own meanwhile."
        )
    return (
        f"All {limit} licensed seats at {school.name} are in use. "
        "Ask your school admin to add seats. You can keep learning on your own meanwhile."
    )


def grant_trial(db: Session, school: School, now: Optional[datetime] = None) -> SchoolLicence:
    now = now or utcnow()
    trial = SchoolLicence(school_id=school.id, kind="trial", starts_at=now, ends_at=period_end("trial", now))
    db.add(trial)
    return trial


# --- Pricing ----------------------------------------------------------------

class PricingError(ValueError):
    pass


def _price_table(school: School) -> dict:
    table = PRICES.get(school.country)
    if not table:
        raise PricingError(f"No institutional licence price is set for country '{school.country}' yet.")
    return table


def _next_paid_start(db: Session, school: School, now: datetime) -> datetime:
    """A purchase starts when the school's current paid time or free trial
    runs out, not today - paying during the free first term buys the next
    term rather than overlapping the free one."""
    paid_ends = [r.ends_at for r in _rows(db, school.id) if r.kind != "top_up" and r.ends_at > now]
    return max(paid_ends) if paid_ends else now


def quote_period(db: Session, school: School, kind: str, now: Optional[datetime] = None) -> dict:
    if kind not in PAID_KINDS:
        raise PricingError(f"Unknown licence period '{kind}'")
    now = now or utcnow()
    table = _price_table(school)
    students = student_count(db, school.id)
    billed = max(students, MIN_BILLED_STUDENTS)
    rate = table[f"{kind}_volume"] if billed >= VOLUME_THRESHOLD else table[kind]
    starts_at = _next_paid_start(db, school, now)
    ends_at = period_end(kind, starts_at)
    return {
        "kind": kind,
        "currency": table["currency"],
        "students": students,
        "billed_students": billed,
        "price_per_student_minor": rate,
        "amount_minor_units": billed * rate,
        "seats": math.ceil(billed * (1 + SEAT_BUFFER)),
        "starts_at": starts_at,
        "ends_at": ends_at,
        "starts_on": starts_at.date().isoformat(),
        "valid_until": last_day(ends_at),
    }


def quote_top_up(db: Session, school: School, extra_seats: int, now: Optional[datetime] = None) -> dict:
    """Extra seats for the paid period running now, charged only for the
    part of it that's left."""
    if extra_seats < 1:
        raise PricingError("Add at least one seat")
    now = now or utcnow()
    current = [r for r in _rows(db, school.id) if r.kind in PAID_KINDS and r.starts_at <= now < r.ends_at]
    if not current:
        raise PricingError("Extra seats can only be added while a paid licence is active")
    period = max(current, key=lambda r: r.ends_at)
    table = _price_table(school)
    fraction = (period.ends_at - now) / (period.ends_at - period.starts_at)
    per_seat = math.ceil(period.price_per_seat_minor * fraction)
    return {
        "kind": "top_up",
        "currency": table["currency"],
        "extra_seats": extra_seats,
        "price_per_student_minor": per_seat,
        "amount_minor_units": per_seat * extra_seats,
        "seats": extra_seats,
        "starts_at": now,
        "ends_at": period.ends_at,
        "starts_on": now.date().isoformat(),
        "valid_until": last_day(period.ends_at),
    }


def public_quote(quote: dict) -> dict:
    return {k: v for k, v in quote.items() if k not in ("starts_at", "ends_at")}


# --- Activation -------------------------------------------------------------

def activate_from_transaction(db: Session, transaction) -> Optional[SchoolLicence]:
    """Grant the licence a successful payment bought. Idempotent: verify and
    the webhook can both fire for the same payment. Commits."""
    existing = db.query(SchoolLicence).filter(SchoolLicence.transaction_id == transaction.id).first()
    if existing:
        return existing

    kind = transaction.licence_kind
    if kind not in (*PAID_KINDS, "top_up") or not transaction.school_id:
        return None

    now = utcnow()
    if kind == "top_up":
        # Seats land on whichever paid period is running when the money
        # arrives (normally the same one that was quoted).
        current = [
            r for r in _rows(db, transaction.school_id)
            if r.kind in PAID_KINDS and r.starts_at <= now < r.ends_at
        ]
        if not current:
            return None
        starts_at, ends_at = now, max(r.ends_at for r in current)
    else:
        school = db.query(School).filter(School.id == transaction.school_id).first()
        starts_at = _next_paid_start(db, school, now)
        ends_at = period_end(kind, starts_at)

    licence = SchoolLicence(
        school_id=transaction.school_id,
        kind=kind,
        seats=transaction.licence_seats,
        price_per_seat_minor=transaction.price_per_seat_minor,
        currency=transaction.currency,
        starts_at=starts_at,
        ends_at=ends_at,
        transaction_id=transaction.id,
    )
    db.add(licence)
    db.commit()
    db.refresh(licence)
    return licence
