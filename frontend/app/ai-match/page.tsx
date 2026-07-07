"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getJobs,
  getResumes,
  rankJobs,
  RankedJobResponse,
  ResumeResponse,
} from "@/lib/api";

const ACTIVE_RESUME_STORAGE_KEY = "jovixa.aiMatch.activeResumeId";
const MATCH_RESULTS_STORAGE_KEY = "jovixa.aiMatch.results";

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

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

function formatSource(source: string) {
  return source
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getResumeSkills(resume: ResumeResponse | null) {
  return resume?.parsed_json?.skills?.filter(Boolean) || [];
}

function getMissingSkills(resume: ResumeResponse | null, match: RankedJobResponse) {
  const matched = new Set(match.matched_skills.map((skill) => skill.toLowerCase()));
  return getResumeSkills(resume).filter((skill) => !matched.has(skill.toLowerCase()));
}

function readStoredMatches(): {
  resumeId: string;
  results: RankedJobResponse[];
} | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const rawValue = window.localStorage.getItem(MATCH_RESULTS_STORAGE_KEY);
    return rawValue ? JSON.parse(rawValue) : null;
  } catch {
    return null;
  }
}

export default function AIMatchPage() {
  const [resumes, setResumes] = useState<ResumeResponse[]>([]);
  const [activeResumeId, setActiveResumeId] = useState("");
  const [availableJobCount, setAvailableJobCount] = useState(0);
  const [matches, setMatches] = useState<RankedJobResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRanking, setIsRanking] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const activeResume = useMemo(
    () => resumes.find((resume) => resume.id === activeResumeId) || resumes[0] || null,
    [activeResumeId, resumes]
  );

  const topMatch = matches[0] || null;
  const averageScore = useMemo(() => {
    if (!matches.length) {
      return 0;
    }

    return matches.reduce((total, match) => total + match.score, 0) / matches.length;
  }, [matches]);

  async function loadInitialData() {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const [savedResumes, savedJobs] = await Promise.all([getResumes(), getJobs()]);
      const storedResumeId =
        typeof window !== "undefined"
          ? window.localStorage.getItem(ACTIVE_RESUME_STORAGE_KEY)
          : "";
      const storedMatches = readStoredMatches();
      const nextActiveResumeId =
        storedResumeId && savedResumes.some((resume) => resume.id === storedResumeId)
          ? storedResumeId
          : savedResumes[0]?.id || "";

      setResumes(savedResumes);
      setAvailableJobCount(savedJobs.length);
      setActiveResumeId(nextActiveResumeId);

      if (storedMatches?.resumeId === nextActiveResumeId) {
        setMatches(storedMatches.results);
      } else {
        setMatches([]);
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to load match data");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRankJobs() {
    if (!activeResume) {
      setErrorMessage("Upload or select a resume before generating matches.");
      return;
    }

    setIsRanking(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await rankJobs(activeResume.id, 25);
      setMatches(response.results);
      setSuccessMessage(`Generated ${response.results.length} ranked matches.`);

      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          MATCH_RESULTS_STORAGE_KEY,
          JSON.stringify({
            resumeId: response.resume_id,
            results: response.results,
          })
        );
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to generate matches");
    } finally {
      setIsRanking(false);
    }
  }

  function handleResumeChange(resumeId: string) {
    setActiveResumeId(resumeId);
    setMatches([]);
    setSuccessMessage("");
    setErrorMessage("");

    if (typeof window !== "undefined") {
      window.localStorage.setItem(ACTIVE_RESUME_STORAGE_KEY, resumeId);
    }
  }

  useEffect(() => {
    void loadInitialData();
  }, []);

  return (
    <main className="min-h-screen bg-zinc-950 p-10 text-white">
      <div className="mb-10">
        <h1 className="text-5xl font-bold">AI Match</h1>
        <p className="mt-3 text-zinc-400">
          Rank saved jobs against your selected resume.
        </p>
      </div>

      <div className="mb-8 rounded-3xl border border-zinc-800 bg-zinc-900 p-8">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto_auto]">
          <label>
            <span className="mb-2 block text-sm text-zinc-400">Active Resume</span>
            <select
              value={activeResume?.id || ""}
              disabled={isLoading || resumes.length === 0}
              onChange={(event) => handleResumeChange(event.target.value)}
              className="w-full rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white outline-none transition focus:border-emerald-500"
            >
              {resumes.length === 0 ? (
                <option value="">No saved resumes</option>
              ) : (
                resumes.map((resume) => (
                  <option key={resume.id} value={resume.id}>
                    {resume.original_filename} - {new Date(resume.created_at).toLocaleDateString()}
                  </option>
                ))
              )}
            </select>
          </label>

          <button
            type="button"
            onClick={() => void loadInitialData()}
            disabled={isLoading}
            className="self-end rounded-2xl border border-zinc-700 px-6 py-3 font-semibold text-zinc-200 transition hover:border-zinc-500 disabled:cursor-not-allowed disabled:text-zinc-500"
          >
            {isLoading ? "Loading..." : "Reload"}
          </button>

          <button
            type="button"
            onClick={() => void handleRankJobs()}
            disabled={isLoading || isRanking || !activeResume || availableJobCount === 0}
            className="self-end rounded-2xl bg-white px-6 py-3 font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:bg-zinc-500"
          >
            {isRanking ? "Generating..." : "Generate Matches"}
          </button>
        </div>

        {errorMessage ? (
          <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-300">
            {errorMessage}
          </div>
        ) : null}

        {successMessage ? (
          <div className="mt-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-300">
            {successMessage}
          </div>
        ) : null}
      </div>

      <div className="mb-8 grid gap-6 md:grid-cols-3">
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <p className="text-sm text-zinc-400">Top Match</p>
          <h2 className="mt-3 text-5xl font-bold text-emerald-400">
            {topMatch ? formatPercent(topMatch.score) : "-"}
          </h2>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <p className="text-sm text-zinc-400">Ranked Jobs</p>
          <h2 className="mt-3 text-5xl font-bold">{matches.length}</h2>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <p className="text-sm text-zinc-400">Average Score</p>
          <h2 className="mt-3 text-5xl font-bold text-blue-400">
            {matches.length ? formatPercent(averageScore) : "-"}
          </h2>
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-10 text-center text-zinc-400">
          Loading resumes and jobs...
        </div>
      ) : null}

      {!isLoading && resumes.length === 0 ? (
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-10 text-center">
          <h2 className="text-2xl font-semibold">No resume uploaded</h2>
          <p className="mt-3 text-zinc-400">
            Upload a resume before generating AI job matches.
          </p>
        </div>
      ) : null}

      {!isLoading && resumes.length > 0 && availableJobCount === 0 ? (
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-10 text-center">
          <h2 className="text-2xl font-semibold">No jobs available</h2>
          <p className="mt-3 text-zinc-400">
            Fetch jobs from the Jobs page, then return here to rank them.
          </p>
        </div>
      ) : null}

      {!isLoading && resumes.length > 0 && availableJobCount > 0 && matches.length === 0 ? (
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-10 text-center">
          <h2 className="text-2xl font-semibold">No matches returned yet</h2>
          <p className="mt-3 text-zinc-400">
            Generate matches to rank {availableJobCount} saved jobs against this resume.
          </p>
        </div>
      ) : null}

      <div className="space-y-6">
        {matches.map((match, index) => {
          const missingSkills = getMissingSkills(activeResume, match);

          return (
            <article
              key={match.job_id}
              className="rounded-3xl border border-zinc-800 bg-zinc-900 p-8"
            >
              <div className="mb-6 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-sm text-zinc-500">Rank #{index + 1}</p>
                  <h2 className="mt-2 text-3xl font-bold">{match.title}</h2>
                  <p className="mt-2 text-zinc-400">
                    {match.company || "Company unavailable"} ·{" "}
                    {match.location || "Location unavailable"} · {formatSource(match.source)}
                  </p>
                  <p className="mt-2 text-sm text-zinc-500">
                    Posted: {formatDate(match.posted_at)}
                  </p>
                </div>

                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-6 py-4 text-center">
                  <p className="text-sm text-emerald-300">Match Score</p>
                  <p className="text-4xl font-bold text-emerald-400">
                    {formatPercent(match.score)}
                  </p>
                </div>
              </div>

              <div className="mb-6 grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl bg-zinc-950 p-4">
                  <p className="text-sm text-zinc-400">Semantic</p>
                  <p className="mt-2 text-2xl font-bold">
                    {formatPercent(match.semantic_score)}
                  </p>
                </div>

                <div className="rounded-2xl bg-zinc-950 p-4">
                  <p className="text-sm text-zinc-400">Skill Overlap</p>
                  <p className="mt-2 text-2xl font-bold">
                    {formatPercent(match.skill_overlap_score)}
                  </p>
                </div>

                <div className="rounded-2xl bg-zinc-950 p-4">
                  <p className="text-sm text-zinc-400">Title Alignment</p>
                  <p className="mt-2 text-2xl font-bold">
                    {formatPercent(match.title_score)}
                  </p>
                </div>
              </div>

              <div className="mb-6 grid gap-6 lg:grid-cols-2">
                <div>
                  <h3 className="mb-3 text-lg font-semibold">Matched Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {match.matched_skills.length ? (
                      match.matched_skills.map((skill) => (
                        <span
                          key={skill}
                          className="rounded-full bg-emerald-500/10 px-4 py-2 text-emerald-300"
                        >
                          {skill}
                        </span>
                      ))
                    ) : (
                      <p className="text-zinc-400">No direct skill overlap found.</p>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="mb-3 text-lg font-semibold">Missing Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {missingSkills.length ? (
                      missingSkills.map((skill) => (
                        <span
                          key={skill}
                          className="rounded-full border border-red-500/20 bg-red-500/10 px-4 py-2 text-red-300"
                        >
                          {skill}
                        </span>
                      ))
                    ) : (
                      <p className="text-emerald-300">
                        All parsed resume skills matched this job text.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-zinc-950 p-5">
                <h3 className="mb-2 text-lg font-semibold">Explanation</h3>
                <p className="text-zinc-300">{match.explanation}</p>
              </div>

              <div className="mt-6 flex items-center justify-between">
                <span
                  className={
                    match.is_applied
                      ? "text-sm text-emerald-300"
                      : "text-sm text-zinc-500"
                  }
                >
                  {match.is_applied
                    ? `Applied${match.applied_at ? ` on ${formatDate(match.applied_at)}` : ""}`
                    : "Not marked applied"}
                </span>

                <button
                  type="button"
                  onClick={() => window.open(match.url, "_blank", "noopener,noreferrer")}
                  className="rounded-xl bg-white px-5 py-2 text-sm font-semibold text-black transition hover:bg-zinc-200"
                >
                  View Job
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </main>
  );
}
