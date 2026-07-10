
# ============================================
# DASHBOARD API
# ============================================

from services.dashboard_service import dashboard_service


@app.get("/api/dashboard")
async def get_dashboard(user_id: str = "guest"):
    """Get complete dashboard data"""
    try:
        return dashboard_service.get_dashboard(user_id)
    except Exception as e:
        return {
            "error": str(e),
            "message": "Unable to load dashboard"
        }


@app.get("/api/dashboard/progress")
async def get_dashboard_progress(user_id: str = "guest"):
    """Get user progress data"""
    try:
        data = dashboard_service.get_dashboard(user_id)
        return {"progress": data.get("progress", {})}
    except Exception as e:
        return {"error": str(e)}


@app.get("/api/dashboard/recommendations")
async def get_dashboard_recommendations(user_id: str = "guest"):
    """Get user recommendations"""
    try:
        data = dashboard_service.get_dashboard(user_id)
        return {"recommendations": data.get("recommendations", [])}
    except Exception as e:
        return {"error": str(e)}


@app.get("/api/dashboard/activity")
async def get_dashboard_activity(user_id: str = "guest"):
    """Get user activity"""
    try:
        data = dashboard_service.get_dashboard(user_id)
        return {"activities": data.get("activities", [])}
    except Exception as e:
        return {"error": str(e)}


@app.get("/api/dashboard/insights")
async def get_dashboard_insights(user_id: str = "guest"):
    """Get AI insights"""
    try:
        data = dashboard_service.get_dashboard(user_id)
        return {"insights": data.get("insights", {})}
    except Exception as e:
        return {"error": str(e)}

print("✅ Dashboard API endpoints registered!")

# ============================================
# AUTHENTICATION MODULE
# ============================================

from modules.auth.router import router as auth_router
app.include_router(auth_router, prefix="/api/auth", tags=["Authentication"])

print("✅ Auth module registered in main.py")
