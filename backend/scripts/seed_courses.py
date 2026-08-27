"""
One-time import of the existing course JSON files (backend/data/courses/**/*.json)
into the Course/Lesson tables. Safe to re-run: skips courses that already exist
(matched by slug).

Video URLs are NOT in the source JSON files (they never had any). Fill in real
YouTube/Vimeo links below in VIDEO_URLS (keyed by lesson id) before running,
or edit them directly in the database/admin later - lessons without a URL
just won't have a playable video yet.

Usage (from backend/):
    venv/Scripts/python.exe scripts/seed_courses.py
"""

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from dotenv import load_dotenv  # noqa: E402

load_dotenv()

from core.database import SessionLocal  # noqa: E402
from core.video import parse_video_url  # noqa: E402
from models.course import Course, Lesson  # noqa: E402

PROJECT_ROOT = Path(__file__).parent.parent
COURSES_DIR = PROJECT_ROOT / "data" / "courses"

# Fill in real video URLs per lesson id as they become available.
VIDEO_URLS = {}


def import_course(db, course_json: dict, level_dir_name: str):
    slug = course_json.get("slug") or course_json.get("id")
    if db.query(Course).filter(Course.slug == slug).first():
        print(f"  skip (already imported): {slug}")
        return

    course = Course(
        slug=slug,
        title=course_json["title"],
        description=course_json.get("description"),
        level=course_json.get("level", level_dir_name),
    )
    db.add(course)
    db.flush()

    order_index = 0
    for module in course_json.get("modules", []):
        for lesson_json in module.get("lessons", []):
            video_url = VIDEO_URLS.get(lesson_json["id"])
            provider = parse_video_url(video_url)[0] if video_url else None
            db.add(
                Lesson(
                    course_id=course.id,
                    slug=lesson_json["id"],
                    title=lesson_json["title"],
                    description=lesson_json.get("description"),
                    lesson_type=lesson_json.get("lesson_type", "video"),
                    order_index=order_index,
                    is_free_preview=lesson_json.get("is_free_preview", False),
                    duration_minutes=lesson_json.get("duration_minutes"),
                    video_url=video_url,
                    video_provider=provider,
                )
            )
            order_index += 1

    # Some courses use a flat "lessons" list instead of "modules"
    for lesson_json in course_json.get("lessons", []):
        video_url = VIDEO_URLS.get(lesson_json["id"])
        provider = parse_video_url(video_url)[0] if video_url else None
        db.add(
            Lesson(
                course_id=course.id,
                slug=lesson_json["id"],
                title=lesson_json["title"],
                description=lesson_json.get("description"),
                lesson_type=lesson_json.get("lesson_type", "video"),
                order_index=order_index,
                is_free_preview=lesson_json.get("is_free_preview", False),
                duration_minutes=lesson_json.get("duration_minutes"),
                video_url=video_url,
                video_provider=provider,
            )
        )
        order_index += 1

    db.commit()
    print(f"  imported: {slug} ({order_index} lessons)")


def main():
    db = SessionLocal()
    try:
        for level_dir in sorted(COURSES_DIR.iterdir()):
            if not level_dir.is_dir():
                continue
            for course_file in sorted(level_dir.glob("*.json")):
                with open(course_file, "r", encoding="utf-8") as f:
                    course_json = json.load(f)
                import_course(db, course_json, level_dir.name)
    finally:
        db.close()


if __name__ == "__main__":
    main()
