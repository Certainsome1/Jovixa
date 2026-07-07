from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.schemas.resume import ParsedResumeResponse


class FetchJobsRequest(BaseModel):
    query: str | None = None
    location: str | None = None
    job_board_urls: list[str] | None = None


class FetchJobsResponse(BaseModel):
    fetched: int
    inserted: int
    updated: int
    skipped: int
    sources: list[str]


class LiveJobSearchRequest(BaseModel):
    parsed_resume: ParsedResumeResponse
    query: str | None = None
    location: str | None = None
    job_board_urls: list[str] | None = None
    limit: int = 25


class LiveJobSearchResponse(BaseModel):
    fetched: int
    sources: list[str]
    results: list[dict]


class JobApplicationRequest(BaseModel):
    job_id: UUID | None = None
    source: str | None = None
    source_external_id: str | None = None
    title: str | None = None
    company: str | None = None
    location: str | None = None
    description: str | None = None
    url: str | None = None
    posted_at: datetime | None = None
    is_applied: bool = True


class JobResponse(BaseModel):
    id: UUID
    source: str
    source_external_id: str | None
    title: str
    company: str | None
    location: str | None
    description: str | None
    url: str
    posted_at: datetime | None
    fetched_at: datetime
    is_applied: bool
    applied_at: datetime | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
