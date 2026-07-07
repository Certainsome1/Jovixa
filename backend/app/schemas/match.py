from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class RankJobsRequest(BaseModel):
    resume_id: UUID
    limit: int = Field(default=25, ge=1, le=200)


class RankedJobResponse(BaseModel):
    job_id: UUID
    title: str
    company: str | None
    location: str | None
    source: str
    url: str
    posted_at: datetime | None
    is_applied: bool = False
    applied_at: datetime | None = None
    score: float
    semantic_score: float
    skill_overlap_score: float
    title_score: float
    matched_skills: list[str]
    explanation: str


class RankJobsResponse(BaseModel):
    resume_id: UUID
    results: list[RankedJobResponse]
