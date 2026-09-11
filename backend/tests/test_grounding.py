from models.course import Course, Lesson
from modules.tutor.grounding import build_grounding_context


def test_subject_grounding_returns_real_content(db_session):
    context = build_grounding_context(db_session, "mathematics", None, "What is 2 + 2?")
    assert context is not None
    assert "Mathematics" in context
    # The real explanation text from data/practice/questions.json, not a
    # fabricated or generic string.
    assert "2 + 2 equals 4" in context


def test_no_subject_or_lesson_returns_none(db_session):
    assert build_grounding_context(db_session, None, None, "hello") is None


def test_unknown_subject_returns_none(db_session):
    assert build_grounding_context(db_session, "not-a-real-subject", None, "hello") is None


def test_lesson_grounding_is_none_today_with_no_content(db_session):
    course = Course(slug="grounding-course", title="Grounding Course", level="jhs")
    db_session.add(course)
    db_session.flush()
    lesson = Lesson(course_id=course.id, slug="grounding-lesson", title="Grounding Lesson", lesson_type="video", order_index=0)
    db_session.add(lesson)
    db_session.commit()

    context = build_grounding_context(db_session, None, "grounding-lesson", "tell me about this lesson")
    assert context is None


def test_lesson_grounding_activates_once_content_exists(db_session):
    course = Course(slug="grounding-course-2", title="Grounding Course 2", level="jhs")
    db_session.add(course)
    db_session.flush()
    lesson = Lesson(
        course_id=course.id,
        slug="grounding-lesson-2",
        title="Photosynthesis",
        lesson_type="text",
        order_index=0,
        content="Photosynthesis is the process by which plants convert light energy into chemical energy.",
    )
    db_session.add(lesson)
    db_session.commit()

    context = build_grounding_context(db_session, None, "grounding-lesson-2", "how does photosynthesis work?")
    assert context is not None
    assert "Photosynthesis" in context
    assert "chemical energy" in context


def test_lesson_grounding_takes_priority_over_subject_grounding(db_session):
    course = Course(slug="grounding-course-3", title="Grounding Course 3", level="jhs")
    db_session.add(course)
    db_session.flush()
    lesson = Lesson(
        course_id=course.id,
        slug="grounding-lesson-3",
        title="Real Lesson",
        lesson_type="text",
        order_index=0,
        content="This is the real lesson body.",
    )
    db_session.add(lesson)
    db_session.commit()

    context = build_grounding_context(db_session, "mathematics", "grounding-lesson-3", "anything")
    assert "real lesson body" in context
    assert "Curriculum material for subject" not in context
