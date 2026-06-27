"""
PathwayGH Backend - Main Application
FastAPI server with domain-driven architecture
"""

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from src.core.config import settings
from src.core.database import engine, Base
from src.api.routes import careers, quiz, eligibility, universities, pathways, chatbot

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🚀 Starting PathwayGH API...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("✅ Database ready")
    yield
    logger.info("🛑 Shutting down...")
    await engine.dispose()


app = FastAPI(
    title="PathwayGH API",
    description="AI-Powered Career Guidance for Ghanaian Students",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {"message": "PathwayGH API", "status": "operational", "docs": "/api/docs"}


@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "pathwaygh-backend"}


app.include_router(careers.router, prefix="/api/careers", tags=["Careers"])
app.include_router(quiz.router, prefix="/api/quiz", tags=["Quiz"])
app.include_router(eligibility.router, prefix="/api/eligibility", tags=["Eligibility"])
app.include_router(universities.router, prefix="/api/universities", tags=["Universities"])
app.include_router(pathways.router, prefix="/api/pathways", tags=["Pathways"])
app.include_router(chatbot.router, prefix="/api/chatbot", tags=["Chatbot"])


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
