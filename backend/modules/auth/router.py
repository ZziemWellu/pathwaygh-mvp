"""
Authentication Module Router
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import uuid
import datetime

router = APIRouter(tags=["auth"])

class RegisterRequest(BaseModel):
    email: str
    full_name: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

users = {}

@router.get("/")
async def auth_root():
    return {"module": "auth", "status": "active"}

@router.post("/register")
async def register(request: RegisterRequest):
    if request.email in users:
        raise HTTPException(status_code=400, detail="Email already registered")
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    users[request.email] = {
        "id": user_id,
        "email": request.email,
        "full_name": request.full_name,
        "password": request.password,
        "created_at": datetime.datetime.now().isoformat()
    }
    return {"success": True, "user_id": user_id, "email": request.email}

@router.post("/login")
async def login(request: LoginRequest):
    if request.email not in users:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    user = users[request.email]
    if user["password"] != request.password:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return {
        "success": True,
        "token": f"token_{uuid.uuid4().hex[:32]}",
        "user": {"id": user["id"], "email": user["email"], "full_name": user["full_name"]}
    }
