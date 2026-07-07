# AI Job Matcher Backend

FastAPI backend foundation for the AI-powered engineering job matcher.

## Architecture

- `app/main.py` creates the FastAPI app, configures CORS, and owns application startup/shutdown.
- `app/api/v1` contains versioned API routers and endpoint modules.
- `app/core/config.py` loads environment-driven settings from `.env`.
- `app/db` owns SQLAlchemy async engine, sessions, and metadata initialization.
- `app/models` contains database models.
- `app/schemas` contains Pydantic API contracts.
- `app/services` contains business logic such as resume upload validation and storage.

## Endpoints

- `GET /api/v1/health` checks API and PostgreSQL connectivity.
- `POST /api/v1/resumes/upload` accepts `.pdf` and `.docx` resume uploads.
- `POST /api/v1/resumes/parse` extracts resume text, skills, experience years, and companies as structured JSON.
- `POST /api/v1/jobs/fetch` fetches jobs from LinkedIn, Indeed, and optional organization job-board providers, then stores them.
- `GET /api/v1/jobs` lists stored jobs newest-first.
- `POST /api/v1/matches/rank` generates embeddings, scores stored jobs against a resume, and returns ranked matches.

## Setup

1. Create and activate a virtual environment:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

2. Install dependencies:

```powershell
pip install -r requirements.txt
```

The parser can use spaCy when available. If `en_core_web_sm` is installed it will use named entity recognition for companies; otherwise it falls back to resume-specific heuristics. On Python versions supported by spaCy stable releases, install the optional NLP stack with:

```powershell
pip install -r requirements-spacy.txt
python -m spacy download en_core_web_sm
```

3. Create your environment file:

```powershell
Copy-Item .env.example .env
```

4. Use the local development database, or update `DATABASE_URL` in `.env` for PostgreSQL:

```env
DATABASE_URL="sqlite+aiosqlite:///./ai_job_matcher.db"
```

5. Start the API:

```powershell
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`.

## Job Fetching

Job fetching uses source adapters:

- LinkedIn: `LINKEDIN_JOB_SEARCH_URL_TEMPLATE`
- Indeed: `INDEED_JOB_FEED_URL_TEMPLATE`
- Arbeitnow: `ARBEITNOW_JOB_API_URL_TEMPLATE`
- Remotive: `REMOTIVE_JOB_API_URL_TEMPLATE`
- Organization boards: `ORGANIZATION_JOB_BOARD_URLS`, plus per-request `job_board_urls`

Both templates support `{query}` and `{location}` placeholders. Fetched jobs are stored with a source-specific unique key to avoid duplicates, and each row includes `posted_at`, `fetched_at`, `created_at`, and `updated_at`.

Organization job-board URLs can point to JSON APIs, JSON-LD job posting pages, or generic career pages. Add comma-separated defaults in `.env`:

```env
ORGANIZATION_JOB_BOARD_URLS="https://company.example.com/careers?search={query}&location={location},https://boards-api.greenhouse.io/v1/boards/company/jobs?content=true"
```

Or send custom URLs with a single fetch request:

Run a manual fetch:

```powershell
curl.exe -X POST "http://localhost:8000/api/v1/jobs/fetch" -H "Content-Type: application/json" -d "{\"query\":\"Teamcenter NX PLM\",\"location\":\"India\",\"job_board_urls\":[\"https://company.example.com/careers?search={query}\"]}"
```

Enable periodic fetching:

```env
ENABLE_JOB_SCHEDULER=true
JOB_FETCH_INTERVAL_SECONDS=3600
```

If your local network injects a proxy certificate and Python reports `CERTIFICATE_VERIFY_FAILED`, keep `JOB_SOURCE_VERIFY_SSL=false` for local development. Use `true` in production with a trusted certificate chain.

## Semantic Matching

The MVP matching engine uses a deterministic local hashing embedding provider, so it works without an external AI API key. It stores generated vectors on `resumes.embedding` and `jobs.embedding`, then upserts rows in `matches` with score details.

Run ranking for a stored resume:

```powershell
curl.exe -X POST "http://localhost:8000/api/v1/matches/rank" -H "Content-Type: application/json" -d "{\"resume_id\":\"00000000-0000-0000-0000-000000000000\",\"limit\":25}"
```

## Database

Local development uses SQLite by default so the app works without installing PostgreSQL:

```env
DATABASE_URL="sqlite+aiosqlite:///./ai_job_matcher.db"
AUTO_CREATE_TABLES=true
```

For PostgreSQL, create the database before starting the API:

```sql
CREATE DATABASE ai_job_matcher;
```

Then use:

```env
DATABASE_URL="postgresql+asyncpg://postgres:postgres@localhost:5432/ai_job_matcher"
```

For production deployments, use migrations before changing schemas. For quick local MVP setup, set `AUTO_CREATE_TABLES=true` after creating the database to let the app create the initial tables at startup.

## Example Upload

```powershell
curl.exe -X POST "http://localhost:8000/api/v1/resumes/upload" -F "file=@C:\path\to\resume.pdf"
```
