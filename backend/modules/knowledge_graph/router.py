"""
Knowledge Graph Module Router - not yet built. Returns an honest 501
rather than fabricated sample data; nothing in the frontend calls this
today.
"""

from fastapi import APIRouter, HTTPException

router = APIRouter(tags=["knowledge_graph"])

@router.get("/")
async def kg_root():
    return {"module": "knowledge_graph", "status": "not_implemented"}

@router.get("/subject/{subject}")
async def get_subject_kg(subject: str):
    raise HTTPException(status_code=501, detail="Knowledge graph is not yet available.")
