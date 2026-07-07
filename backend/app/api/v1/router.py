from fastapi import APIRouter

from app.api.v1.endpoints import health, jobs, matches, resumes

api_router = APIRouter()
api_router.include_router(health.router, tags=["health"])
api_router.include_router(resumes.router, prefix="/resumes", tags=["resumes"])
api_router.include_router(jobs.router, prefix="/jobs", tags=["jobs"])
api_router.include_router(matches.router, prefix="/matches", tags=["matches"])
