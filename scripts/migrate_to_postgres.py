#!/usr/bin/env python3
"""
PostgreSQL Migration Script
Migrates data from SQLite/JSON to PostgreSQL
"""

import json
import sqlite3
import psycopg2
from psycopg2.extras import Json
import os
from datetime import datetime

# Database configuration
DB_CONFIG = {
    'host': 'localhost',
    'port': 5432,
    'database': 'pathway_ai',
    'user': 'pathway_user',
    'password': 'your_password'
}

def create_tables(conn):
    """Create PostgreSQL tables"""
    with conn.cursor() as cur:
        # Users table
        cur.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id VARCHAR(50) PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                full_name VARCHAR(255) NOT NULL,
                role VARCHAR(50) DEFAULT 'student',
                password_hash VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Profiles table
        cur.execute('''
            CREATE TABLE IF NOT EXISTS profiles (
                id SERIAL PRIMARY KEY,
                user_id VARCHAR(50) REFERENCES users(id),
                academic JSONB DEFAULT '{}',
                career JSONB DEFAULT '{}',
                geographic JSONB DEFAULT '{}',
                financial JSONB DEFAULT '{}',
                learning JSONB DEFAULT '{}',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Courses table
        cur.execute('''
            CREATE TABLE IF NOT EXISTS courses (
                id VARCHAR(50) PRIMARY KEY,
                slug VARCHAR(100) UNIQUE,
                title VARCHAR(255) NOT NULL,
                level VARCHAR(50),
                subject VARCHAR(100),
                description TEXT,
                difficulty VARCHAR(50),
                duration_hours INTEGER DEFAULT 0,
                is_published BOOLEAN DEFAULT FALSE,
                metadata JSONB DEFAULT '{}',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Lessons table
        cur.execute('''
            CREATE TABLE IF NOT EXISTS lessons (
                id VARCHAR(50) PRIMARY KEY,
                course_id VARCHAR(50) REFERENCES courses(id),
                title VARCHAR(255) NOT NULL,
                description TEXT,
                lesson_type VARCHAR(50),
                video_url TEXT,
                content TEXT,
                order_index INTEGER,
                duration_minutes INTEGER,
                metadata JSONB DEFAULT '{}',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Progress table
        cur.execute('''
            CREATE TABLE IF NOT EXISTS progress (
                id SERIAL PRIMARY KEY,
                user_id VARCHAR(50) REFERENCES users(id),
                course_id VARCHAR(50) REFERENCES courses(id),
                lesson_id VARCHAR(50) REFERENCES lessons(id),
                status VARCHAR(50) DEFAULT 'not_started',
                progress INTEGER DEFAULT 0,
                completed_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        conn.commit()
        print("✅ Tables created successfully")

def migrate_users(conn, sqlite_conn):
    """Migrate users from SQLite"""
    cursor = sqlite_conn.cursor()
    cursor.execute("SELECT * FROM users")
    users = cursor.fetchall()
    
    with conn.cursor() as cur:
        for user in users:
            cur.execute('''
                INSERT INTO users (id, email, full_name, role)
                VALUES (%s, %s, %s, %s)
                ON CONFLICT (id) DO NOTHING
            ''', (user[0], user[1], user[2], user[3]))
        conn.commit()
        print(f"✅ Migrated {len(users)} users")

def migrate_courses(conn):
    """Migrate courses from JSON files"""
    course_dir = "../backend/data/courses"
    courses = []
    
    for root, dirs, files in os.walk(course_dir):
        for file in files:
            if file.endswith('.json'):
                with open(os.path.join(root, file), 'r') as f:
                    course = json.load(f)
                    courses.append(course)
    
    with conn.cursor() as cur:
        for course in courses:
            cur.execute('''
                INSERT INTO courses (id, slug, title, level, subject, description, difficulty, duration_hours, is_published, metadata)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (id) DO NOTHING
            ''', (
                course.get('id'),
                course.get('slug'),
                course.get('title'),
                course.get('level'),
                course.get('subject'),
                course.get('description'),
                course.get('difficulty'),
                course.get('duration_hours', 0),
                course.get('is_published', False),
                Json(course)
            ))
        conn.commit()
        print(f"✅ Migrated {len(courses)} courses")

def main():
    """Main migration function"""
    print("🔄 Starting PostgreSQL migration...")
    
    # Connect to PostgreSQL
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        print("✅ Connected to PostgreSQL")
    except Exception as e:
        print(f"❌ PostgreSQL connection failed: {e}")
        print("   Please ensure PostgreSQL is running and credentials are correct")
        return
    
    # Create tables
    create_tables(conn)
    
    # Migrate data
    try:
        # Migrate from SQLite if exists
        if os.path.exists('pathwaygh.db'):
            sqlite_conn = sqlite3.connect('pathwaygh.db')
            migrate_users(conn, sqlite_conn)
            sqlite_conn.close()
        
        # Migrate courses
        migrate_courses(conn)
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        conn.rollback()
    else:
        conn.commit()
        print("✅ Migration completed successfully!")
    
    conn.close()

if __name__ == "__main__":
    main()
