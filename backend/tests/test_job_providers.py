from app.services.job_providers import (
    parse_arbeitnow_jobs,
    parse_indeed_rss,
    parse_linkedin_guest_html,
    parse_organization_job_board,
    parse_remotive_jobs,
)


def test_parse_indeed_rss_returns_job_postings():
    feed = """
    <rss>
      <channel>
        <item>
          <title>PLM Support Engineer - Bosch India</title>
          <link>https://www.indeed.com/viewjob?jk=abc123</link>
          <guid>abc123</guid>
          <description><![CDATA[Teamcenter and NX support role]]></description>
          <pubDate>Mon, 18 May 2026 10:00:00 GMT</pubDate>
        </item>
      </channel>
    </rss>
    """

    jobs = parse_indeed_rss(feed)

    assert len(jobs) == 1
    assert jobs[0].source == "indeed"
    assert jobs[0].source_external_id == "abc123"
    assert jobs[0].title == "PLM Support Engineer"
    assert jobs[0].company == "Bosch India"
    assert jobs[0].posted_at is not None


def test_parse_linkedin_guest_html_returns_job_postings():
    html = """
    <li>
      <a href="https://www.linkedin.com/jobs/view/123456?currentJobId=123456">
        <h3 class="base-search-card__title">Teamcenter Developer</h3>
      </a>
      <h4 class="base-search-card__subtitle"><a>Siemens</a></h4>
      <span class="job-search-card__location">Pune, Maharashtra</span>
    </li>
    """

    jobs = parse_linkedin_guest_html(html)

    assert len(jobs) == 1
    assert jobs[0].source == "linkedin"
    assert jobs[0].source_external_id == "123456"
    assert jobs[0].title == "Teamcenter Developer"
    assert jobs[0].company == "Siemens"
    assert jobs[0].location == "Pune, Maharashtra"


def test_parse_arbeitnow_jobs_returns_filtered_postings():
    payload = """
    {
      "data": [
        {
          "slug": "teamcenter-engineer",
          "title": "Teamcenter PLM Engineer",
          "company_name": "Example Auto",
          "location": "Noida",
          "url": "https://www.arbeitnow.com/jobs/teamcenter-engineer",
          "description": "Work on Teamcenter NX PLM workflows",
          "created_at": 1779000000
        },
        {
          "slug": "finance-manager",
          "title": "Finance Manager",
          "company_name": "Example Finance",
          "location": "Berlin",
          "url": "https://www.arbeitnow.com/jobs/finance-manager"
        }
      ]
    }
    """

    jobs = parse_arbeitnow_jobs(payload, query="teamcenter plm", location="Noida")

    assert len(jobs) == 1
    assert jobs[0].source == "arbeitnow"
    assert jobs[0].source_external_id == "teamcenter-engineer"
    assert jobs[0].title == "Teamcenter PLM Engineer"


def test_parse_remotive_jobs_returns_filtered_postings():
    payload = """
    {
      "jobs": [
        {
          "id": 42,
          "title": "Remote Python PLM Developer",
          "company_name": "Remote Auto",
          "candidate_required_location": "Worldwide",
          "url": "https://remotive.com/remote-jobs/software-dev/python-plm",
          "description": "Python automation for PLM integrations",
          "publication_date": "2026-05-20T10:00:00Z"
        },
        {
          "id": 43,
          "title": "Customer Support",
          "company_name": "Remote Help",
          "candidate_required_location": "Worldwide",
          "url": "https://remotive.com/remote-jobs/support/customer-support"
        }
      ]
    }
    """

    jobs = parse_remotive_jobs(payload, query="python plm", location="India")

    assert len(jobs) == 1
    assert jobs[0].source == "remotive"
    assert jobs[0].source_external_id == "42"
    assert jobs[0].location == "Worldwide"


def test_parse_organization_job_board_json_returns_filtered_jobs():
    payload = """
    {
      "jobs": [
        {
          "id": "plm-123",
          "title": "Teamcenter PLM Engineer",
          "absolute_url": "/jobs/plm-123",
          "company": {"name": "Bosch"},
          "location": {"name": "Noida, India"},
          "content": "Support Teamcenter, NX, and PLM workflows."
        },
        {
          "id": "sales-123",
          "title": "Sales Executive",
          "absolute_url": "/jobs/sales-123",
          "location": {"name": "Delhi, India"}
        }
      ]
    }
    """

    jobs = parse_organization_job_board(
        payload,
        base_url="https://careers.example.com",
        source="org:example.com",
        query="teamcenter plm",
        location="Noida",
        content_type="application/json",
    )

    assert len(jobs) == 1
    assert jobs[0].source == "org:example.com"
    assert jobs[0].source_external_id == "plm-123"
    assert jobs[0].title == "Teamcenter PLM Engineer"
    assert jobs[0].company == "Bosch"
    assert jobs[0].url == "https://careers.example.com/jobs/plm-123"


def test_parse_organization_job_board_html_returns_job_links():
    html = """
    <main>
      <a href="/careers/jobs/teamcenter-plm-engineer">Teamcenter PLM Engineer</a>
      <a href="/privacy">Privacy Policy</a>
    </main>
    """

    jobs = parse_organization_job_board(
        html,
        base_url="https://company.example.com/careers",
        source="org:company.example.com",
        query="teamcenter",
        location="India",
        content_type="text/html",
    )

    assert len(jobs) == 1
    assert jobs[0].title == "Teamcenter PLM Engineer"
    assert jobs[0].url == "https://company.example.com/careers/jobs/teamcenter-plm-engineer"
