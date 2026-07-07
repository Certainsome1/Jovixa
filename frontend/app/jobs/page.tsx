"use client";

import { useEffect, useMemo, useState } from "react";
import Topbar from "@/components/topbar";
import JobCard from "@/components/jobs/job-card";
import JobsFilter from "@/components/jobs/jobs-filter";
import JobsSearch from "@/components/jobs/jobs-search";
import {
  fetchJobs,
  getJobs,
  JobResponse,
  updateJobApplication,
} from "@/lib/api";

const DEFAULT_QUERY = "Teamcenter NX PLM";
const DEFAULT_LOCATION = "India";
const SKILL_HINTS = [
  "teamcenter",
  "nx",
  "plm",
  "catia",
  "cad",
  "python",
  "sql",
  "react",
  "typescript",
  "fastapi",
  "docker",
  "aws",
];

function formatDate(value: string | null) {
  if (!value) {
    return "Date unavailable";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return date.toLocaleDateString();
}

function normalizeSource(source: string) {
  return source
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function inferSkills(job: JobResponse) {
  const haystack = `${job.title} ${job.description || ""}`.toLowerCase();
  return SKILL_HINTS.filter((skill) => haystack.includes(skill)).slice(0, 6);
}

function matchesSearch(job: JobResponse, search: string) {
  const term = search.trim().toLowerCase();
  if (!term) {
    return true;
  }

  return [
    job.title,
    job.company,
    job.location,
    job.source,
    job.description,
  ]
    .filter(Boolean)
    .some((value) => value?.toLowerCase().includes(term));
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<JobResponse[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [query, setQuery] = useState(DEFAULT_QUERY);
  const [location, setLocation] = useState(DEFAULT_LOCATION);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [applyingJobId, setApplyingJobId] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const filteredJobs = useMemo(
    () => jobs.filter((job) => matchesSearch(job, searchTerm)),
    [jobs, searchTerm]
  );

  const appliedCount = useMemo(
    () => jobs.filter((job) => job.is_applied).length,
    [jobs]
  );

  const sources = useMemo(
    () => Array.from(new Set(jobs.map((job) => job.source))).filter(Boolean),
    [jobs]
  );

  async function loadJobs() {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const loadedJobs = await getJobs();
      setJobs(loadedJobs);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to load jobs");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRefreshJobs() {
    setIsRefreshing(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const result = await fetchJobs({
        query: query.trim() || null,
        location: location.trim() || null,
      });
      const loadedJobs = await getJobs();
      setJobs(loadedJobs);
      setSuccessMessage(
        `Fetched ${result.fetched} jobs. Inserted ${result.inserted}, updated ${result.updated}, skipped ${result.skipped}.`
      );
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to refresh jobs");
    } finally {
      setIsRefreshing(false);
    }
  }

  async function handleApplicationToggle(job: JobResponse) {
    setApplyingJobId(job.id);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const updatedJob = await updateJobApplication({
        job_id: job.id,
        is_applied: !job.is_applied,
      });
      setJobs((currentJobs) =>
        currentJobs.map((item) => (item.id === updatedJob.id ? updatedJob : item))
      );
      setSuccessMessage(
        updatedJob.is_applied
          ? `Marked applied: ${updatedJob.title}`
          : `Marked not applied: ${updatedJob.title}`
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to update application status"
      );
    } finally {
      setApplyingJobId("");
    }
  }

  useEffect(() => {
    void loadJobs();
  }, []);

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <Topbar />

      <div className="mx-auto max-w-7xl p-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold">Jobs</h1>

          <p className="mt-2 text-zinc-400">
            Discover backend-synced engineering opportunities.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
          <aside className="xl:col-span-3">
            <JobsFilter />
          </aside>

          <section className="space-y-6 xl:col-span-9">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
                <p className="text-sm text-zinc-400">Jobs Found</p>

                <h3 className="mt-2 text-3xl font-bold">
                  {isLoading ? "-" : jobs.length}
                </h3>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
                <p className="text-sm text-zinc-400">Applied Jobs</p>

                <h3 className="mt-2 text-3xl font-bold text-emerald-400">
                  {isLoading ? "-" : appliedCount}
                </h3>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
                <p className="text-sm text-zinc-400">Sources</p>

                <h3 className="mt-2 text-3xl font-bold text-blue-400">
                  {isLoading ? "-" : sources.length}
                </h3>
              </div>
            </div>

            <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5">
              <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto]">
                <label className="block">
                  <span className="mb-2 block text-sm text-zinc-400">
                    Fetch Keywords
                  </span>
                  <input
                    type="text"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    className="w-full rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white outline-none transition focus:border-emerald-500"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm text-zinc-400">
                    Location
                  </span>
                  <input
                    type="text"
                    value={location}
                    onChange={(event) => setLocation(event.target.value)}
                    className="w-full rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white outline-none transition focus:border-emerald-500"
                  />
                </label>

                <button
                  type="button"
                  onClick={() => void handleRefreshJobs()}
                  disabled={isRefreshing}
                  className="self-end rounded-2xl bg-white px-6 py-3 font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:bg-zinc-500"
                >
                  {isRefreshing ? "Refreshing..." : "Refresh Jobs"}
                </button>
              </div>
            </div>

            <JobsSearch
              value={searchTerm}
              onChange={setSearchTerm}
              disabled={isLoading}
            />

            {successMessage ? (
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-300">
                {successMessage}
              </div>
            ) : null}

            {errorMessage ? (
              <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-300">
                {errorMessage}
              </div>
            ) : null}

            <div className="space-y-5">
              {isLoading ? (
                <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-10 text-center text-zinc-400">
                  Loading jobs from backend...
                </div>
              ) : null}

              {!isLoading && jobs.length === 0 ? (
                <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-10 text-center">
                  <h2 className="text-2xl font-semibold">No jobs saved yet</h2>
                  <p className="mt-3 text-zinc-400">
                    Refresh jobs to fetch opportunities from the configured job sources.
                  </p>
                </div>
              ) : null}

              {!isLoading && jobs.length > 0 && filteredJobs.length === 0 ? (
                <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-10 text-center text-zinc-400">
                  No jobs match your current search.
                </div>
              ) : null}

              {!isLoading
                ? filteredJobs.map((job) => (
                    <JobCard
                      key={job.id}
                      role={job.title}
                      company={job.company || "Company unavailable"}
                      location={job.location || "Location unavailable"}
                      source={normalizeSource(job.source)}
                      posted={formatDate(job.posted_at || job.fetched_at)}
                      skills={inferSkills(job)}
                      isApplied={job.is_applied}
                      isApplying={applyingJobId === job.id}
                      url={job.url}
                      onApply={() => void handleApplicationToggle(job)}
                    />
                  ))
                : null}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
