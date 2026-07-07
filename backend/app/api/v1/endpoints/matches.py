from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.schemas.match import RankJobsRequest, RankJobsResponse, RankedJobResponse
from app.services.matching_service import MatchingService, ResumeNotFoundError

router = APIRouter()


@router.post("/rank", response_model=RankJobsResponse)
async def rank_jobs(
    request: RankJobsRequest,
    db: AsyncSession = Depends(get_db),
) -> RankJobsResponse:
    service = MatchingService(db)

    try:
        ranked_matches = await service.rank_jobs_for_resume(
            resume_id=request.resume_id,
            limit=request.limit,
        )
    except ResumeNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Resume not found: {exc}",
        ) from exc
    except (OSError, SQLAlchemyError) as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Database unavailable: {exc}",
        ) from exc

    return RankJobsResponse(
        resume_id=request.resume_id,
        results=[
            RankedJobResponse(
                job_id=ranked_match.job.id,
                title=ranked_match.job.title,
                company=ranked_match.job.company,
                location=ranked_match.job.location,
                source=ranked_match.job.source,
                url=ranked_match.job.url,
                posted_at=ranked_match.job.posted_at,
                is_applied=ranked_match.job.is_applied,
                applied_at=ranked_match.job.applied_at,
                score=ranked_match.score,
                semantic_score=ranked_match.semantic_score,
                skill_overlap_score=ranked_match.skill_overlap_score,
                title_score=ranked_match.title_score,
                matched_skills=ranked_match.matched_skills,
                explanation=ranked_match.explanation,
            )
            for ranked_match in ranked_matches
        ],
    )
