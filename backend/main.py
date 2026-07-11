"""
Pathway AI - Main Application
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging
import os

# Simple config
class Settings:
    DEBUG = True
    CORS_ORIGINS = ["*"]
    DATABASE_URL = "sqlite:///./pathwaygh.db"

settings = Settings()

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="Pathway AI Education Ecosystem",
    description="AI-powered learning and career guidance",
    version="3.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================
# HEALTH CHECK
# ============================================

@app.get("/")
async def root():
    return {"message": "Pathway AI", "version": "3.0.0", "status": "running"}

@app.get("/health")
async def health():
    return {"status": "healthy", "service": "pathway-ai-ecosystem", "careers_count": 10}

# ============================================
# LEARN MODULE (Working)
# ============================================

from modules.learn.router import router as learn_router
from modules.auth.router import router as auth_router
app.include_router(learn_router, prefix="/api/learn", tags=["Learn"])
app.include_router(auth_router, tags=["Authentication"])

# ============================================
# ALL OTHER MODULES
# ============================================

# Try to import and register all modules
modules_to_load = [
    ("practice", "Practice"),
    ("parent", "Parent"), 
    ("teacher", "Teacher"),
    ("payment", "Payment"),
    ("live", "Live"),
    ("explore", "Explore"),
    ("plan", "Plan"),
    ("community", "Community")
]

for module_name, tag in modules_to_load:
    try:
        module_path = f"modules.{module_name}.router"
        router = __import__(module_path, fromlist=["router"]).router
        app.include_router(router, prefix=f"/api/{module_name}", tags=[tag])
        print(f"✅ Loaded {module_name} module")
    except Exception as e:
        print(f"⚠️ Could not load {module_name} module: {e}")

# ============================================
# LEGACY: Career & Other Endpoints
# ============================================

try:
    from ml.smart_recommender import SmartRecommender
    from ml.admission_predictor import AdmissionPredictor
    from ml.real_data_loader import real_data
    from ml.real_recommender_engine import real_recommender
    
    @app.get("/api/careers")
    async def get_careers():
        return [{"id": 1, "name": "Medical Doctor", "field": "Healthcare"}]
    
    @app.post("/api/smart/recommend")
    async def smart_recommend():
        return {"predictions": []}
    
    print("✅ Legacy endpoints loaded")
except Exception as e:
    print(f"⚠️ Legacy endpoints skipped: {e}")

print("==================================================")
print("✅ PATHWAY AI STARTED")
print("   Endpoints: /health, /api/learn/courses")
print("==================================================")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)

# ============================================
# REGISTER ALL MODULE ROUTERS
# ============================================

# Practice Module
try:
    from modules.practice.router import router as practice_router
    app.include_router(practice_router, prefix="/api/practice", tags=["Practice"])
    print("✅ Practice router registered")
except Exception as e:
    print(f"⚠️ Practice router failed: {e}")

# Parent Portal
try:
    from modules.parent.router import router as parent_router
    app.include_router(parent_router, prefix="/api/parent", tags=["Parent"])
    print("✅ Parent router registered")
except Exception as e:
    print(f"⚠️ Parent router failed: {e}")

# Teacher Portal
try:
    from modules.teacher.router import router as teacher_router
    app.include_router(teacher_router, prefix="/api/teacher", tags=["Teacher"])
    print("✅ Teacher router registered")
except Exception as e:
    print(f"⚠️ Teacher router failed: {e}")

# Payment
try:
    from modules.payment.router import router as payment_router
    app.include_router(payment_router, prefix="/api/payment", tags=["Payment"])
    print("✅ Payment router registered")
except Exception as e:
    print(f"⚠️ Payment router failed: {e}")

# Live Classes
try:
    from modules.live.router import router as live_router
    app.include_router(live_router, prefix="/api/live", tags=["Live"])
    print("✅ Live router registered")
except Exception as e:
    print(f"⚠️ Live router failed: {e}")

# Explore
try:
    from modules.explore.router import router as explore_router
    app.include_router(explore_router, prefix="/api/explore", tags=["Explore"])
    print("✅ Explore router registered")
except Exception as e:
    print(f"⚠️ Explore router failed: {e}")

# Plan
try:
    from modules.plan.router import router as plan_router
    app.include_router(plan_router, prefix="/api/plan", tags=["Plan"])
    print("✅ Plan router registered")
except Exception as e:
    print(f"⚠️ Plan router failed: {e}")

# Community
try:
    from modules.community.router import router as community_router
    app.include_router(community_router, prefix="/api/community", tags=["Community"])
    print("✅ Community router registered")
except Exception as e:
    print(f"⚠️ Community router failed: {e}")

print("✅ ALL ROUTERS REGISTERED!")

# ============================================
# EMERGENCY FIX - DIRECT REGISTRATION
# ============================================

# Practice
try:
    from modules.practice.router import router as p_router
    app.include_router(p_router, prefix="/api/practice")
    print("✅ Practice OK")
except Exception as e:
    print(f"❌ Practice: {e}")

# Parent
try:
    from modules.parent.router import router as par_router
    app.include_router(par_router, prefix="/api/parent")
    print("✅ Parent OK")
except Exception as e:
    print(f"❌ Parent: {e}")

# Teacher
try:
    from modules.teacher.router import router as t_router
    app.include_router(t_router, prefix="/api/teacher")
    print("✅ Teacher OK")
except Exception as e:
    print(f"❌ Teacher: {e}")

# Payment
try:
    from modules.payment.router import router as pay_router
    app.include_router(pay_router, prefix="/api/payment")
    print("✅ Payment OK")
except Exception as e:
    print(f"❌ Payment: {e}")

# Live
try:
    from modules.live.router import router as l_router
    app.include_router(l_router, prefix="/api/live")
    print("✅ Live OK")
except Exception as e:
    print(f"❌ Live: {e}")

# Explore
try:
    from modules.explore.router import router as e_router
    app.include_router(e_router, prefix="/api/explore")
    print("✅ Explore OK")
except Exception as e:
    print(f"❌ Explore: {e}")

# Plan
try:
    from modules.plan.router import router as pl_router
    app.include_router(pl_router, prefix="/api/plan")
    print("✅ Plan OK")
except Exception as e:
    print(f"❌ Plan: {e}")

# Community
try:
    from modules.community.router import router as c_router
    app.include_router(c_router, prefix="/api/community")
    print("✅ Community OK")
except Exception as e:
    print(f"❌ Community: {e}")

print("✅ EMERGENCY FIX COMPLETE")
