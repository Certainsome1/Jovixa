from __future__ import annotations

import re
from dataclasses import dataclass
from pathlib import Path

import docx2txt
import fitz

try:
    import spacy
except ImportError:
    spacy = None


class ResumeParsingError(Exception):
    pass


@dataclass(frozen=True)
class ParsedResume:
    text: str
    skills: list[str]
    experience_years: float | None
    companies: list[str]

    def to_dict(self) -> dict:
        return {
            "text": self.text,
            "skills": self.skills,
            "experience_years": self.experience_years,
            "companies": self.companies,
        }


class ResumeParser:
    SKILL_KEYWORDS = {
        "3dexperience": ["3dexperience", "3d experience"],
        "agile": ["agile", "scrum"],
        "aws": ["aws", "amazon web services"],
        "azure": ["azure"],
        "bmide": ["bmide"],
        "cad": ["cad", "computer aided design"],
        "catia": ["catia"],
        "celery": ["celery"],
        "docker": ["docker"],
        "fastapi": ["fastapi"],
        "git": ["git", "github", "gitlab"],
        "java": ["java"],
        "javascript": ["javascript", "js"],
        "jt": ["jt"],
        "kubernetes": ["kubernetes", "k8s"],
        "nx": ["nx", "siemens nx", "unigraphics"],
        "plm": ["plm", "product lifecycle management"],
        "postgresql": ["postgresql", "postgres"],
        "python": ["python"],
        "react": ["react", "react.js"],
        "sql": ["sql"],
        "step": ["step"],
        "teamcenter": ["teamcenter", "team center"],
        "typescript": ["typescript", "ts"],
    }

    COMPANY_SUFFIX_PATTERN = re.compile(
        r"\b([A-Z][A-Za-z0-9&.,' -]{1,80}?\s(?:"
        r"Inc|LLC|Ltd|Limited|Technologies|Technology|Systems|Solutions|"
        r"Services|Software|Industries|Motors|Automotive|Engineering|Consulting|"
        r"Corporation|Corp|GmbH|AG|Pvt\.?\s+Ltd\.?"
        r"))\b"
    )
    AT_COMPANY_PATTERN = re.compile(
        r"\b(?:at|with|for)\s+([A-Z][A-Za-z0-9&.,' -]{2,80})(?=[\n,.;)]|$)"
    )
    YEARS_PATTERN = re.compile(
        r"\b(\d+(?:\.\d+)?)\+?\s*(?:years?|yrs?)\b", re.IGNORECASE
    )
    EXPERIENCE_CONTEXT_PATTERN = re.compile(
        r"(?:experience|exp\.?|professional experience|work experience)",
        re.IGNORECASE,
    )

    def __init__(self) -> None:
        self.nlp = self._load_spacy_pipeline()

    def parse_file(self, path: Path) -> ParsedResume:
        extension = path.suffix.lower()

        if extension == ".pdf":
            text = self._extract_pdf_text(path)
        elif extension == ".docx":
            text = self._extract_docx_text(path)
        else:
            raise ResumeParsingError("Only PDF and DOCX resumes can be parsed.")

        return self.parse_text(text)

    def parse_text(self, text: str) -> ParsedResume:
        normalized_text = self._normalize_text(text)

        if not normalized_text:
            raise ResumeParsingError("Resume text could not be extracted.")

        return ParsedResume(
            text=normalized_text,
            skills=self.extract_skills(normalized_text),
            experience_years=self.extract_experience_years(normalized_text),
            companies=self.extract_companies(normalized_text),
        )

    def extract_skills(self, text: str) -> list[str]:
        lowered = text.lower()
        skills = []

        for canonical, aliases in self.SKILL_KEYWORDS.items():
            if any(self._contains_term(lowered, alias) for alias in aliases):
                skills.append(canonical)

        return sorted(skills)

    def extract_experience_years(self, text: str) -> float | None:
        candidates: list[tuple[float, bool]] = []

        for match in self.YEARS_PATTERN.finditer(text):
            value = float(match.group(1))
            window_start = max(match.start() - 80, 0)
            window_end = min(match.end() + 80, len(text))
            context = text[window_start:window_end]
            has_experience_context = bool(self.EXPERIENCE_CONTEXT_PATTERN.search(context))
            candidates.append((value, has_experience_context))

        if not candidates:
            return None

        contextual_values = [value for value, has_context in candidates if has_context]
        values = contextual_values or [value for value, _ in candidates]
        return max(values)

    def extract_companies(self, text: str) -> list[str]:
        companies: list[str] = []

        if self.nlp is not None:
            doc = self.nlp(text)
            for entity in doc.ents:
                if entity.label_ == "ORG":
                    companies.append(entity.text)

        companies.extend(match.group(1) for match in self.COMPANY_SUFFIX_PATTERN.finditer(text))
        companies.extend(match.group(1) for match in self.AT_COMPANY_PATTERN.finditer(text))

        return self._unique_cleaned(companies)

    def _extract_pdf_text(self, path: Path) -> str:
        try:
            with fitz.open(path) as document:
                return "\n".join(page.get_text("text") for page in document)
        except Exception as exc:
            raise ResumeParsingError("Could not extract text from PDF resume.") from exc

    def _extract_docx_text(self, path: Path) -> str:
        try:
            return docx2txt.process(str(path)) or ""
        except Exception as exc:
            raise ResumeParsingError("Could not extract text from DOCX resume.") from exc

    def _load_spacy_pipeline(self):
        if spacy is None:
            return None

        try:
            return spacy.load("en_core_web_sm")
        except OSError:
            return spacy.blank("en")

    def _contains_term(self, lowered_text: str, term: str) -> bool:
        escaped = re.escape(term.lower())
        return bool(re.search(rf"(?<![a-z0-9+#]){escaped}(?![a-z0-9+#])", lowered_text))

    def _normalize_text(self, text: str) -> str:
        lines = [" ".join(line.split()) for line in text.replace("\x00", " ").splitlines()]
        return "\n".join(line for line in lines if line).strip()

    def _unique_cleaned(self, values: list[str]) -> list[str]:
        seen = set()
        cleaned_values = []

        for value in values:
            cleaned = re.sub(r"\s+", " ", value).strip(" ,.;:-")
            if len(cleaned) < 2:
                continue
            key = cleaned.lower()
            if key in seen:
                continue
            seen.add(key)
            cleaned_values.append(cleaned)

        return sorted(cleaned_values)
