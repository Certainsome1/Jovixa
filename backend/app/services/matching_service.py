from __future__ import annotations

from dataclasses import dataclass
from uuid import UUID, uuid4

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.job import Job
from app.models.match import Match
from app.models.resume import Resume
from app.services.embedding_service import (
    EmbeddingProvider,
    build_embedding_provider,
    cosine_similarity,
)
from app.services.job_service import build_job_unique_key_from_parts
from app.services.job_providers import JobPosting


@dataclass(frozen=True)
class RankedJobMatch:
    job: Job
    score: float
    semantic_score: float
    skill_overlap_score: float
    title_score: float
    matched_skills: list[str]
    explanation: str


class MatchingService:
    def __init__(
        self,
        db: AsyncSession,
        embedding_provider: EmbeddingProvider | None = None,
    ):
        self.db = db
        self.embedding_provider = embedding_provider or build_embedding_provider()

    async def rank_jobs_for_resume(
        self,
        resume_id: UUID,
        limit: int = 25,
    ) -> list[RankedJobMatch]:
        resume = await self.db.get(Resume, resume_id)
        if resume is None:
            raise ResumeNotFoundError(str(resume_id))

        result = await self.db.execute(select(Job))
        jobs = list(result.scalars().all())

        resume_text = build_resume_match_text(resume)
        resume_embedding = resume.embedding or self.embedding_provider.embed(resume_text).vector
        resume.embedding = resume_embedding

        ranked_matches = []
        for job in jobs:
            ranked_match = self.score_job(resume, resume_embedding, job)
            ranked_matches.append(ranked_match)
            await self._upsert_match(resume.id, ranked_match)

        await self.db.commit()

        return sorted(ranked_matches, key=lambda match: match.score, reverse=True)[:limit]

    def score_job(
        self,
        resume: Resume,
        resume_embedding: list[float],
        job: Job,
    ) -> RankedJobMatch:
        job_text = build_job_match_text(job)
        job_embedding = job.embedding or self.embedding_provider.embed(job_text).vector
        job.embedding = job_embedding

        semantic_score = clamp_score(cosine_similarity(resume_embedding, job_embedding))
        matched_skills = extract_matched_skills(resume.parsed_json or {}, job_text)
        skill_overlap_score = calculate_skill_overlap_score(resume.parsed_json or {}, matched_skills)
        title_score = calculate_title_score(resume.parsed_json or {}, job.title)
        score = round(
            (semantic_score * 0.65) + (skill_overlap_score * 0.25) + (title_score * 0.10),
            4,
        )

        explanation = build_match_explanation(
            semantic_score=semantic_score,
            skill_overlap_score=skill_overlap_score,
            title_score=title_score,
            matched_skills=matched_skills,
        )

        return RankedJobMatch(
            job=job,
            score=score,
            semantic_score=round(semantic_score, 4),
            skill_overlap_score=round(skill_overlap_score, 4),
            title_score=round(title_score, 4),
            matched_skills=matched_skills,
            explanation=explanation,
        )

    async def _upsert_match(self, resume_id: UUID, ranked_match: RankedJobMatch) -> None:
        result = await self.db.execute(
            select(Match).where(
                Match.resume_id == resume_id,
                Match.job_id == ranked_match.job.id,
            )
        )
        existing_match = result.scalar_one_or_none()
        explanation = {
            "semantic_score": ranked_match.semantic_score,
            "skill_overlap_score": ranked_match.skill_overlap_score,
            "title_score": ranked_match.title_score,
            "matched_skills": ranked_match.matched_skills,
            "summary": ranked_match.explanation,
        }

        if existing_match is None:
            self.db.add(
                Match(
                    resume_id=resume_id,
                    job_id=ranked_match.job.id,
                    score=ranked_match.score,
                    explanation=explanation,
                )
            )
            return

        existing_match.score = ranked_match.score
        existing_match.explanation = explanation


class ResumeNotFoundError(Exception):
    pass


def build_resume_match_text(resume: Resume) -> str:
    parsed = resume.parsed_json or {}
    skills = " ".join(parsed.get("skills") or [])
    companies = " ".join(parsed.get("companies") or [])
    text = parsed.get("text") or ""
    experience = parsed.get("experience_years")
    return f"{text}\nSkills: {skills}\nCompanies: {companies}\nExperience years: {experience or ''}"


def build_job_match_text(job: Job) -> str:
    return "\n".join(
        value
        for value in [
            job.title,
            job.company,
            job.location,
            job.description,
        ]
        if value
    )


def extract_matched_skills(parsed_resume: dict, job_text: str) -> list[str]:
    job_text_lower = job_text.lower()
    skills = parsed_resume.get("skills") or []
    return sorted({skill for skill in skills if skill.lower() in job_text_lower})


def calculate_skill_overlap_score(parsed_resume: dict, matched_skills: list[str]) -> float:
    resume_skills = parsed_resume.get("skills") or []
    if not resume_skills:
        return 0.0
    return len(matched_skills) / len(set(skill.lower() for skill in resume_skills))


def calculate_title_score(parsed_resume: dict, title: str) -> float:
    title_lower = (title or "").lower()
    skills = parsed_resume.get("skills") or []
    if not skills:
        return 0.0

    title_hits = sum(1 for skill in skills if skill.lower() in title_lower)
    return min(title_hits / 2, 1.0)


def clamp_score(value: float) -> float:
    return max(0.0, min(1.0, value))


def build_match_explanation(
    semantic_score: float,
    skill_overlap_score: float,
    title_score: float,
    matched_skills: list[str],
) -> str:
    if not matched_skills and semantic_score < 0.2:
        return "Low match: limited semantic similarity and no direct resume skill overlap."

    reasons = []
    if semantic_score >= 0.35:
        reasons.append("strong semantic similarity")
    elif semantic_score >= 0.2:
        reasons.append("moderate semantic similarity")

    if matched_skills:
        reasons.append(f"matched skills: {', '.join(matched_skills)}")

    if title_score > 0:
        reasons.append("job title aligns with resume skills")

    return "; ".join(reasons) or "Partial match based on available resume and job text."


def rank_live_postings(
    parsed_resume: dict,
    postings: list[JobPosting],
    limit: int = 25,
) -> list[RankedJobMatch]:
    provider = build_embedding_provider()
    service = MatchingService(db=None, embedding_provider=provider)
    resume = Resume(
        id=uuid4(),
        original_filename="live-resume",
        stored_filename="live-resume",
        file_size_bytes=0,
        storage_path="",
        parsed_json=parsed_resume,
    )
    resume_embedding = provider.embed(build_resume_match_text(resume)).vector
    ranked_matches = []

    for posting in postings:
        job = Job(
            id=uuid4(),
            unique_key=build_job_unique_key_from_parts(
                posting.source,
                posting.source_external_id,
                posting.url,
            ),
            source=posting.source,
            source_external_id=posting.source_external_id,
            title=posting.title,
            company=posting.company,
            location=posting.location,
            description=posting.description,
            url=posting.url,
            posted_at=posting.posted_at,
            raw_payload=posting.raw_payload,
        )
        ranked_matches.append(service.score_job(resume, resume_embedding, job))

    return sorted(ranked_matches, key=lambda match: match.score, reverse=True)[:limit]
