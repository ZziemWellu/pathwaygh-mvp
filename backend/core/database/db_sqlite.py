"""
SQLite Database Configuration
"""

import sqlite3
import json
from pathlib import Path
from typing import List, Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)

class SQLiteDB:
    def __init__(self):
        self.db_path = Path("database/sqlite/pathway_ai.db")
        self.conn = None
    
    def connect(self):
        if not self.conn:
            self.conn = sqlite3.connect(str(self.db_path))
            self.conn.row_factory = sqlite3.Row
        return self.conn
    
    def close(self):
        if self.conn:
            self.conn.close()
            self.conn = None
    
    def execute(self, query: str, params: tuple = ()) -> List[Dict]:
        conn = self.connect()
        cursor = conn.cursor()
        cursor.execute(query, params)
        
        if query.strip().upper().startswith(('SELECT', 'PRAGMA')):
            rows = cursor.fetchall()
            return [dict(row) for row in rows]
        
        conn.commit()
        return []
    
    def execute_one(self, query: str, params: tuple = ()) -> Optional[Dict]:
        results = self.execute(query, params)
        return results[0] if results else None
    
    def get_user_by_email(self, email: str) -> Optional[Dict]:
        return self.execute_one("SELECT * FROM users WHERE email = ?", (email,))
    
    def create_user(self, user_id: str, email: str, full_name: str, password_hash: str) -> bool:
        try:
            self.execute(
                "INSERT INTO users (id, email, full_name, password_hash) VALUES (?, ?, ?, ?)",
                (user_id, email, full_name, password_hash)
            )
            return True
        except Exception as e:
            logger.error(f"Failed to create user: {e}")
            return False
    
    def log_activity(self, activity_id: str, user_id: str, activity_type: str, data: Dict) -> bool:
        try:
            self.execute(
                "INSERT INTO activity_log (id, user_id, activity_type, activity_data) VALUES (?, ?, ?, ?)",
                (activity_id, user_id, activity_type, json.dumps(data))
            )
            return True
        except Exception as e:
            logger.error(f"Failed to log activity: {e}")
            return False
    
    def get_activities(self, user_id: str, limit: int = 10) -> List[Dict]:
        return self.execute(
            "SELECT * FROM activity_log WHERE user_id = ? ORDER BY created_at DESC LIMIT ?",
            (user_id, limit)
        )

db = SQLiteDB()
