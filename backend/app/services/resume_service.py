from pathlib import Path
from uuid import UUID
from uuid import uuid4

from fastapi import UploadFile, status
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.resume import Resume
from app.services.resume_parser import ParsedResume, ResumeParser, ResumeParsingError


class ResumeUploadError(Exception):
    def __init__(self, message: str, status_code: int = status.HTTP_400_BAD_REQUEST):
        self.message = message
        self.status_code = status_code
        super().__init__(message)


class ResumeService:
    def __init__(self, db: AsyncSession | None = None):
        self.db = db
        self.parser = ResumeParser()

    async def list_saved_resumes(self, limit: int = 20) -> list[Resume]:
        if self.db is None:
            raise ResumeUploadError("Database session is required to load resumes.")

        bounded_limit = min(max(limit, 1), 100)
        result = await self.db.execute(
            select(Resume).order_by(desc(Resume.created_at)).limit(bounded_limit)
        )
        return list(result.scalars().all())

    async def get_saved_resume(self, resume_id: UUID) -> Resume | None:
        if self.db is None:
            raise ResumeUploadError("Database session is required to load resumes.")

        return await self.db.get(Resume, resume_id)

    async def store_upload(self, file: UploadFile) -> Resume:
        original_filename = Path(file.filename or "").name
        extension = Path(original_filename).suffix.lower()

        if not original_filename:
            raise ResumeUploadError("Uploaded file must include a filename.")

        if extension not in settings.ALLOWED_RESUME_EXTENSIONS:
            allowed = ", ".join(sorted(settings.ALLOWED_RESUME_EXTENSIONS))
            raise ResumeUploadError(f"Unsupported resume file type. Allowed: {allowed}.")

        upload_dir = settings.UPLOAD_DIR
        upload_dir.mkdir(parents=True, exist_ok=True)

        stored_filename = f"{uuid4()}{extension}"
        storage_path = upload_dir / stored_filename
        file_size = await self._write_upload(file, storage_path)
        parsed_resume = self._parse_storage_path(storage_path)

        resume = Resume(
            original_filename=original_filename,
            stored_filename=stored_filename,
            content_type=file.content_type,
            file_size_bytes=file_size,
            storage_path=str(storage_path),
            parsed_json=parsed_resume.to_dict(),
        )
        if self.db is None:
            raise ResumeUploadError("Database session is required to store resumes.")

        self.db.add(resume)
        await self.db.commit()
        await self.db.refresh(resume)
        return resume

    async def parse_upload(self, file: UploadFile) -> ParsedResume:
        original_filename = Path(file.filename or "").name
        extension = Path(original_filename).suffix.lower()

        if not original_filename:
            raise ResumeUploadError("Uploaded file must include a filename.")

        if extension not in settings.ALLOWED_RESUME_EXTENSIONS:
            allowed = ", ".join(sorted(settings.ALLOWED_RESUME_EXTENSIONS))
            raise ResumeUploadError(f"Unsupported resume file type. Allowed: {allowed}.")

        upload_dir = settings.UPLOAD_DIR
        upload_dir.mkdir(parents=True, exist_ok=True)
        temporary_path = upload_dir / f"parse-{uuid4()}{extension}"

        try:
            await self._write_upload(file, temporary_path)
            return self._parse_storage_path(temporary_path)
        finally:
            temporary_path.unlink(missing_ok=True)

    async def _write_upload(self, file: UploadFile, storage_path: Path) -> int:
        file_size = 0

        try:
            with storage_path.open("wb") as destination:
                while chunk := await file.read(1024 * 1024):
                    file_size += len(chunk)
                    if file_size > settings.max_upload_size_bytes:
                        destination.close()
                        storage_path.unlink(missing_ok=True)
                        raise ResumeUploadError(
                            f"Resume exceeds {settings.MAX_UPLOAD_SIZE_MB} MB upload limit.",
                            status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        )
                    destination.write(chunk)
        finally:
            await file.close()

        if file_size == 0:
            storage_path.unlink(missing_ok=True)
            raise ResumeUploadError("Uploaded resume cannot be empty.")

        return file_size

    def _parse_storage_path(self, storage_path: Path) -> ParsedResume:
        try:
            return self.parser.parse_file(storage_path)
        except ResumeParsingError as exc:
            storage_path.unlink(missing_ok=True)
            raise ResumeUploadError(str(exc)) from exc
