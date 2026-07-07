from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "AI Job Matcher API"
    API_VERSION: str = "0.1.0"
    API_V1_PREFIX: str = "/api/v1"
    DEBUG: bool = False

    DATABASE_URL: str = Field(
        default="postgresql+asyncpg://postgres:postgres@localhost:5432/ai_job_matcher"
    )
    AUTO_CREATE_TABLES: bool = False

    CORS_ORIGINS: str = "http://localhost:3000"
    UPLOAD_DIR: Path = Path("uploads")
    MAX_UPLOAD_SIZE_MB: int = 10
    ALLOWED_RESUME_EXTENSIONS: set[str] = {".pdf", ".docx"}
    DEFAULT_JOB_QUERY: str = "Teamcenter NX PLM"
    DEFAULT_JOB_LOCATION: str = "India"
    LINKEDIN_JOB_SEARCH_URL_TEMPLATE: str = (
        "https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search"
        "?keywords={query}&location={location}&start=0"
    )
    INDEED_JOB_FEED_URL_TEMPLATE: str = "https://rss.indeed.com/rss?q={query}&l={location}"
    ARBEITNOW_JOB_API_URL_TEMPLATE: str = "https://www.arbeitnow.com/api/job-board-api"
    REMOTIVE_JOB_API_URL_TEMPLATE: str = "https://remotive.com/api/remote-jobs?search={query}"
    ORGANIZATION_JOB_BOARD_URLS: str = ""
    JOB_SOURCE_VERIFY_SSL: bool = False
    ENABLE_JOB_SCHEDULER: bool = False
    JOB_FETCH_INTERVAL_SECONDS: int = 3600
    EMBEDDING_DIMENSIONS: int = 384

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
    )

    @property
    def max_upload_size_bytes(self) -> int:
        return self.MAX_UPLOAD_SIZE_MB * 1024 * 1024

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    @property
    def organization_job_board_urls(self) -> list[str]:
        return [
            url.strip()
            for url in self.ORGANIZATION_JOB_BOARD_URLS.split(",")
            if url.strip()
        ]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
