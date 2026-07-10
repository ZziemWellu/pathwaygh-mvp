"""
Authentication Module - Persistent Storage
Uses JSON file for user data persistence
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime
import hashlib
import secrets
import json
import os

router = APIRouter()

# File paths
DATA_DIR = "data"
USERS_FILE = os.path.join(DATA_DIR, "auth_users.json")
SESSIONS_FILE = os.path.join(DATA_DIR, "auth_sessions.json")

# Ensure data directory exists
os.makedirs(DATA_DIR, exist_ok=True)


class RegisterRequest(BaseModel):
    email: str
    full_name: str
    password: str
    role: str = "student"


class LoginRequest(BaseModel):
    email: str
    password: str


def load_users():
    """Load users from JSON file"""
    if os.path.exists(USERS_FILE):
        try:
            with open(USERS_FILE, 'r') as f:
                return json.load(f)
        except:
            return {}
    return {}


def save_users(users):
    """Save users to JSON file"""
    with open(USERS_FILE, 'w') as f:
        json.dump(users, f, indent=2)


def load_sessions():
    """Load sessions from JSON file"""
    if os.path.exists(SESSIONS_FILE):
        try:
            with open(SESSIONS_FILE, 'r') as f:
                return json.load(f)
        except:
            return {}
    return {}


def save_sessions(sessions):
    """Save sessions to JSON file"""
    with open(SESSIONS_FILE, 'w') as f:
        json.dump(sessions, f, indent=2)


def hash_password(password: str) -> str:
    """Hash password with salt"""
    salt = secrets.token_hex(16)
    hash_obj = hashlib.sha256(f"{salt}{password}".encode())
    return f"{salt}:{hash_obj.hexdigest()}"


def verify_password(password: str, hashed: str) -> bool:
    """Verify password against hash"""
    try:
        salt, hash_value = hashed.split(":")
        test_hash = hashlib.sha256(f"{salt}{password}".encode()).hexdigest()
        return test_hash == hash_value
    except:
        return False


@router.post("/register")
async def register(request: RegisterRequest):
    """Register a new user"""
    users = load_users()
    
    # Check if email exists
    for user in users.values():
        if user.get("email") == request.email:
            return {
                "success": False,
                "message": "Email already registered",
                "error": "Email exists"
            }

    # Create user
    user_id = f"user_{int(datetime.now().timestamp())}"
    users[user_id] = {
        "id": user_id,
        "email": request.email,
        "full_name": request.full_name,
        "password_hash": hash_password(request.password),
        "role": request.role,
        "created_at": datetime.now().isoformat()
    }

    save_users(users)

    return {
        "success": True,
        "message": "User registered successfully",
        "user_id": user_id
    }


@router.post("/login")
async def login(request: LoginRequest):
    """Login user"""
    users = load_users()
    
    # Find user by email
    user = None
    user_id = None
    for uid, u in users.items():
        if u.get("email") == request.email:
            user = u
            user_id = uid
            break

    if not user:
        return {
            "success": False,
            "message": "User not found",
            "error": "User not found"
        }

    if not verify_password(request.password, user.get("password_hash", "")):
        return {
            "success": False,
            "message": "Invalid credentials",
            "error": "Invalid password"
        }

    # Create session token
    token = secrets.token_hex(32)
    sessions = load_sessions()
    sessions[token] = {
        "user_id": user_id,
        "email": user["email"],
        "created_at": datetime.now().isoformat()
    }
    save_sessions(sessions)

    return {
        "success": True,
        "token": token,
        "user": {
            "id": user_id,
            "email": user["email"],
            "full_name": user["full_name"],
            "role": user.get("role", "student")
        }
    }


@router.get("/me")
async def get_current_user(token: str):
    """Get current user from token"""
    sessions = load_sessions()
    
    if token not in sessions:
        return {
            "success": False,
            "message": "Invalid or expired token"
        }

    session = sessions[token]
    users = load_users()
    user = users.get(session["user_id"])
    
    if not user:
        return {
            "success": False,
            "message": "User not found"
        }

    return {
        "success": True,
        "user": {
            "id": user["id"],
            "email": user["email"],
            "full_name": user["full_name"],
            "role": user.get("role", "student")
        }
    }


@router.post("/logout")
async def logout(token: str):
    """Logout user"""
    sessions = load_sessions()
    if token in sessions:
        del sessions[token]
        save_sessions(sessions)
        return {"success": True, "message": "Logged out successfully"}
    return {"success": False, "message": "Invalid session"}

print("✅ Auth module loaded with persistent storage")
