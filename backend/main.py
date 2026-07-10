"""
Pathway AI Education Ecosystem - Clean Main Application
Version: 3.0.0 - Stabilized
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict
import logging
import os

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============================================
# FastAPI Application
# ============================================

app = FastAPI(
    title="Pathway AI Education Ecosystem",
    description="AI-powered education and career guidance for Ghanaian students",
    version="3.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================
# Career Data
# ============================================

CAREERS = [
    {
        "id": 1,
        "slug": "medical-doctor",
        "name": "Medical Doctor",
        "field": "Healthcare",
        "description": "Diagnoses and treats illnesses. Requires MBChB degree.",
        "salary_range": "GH₵ 5,000 - 15,000",
        "duration_years": 10,
        "typical_aggregate": 12,
        "required_subjects": ["Biology", "Chemistry", "Physics"],
        "universities": ["University of Ghana", "KNUST", "UHAS"]
    },
    {
        "id": 2,
        "slug": "software-engineer",
        "name": "Software Engineer",
        "field": "Technology",
        "description": "Designs and develops software applications.",
        "salary_range": "GH₵ 3,000 - 12,000",
        "duration_years": 4,
        "typical_aggregate": 18,
        "required_subjects": ["Elective Mathematics"],
        "universities": ["University of Ghana", "KNUST", "Ashesi"]
    },
    {
        "id": 3,
        "slug": "civil-engineer",
        "name": "Civil Engineer",
        "field": "Engineering",
        "description": "Designs infrastructure like roads and buildings.",
        "salary_range": "GH₵ 4,000 - 12,000",
        "duration_years": 5,
        "typical_aggregate": 16,
        "required_subjects": ["Physics", "Chemistry", "Elective Mathematics"],
        "universities": ["KNUST", "University of Ghana"]
    },
    {
        "id": 4,
        "slug": "lawyer",
        "name": "Lawyer",
        "field": "Legal",
        "description": "Represents clients in legal matters.",
        "salary_range": "GH₵ 5,000 - 20,000",
        "duration_years": 7,
        "typical_aggregate": 12,
        "required_subjects": ["Government", "Literature"],
        "universities": ["University of Ghana", "KNUST"]
    },
    {
        "id": 5,
        "slug": "accountant",
        "name": "Accountant",
        "field": "Business",
        "description": "Manages financial records and audits.",
        "salary_range": "GH₵ 3,000 - 15,000",
        "duration_years": 4,
        "typical_aggregate": 16,
        "required_subjects": ["Accounting", "Business Management"],
        "universities": ["University of Ghana", "UPSA", "KNUST"]
    },
    {
        "id": 6,
        "slug": "architect",
        "name": "Architect",
        "field": "Creative Arts",
        "description": "Designs buildings and structures.",
        "salary_range": "GH₵ 4,000 - 15,000",
        "duration_years": 6,
        "typical_aggregate": 14,
        "required_subjects": ["General Knowledge in Art"],
        "universities": ["KNUST", "University of Ghana"]
    },
    {
        "id": 7,
        "slug": "nurse",
        "name": "Nurse",
        "field": "Healthcare",
        "description": "Provides patient care in hospitals.",
        "salary_range": "GH₵ 2,500 - 8,000",
        "duration_years": 4,
        "typical_aggregate": 18,
        "required_subjects": ["Biology", "Chemistry"],
        "universities": ["University of Ghana", "UHAS", "UCC"]
    },
    {
        "id": 8,
        "slug": "teacher",
        "name": "Teacher",
        "field": "Education",
        "description": "Educates students at various levels.",
        "salary_range": "GH₵ 1,500 - 5,000",
        "duration_years": 4,
        "typical_aggregate": 24,
        "required_subjects": [],
        "universities": ["University of Education", "UCC", "UEW"]
    },
    {
        "id": 9,
        "slug": "pharmacist",
        "name": "Pharmacist",
        "field": "Healthcare",
        "description": "Dispenses medications and advises on drug safety.",
        "salary_range": "GH₵ 4,000 - 10,000",
        "duration_years": 6,
        "typical_aggregate": 15,
        "required_subjects": ["Biology", "Chemistry"],
        "universities": ["KNUST", "University of Ghana", "UCC"]
    },
    {
        "id": 10,
        "slug": "agricultural-scientist",
        "name": "Agricultural Scientist",
        "field": "Agriculture",
        "description": "Researches crop production and sustainable farming.",
        "salary_range": "GH₵ 3,000 - 8,000",
        "duration_years": 5,
        "typical_aggregate": 20,
        "required_subjects": ["Biology", "Chemistry"],
        "universities": ["University of Ghana", "KNUST", "UDS"]
    }
]

# ============================================
# Health & Root Endpoints
# ============================================

@app.get("/")
async def root():
    return {
        "message": "Pathway AI Education Ecosystem",
        "version": "3.0.0",
        "status": "operational",
        "docs": "/api/docs"
    }


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "pathway-ai-ecosystem",
        "careers_count": len(CAREERS)
    }

# ============================================
# Career Endpoints
# ============================================

@app.get("/api/careers")
async def get_careers(search: Optional[str] = None):
    if search:
        results = [c for c in CAREERS if search.lower() in c["name"].lower()]
        return results
    return CAREERS


@app.get("/api/careers/{slug}")
async def get_career_by_slug(slug: str):
    for career in CAREERS:
        if career["slug"] == slug:
            return career
    raise HTTPException(status_code=404, detail="Career not found")

# ============================================
# UNIFIED MODULAR ROUTERS (SINGLE SOURCE OF TRUTH)
# ============================================

print("📦 Loading modular routers...")

# Import all modular routers
from modules.learn.router import router as learn_router
from modules.explore.router import router as explore_router
from modules.practice.router import router as practice_router
from modules.plan.router import router as plan_router
from modules.community.router import router as community_router
from modules.profile.router import router as profile_router

# Register all routers (ONCE)
app.include_router(learn_router, prefix="/api/learn", tags=["Learn"])
app.include_router(explore_router, prefix="/api/explore", tags=["Explore"])
app.include_router(practice_router, prefix="/api/practice", tags=["Practice"])
app.include_router(plan_router, prefix="/api/plan", tags=["Plan"])
app.include_router(community_router, prefix="/api/community", tags=["Community"])
app.include_router(profile_router, prefix="/api/profile", tags=["Profile"])

print("✅ All modular routers registered!")

# ============================================
# LEGACY ENDPOINTS (Preserved)
# ============================================

print("📦 Loading legacy endpoints...")

try:
    from ml.smart_recommender import SmartRecommender
    from ml.admission_predictor import AdmissionPredictor
    from ml.real_data_loader import real_data
    from ml.real_recommender_engine import real_recommender
    from ml.explainability.unified_explainer import UnifiedExplainer
    from ml.roadmap.roadmap_generator import RoadmapGenerator
    
    @app.post("/api/smart/recommend")
    async def smart_recommend(request: Dict):
        recommender = SmartRecommender()
        return recommender.recommend(
            aggregate=request.get("aggregate", 12),
            subjects=request.get("subjects", {}),
            interests=request.get("interests", {})
        )
    
    @app.post("/api/real-data/recommend")
    async def real_data_recommend(request: Dict):
        return real_recommender.recommend(
            aggregate=request.get("aggregate", 12),
            interests=request.get("interests", []),
            subjects=request.get("subjects", [])
        )
    
    @app.post("/api/admission-chance")
    async def predict_admission(request: Dict):
        predictor = AdmissionPredictor()
        return predictor.predict_admission_chance(
            career=request.get("career", ""),
            aggregate=request.get("aggregate", 12),
            subjects=request.get("subjects", []),
            preferred_university=request.get("preferred_university")
        )
    
    @app.post("/api/explain/recommendation")
    async def explain_recommendation(request: Dict):
        explainer = UnifiedExplainer()
        return explainer.explain_recommendation(
            career=request.get("career", {}),
            profile=request.get("student_profile", {})
        )
    
    @app.get("/api/roadmap/{career_slug}")
    async def get_career_roadmap(career_slug: str):
        generator = RoadmapGenerator()
        return generator.get_roadmap(career_slug)
    
    print("✅ Legacy endpoints loaded")
except Exception as e:
    print(f"⚠️ Some legacy endpoints failed: {e}")

# ============================================
# ADDITIONAL LEGACY ENDPOINTS
# ============================================

@app.post("/api/eligibility/check")
async def check_eligibility(request: Dict):
    grade_map = {"A1": 1, "B2": 2, "B3": 3, "C4": 4, "C5": 5, "C6": 6, "D7": 7, "E8": 8, "F9": 9}
    
    all_grades = [
        grade_map.get(request.get("english", "F9"), 9),
        grade_map.get(request.get("math", "F9"), 9),
        grade_map.get(request.get("science", "F9"), 9),
        grade_map.get(request.get("social", "F9"), 9),
    ]
    for grade in request.get("electives", {}).values():
        all_grades.append(grade_map.get(grade, 9))
    
    all_grades.sort()
    aggregate = sum(all_grades[:6])
    
    programmes = [
        {"name": "Medicine (MBChB)", "cutoff": 12, "universities": ["UG", "KNUST", "UHAS"]},
        {"name": "Engineering", "cutoff": 16, "universities": ["KNUST", "UG"]},
        {"name": "Computer Science", "cutoff": 18, "universities": ["UG", "KNUST", "Ashesi"]},
        {"name": "Law (LLB)", "cutoff": 12, "universities": ["UG", "KNUST"]},
        {"name": "Business Administration", "cutoff": 20, "universities": ["UG", "UPSA", "KNUST"]},
        {"name": "Nursing", "cutoff": 18, "universities": ["UG", "UHAS", "UCC"]},
    ]
    
    eligible = [p for p in programmes if aggregate <= p["cutoff"]]
    
    return {
        "aggregate": aggregate,
        "eligible_programmes": eligible[:5],
        "total_eligible": len(eligible)
    }


@app.post("/api/chatbot/chat")
async def chatbot_chat(request: Dict):
    message = request.get("message", "").lower()
    
    if "doctor" in message or "medicine" in message:
        reply = "To become a doctor in Ghana: Choose General Science in SHS, take Biology/Chemistry/Physics, target aggregate ≤ 12, apply to UG/KNUST/UHAS, complete 6-year MBChB, pass Medical Council exams."
    elif "engineer" in message:
        reply = "To become an engineer: Choose General Science, take Physics/Chemistry/Elective Maths, target aggregate ≤ 16, apply to KNUST/UG, complete 4-year BSc, register with GhIE."
    elif "lawyer" in message:
        reply = "To become a lawyer: Choose General Arts, take Government/Literature, target aggregate ≤ 12, apply to UG/KNUST Law, complete LLB, pass Ghana Bar exams."
    else:
        reply = "I can help you with career guidance! Ask me about becoming a Doctor, Engineer, Lawyer, or check WASSCE requirements."
    
    return {"reply": reply, "session_id": request.get("session_id", "new-session")}


@app.get("/api/quiz/questions")
async def get_quiz_questions():
    return {
        "questions": [
            {"id": "q1", "text": "What interests you most?", "options": ["Helping people", "Technology", "Business", "Creative work", "Working outdoors"]},
            {"id": "q2", "text": "What is your strongest subject?", "options": ["Science", "Mathematics", "Arts/Literature", "Business", "Technical"]},
            {"id": "q3", "text": "How do you prefer to work?", "options": ["Office", "Hospital", "Remote", "Field/Outdoors"]},
            {"id": "q4", "text": "What matters most in a career?", "options": ["High income", "Making impact", "Job security", "Creativity"]},
            {"id": "q5", "text": "Your current stage?", "options": ["JHS", "SHS", "University", "TVET"]}
        ]
    }


@app.post("/api/quiz/submit")
async def submit_quiz(request: Dict):
    interest = request.get("q1", "").lower()
    
    if "helping" in interest or "science" in interest:
        primary = CAREERS[0]
    elif "technology" in interest or "math" in interest:
        primary = CAREERS[1]
    elif "business" in interest:
        primary = CAREERS[4]
    else:
        primary = CAREERS[0]
    
    return {
        "primary_career": {
            "name": primary["name"],
            "field": primary["field"],
            "description": primary["description"],
            "typical_aggregate": primary["typical_aggregate"]
        },
        "alternatives": [CAREERS[2], CAREERS[3], CAREERS[6]],
        "confidence": "High"
    }


# ============================================
# RAG Search
# ============================================

try:
    from ml.lazy_rag_system import rag
    
    @app.post("/api/rag/search")
    async def rag_search(request: Dict):
        results = rag.semantic_search(request.get("query", ""), request.get("top_k", 5))
        return {"query": request.get("query"), "results": results}
    print("✅ RAG search loaded")
except Exception as e:
    print(f"⚠️ RAG search failed: {e}")


@app.get("/api/real-data/sources")
async def get_real_data_sources():
    try:
        from ml.real_data_loader import real_data
        return real_data.get_data_sources()
    except:
        return []


@app.get("/api/real-data/universities")
async def get_real_data_universities():
    try:
        from ml.real_data_loader import real_data
        return list(real_data.universities.keys())
    except:
        return []


@app.get("/api/real-data/wassce-info")
async def get_wassce_info():
    try:
        from ml.real_data_loader import real_data
        return real_data.wassce_data
    except:
        return {}

print("=" * 50)
print("✅ PATHWAY AI EDUCATION ECOSYSTEM READY")
print(f"   Version: 3.0.0")
print(f"   Endpoints: {len(app.routes)}")
print("=" * 50)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)

# ============================================
# AUTHENTICATION MODULE
# ============================================

from modules.auth.router import router as auth_router
app.include_router(auth_router, prefix="/api/auth", tags=["Authentication"])

print("✅ Auth module registered in main.py")

# ============================================
# ACTIVITY MODULE
# ============================================

from modules.activity.router import router as activity_router
app.include_router(activity_router, prefix="/api/activity", tags=["Activity"])

print("✅ Activity module registered in main.py")

# ============================================
# DASHBOARD MODULE
# ============================================

from modules.dashboard.router import router as dashboard_router
app.include_router(dashboard_router, prefix="/api/dashboard", tags=["Dashboard"])

print("✅ Dashboard module registered in main.py")

# ============================================
# PARENT PORTAL
# ============================================

from modules.parent.router import router as parent_router
app.include_router(parent_router, prefix="/api/parent", tags=["Parent"])
print("✅ Parent Portal registered")

# ============================================
# TEACHER PORTAL
# ============================================

from modules.teacher.router import router as teacher_router
app.include_router(teacher_router, prefix="/api/teacher", tags=["Teacher"])
print("✅ Teacher Portal registered")
