from fastapi import APIRouter
import uuid
import hashlib

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

users = {}

@router.post("/register")
async def register(data: dict):
    user_id = f"user_{int(uuid.uuid4().time)}"
    users[data["email"]] = {"id": user_id, "email": data["email"], "full_name": data["full_name"]}
    return {"success": True, "message": "User registered", "user_id": user_id}

@router.post("/login")
async def login(data: dict):
    if data["email"] in users:
        return {"success": True, "token": f"token_{uuid.uuid4().hex[:32]}", "user": users[data["email"]]}
    return {"success": False, "message": "Invalid credentials"}

@router.get("/me")
async def get_user():
    return {"user": {"id": "test", "email": "test@example.com"}}
