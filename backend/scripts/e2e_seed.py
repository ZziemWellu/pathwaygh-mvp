"""Creates the schema and demo courses for the end-to-end test. Refuses anything
but a SQLite database, so it can never touch a real one.

    DATABASE_URL=sqlite:///./e2e.db python scripts/e2e_seed.py
"""

import json
import os
import sys
from pathlib import Path

if not os.environ.get("DATABASE_URL", "").startswith("sqlite:"):
    sys.exit("Refusing to run: DATABASE_URL must be a sqlite: URL")

BACKEND = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND))
os.chdir(BACKEND)

from main import app  # noqa: E402,F401  (registers every model)
from core.database import Base, SessionLocal, engine  # noqa: E402
from models.course import Course, Lesson  # noqa: E402

Base.metadata.create_all(engine)
db = SessionLocal()
for path in sorted((BACKEND / "data/courses/primary").glob("*.json")):
    data = json.loads(path.read_text(encoding="utf-8"))
    course = Course(slug=data["slug"], title=data["title"], description=data["description"], level=data["level"], country=data["country"])
    db.add(course)
    db.flush()
    for index, lesson in enumerate(data["lessons"]):
        db.add(Lesson(course_id=course.id, slug=lesson["id"], title=lesson["title"], lesson_type="text", order_index=index, content=lesson["content"]))
for slug, level in (("jhs-demo", "jhs"), ("shs-demo", "shs")):
    course = Course(slug=slug, title=f"{level.upper()} Core Mathematics", description="Demo", level=level, country="GH")
    db.add(course)
    db.flush()
    db.add(Lesson(course_id=course.id, slug=f"{slug}-1", title="One", lesson_type="text", order_index=0, content="Hello"))
db.commit()
print("seeded")
