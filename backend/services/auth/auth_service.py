"""
Authentication Service
"""

from typing import Dict, Optional
from datetime import datetime
import hashlib
import secrets
import re
from core.logging.logger import logger


class AuthService:
    def __init__(self):
        self.users = {}
        self.sessions = {}
    
    def hash_password(self, password: str) -> str:
        salt = secrets.token_hex(16)
        hash_obj = hashlib.sha256(f"{salt}{password}".encode())
        return f"{salt}:{hash_obj.hexdigest()}"
    
    def verify_password(self, password: str, hashed: str) -> bool:
        salt, hash_value = hashed.split(":")
        test_hash = hashlib.sha256(f"{salt}{password}".encode()).hexdigest()
        return test_hash == hash_value
    
    def register_user(self, email: str, full_name: str, password: str) -> Dict:
        if email in self.users:
            return {"success": False, "message": "Email already registered"}
        
        if len(password) < 6:
            return {"success": False, "message": "Password must be at least 6 characters"}
        
        user_id = f"user_{int(datetime.now().timestamp())}"
        self.users[email] = {
            "id": user_id,
            "email": email,
            "full_name": full_name,
            "password_hash": self.hash_password(password),
            "role": "student",
            "is_active": True,
            "created_at": datetime.now().isoformat(),
            "profile": {}
        }
        
        return {"success": True, "message": "User registered", "user_id": user_id}
    
    def login(self, email: str, password: str) -> Dict:
        if email not in self.users:
            return {"success": False, "message": "User not found"}
        
        user = self.users[email]
        if not self.verify_password(password, user["password_hash"]):
            return {"success": False, "message": "Invalid password"}
        
        token = secrets.token_hex(32)
        self.sessions[token] = {"user_id": user["id"], "email": email}
        
        return {
            "success": True,
            "token": token,
            "user": {
                "id": user["id"],
                "email": user["email"],
                "full_name": user["full_name"],
                "role": user["role"]
            }
        }
    
    def validate_token(self, token: str) -> Optional[Dict]:
        if token in self.sessions:
            return self.sessions[token]
        return None
    
    def get_user(self, user_id: str) -> Optional[Dict]:
        for email, user in self.users.items():
            if user["id"] == user_id:
                return user
        return None

auth_service = AuthService()
