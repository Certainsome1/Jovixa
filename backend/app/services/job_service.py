from __future__ import annotations

import hashlib
from dataclasses import dataclass
from datetime import datetime, timezone
from uuid import UUID

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.job import Job
from app.services.job_providers import (
    ArbeitnowJobProvider,
    BaseJobProvider,
    IndeedJobProvider,
    JobPosting,
    LinkedInJobProvider,
    OrganizationJobBoardProvider,
    RemotiveJobProvider,
)


@dataclass(frozen=True)
class FetchJobsResult:
    fetched: int
    inserted: int
    updated: int
    skipped: int
    sources: list[str]


class JobFetchService:
    def __init__(
        self,
        db: AsyncSession,
        providers: list[BaseJobProvider] | None = None,
    ):
        self.db = db
        self.providers = providers or build_default_providers()

    async def fetch_and_store_jobs(
        self,
        query: str | None = None,
        location: str | None = None,
        job_board_urls: list[str] | None = None,
    ) -> FetchJobsResult:
        query = query or settings.DEFAULT_JOB_QUERY
        location = location or settings.DEFAULT_JOB_LOCATION
        fetched_postings: list[JobPosting] = []
        sources = []

        providers = [
            *self.providers,
            *build_organization_job_board_providers(job_board_urls or []),
        ]

        for provider in providers:
            try:
                postings = await provider.fetch(query=query, location=location)
            except httpx.HTTPError:
                sources.append(f"{provider.source}:unavailable")
                continue
            fetched_postings.extend(postings)
            sources.append(provider.source)

        inserted = 0
        updated = 0
        skipped = 0

        for posting in fetched_postings:
            if not posting.title or not posting.url:
                skipped += 1
                continue

            unique_key = build_job_unique_key(posting)
            result = await self.db.execute(select(Job).where(Job.unique_key == unique_key))
            existing_job = result.scalar_one_or_none()

            if existing_job is None:
                self.db.add(self._create_job(posting, unique_key))
                inserted += 1
            else:
                self._update_job(existing_job, posting)
                updated += 1

        await self.db.commit()
        return FetchJobsResult(
            fetched=len(fetched_postings),
            inserted=inserted,
            updated=updated,
            skipped=skipped,
            sources=sources,
        )

    def _create_job(self, posting: JobPosting, unique_key: str) -> Job:
        now = datetime.now(timezone.utc)
        return Job(
            unique_key=unique_key,
            source=posting.source,
            source_external_id=posting.source_external_id,
            title=posting.title,
            company=posting.company,
            location=posting.location,
            description=posting.description,
            url=posting.url,
            posted_at=posting.posted_at,
            fetched_at=now,
            raw_payload=posting.raw_payload,
        )

    def _update_job(self, job: Job, posting: JobPosting) -> None:
        job.title = posting.title
        job.company = posting.company
        job.location = posting.location
        job.description = posting.description
        job.url = posting.url
        job.posted_at = posting.posted_at
        job.source_external_id = posting.source_external_id
        job.raw_payload = posting.raw_payload
        job.fetched_at = datetime.now(timezone.utc)

    async def set_application_status(
        self,
        *,
        is_applied: bool,
        job_id: UUID | None = None,
        source: str | None = None,
        source_external_id: str | None = None,
        title: str | None = None,
        company: str | None = None,
        location: str | None = None,
        description: str | None = None,
        url: str | None = None,
        posted_at: datetime | None = None,
    ) -> Job:
        job = None
        if job_id is not None:
            job = await self.db.get(Job, job_id)

        if job is None:
            if not source or not url:
                raise JobApplicationError("A job id or source and URL are required.")
            unique_key = build_job_unique_key_from_parts(source, source_external_id, url)
            result = await self.db.execute(select(Job).where(Job.unique_key == unique_key))
            job = result.scalar_one_or_none()

            if job is None:
                now = datetime.now(timezone.utc)
                job = Job(
                    unique_key=unique_key,
                    source=source,
                    source_external_id=source_external_id,
                    title=title or "Untitled job",
                    company=company,
                    location=location,
                    description=description,
                    url=url,
                    posted_at=posted_at,
                    fetched_at=now,
                    raw_payload={},
                )
                self.db.add(job)

        job.is_applied = is_applied
        job.applied_at = datetime.now(timezone.utc) if is_applied else None
        await self.db.commit()
        await self.db.refresh(job)
        return job


class JobApplicationError(Exception):
    pass


def build_default_providers() -> list[BaseJobProvider]:
    providers: list[BaseJobProvider] = [
        LinkedInJobProvider(
            settings.LINKEDIN_JOB_SEARCH_URL_TEMPLATE,
            verify_ssl=settings.JOB_SOURCE_VERIFY_SSL,
        ),
        IndeedJobProvider(
            settings.INDEED_JOB_FEED_URL_TEMPLATE,
            verify_ssl=settings.JOB_SOURCE_VERIFY_SSL,
        ),
        ArbeitnowJobProvider(
            settings.ARBEITNOW_JOB_API_URL_TEMPLATE,
            verify_ssl=settings.JOB_SOURCE_VERIFY_SSL,
        ),
        RemotiveJobProvider(
            settings.REMOTIVE_JOB_API_URL_TEMPLATE,
            verify_ssl=settings.JOB_SOURCE_VERIFY_SSL,
        ),
    ]
    providers.extend(build_organization_job_board_providers(settings.organization_job_board_urls))
    return providers


def build_organization_job_board_providers(job_board_urls: list[str]) -> list[BaseJobProvider]:
    return [
        OrganizationJobBoardProvider(
            job_board_url,
            verify_ssl=settings.JOB_SOURCE_VERIFY_SSL,
        )
        for job_board_url in job_board_urls
        if job_board_url.strip()
    ]


def build_job_unique_key(posting: JobPosting) -> str:
    return build_job_unique_key_from_parts(
        posting.source,
        posting.source_external_id,
        posting.url,
    )


def build_job_unique_key_from_parts(
    source: str,
    source_external_id: str | None,
    url: str,
) -> str:
    stable_identity = source_external_id or url
    raw_key = f"{source}:{stable_identity}".strip().lower()
    return hashlib.sha256(raw_key.encode("utf-8")).hexdigest()
