from app.services.job_providers import JobPosting
from app.services.job_service import build_job_unique_key


def test_build_job_unique_key_prefers_source_external_id():
    first = JobPosting(
        source="indeed",
        source_external_id="ABC123",
        title="PLM Engineer",
        url="https://example.com/old",
    )
    second = JobPosting(
        source="indeed",
        source_external_id="ABC123",
        title="PLM Engineer",
        url="https://example.com/new",
    )

    assert build_job_unique_key(first) == build_job_unique_key(second)


def test_build_job_unique_key_is_source_scoped():
    indeed = JobPosting(
        source="indeed",
        source_external_id="123",
        title="PLM Engineer",
        url="https://example.com/job",
    )
    linkedin = JobPosting(
        source="linkedin",
        source_external_id="123",
        title="PLM Engineer",
        url="https://example.com/job",
    )

    assert build_job_unique_key(indeed) != build_job_unique_key(linkedin)
