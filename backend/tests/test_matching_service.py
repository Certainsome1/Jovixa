from uuid import uuid4

from app.models.job import Job
from app.models.resume import Resume
from app.services.embedding_service import HashingEmbeddingProvider, cosine_similarity
from app.services.matching_service import MatchingService


def test_hashing_embedding_provider_generates_comparable_vectors():
    provider = HashingEmbeddingProvider(dimensions=64)

    first = provider.embed("teamcenter nx plm cad support").vector
    second = provider.embed("teamcenter nx plm engineering support").vector
    unrelated = provider.embed("frontend react dashboard design").vector

    assert len(first) == 64
    assert cosine_similarity(first, second) > cosine_similarity(first, unrelated)


def test_score_job_rewards_semantic_and_skill_overlap():
    provider = HashingEmbeddingProvider(dimensions=64)
    service = MatchingService(db=None, embedding_provider=provider)
    resume = Resume(
        id=uuid4(),
        original_filename="resume.pdf",
        stored_filename="resume.pdf",
        file_size_bytes=100,
        storage_path="resume.pdf",
        parsed_json={
            "text": "Teamcenter NX PLM engineer with CAD support experience",
            "skills": ["teamcenter", "nx", "plm", "cad"],
            "companies": ["Siemens"],
            "experience_years": 4,
        },
    )
    resume_embedding = provider.embed("Teamcenter NX PLM engineer with CAD support").vector
    strong_job = Job(
        id=uuid4(),
        unique_key="strong",
        source="indeed",
        title="Teamcenter NX PLM Support Engineer",
        company="Bosch",
        url="https://example.com/strong",
        description="Support Teamcenter, NX, CAD publishing, and PLM workflows.",
    )
    weak_job = Job(
        id=uuid4(),
        unique_key="weak",
        source="indeed",
        title="Frontend Developer",
        company="Acme",
        url="https://example.com/weak",
        description="Build React UI dashboards and CSS components.",
    )

    strong_match = service.score_job(resume, resume_embedding, strong_job)
    weak_match = service.score_job(resume, resume_embedding, weak_job)

    assert strong_match.score > weak_match.score
    assert strong_match.matched_skills == ["cad", "nx", "plm", "teamcenter"]
    assert strong_match.skill_overlap_score == 1.0
