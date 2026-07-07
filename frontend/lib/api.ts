const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

export type ParsedResumeJson = {
  text?: string;
  skills?: string[];
  experience_years?: number | null;
  companies?: string[];
};

export type ResumeResponse = {
  id: string;
  original_filename: string;
  content_type: string | null;
  file_size_bytes: number;
  parsed_json: ParsedResumeJson;
  created_at: string;
};

export type JobResponse = {
  id: string;
  source: string;
  source_external_id: string | null;
  title: string;
  company: string | null;
  location: string | null;
  description: string | null;
  url: string;
  posted_at: string | null;
  fetched_at: string;
  is_applied: boolean;
  applied_at: string | null;
  created_at: string;
  updated_at: string;
};

export type FetchJobsRequest = {
  query?: string | null;
  location?: string | null;
  job_board_urls?: string[] | null;
};

export type FetchJobsResponse = {
  fetched: number;
  inserted: number;
  updated: number;
  skipped: number;
  sources: string[];
};

export type JobApplicationRequest = {
  job_id?: string;
  source?: string | null;
  source_external_id?: string | null;
  title?: string;
  company?: string | null;
  location?: string | null;
  description?: string | null;
  url?: string;
  posted_at?: string | null;
  is_applied: boolean;
};

export type RankedJobResponse = {
  job_id: string;
  title: string;
  company: string | null;
  location: string | null;
  source: string;
  url: string;
  posted_at: string | null;
  is_applied: boolean;
  applied_at: string | null;
  score: number;
  semantic_score: number;
  skill_overlap_score: number;
  title_score: number;
  matched_skills: string[];
  explanation: string;
};

export type RankJobsResponse = {
  resume_id: string;
  results: RankedJobResponse[];
};

export type HealthResponse = {
  status: string;
  database: string;
  detail: string | null;
};

function getErrorMessage(payload: unknown, fallback: string) {
  if (payload && typeof payload === "object" && "detail" in payload) {
    const detail = (payload as { detail?: unknown }).detail;
    if (typeof detail === "string") {
      return detail;
    }
  }

  return fallback;
}

export async function uploadResume(file: File): Promise<ResumeResponse> {
  const formData = new FormData();

  formData.append("file", file);

  const response = await fetch(
    `${API_BASE_URL}/api/v1/resumes/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(getErrorMessage(payload, "Resume upload failed"));
  }

  return response.json();
}

export async function getJobs(): Promise<JobResponse[]> {
  const response = await fetch(`${API_BASE_URL}/api/v1/jobs`);

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(getErrorMessage(payload, "Failed to load jobs"));
  }

  return response.json();
}

export async function fetchJobs(
  request: FetchJobsRequest
): Promise<FetchJobsResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/jobs/fetch`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(getErrorMessage(payload, "Failed to refresh jobs"));
  }

  return response.json();
}

export async function updateJobApplication(
  request: JobApplicationRequest
): Promise<JobResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/jobs/application`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(getErrorMessage(payload, "Failed to update job application"));
  }

  return response.json();
}

export async function rankJobs(
  resumeId: string,
  limit = 25
): Promise<RankJobsResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/matches/rank`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      resume_id: resumeId,
      limit,
    }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(getErrorMessage(payload, "Failed to rank jobs"));
  }

  return response.json();
}

export async function getResumes(): Promise<ResumeResponse[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/resumes`
  );

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(getErrorMessage(payload, "Failed to load resumes"));
  }

  return response.json();
}

export async function getHealth(): Promise<HealthResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/health`);

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(getErrorMessage(payload, "Backend health check failed"));
  }

  return response.json();
}
