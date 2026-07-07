# AI Job Matcher

AI-powered engineering job matching platform for resume parsing, fresh job discovery, and semantic match scoring.

## Backend

The FastAPI backend lives in `backend/`.

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
uvicorn app.main:app --reload
```

See `backend/README.md` for architecture and setup details.
