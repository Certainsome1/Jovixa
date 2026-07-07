from __future__ import annotations

import html
import json
import re
from dataclasses import dataclass, field
from datetime import datetime
from email.utils import parsedate_to_datetime
from urllib.parse import quote_plus, urljoin, urlparse
from xml.etree import ElementTree

import httpx


@dataclass(frozen=True)
class JobPosting:
    source: str
    title: str
    url: str
    company: str | None = None
    location: str | None = None
    description: str | None = None
    posted_at: datetime | None = None
    source_external_id: str | None = None
    raw_payload: dict = field(default_factory=dict)


class BaseJobProvider:
    source: str

    async def fetch(self, query: str, location: str) -> list[JobPosting]:
        raise NotImplementedError


class IndeedJobProvider(BaseJobProvider):
    source = "indeed"

    def __init__(self, feed_url_template: str, timeout_seconds: int = 20, verify_ssl: bool = True):
        self.feed_url_template = feed_url_template
        self.timeout_seconds = timeout_seconds
        self.verify_ssl = verify_ssl

    async def fetch(self, query: str, location: str) -> list[JobPosting]:
        url = self.feed_url_template.format(
            query=quote_plus(query),
            location=quote_plus(location),
        )

        async with httpx.AsyncClient(
            timeout=self.timeout_seconds,
            follow_redirects=True,
            verify=self.verify_ssl,
        ) as client:
            response = await client.get(url, headers={"User-Agent": "AIJobMatcher/0.1"})
            response.raise_for_status()

        return parse_indeed_rss(response.text)


class LinkedInJobProvider(BaseJobProvider):
    source = "linkedin"

    def __init__(self, search_url_template: str, timeout_seconds: int = 20, verify_ssl: bool = True):
        self.search_url_template = search_url_template
        self.timeout_seconds = timeout_seconds
        self.verify_ssl = verify_ssl

    async def fetch(self, query: str, location: str) -> list[JobPosting]:
        url = self.search_url_template.format(
            query=quote_plus(query),
            location=quote_plus(location),
        )

        async with httpx.AsyncClient(
            timeout=self.timeout_seconds,
            follow_redirects=True,
            verify=self.verify_ssl,
        ) as client:
            response = await client.get(url, headers={"User-Agent": "AIJobMatcher/0.1"})
            response.raise_for_status()

        return parse_linkedin_guest_html(response.text)


class ArbeitnowJobProvider(BaseJobProvider):
    source = "arbeitnow"

    def __init__(self, api_url_template: str, timeout_seconds: int = 20, verify_ssl: bool = True):
        self.api_url_template = api_url_template
        self.timeout_seconds = timeout_seconds
        self.verify_ssl = verify_ssl

    async def fetch(self, query: str, location: str) -> list[JobPosting]:
        url = self.api_url_template.format(
            query=quote_plus(query),
            location=quote_plus(location),
        )

        async with httpx.AsyncClient(
            timeout=self.timeout_seconds,
            follow_redirects=True,
            verify=self.verify_ssl,
        ) as client:
            response = await client.get(url, headers={"User-Agent": "AIJobMatcher/0.1"})
            response.raise_for_status()

        return parse_arbeitnow_jobs(response.text, query=query, location=location)


class RemotiveJobProvider(BaseJobProvider):
    source = "remotive"

    def __init__(self, api_url_template: str, timeout_seconds: int = 20, verify_ssl: bool = True):
        self.api_url_template = api_url_template
        self.timeout_seconds = timeout_seconds
        self.verify_ssl = verify_ssl

    async def fetch(self, query: str, location: str) -> list[JobPosting]:
        url = self.api_url_template.format(
            query=quote_plus(query),
            location=quote_plus(location),
        )

        async with httpx.AsyncClient(
            timeout=self.timeout_seconds,
            follow_redirects=True,
            verify=self.verify_ssl,
        ) as client:
            response = await client.get(url, headers={"User-Agent": "AIJobMatcher/0.1"})
            response.raise_for_status()

        return parse_remotive_jobs(response.text, query=query, location=location)


class OrganizationJobBoardProvider(BaseJobProvider):
    def __init__(
        self,
        job_board_url: str,
        timeout_seconds: int = 20,
        verify_ssl: bool = True,
    ):
        self.job_board_url = job_board_url
        self.timeout_seconds = timeout_seconds
        self.verify_ssl = verify_ssl
        host = urlparse(job_board_url).netloc.replace("www.", "") or "organization"
        self.source = f"org:{host}"

    async def fetch(self, query: str, location: str) -> list[JobPosting]:
        url = self.job_board_url.format(
            query=quote_plus(query),
            location=quote_plus(location),
        )

        async with httpx.AsyncClient(
            timeout=self.timeout_seconds,
            follow_redirects=True,
            verify=self.verify_ssl,
        ) as client:
            response = await client.get(url, headers={"User-Agent": "AIJobMatcher/0.1"})
            response.raise_for_status()

        content_type = response.headers.get("content-type", "")
        postings = parse_organization_job_board(
            response.text,
            base_url=str(response.url),
            source=self.source,
            query=query,
            location=location,
            content_type=content_type,
        )
        return postings


def parse_indeed_rss(feed_text: str) -> list[JobPosting]:
    root = ElementTree.fromstring(feed_text)
    postings = []

    for item in root.findall(".//item"):
        title_text = _node_text(item, "title")
        url = _node_text(item, "link")
        description = _clean_html(_node_text(item, "description"))
        guid = _node_text(item, "guid") or url
        posted_at = _parse_datetime(_node_text(item, "pubDate"))

        if not title_text or not url:
            continue

        title, company = _split_indeed_title(title_text)
        postings.append(
            JobPosting(
                source="indeed",
                source_external_id=guid,
                title=title,
                company=company,
                description=description,
                url=url,
                posted_at=posted_at,
                raw_payload={"title": title_text, "guid": guid},
            )
        )

    return postings


def parse_linkedin_guest_html(html_text: str) -> list[JobPosting]:
    cards = re.findall(r"<li\b.*?</li>", html_text, flags=re.IGNORECASE | re.DOTALL)
    postings = []

    for card in cards:
        title = _clean_html(
            _first_match(card, r'class="[^"]*base-search-card__title[^"]*"[^>]*>(.*?)</')
        )
        company = _clean_html(
            _first_match(
                card,
                r'class="[^"]*base-search-card__subtitle[^"]*"[^>]*>.*?<a[^>]*>(.*?)</a>',
            )
        )
        location = _clean_html(
            _first_match(card, r'class="[^"]*job-search-card__location[^"]*"[^>]*>(.*?)</')
        )
        url = html.unescape(_first_match(card, r'href="([^"]*?/jobs/view/[^"]*)"'))
        external_id = _first_match(card, r"currentJobId=(\d+)") or _first_match(
            url, r"/jobs/view/(\d+)"
        )

        if not title or not url:
            continue

        postings.append(
            JobPosting(
                source="linkedin",
                source_external_id=external_id,
                title=title,
                company=company,
                location=location,
                url=url,
                raw_payload={"external_id": external_id},
            )
        )

    return postings


def parse_arbeitnow_jobs(body_text: str, *, query: str, location: str) -> list[JobPosting]:
    try:
        payload = json.loads(body_text)
    except json.JSONDecodeError:
        return []

    postings = []
    for item in payload.get("data", []):
        title = str(item.get("title") or "").strip()
        url = str(item.get("url") or "").strip()
        company = str(item.get("company_name") or "").strip() or None
        locations = item.get("location") or item.get("locations") or []
        if isinstance(locations, str):
            location_text = locations
        else:
            location_text = ", ".join(str(part) for part in locations if part)
        description = _clean_html(str(item.get("description") or ""))
        posted_at = _parse_unix_datetime(item.get("created_at"))
        external_id = str(item.get("slug") or item.get("id") or url)

        if not title or not url:
            continue

        postings.append(
            JobPosting(
                source="arbeitnow",
                source_external_id=external_id,
                title=title,
                company=company,
                location=location_text or None,
                description=description or None,
                url=url,
                posted_at=posted_at,
                raw_payload={"source": "arbeitnow", "tags": item.get("tags") or []},
            )
        )

    return filter_job_board_results(_dedupe_postings(postings), query=query, location=location)


def parse_remotive_jobs(body_text: str, *, query: str, location: str) -> list[JobPosting]:
    try:
        payload = json.loads(body_text)
    except json.JSONDecodeError:
        return []

    postings = []
    for item in payload.get("jobs", []):
        title = str(item.get("title") or "").strip()
        url = str(item.get("url") or "").strip()
        company = str(item.get("company_name") or "").strip() or None
        location_text = str(item.get("candidate_required_location") or item.get("job_type") or "Remote").strip()
        description = _clean_html(str(item.get("description") or ""))
        posted_at = _parse_iso_datetime(str(item.get("publication_date") or ""))
        external_id = str(item.get("id") or url)

        if not title or not url:
            continue

        postings.append(
            JobPosting(
                source="remotive",
                source_external_id=external_id,
                title=title,
                company=company,
                location=location_text or "Remote",
                description=description or None,
                url=url,
                posted_at=posted_at,
                raw_payload={"source": "remotive", "category": item.get("category")},
            )
        )

    return filter_job_board_results(_dedupe_postings(postings), query=query, location=location)


def parse_organization_job_board(
    body_text: str,
    *,
    base_url: str,
    source: str,
    query: str,
    location: str,
    content_type: str = "",
) -> list[JobPosting]:
    postings = []
    if "json" in content_type.lower() or body_text.lstrip().startswith(("{", "[")):
        postings = parse_job_board_json(body_text, base_url=base_url, source=source)

    if not postings:
        postings = parse_job_board_json_ld(body_text, base_url=base_url, source=source)

    if not postings:
        postings = parse_generic_job_board_html(body_text, base_url=base_url, source=source)

    return filter_job_board_results(postings, query=query, location=location)


def parse_job_board_json(body_text: str, *, base_url: str, source: str) -> list[JobPosting]:
    try:
        payload = json.loads(body_text)
    except json.JSONDecodeError:
        return []

    postings = []
    for item in _iter_json_objects(payload):
        title = _first_json_value(item, ["title", "text", "name"])
        url = _first_json_value(item, ["absolute_url", "hostedUrl", "applyUrl", "url"])
        if isinstance(url, dict):
            url = _first_json_value(url, ["url", "value"])
        company = _json_company(item)
        location = _json_location(item)
        description = _clean_html(str(_first_json_value(item, ["content", "description", "descriptionPlain"]) or ""))
        external_id = str(_first_json_value(item, ["id", "jobId", "postingId", "requisitionId"]) or "")
        posted_at = _parse_iso_datetime(str(_first_json_value(item, ["created_at", "createdAt", "postedAt", "datePosted"]) or ""))

        if not title or not url:
            continue

        postings.append(
            JobPosting(
                source=source,
                source_external_id=external_id or None,
                title=str(title).strip(),
                company=company,
                location=location,
                description=description or None,
                url=urljoin(base_url, str(url)),
                posted_at=posted_at,
                raw_payload={"source": "organization_json"},
            )
        )

    return _dedupe_postings(postings)


def parse_job_board_json_ld(html_text: str, *, base_url: str, source: str) -> list[JobPosting]:
    scripts = re.findall(
        r'<script[^>]+type=["\']application/ld\+json["\'][^>]*>(.*?)</script>',
        html_text,
        flags=re.IGNORECASE | re.DOTALL,
    )
    postings = []

    for script in scripts:
        try:
            payload = json.loads(html.unescape(script.strip()))
        except json.JSONDecodeError:
            continue

        for item in _iter_json_objects(payload):
            if str(item.get("@type", "")).lower() != "jobposting":
                continue
            title = item.get("title")
            url = item.get("url") or item.get("sameAs")
            company = _json_company(item)
            location = _json_location(item)
            description = _clean_html(str(item.get("description") or ""))
            posted_at = _parse_iso_datetime(str(item.get("datePosted") or ""))

            if not title or not url:
                continue

            postings.append(
                JobPosting(
                    source=source,
                    source_external_id=str(item.get("identifier") or url),
                    title=str(title).strip(),
                    company=company,
                    location=location,
                    description=description or None,
                    url=urljoin(base_url, str(url)),
                    posted_at=posted_at,
                    raw_payload={"source": "organization_json_ld"},
                )
            )

    return _dedupe_postings(postings)


def parse_generic_job_board_html(html_text: str, *, base_url: str, source: str) -> list[JobPosting]:
    anchors = re.findall(
        r'<a\b([^>]*)href=["\']([^"\']+)["\']([^>]*)>(.*?)</a>',
        html_text,
        flags=re.IGNORECASE | re.DOTALL,
    )
    postings = []

    for before_attrs, href, after_attrs, label_html in anchors:
        url = urljoin(base_url, html.unescape(href))
        title = _clean_html(label_html)
        attrs = f"{before_attrs} {after_attrs}"
        aria_label = _first_match(attrs, r'aria-label=["\']([^"\']+)["\']')
        title = title or _clean_html(aria_label)

        if not title or not _looks_like_job_link(url, title):
            continue

        postings.append(
            JobPosting(
                source=source,
                source_external_id=url,
                title=title,
                url=url,
                raw_payload={"source": "organization_html"},
            )
        )

    return _dedupe_postings(postings)


def filter_job_board_results(
    postings: list[JobPosting],
    *,
    query: str,
    location: str,
) -> list[JobPosting]:
    query_terms = _search_terms(query)
    location_terms = _search_terms(location)
    filtered = []

    for posting in postings:
        searchable_text = " ".join(
            value
            for value in [
                posting.title,
                posting.company,
                posting.location,
                posting.description,
            ]
            if value
        ).lower()
        query_match = not query_terms or any(term in searchable_text for term in query_terms)
        location_match = (
            not location_terms
            or not posting.location
            or any(term in (posting.location or "").lower() for term in location_terms)
            or any(term in searchable_text for term in location_terms)
        )

        if query_match and location_match:
            filtered.append(posting)

    return filtered


def _split_indeed_title(title_text: str) -> tuple[str, str | None]:
    if " - " not in title_text:
        return title_text.strip(), None

    title, company = title_text.split(" - ", 1)
    return title.strip(), company.strip() or None


def _node_text(item: ElementTree.Element, name: str) -> str:
    child = item.find(name)
    return (child.text or "").strip() if child is not None else ""


def _first_match(text: str, pattern: str) -> str:
    match = re.search(pattern, text, flags=re.IGNORECASE | re.DOTALL)
    return match.group(1).strip() if match else ""


def _clean_html(value: str) -> str:
    without_tags = re.sub(r"<[^>]+>", " ", value or "")
    return re.sub(r"\s+", " ", html.unescape(without_tags)).strip()


def _parse_datetime(value: str) -> datetime | None:
    if not value:
        return None

    try:
        return parsedate_to_datetime(value)
    except (TypeError, ValueError):
        return None


def _parse_iso_datetime(value: str) -> datetime | None:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return _parse_datetime(value)


def _parse_unix_datetime(value) -> datetime | None:
    if value in (None, ""):
        return None
    try:
        return datetime.fromtimestamp(int(value))
    except (TypeError, ValueError, OSError):
        return None


def _iter_json_objects(value):
    if isinstance(value, dict):
        yield value
        for child in value.values():
            yield from _iter_json_objects(child)
    elif isinstance(value, list):
        for child in value:
            yield from _iter_json_objects(child)


def _first_json_value(item: dict, keys: list[str]):
    for key in keys:
        value = item.get(key)
        if value:
            return value
    return None


def _json_company(item: dict) -> str | None:
    value = _first_json_value(item, ["company", "hiringOrganization", "department", "team"])
    if isinstance(value, dict):
        return str(_first_json_value(value, ["name", "title"]) or "").strip() or None
    return str(value).strip() if value else None


def _json_location(item: dict) -> str | None:
    value = _first_json_value(item, ["location", "jobLocation", "workplaceType"])
    if isinstance(value, str):
        return value.strip() or None
    if isinstance(value, list):
        parts = [_json_location({"location": child}) for child in value]
        return ", ".join(part for part in parts if part) or None
    if isinstance(value, dict):
        address = value.get("address")
        if isinstance(address, dict):
            parts = [
                address.get("addressLocality"),
                address.get("addressRegion"),
                address.get("addressCountry"),
            ]
            return ", ".join(str(part) for part in parts if part) or None
        return str(_first_json_value(value, ["name", "city", "country"]) or "").strip() or None
    return None


def _looks_like_job_link(url: str, title: str) -> bool:
    combined = f"{url} {title}".lower()
    job_markers = ["job", "career", "opening", "position", "role", "vacancy", "requisition"]
    ignored = ["privacy", "terms", "login", "sign-in", "cookie", "linkedin.com/company"]
    return any(marker in combined for marker in job_markers) and not any(
        marker in combined for marker in ignored
    )


def _search_terms(value: str) -> list[str]:
    return [term for term in re.findall(r"[a-z0-9+#.]{3,}", value.lower()) if term not in {"india", "remote"}]


def _dedupe_postings(postings: list[JobPosting]) -> list[JobPosting]:
    seen = set()
    unique = []
    for posting in postings:
        key = (posting.source, posting.source_external_id or posting.url)
        if key in seen:
            continue
        seen.add(key)
        unique.append(posting)
    return unique
