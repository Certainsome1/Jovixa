from pydantic import BaseModel


class HealthResponse(BaseModel):
    status: str
    database: str
    detail: str | None = None
