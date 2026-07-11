"""
Knowledge Graph Module Router
"""

from fastapi import APIRouter

router = APIRouter(tags=["knowledge_graph"])

@router.get("/")
async def kg_root():
    return {"module": "knowledge_graph", "status": "active"}

@router.get("/subject/{subject}")
async def get_subject_kg(subject: str):
    return {
        "success": True,
        "subject": subject,
        "knowledge_graph": {
            "nodes": [
                {"id": "1", "label": subject, "type": "subject"}
            ]
        }
    }
