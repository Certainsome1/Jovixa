from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class ResumeUploadResponse(BaseModel):
    id: UUID
    original_filename: str
    content_type: str | None
    file_size_bytes: int
    parsed_json: dict
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ResumeResponse(ResumeUploadResponse):
    pass


class ParsedResumeResponse(BaseModel):
    text: str
    skills: list[str]
    experience_years: float | None
    companies: list[str]
