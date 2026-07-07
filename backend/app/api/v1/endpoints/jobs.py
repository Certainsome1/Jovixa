import httpx
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import desc, select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.job import Job
from app.schemas.job import (
    FetchJobsRequest,
    FetchJobsResponse,
    JobApplicationRequest,
    JobResponse,
    LiveJobSearchRequest,
)
from app.schemas.match import RankedJobResponse
from app.services.job_service import (
    JobApplicationError,
    JobFetchService,
    build_default_providers,
    build_job_unique_key_from_parts,
    build_organization_job_board_providers,
)
from app.services.matching_service import rank_live_postings

router = APIRouter()


@router.post("/fetch", response_model=FetchJobsResponse)
async def fetch_jobs(
    request: FetchJobsRequest,
    db: AsyncSession = Depends(get_db),
) -> FetchJobsResponse:
    service = JobFetchService(db)
    try:
        result = await service.fetch_and_store_jobs(
            query=request.query,
            location=request.location,
            job_board_urls=request.job_board_urls,
        )
    except (OSError, SQLAlchemyError) as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Database unavailable: {exc}",
        ) from exc
    except httpx.HTTPError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Job source unavailable: {exc}",
        ) from exc

    return FetchJobsResponse(**result.__dict__)


@router.get("", response_model=list[JobResponse])
async def list_jobs(
    db: AsyncSession = Depends(get_db),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
) -> list[Job]:
    try:
        result = await db.execute(
            select(Job).order_by(desc(Job.fetched_at)).limit(limit).offset(offset)
        )
    except (OSError, SQLAlchemyError) as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Database unavailable: {exc}",
        ) from exc

    return list(result.scalars().all())


@router.patch("/application", response_model=JobResponse)
async def set_job_application_status(
    request: JobApplicationRequest,
    db: AsyncSession = Depends(get_db),
) -> Job:
    service = JobFetchService(db)

    try:
        return await service.set_application_status(**request.model_dump())
    except JobApplicationError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    except (OSError, SQLAlchemyError) as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Database unavailable: {exc}",
        ) from exc


@router.post("/live-search", response_model=list[RankedJobResponse])
async def live_search_jobs(
    request: LiveJobSearchRequest,
    db: AsyncSession = Depends(get_db),
) -> list[RankedJobResponse]:
    providers = build_default_providers()
    if request.job_board_urls:
        providers.extend(build_organization_job_board_providers(request.job_board_urls))
    query = request.query or build_query_from_resume(request.parsed_resume.skills)
    location = request.location or "India"
    postings = []

    for provider in providers:
        try:
            postings.extend(await provider.fetch(query=query, location=location))
        except httpx.HTTPError:
            continue

    ranked_matches = rank_live_postings(
        parsed_resume=request.parsed_resume.model_dump(),
        postings=postings,
        limit=request.limit,
    )
    applied_by_key = await load_applied_jobs_by_unique_key(db, ranked_matches)

    return [
        RankedJobResponse(
            job_id=ranked_match.job.id,
            title=ranked_match.job.title,
            company=ranked_match.job.company,
            location=ranked_match.job.location,
            source=ranked_match.job.source,
            url=ranked_match.job.url,
            posted_at=ranked_match.job.posted_at,
            is_applied=applied_by_key.get(ranked_match.job.unique_key, (False, None))[0],
            applied_at=applied_by_key.get(ranked_match.job.unique_key, (False, None))[1],
            score=ranked_match.score,
            semantic_score=ranked_match.semantic_score,
            skill_overlap_score=ranked_match.skill_overlap_score,
            title_score=ranked_match.title_score,
            matched_skills=ranked_match.matched_skills,
            explanation=ranked_match.explanation,
        )
        for ranked_match in ranked_matches
    ]


def build_query_from_resume(skills: list[str]) -> str:
    priority = ["teamcenter", "nx", "plm", "catia", "cad", "python"]
    ordered = [skill for skill in priority if skill in {item.lower() for item in skills}]
    return " ".join(ordered[:5]) or "Teamcenter NX PLM"


async def load_applied_jobs_by_unique_key(
    db: AsyncSession,
    ranked_matches,
) -> dict[str, tuple[bool, object]]:
    unique_keys = [
        build_job_unique_key_from_parts(
            ranked_match.job.source,
            ranked_match.job.source_external_id,
            ranked_match.job.url,
        )
        for ranked_match in ranked_matches
    ]
    if not unique_keys:
        return {}

    result = await db.execute(select(Job).where(Job.unique_key.in_(unique_keys)))
    return {
        job.unique_key: (job.is_applied, job.applied_at)
        for job in result.scalars().all()
    }
