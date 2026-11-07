from pathlib import Path

from core.database import Base

BACKEND = Path(__file__).resolve().parents[1]


def test_no_student_facing_data_mentions_certification():
    mentions = [
        str(path.relative_to(BACKEND))
        for path in (BACKEND / "data").rglob("*.json")
        if "certif" in path.read_text(encoding="utf-8").lower()
    ]
    assert mentions == []


def test_the_certificates_table_is_gone():
    assert "certificates" not in Base.metadata.tables


def test_a_course_with_progress_can_still_be_deleted_by_an_admin(client, db_session):
    from models.course import Course, Lesson
    from models.user import User
    from tests.conftest import register_user

    data = register_user(client, email="root@test.com", level="shs")
    db_session.query(User).filter(User.email == "root@test.com").update({User.is_admin: True})
    course = Course(slug="old-course", title="Old", level="shs", country="GH")
    db_session.add(course)
    db_session.flush()
    db_session.add(Lesson(course_id=course.id, slug="old-1", title="One", lesson_type="text", content="Hi"))
    db_session.commit()
    headers = {"Authorization": f"Bearer {data['token']}"}
    client.post("/api/learn/courses/old-course/enroll", headers=headers)
    client.post("/api/learn/lessons/old-1/progress", json={"watched": True}, headers=headers)

    assert client.delete(f"/api/admin/courses/{course.id}", headers=headers).status_code == 200
