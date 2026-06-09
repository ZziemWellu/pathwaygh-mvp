from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

router = APIRouter()


class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None


class ChatResponse(BaseModel):
    reply: str
    session_id: str


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    message_lower = request.message.lower()
    
    # Simple rule-based responses
    if "doctor" in message_lower or "medicine" in message_lower:
        reply = "To become a doctor in Ghana, you need:\n1. Choose General Science in SHS\n2. Take Biology, Chemistry, Physics, and Elective Maths\n3. Target WASSCE aggregate ≤ 12\n4. Apply to UG, KNUST, or UHAS\n5. Complete 6-year MBChB programme\n6. Pass Medical and Dental Council licensing exam"
    
    elif "engineer" in message_lower:
        reply = "To become an engineer:\n1. Choose General Science in SHS\n2. Take Physics, Chemistry, Elective Maths\n3. Target aggregate ≤ 16\n4. Apply to KNUST or UG\n5. Complete 4-year BSc Engineering\n6. Register with GhIE after graduation"
    
    elif "lawyer" in message_lower:
        reply = "To become a lawyer:\n1. Choose General Arts in SHS\n2. Take Government, Literature, History\n3. Target aggregate ≤ 12\n4. Apply to UG Law or KNUST Law\n5. Complete 4-year LLB\n6. Pass Ghana Bar Association exams\n7. Complete 1-year pupillage"
    
    elif "aggregate" in message_lower:
        reply = "WASSCE aggregate is calculated from your best 6 subjects (4 cores + best 2 electives). A1=1, B2=2, B3=3, C4=4, C5=5, C6=6. Lower is better! Medicine needs ≤12, Engineering ≤16, Law ≤12."
    
    elif "subject" in message_lower and ("need" in message_lower or "required" in message_lower):
        reply = "The subjects you need depend on your target career. For Medicine: Biology, Chemistry, Physics, Elective Maths. For Engineering: Physics, Chemistry, Elective Maths. For Law: Government, Literature, History. For Business: Economics, Accounting, Business Management."
    
    else:
        reply = "Thank you for your question! For specific career guidance, try our Career Search or take our AI Quiz. You can ask me about:\n- Becoming a Doctor/Engineer/Lawyer\n- WASSCE aggregate requirements\n- Required subjects for programmes\n- University options in Ghana"
    
    return ChatResponse(reply=reply, session_id=request.session_id or "new-session")
