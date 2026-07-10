"""
Initial Database Migration
Run: python database/migrations/001_initial_migration.py
"""

import os
import sys
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

# Database configuration
DB_NAME = os.getenv("DB_NAME", "pathway_ai")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "postgres")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")


def create_database():
    """Create database if it doesn't exist"""
    try:
        conn = psycopg2.connect(
            dbname="postgres",
            user=DB_USER,
            password=DB_PASSWORD,
            host=DB_HOST,
            port=DB_PORT
        )
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cur = conn.cursor()
        
        # Check if database exists
        cur.execute(f"SELECT 1 FROM pg_database WHERE datname = '{DB_NAME}'")
        exists = cur.fetchone()
        
        if not exists:
            cur.execute(f"CREATE DATABASE {DB_NAME}")
            print(f"✅ Database '{DB_NAME}' created")
        else:
            print(f"ℹ️ Database '{DB_NAME}' already exists")
        
        cur.close()
        conn.close()
        return True
    except Exception as e:
        print(f"❌ Error creating database: {e}")
        return False


def run_migration():
    """Run the schema migration"""
    try:
        conn = psycopg2.connect(
            dbname=DB_NAME,
            user=DB_USER,
            password=DB_PASSWORD,
            host=DB_HOST,
            port=DB_PORT
        )
        
        # Read schema file
        schema_path = Path(__file__).parent.parent / "schemas" / "complete_schema.sql"
        with open(schema_path, 'r') as f:
            schema_sql = f.read()
        
        # Execute schema
        cur = conn.cursor()
        cur.execute(schema_sql)
        conn.commit()
        
        print("✅ Schema migration completed successfully")
        
        cur.close()
        conn.close()
        return True
    except Exception as e:
        print(f"❌ Error running migration: {e}")
        return False


if __name__ == "__main__":
    print("🚀 Running initial migration...")
    if create_database():
        run_migration()
    else:
        print("❌ Migration failed")
