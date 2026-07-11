"""
Knowledge Graph Router
"""

from fastapi import APIRouter
from services.knowledge.graph import knowledge_graph

router = APIRouter()


@router.get("/subject/{subject}")
async def get_subject_skills(subject: str):
    """Get skills for a subject"""
    skills = knowledge_graph.get_subject_skills(subject)
    prerequisites = knowledge_graph.get_subject_prerequisites(subject)
    return {
        "subject": subject,
        "skills": skills,
        "prerequisites": prerequisites
    }


@router.get("/career/{career}")
async def get_career_subjects(career: str):
    """Get required subjects for a career"""
    subjects = knowledge_graph.get_career_subjects(career)
    return {
        "career": career,
        "required_subjects": subjects
    }


@router.get("/path")
async def find_path(start: str, end: str):
    """Find a path between two nodes"""
    path = knowledge_graph.find_path(start, end)
    return {
        "start": start,
        "end": end,
        "path": path
    }


@router.get("/related/{skill}")
async def get_related_skills(skill: str):
    """Get skills related to a skill"""
    related = knowledge_graph.get_related_skills(skill)
    return {
        "skill": skill,
        "related_skills": related
    }

print("✅ Knowledge Graph router loaded")
