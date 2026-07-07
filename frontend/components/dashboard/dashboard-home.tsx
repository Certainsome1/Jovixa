"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  Database,
  FileText,
  RefreshCw,
  Sparkles,
  Target,
  XCircle,
} from "lucide-react";
import Topbar from "@/components/topbar";
import {
  getHealth,
  getJobs,
  getResumes,
  HealthResponse,
  JobResponse,
  RankedJobResponse,
  rankJobs,
  ResumeResponse,
} from "@/lib/api";

type ActivityItem = {
  id: string;
  timestamp: string;
  title: string;
  detail: string;
  tone: "emerald" | "blue" | "violet";
};

const ACTIVITY_TONE_CLASS = {
  emerald: "bg-emerald-400",
  blue: "bg-blue-400",
  violet: "bg-violet-400",
};

function formatDate(value: string | null) {
  if (!value) {
    return "Date unavailable";
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Date unavailable" : date.toLocaleDateString();
}

function formatDateTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Date unavailable"
    : date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

function getSkills(resume: ResumeResponse | null) {
  return resume?.parsed_json?.skills?.filter(Boolean) || [];
}

function getHealthTone(health: HealthResponse | null, errorMessage: string) {
  if (!health) {
    return {
      label: "Offline",
      description: errorMessage || "Health check unavailable",
      className: "border-red-500/30 bg-red-500/10 text-red-300",
      Icon: XCircle,
    };
  }

  if (health.status === "ok" && health.database === "ok") {
    return {
      label: "Healthy",
      description: "Backend and database are available",
      className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
      Icon: CheckCircle2,
    };
  }

  return {
    label: "Degraded",
    description: health.detail || "Backend is responding with reduced availability",
    className: "border-yellow-500/30 bg-yellow-500/10 text-yellow-300",
    Icon: Activity,
  };
}

function buildRecentActivity(resumes: ResumeResponse[], jobs: JobResponse[]) {
  const activities: ActivityItem[] = [
    ...resumes.map((resume) => ({
      id: `resume-${resume.id}`,
      timestamp: resume.created_at,
      title: "Resume uploaded and parsed",
      detail: `${resume.original_filename} · ${getSkills(resume).length} skills extracted`,
      tone: "emerald" as const,
    })),
    ...jobs
      .filter((job) => job.is_applied && job.applied_at)
      .map((job) => ({
        id: `application-${job.id}`,
        timestamp: job.applied_at as string,
        title: "Job marked as applied",
        detail: `${job.title} · ${job.company || "Company unavailable"}`,
        tone: "violet" as const,
      })),
    ...jobs.map((job) => ({
      id: `fetch-${job.id}`,
      timestamp: job.fetched_at,
      title: "Job fetched from source",
      detail: `${job.title} · ${job.source}`,
      tone: "blue" as const,
    })),
  ];

  return activities
    .sort((left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime())
    .slice(0, 8);
}

export default function DashboardHome() {
  const [resumes, setResumes] = useState<ResumeResponse[]>([]);
  const [jobs, setJobs] = useState<JobResponse[]>([]);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [activeResumeId, setActiveResumeId] = useState("");
  const [matches, setMatches] = useState<RankedJobResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRanking, setIsRanking] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const activeResume = useMemo(
    () => resumes.find((resume) => resume.id === activeResumeId) || resumes[0] || null,
    [activeResumeId, resumes]
  );
  const appliedJobs = useMemo(() => jobs.filter((job) => job.is_applied), [jobs]);
  const recentActivity = useMemo(() => buildRecentActivity(resumes, jobs), [resumes, jobs]);
  const healthState = getHealthTone(health, errorMessage);
  const topMatch = matches[0] || null;

  async function loadDashboard(resumeId?: string) {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const [savedResumes, savedJobs, backendHealth] = await Promise.all([
        getResumes(),
        getJobs(),
        getHealth(),
      ]);
      const selectedResumeId =
        resumeId && savedResumes.some((resume) => resume.id === resumeId)
          ? resumeId
          : savedResumes[0]?.id || "";

      setResumes(savedResumes);
      setJobs(savedJobs);
      setHealth(backendHealth);
      setActiveResumeId(selectedResumeId);

      if (selectedResumeId && savedJobs.length > 0) {
        setIsRanking(true);
        try {
          const response = await rankJobs(selectedResumeId, 5);
          setMatches(response.results);
        } catch (error) {
          setMatches([]);
          setErrorMessage(
            error instanceof Error
              ? `Dashboard loaded, but match ranking failed: ${error.message}`
              : "Dashboard loaded, but match ranking failed."
          );
        } finally {
          setIsRanking(false);
        }
      } else {
        setMatches([]);
      }
    } catch (error) {
      setHealth(null);
      setMatches([]);
      setErrorMessage(error instanceof Error ? error.message : "Failed to load dashboard");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleResumeChange(resumeId: string) {
    setActiveResumeId(resumeId);
    setMatches([]);
    setErrorMessage("");

    if (!jobs.length) {
      return;
    }

    setIsRanking(true);
    try {
      const response = await rankJobs(resumeId, 5);
      setMatches(response.results);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to rank jobs");
    } finally {
      setIsRanking(false);
    }
  }

  useEffect(() => {
    void loadDashboard();
  }, []);

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <Topbar />

      <div className="mx-auto max-w-7xl space-y-8 p-6">
        <section className="flex flex-col gap-6 border-b border-zinc-800 pb-8 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm font-medium text-emerald-400">Career command center</p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight">Dashboard</h1>
            <p className="mt-3 max-w-2xl text-zinc-400">
              Your latest resume, job activity, and AI-ranked opportunities in one place.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadDashboard(activeResume?.id)}
            disabled={isLoading || isRanking}
            className="flex w-fit items-center gap-2 rounded-xl border border-zinc-700 px-4 py-2.5 text-sm font-semibold text-zinc-200 transition hover:border-zinc-500 disabled:cursor-not-allowed disabled:text-zinc-500"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading || isRanking ? "animate-spin" : ""}`} />
            Refresh dashboard
          </button>
        </section>

        {errorMessage ? (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-300">
            {errorMessage}
          </div>
        ) : null}

        <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {[
            { label: "Total Jobs", value: isLoading ? "-" : jobs.length, tone: "text-white", icon: BriefcaseBusiness },
            { label: "Applied Jobs", value: isLoading ? "-" : appliedJobs.length, tone: "text-emerald-400", icon: CheckCircle2 },
            { label: "Unapplied Jobs", value: isLoading ? "-" : jobs.length - appliedJobs.length, tone: "text-blue-300", icon: Clock3 },
            { label: "Top Match", value: topMatch ? formatPercent(topMatch.score) : "-", tone: "text-violet-300", icon: Target },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
                <div className="flex items-start justify-between">
                  <p className="text-sm text-zinc-400">{stat.label}</p>
                  <Icon className="h-5 w-5 text-zinc-500" />
                </div>
                <p className={`mt-4 text-3xl font-bold ${stat.tone}`}>{stat.value}</p>
              </div>
            );
          })}
        </section>

        <section className="grid gap-6 xl:grid-cols-12">
          <div className="space-y-6 xl:col-span-7">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-emerald-400" />
                    <h2 className="text-xl font-semibold">Latest Resume</h2>
                  </div>
                  <p className="mt-2 text-sm text-zinc-400">Select a saved resume for dashboard insights.</p>
                </div>
                <Link href="/resume" className="text-sm font-medium text-emerald-400 hover:text-emerald-300">
                  Manage resumes
                </Link>
              </div>

              {isLoading ? (
                <p className="text-zinc-400">Loading saved resumes...</p>
              ) : resumes.length === 0 ? (
                <div className="rounded-xl border border-dashed border-zinc-700 p-6 text-zinc-400">
                  No resume uploaded. Upload one to start seeing profile and match insights.
                </div>
              ) : (
                <div className="space-y-5">
                  <select
                    value={activeResume?.id || ""}
                    onChange={(event) => void handleResumeChange(event.target.value)}
                    disabled={isRanking}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white outline-none focus:border-emerald-500"
                  >
                    {resumes.map((resume) => (
                      <option key={resume.id} value={resume.id}>
                        {resume.original_filename} - {formatDate(resume.created_at)}
                      </option>
                    ))}
                  </select>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-xl bg-zinc-950 p-4">
                      <p className="text-sm text-zinc-400">Resume name</p>
                      <p className="mt-2 break-words font-semibold">{activeResume?.original_filename}</p>
                    </div>
                    <div className="rounded-xl bg-zinc-950 p-4">
                      <p className="text-sm text-zinc-400">Uploaded</p>
                      <p className="mt-2 font-semibold">{formatDate(activeResume?.created_at || null)}</p>
                    </div>
                    <div className="rounded-xl bg-zinc-950 p-4">
                      <p className="text-sm text-zinc-400">Extracted skills</p>
                      <p className="mt-2 text-2xl font-bold text-emerald-400">{getSkills(activeResume).length}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-blue-300" />
                  <h2 className="text-xl font-semibold">Recent Activity</h2>
                </div>
                <span className="text-sm text-zinc-500">Latest persisted events</span>
              </div>

              {isLoading ? (
                <p className="text-zinc-400">Loading activity...</p>
              ) : recentActivity.length === 0 ? (
                <p className="rounded-xl border border-dashed border-zinc-700 p-6 text-zinc-400">
                  No resume uploads, job fetches, or applications recorded yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex gap-4 rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                      <div className={`mt-1 h-2.5 w-2.5 rounded-full ${ACTIVITY_TONE_CLASS[activity.tone]}`} />
                      <div className="min-w-0">
                        <p className="font-medium">{activity.title}</p>
                        <p className="mt-1 truncate text-sm text-zinc-400">{activity.detail}</p>
                        <p className="mt-2 text-xs text-zinc-500">{formatDateTime(activity.timestamp)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6 xl:col-span-5">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
              <div className="mb-5 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-violet-300" />
                <h2 className="text-xl font-semibold">AI Match Summary</h2>
              </div>

              {isRanking ? (
                <p className="text-zinc-400">Ranking saved jobs for the selected resume...</p>
              ) : !activeResume ? (
                <p className="rounded-xl border border-dashed border-zinc-700 p-6 text-zinc-400">Upload a resume to generate AI matches.</p>
              ) : jobs.length === 0 ? (
                <p className="rounded-xl border border-dashed border-zinc-700 p-6 text-zinc-400">No jobs available. Fetch jobs to generate matches.</p>
              ) : !topMatch ? (
                <p className="rounded-xl border border-dashed border-zinc-700 p-6 text-zinc-400">No matches returned for this resume.</p>
              ) : (
                <div className="rounded-xl bg-zinc-950 p-5">
                  <p className="text-sm text-zinc-400">Top ranked opportunity</p>
                  <h3 className="mt-3 text-2xl font-bold">{topMatch.title}</h3>
                  <p className="mt-2 text-zinc-400">{topMatch.company || "Company unavailable"}</p>
                  <div className="mt-5 flex items-end justify-between">
                    <div>
                      <p className="text-sm text-zinc-400">Match score</p>
                      <p className="mt-1 text-4xl font-bold text-emerald-400">{formatPercent(topMatch.score)}</p>
                    </div>
                    <Link href="/ai-match" className="text-sm font-medium text-emerald-400 hover:text-emerald-300">View matches</Link>
                  </div>
                </div>
              )}
            </div>

            <div className={`rounded-2xl border p-6 ${healthState.className}`}>
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                <h2 className="text-xl font-semibold">Dashboard Health</h2>
              </div>
              <div className="mt-5 flex items-center gap-3">
                <healthState.Icon className="h-7 w-7" />
                <div>
                  <p className="font-semibold">{healthState.label}</p>
                  <p className="mt-1 text-sm opacity-80">{healthState.description}</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
              <div className="mb-5 flex items-center gap-2">
                <BriefcaseBusiness className="h-5 w-5 text-blue-300" />
                <h2 className="text-xl font-semibold">Jobs Summary</h2>
              </div>
              {isLoading ? (
                <p className="text-zinc-400">Loading jobs...</p>
              ) : jobs.length === 0 ? (
                <p className="rounded-xl border border-dashed border-zinc-700 p-5 text-zinc-400">No jobs fetched yet.</p>
              ) : (
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-xl bg-zinc-950 p-4"><p className="text-xs text-zinc-400">Total</p><p className="mt-2 text-2xl font-bold">{jobs.length}</p></div>
                  <div className="rounded-xl bg-zinc-950 p-4"><p className="text-xs text-zinc-400">Applied</p><p className="mt-2 text-2xl font-bold text-emerald-400">{appliedJobs.length}</p></div>
                  <div className="rounded-xl bg-zinc-950 p-4"><p className="text-xs text-zinc-400">Unapplied</p><p className="mt-2 text-2xl font-bold text-blue-300">{jobs.length - appliedJobs.length}</p></div>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
