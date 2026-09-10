"""
Platform-wide impact / M&E dashboard for platform admins (is_admin) - not to
be confused with modules/school/router.py, which is scoped to one school
admin's own roster. This module answers "what impact has the platform had
across all schools and countries", the aggregate view a grant funder's
report needs.

The overview, trends, and CSV export endpoints all share _compute_overview/
_compute_trends so the exported report can never drift from what the UI
shows - they are the same computation, just serialized differently.
"""

import csv
import io
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from core.database import get_db
from core.security import require_admin
from models.enrollment import Enrollment
from models.progress import LessonProgress
from models.quiz_attempt import QuizAttempt
from models.school import School
from models.user import User
from modules.dashboard.aggregation import overview_for_users, summarize_overviews

router = APIRouter(tags=["impact"])

UNSCHOOLED_LABEL = "No school (individual learners)"


def _csv_safe(value):
    """Neutralizes CSV/formula injection: Excel/Sheets treats a leading
    =, +, -, or @ as the start of a formula, and School.name is arbitrary
    user-supplied text (any authenticated user can self-service-create a
    school with any name via POST /api/school/create)."""
    text = "" if value is None else str(value)
    if text and text[0] in ("=", "+", "-", "@"):
        return "'" + text
    return text


def _compute_overview(db: Session) -> dict:
    students = db.query(User).filter(User.is_admin.is_(False)).all()
    schools = {s.id: s for s in db.query(School).all()}
    overview_by_user = overview_for_users(db, [s.id for s in students])

    by_school_students: dict = {}
    by_country_students: dict = {}
    for student in students:
        by_school_students.setdefault(student.school_id, []).append(student)
        by_country_students.setdefault(student.country, []).append(student)

    by_school_rows = []
    for school_id, group in by_school_students.items():
        summary = summarize_overviews([overview_by_user[s.id] for s in group])
        school = schools.get(school_id)
        by_school_rows.append(
            {
                "school_id": school_id,
                "school_name": school.name if school else UNSCHOOLED_LABEL,
                "country": school.country if school else None,
                "student_count": summary["student_count"],
                "average_completion_rate": summary["average_completion_rate"],
                "average_quiz_score": summary["average_quiz_score"],
                "quizzes_taken": summary["quizzes_taken"],
                "average_quiz_time_seconds": summary["average_quiz_time_seconds"],
            }
        )
    by_school_rows.sort(key=lambda row: row["student_count"], reverse=True)

    by_country_rows = []
    for country, group in by_country_students.items():
        summary = summarize_overviews([overview_by_user[s.id] for s in group])
        school_ids = {s.school_id for s in group if s.school_id is not None}
        by_country_rows.append(
            {
                "country": country,
                "student_count": summary["student_count"],
                "school_count": len(school_ids),
                "average_completion_rate": summary["average_completion_rate"],
                "average_quiz_score": summary["average_quiz_score"],
                "quizzes_taken": summary["quizzes_taken"],
            }
        )
    by_country_rows.sort(key=lambda row: row["student_count"], reverse=True)

    totals_summary = summarize_overviews(list(overview_by_user.values()))
    total_enrollments = sum(o["courses_enrolled"] for o in overview_by_user.values())
    countries_reached = {c for c in by_country_students.keys() if c}

    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "totals": {
            "student_count": totals_summary["student_count"],
            "school_count": len(schools),
            "country_count": len(countries_reached),
            "total_enrollments": total_enrollments,
            "average_completion_rate": totals_summary["average_completion_rate"],
            "average_quiz_score": totals_summary["average_quiz_score"],
            "quizzes_taken": totals_summary["quizzes_taken"],
            "average_quiz_time_seconds": totals_summary["average_quiz_time_seconds"],
        },
        "by_school": by_school_rows,
        "by_country": by_country_rows,
    }


def _month_key(dt: datetime) -> str:
    return f"{dt.year:04d}-{dt.month:02d}"


def _last_n_month_keys(n: int) -> list:
    """Oldest-first list of the last n calendar months' "YYYY-MM" keys,
    ending with the current month."""
    now = datetime.now(timezone.utc)
    year, month = now.year, now.month
    keys = []
    for _ in range(n):
        keys.append(f"{year:04d}-{month:02d}")
        month -= 1
        if month == 0:
            month, year = 12, year - 1
    keys.reverse()
    return keys


def _compute_trends(db: Session, months: int) -> dict:
    months = max(1, min(months, 24))
    period_keys = _last_n_month_keys(months)
    since_year, since_month = (int(part) for part in period_keys[0].split("-"))
    since = datetime(since_year, since_month, 1)

    # Naive-UTC comparison: enrolled_at/watched_at/completed_at are all
    # stored as naive-UTC DateTime columns, and Ghana/Nigeria sit at
    # UTC+0/UTC+1, so per-user timezone conversion isn't meaningful here -
    # bucketing on the stored value as-is is an explicit simplification.
    enrollment_dates = [
        row[0] for row in db.query(Enrollment.enrolled_at).filter(Enrollment.enrolled_at >= since).all() if row[0]
    ]
    progress_dates = [
        row[0]
        for row in db.query(LessonProgress.watched_at)
        .filter(LessonProgress.watched.is_(True), LessonProgress.watched_at >= since)
        .all()
        if row[0]
    ]
    quiz_rows = [
        row for row in db.query(QuizAttempt.completed_at, QuizAttempt.score).filter(QuizAttempt.completed_at >= since).all() if row[0]
    ]

    enrollments_by_month: dict = {}
    for dt in enrollment_dates:
        key = _month_key(dt)
        enrollments_by_month[key] = enrollments_by_month.get(key, 0) + 1

    lessons_by_month: dict = {}
    for dt in progress_dates:
        key = _month_key(dt)
        lessons_by_month[key] = lessons_by_month.get(key, 0) + 1

    quiz_scores_by_month: dict = {}
    for dt, score in quiz_rows:
        quiz_scores_by_month.setdefault(_month_key(dt), []).append(score)

    series = []
    for key in period_keys:
        scores = quiz_scores_by_month.get(key, [])
        series.append(
            {
                "month": key,
                "enrollments": enrollments_by_month.get(key, 0),
                "lessons_completed": lessons_by_month.get(key, 0),
                "quizzes_taken": len(scores),
                "average_quiz_score": round(sum(scores) / len(scores)) if scores else 0,
            }
        )

    return {"months": months, "series": series}


@router.get("/overview")
async def get_impact_overview(current_user: User = Depends(require_admin), db: Session = Depends(get_db)):
    return {"success": True, **_compute_overview(db)}


@router.get("/trends")
async def get_impact_trends(
    months: int = Query(default=6, ge=1, le=24),
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    return {"success": True, **_compute_trends(db, months)}


@router.get("/export")
async def export_impact_report(
    months: int = Query(default=6, ge=1, le=24),
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    overview = _compute_overview(db)
    trends = _compute_trends(db, months)
    totals = overview["totals"]
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    buffer = io.StringIO()
    writer = csv.writer(buffer)

    writer.writerow(["PathwayGH Impact Report", f"Generated {today}"])
    writer.writerow([])

    writer.writerow(["Metric", "Value"])
    writer.writerow(["Total Students", totals["student_count"]])
    writer.writerow(["Total Schools", totals["school_count"]])
    writer.writerow(["Countries Served", totals["country_count"]])
    writer.writerow(["Total Enrollments", totals["total_enrollments"]])
    writer.writerow(["Average Completion Rate (%)", totals["average_completion_rate"]])
    writer.writerow(["Average Quiz Score (%)", totals["average_quiz_score"]])
    writer.writerow(["Total Quizzes Taken", totals["quizzes_taken"]])
    writer.writerow(["Average Time per Quiz (seconds)", totals["average_quiz_time_seconds"]])
    writer.writerow([])

    writer.writerow(["By School"])
    writer.writerow(["School", "Country", "Students", "Avg Completion (%)", "Avg Quiz Score (%)", "Quizzes Taken"])
    for row in overview["by_school"]:
        writer.writerow(
            [
                _csv_safe(row["school_name"]),
                row["country"] or "",
                row["student_count"],
                row["average_completion_rate"],
                row["average_quiz_score"],
                row["quizzes_taken"],
            ]
        )
    writer.writerow([])

    writer.writerow(["By Country"])
    writer.writerow(["Country", "Students", "Schools", "Avg Completion (%)", "Avg Quiz Score (%)", "Quizzes Taken"])
    for row in overview["by_country"]:
        writer.writerow(
            [
                row["country"] or "",
                row["student_count"],
                row["school_count"],
                row["average_completion_rate"],
                row["average_quiz_score"],
                row["quizzes_taken"],
            ]
        )
    writer.writerow([])

    writer.writerow([f"Monthly Trend (last {trends['months']} months)"])
    writer.writerow(["Month", "Enrollments", "Lessons Completed", "Quizzes Taken", "Avg Quiz Score (%)"])
    for row in trends["series"]:
        writer.writerow(
            [row["month"], row["enrollments"], row["lessons_completed"], row["quizzes_taken"], row["average_quiz_score"]]
        )

    filename = f"impact_report_{today}.csv"
    return StreamingResponse(
        iter([buffer.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
