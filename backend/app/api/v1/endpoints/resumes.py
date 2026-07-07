from uuid import UUID

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.schemas.resume import ParsedResumeResponse, ResumeResponse, ResumeUploadResponse
from app.services.resume_service import ResumeService, ResumeUploadError

router = APIRouter()


@router.get("", response_model=list[ResumeResponse])
async def list_resumes(
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
) -> list[ResumeResponse]:
    service = ResumeService(db)

    try:
        resumes = await service.list_saved_resumes(limit)
    except ResumeUploadError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc
    except (OSError, SQLAlchemyError) as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Database unavailable: {exc}",
        ) from exc

    return [ResumeResponse.model_validate(resume) for resume in resumes]


@router.get("/{resume_id}", response_model=ResumeResponse)
async def get_resume(
    resume_id: UUID,
    db: AsyncSession = Depends(get_db),
) -> ResumeResponse:
    service = ResumeService(db)

    try:
        resume = await service.get_saved_resume(resume_id)
    except ResumeUploadError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc
    except (OSError, SQLAlchemyError) as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Database unavailable: {exc}",
        ) from exc

    if resume is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found.")

    return ResumeResponse.model_validate(resume)


@router.post(
    "/upload",
    response_model=ResumeUploadResponse,
    status_code=status.HTTP_201_CREATED,
)
async def upload_resume(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
) -> ResumeUploadResponse:
    service = ResumeService(db)

    try:
        resume = await service.store_upload(file)
    except ResumeUploadError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc
    except (OSError, SQLAlchemyError) as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Database unavailable: {exc}",
        ) from exc

    return ResumeUploadResponse.model_validate(resume)


@router.post("/parse", response_model=ParsedResumeResponse)
async def parse_resume(file: UploadFile = File(...)) -> ParsedResumeResponse:
    service = ResumeService()

    try:
        parsed_resume = await service.parse_upload(file)
    except ResumeUploadError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc

    return ParsedResumeResponse.model_validate(parsed_resume.to_dict())
