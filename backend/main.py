"""
PATHWAY AI - Main Application Entry Point
Version: 3.0.0 - Fixed Import Paths
"""

import sys
import os

# Add the current directory to Python path so "modules" can be found
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="PATHWAY AI Education Ecosystem",
    description="AI-Powered Learning and Career Guidance Platform",
    version="3.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================
# HEALTH & ROOT ENDPOINTS
# ============================================

@app.get("/")
async def root():
    return {
        "name": "PATHWAY AI Education Ecosystem",
        "version": "3.0.0",
        "status": "running",
        "endpoints": {
            "docs": "/api/docs",
            "health": "/health",
            "auth": "/api/auth",
            "learn": "/api/learn",
            "practice": "/api/practice",
            "explore": "/api/explore",
            "plan": "/api/plan",
            "community": "/api/community",
            "parent": "/api/parent",
            "teacher": "/api/teacher",
            "school": "/api/school",
            "payment": "/api/payment",
            "live": "/api/live",
            "profile": "/api/profile",
            "dashboard": "/api/dashboard",
            "activity": "/api/activity",
            "analytics": "/api/analytics",
            "tutor": "/api/tutor",
            "paths": "/api/paths",
            "recommendations": "/api/recommendations",
            "knowledge_graph": "/api/knowledge_graph"
        }
    }

@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "service": "pathway-ai-ecosystem",
        "version": "3.0.0"
    }

# ============================================
# REGISTER ALL ROUTERS
# ============================================

print("=" * 60)
print("🚀 PATHWAY AI - Loading Modules")
print("=" * 60)

# Define all modules
modules = [
    ("auth", "modules.auth.router", "/api/auth"),
    ("learn", "modules.learn.router", "/api/learn"),
    ("practice", "modules.practice.router", "/api/practice"),
    ("explore", "modules.explore.router", "/api/explore"),
    ("plan", "modules.plan.router", "/api/plan"),
    ("community", "modules.community.router", "/api/community"),
    ("profile", "modules.profile.router", "/api/profile"),
    ("parent", "modules.parent.router", "/api/parent"),
    ("teacher", "modules.teacher.router", "/api/teacher"),
    ("school", "modules.school.router", "/api/school"),
    ("payment", "modules.payment.router", "/api/payment"),
    ("live", "modules.live.router", "/api/live"),
    ("dashboard", "modules.dashboard.router", "/api/dashboard"),
    ("activity", "modules.activity.router", "/api/activity"),
    ("analytics", "modules.analytics.router", "/api/analytics"),
    ("tutor", "modules.tutor.router", "/api/tutor"),
    ("paths", "modules.paths.router", "/api/paths"),
    ("recommendations", "modules.recommendations.router", "/api/recommendations"),
    ("knowledge_graph", "modules.knowledge_graph.router", "/api/knowledge_graph"),
]

loaded = []
failed = []

for module_name, import_path, prefix in modules:
    try:
        module = __import__(import_path, fromlist=["router"])
        router = getattr(module, "router")
        app.include_router(router, prefix=prefix, tags=[module_name.capitalize()])
        loaded.append(module_name)
        print(f"  ✅ {module_name.capitalize()} loaded at {prefix}")
    except ImportError as e:
        failed.append(f"{module_name}: {str(e)}")
        print(f"  ❌ Could not import {module_name}: {e}")
    except AttributeError as e:
        failed.append(f"{module_name}: {str(e)}")
        print(f"  ❌ {module_name} router not found: {e}")
    except Exception as e:
        failed.append(f"{module_name}: {str(e)}")
        print(f"  ❌ Error loading {module_name}: {e}")

# ============================================
# LEGACY CAREERS ENDPOINT
# ============================================

@app.get("/api/careers")
async def legacy_careers():
    return {
        "success": True,
        "careers": [
            {"id": "medical_doctor", "title": "Medical Doctor", "category": "Healthcare"},
            {"id": "software_engineer", "title": "Software Engineer", "category": "Technology"},
            {"id": "civil_engineer", "title": "Civil Engineer", "category": "Engineering"},
            {"id": "teacher", "title": "Teacher", "category": "Education"},
            {"id": "pharmacist", "title": "Pharmacist", "category": "Healthcare"}
        ]
    }

# ============================================
# STARTUP SUMMARY
# ============================================

print("=" * 60)
print("📊 MODULE LOADING SUMMARY")
print("=" * 60)
print(f"  ✅ Loaded: {', '.join(loaded) if loaded else 'None'}")
if failed:
    print(f"  ❌ Failed: {', '.join(failed)}")
print("=" * 60)
print("🌐 Server running on http://localhost:8001")
print("📚 API Docs: http://localhost:8001/api/docs")
print("=" * 60)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8001,
        reload=True
    )
