from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from typing import List, Optional

from src.core.database import get_db
from src.models.career import Career

router = APIRouter()


@router.get("/")
async def get_careers(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    query = select(Career)
    if search:
        query = query.where(
            or_(
                Career.name.ilike(f"%{search}%"),
                Career.description.ilike(f"%{search}%")
            )
        )
    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    careers = result.scalars().all()
    
    return [
        {
            "id": c.id,
            "slug": c.slug,
            "name": c.name,
            "field": c.field_id,
            "description": c.description[:150] + "..." if len(c.description) > 150 else c.description,
            "salary_range": f"GH₵ {c.salary_min_ghc:,} - GH₵ {c.salary_max_ghc:,}" if c.salary_min_ghc else "Varies",
            "duration_years": c.duration_years,
            "typical_aggregate": c.typical_aggregate
        }
        for c in careers
    ]


@router.get("/{slug}")
async def get_career_by_slug(slug: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Career).where(Career.slug == slug))
    career = result.scalar_one_or_none()
    if not career:
        raise HTTPException(status_code=404, detail="Career not found")
    
    return {
        "id": career.id,
        "slug": career.slug,
        "name": career.name,
        "description": career.description,
        "duration_years": career.duration_years,
        "salary_range": f"GH₵ {career.salary_min_ghc:,} - GH₵ {career.salary_max_ghc:,}",
        "typical_aggregate": career.typical_aggregate,
        "pathway_stages": [
            {"stage": "SHS", "requirement": "General Science programme"},
            {"stage": "WASSCE", "requirement": f"Aggregate ≤ {career.typical_aggregate or 24}"},
            {"stage": "University", "requirement": f"{career.duration_years or 4} year programme"},
            {"stage": "Professional", "requirement": "Licensing examination"}
        ]
    }
