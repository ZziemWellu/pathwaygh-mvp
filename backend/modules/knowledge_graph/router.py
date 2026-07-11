from fastapi import APIRouter

router = APIRouter(prefix="/api/knowledge-graph", tags=["Knowledge Graph"])

@router.get("/")
async def get_knowledge_graph_info():
    return {"module": "Knowledge Graph", "status": "active"}

print("✅ Knowledge Graph module loaded")
