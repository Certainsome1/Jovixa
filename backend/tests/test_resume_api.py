from fastapi.testclient import TestClient

from app.main import app
from app.services.resume_parser import ParsedResume
from app.services.resume_service import ResumeService


def test_parse_resume_endpoint_returns_structured_json(monkeypatch):
    async def fake_parse_upload(self, file):
        return ParsedResume(
            text="Teamcenter engineer with 3 years at Bosch India.",
            skills=["teamcenter", "nx"],
            experience_years=3.0,
            companies=["Bosch India"],
        )

    monkeypatch.setattr(ResumeService, "parse_upload", fake_parse_upload)

    client = TestClient(app)
    response = client.post(
        "/api/v1/resumes/parse",
        files={"file": ("resume.pdf", b"%PDF test", "application/pdf")},
    )

    assert response.status_code == 200
    assert response.json() == {
        "text": "Teamcenter engineer with 3 years at Bosch India.",
        "skills": ["teamcenter", "nx"],
        "experience_years": 3.0,
        "companies": ["Bosch India"],
    }
