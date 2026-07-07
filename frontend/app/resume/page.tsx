"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { getResumes, ResumeResponse, uploadResume } from "@/lib/api";

const TARGET_SKILLS = [
  "teamcenter",
  "nx",
  "plm",
  "catia",
  "cad",
  "python",
  "sql",
  "react",
  "typescript",
  "aws",
  "docker",
  "fastapi",
];

function formatPercent(score: number) {
  return `${Math.round(score)}%`;
}

function formatExperience(value?: number | null) {
  if (value === null || value === undefined) {
    return "-";
  }

  return `${Number.isInteger(value) ? value : value.toFixed(1)} Years`;
}

function getSkills(resume: ResumeResponse | null) {
  return resume?.parsed_json?.skills?.filter(Boolean) || [];
}

function getCompanies(resume: ResumeResponse | null) {
  return resume?.parsed_json?.companies?.filter(Boolean) || [];
}

function calculateAnalysis(resume: ResumeResponse | null) {
  const parsed = resume?.parsed_json || {};
  const skills = getSkills(resume);
  const skillSet = new Set(skills.map((skill) => skill.toLowerCase()));
  const experienceYears = parsed.experience_years ?? null;
  const text = parsed.text || "";
  const missingKeywords = TARGET_SKILLS.filter((skill) => !skillSet.has(skill));
  const skillCoverage = Math.min((skills.length / 10) * 100, 100);
  const experienceScore =
    experienceYears === null ? 30 : Math.min((experienceYears / 5) * 100, 100);
  const textScore = Math.min((text.length / 2500) * 100, 100);
  const atsScore = resume
    ? Math.round(skillCoverage * 0.45 + experienceScore * 0.35 + textScore * 0.2)
    : 0;
  const resumeRank =
    atsScore >= 85 ? "A+" : atsScore >= 75 ? "A" : atsScore >= 60 ? "B" : "C";

  const strengths = [
    skills.length >= 5 ? "Strong skill keyword coverage" : "",
    experienceYears ? `Experience detected: ${experienceYears} years` : "",
    text.length > 1200 ? "Detailed resume content extracted" : "",
    getCompanies(resume).length > 0 ? "Company history detected" : "",
  ].filter(Boolean);

  const health = [
    {
      label: skills.length > 0 ? "Skills extracted successfully" : "No skills detected yet",
      tone: skills.length > 0 ? "text-emerald-400" : "text-yellow-400",
    },
    {
      label:
        experienceYears !== null
          ? "Experience level detected"
          : "Experience years missing",
      tone: experienceYears !== null ? "text-emerald-400" : "text-yellow-400",
    },
    {
      label:
        missingKeywords.length <= 4
          ? "Good match keyword coverage"
          : "Add more target job keywords",
      tone: missingKeywords.length <= 4 ? "text-emerald-400" : "text-yellow-400",
    },
    {
      label:
        text.length > 800
          ? "Resume text extracted cleanly"
          : "Resume text is short or sparse",
      tone: text.length > 800 ? "text-emerald-400" : "text-yellow-400",
    },
  ];

  const readiness = [
    { name: "Resume Quality", score: atsScore },
    { name: "Interview Readiness", score: Math.round((skillCoverage + experienceScore) / 2) },
    { name: "Market Competitiveness", score: Math.round((skillCoverage * 0.7) + (experienceScore * 0.3)) },
  ];

  return {
    atsScore,
    experienceYears,
    health,
    missingKeywords,
    readiness,
    resumeRank,
    skills,
    strengths: strengths.length ? strengths : ["Upload a parsed resume to generate strengths."],
  };
}

export default function ResumePage() {
  const [savedResumes, setSavedResumes] = useState<ResumeResponse[]>([]);
  const [activeResumeId, setActiveResumeId] = useState<string>("");
  const [isLoadingResumes, setIsLoadingResumes] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const activeResume = useMemo(
    () => savedResumes.find((resume) => resume.id === activeResumeId) || savedResumes[0] || null,
    [activeResumeId, savedResumes]
  );

  const analysis = useMemo(() => calculateAnalysis(activeResume), [activeResume]);
  const companies = getCompanies(activeResume);

  async function loadSavedResumes() {
    setIsLoadingResumes(true);
    setErrorMessage("");

    try {
      const resumes = await getResumes();
      setSavedResumes(resumes);
      setActiveResumeId((currentId) => {
        if (currentId && resumes.some((resume) => resume.id === currentId)) {
          return currentId;
        }

        return resumes[0]?.id || "";
      });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to load resumes");
    } finally {
      setIsLoadingResumes(false);
    }
  }

  useEffect(() => {
    void loadSavedResumes();
  }, []);

  async function handleUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setIsUploading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const uploadedResume = await uploadResume(file);
      setSavedResumes((resumes) => [
        uploadedResume,
        ...resumes.filter((resume) => resume.id !== uploadedResume.id),
      ]);
      setActiveResumeId(uploadedResume.id);
      setSuccessMessage(`Resume parsed and saved: ${uploadedResume.original_filename}`);
      event.target.value = "";
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Resume upload failed");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <main className="min-h-screen bg-zinc-950 p-10 text-white">
      <div className="mb-10">
        <h1 className="text-6xl font-bold">Resume Analyzer</h1>

        <p className="mt-4 text-xl text-zinc-400">
          Upload your resume and get AI-powered feedback.
        </p>
      </div>

      <div className="mb-8 rounded-3xl border border-zinc-800 bg-zinc-900 p-10">
        <h2 className="mb-3 text-3xl font-bold">Upload Resume</h2>

        <p className="mb-8 text-zinc-400">
          Upload your latest resume for AI analysis.
        </p>

        <label
          className="
            flex h-72 cursor-pointer flex-col items-center justify-center
            rounded-3xl border-2 border-dashed border-zinc-700
            transition hover:border-emerald-500
          "
        >
          <span className="mb-6 text-xl text-zinc-400">
            {isUploading ? "Uploading and parsing..." : "Drag & Drop Resume (PDF/DOCX)"}
          </span>

          <span
            className="
              rounded-xl
              bg-white
              px-8
              py-4
              text-lg
              font-semibold
              text-black
            "
          >
            {isUploading ? "Please wait" : "Choose Resume"}
          </span>

          <input
            type="file"
            accept=".pdf,.docx"
            disabled={isUploading}
            onChange={handleUpload}
            className="sr-only"
          />
        </label>

        <div className="mt-8 grid gap-4 lg:grid-cols-[1fr_auto]">
          <div>
            <label className="mb-2 block text-sm text-zinc-400">
              Saved Resumes
            </label>
            <select
              value={activeResume?.id || ""}
              onChange={(event) => setActiveResumeId(event.target.value)}
              disabled={isLoadingResumes || savedResumes.length === 0}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-4 text-white"
            >
              {savedResumes.length === 0 ? (
                <option value="">No saved resumes yet</option>
              ) : (
                savedResumes.map((resume) => (
                  <option key={resume.id} value={resume.id}>
                    {resume.original_filename} - {new Date(resume.created_at).toLocaleDateString()}
                  </option>
                ))
              )}
            </select>
          </div>

          <button
            onClick={() => void loadSavedResumes()}
            disabled={isLoadingResumes}
            className="self-end rounded-xl border border-zinc-700 px-6 py-4 font-semibold text-zinc-200 transition hover:border-zinc-500"
          >
            {isLoadingResumes ? "Loading..." : "Refresh"}
          </button>
        </div>

        {successMessage ? (
          <div className="mt-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-300">
            {successMessage}
          </div>
        ) : null}

        {errorMessage ? (
          <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-300">
            {errorMessage}
          </div>
        ) : null}
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
        <div className="rounded-3xl bg-zinc-900 p-8">
          <p className="text-zinc-400">ATS Score</p>
          <h3 className="mt-2 text-6xl font-bold text-emerald-400">
            {activeResume ? formatPercent(analysis.atsScore) : "-"}
          </h3>
          <p className="mt-3 text-sm text-emerald-400">
            {activeResume ? "Calculated from parsed resume fields" : "Upload a resume"}
          </p>
        </div>

        <div className="rounded-3xl bg-zinc-900 p-8">
          <p className="text-zinc-400">Skills Found</p>
          <h3 className="mt-2 text-6xl font-bold">{analysis.skills.length}</h3>
        </div>

        <div className="rounded-3xl bg-zinc-900 p-8">
          <p className="text-zinc-400">Experience</p>
          <h3 className="mt-2 text-6xl font-bold">
            {formatExperience(analysis.experienceYears)}
          </h3>
        </div>

        <div className="rounded-3xl bg-zinc-900 p-8">
          <p className="text-zinc-400">Resume Rank</p>
          <h3 className="mt-2 text-6xl font-bold text-blue-400">
            {activeResume ? analysis.resumeRank : "-"}
          </h3>
        </div>
      </div>

      <div className="mb-8 rounded-3xl bg-zinc-900 p-10">
        <h2 className="mb-6 text-3xl font-bold">Resume Health Summary</h2>

        <div className="grid gap-4 md:grid-cols-2">
          {analysis.health.map((item) => (
            <p key={item.label} className={item.tone}>
              {item.label}
            </p>
          ))}
        </div>
      </div>

      <div className="mb-8 rounded-3xl bg-zinc-900 p-10">
        <h2 className="mb-8 text-3xl font-bold">Extracted Skills</h2>

        <div className="flex flex-wrap gap-4">
          {analysis.skills.length ? (
            analysis.skills.map((skill) => (
              <span
                key={skill}
                className="rounded-full bg-emerald-500/15 px-6 py-3 text-xl text-emerald-400"
              >
                {skill}
              </span>
            ))
          ) : (
            <p className="text-zinc-400">No skills parsed yet.</p>
          )}
        </div>
      </div>

      <div className="mb-8 rounded-3xl bg-zinc-900 p-10">
        <h2 className="mb-8 text-3xl font-bold">Career Readiness</h2>

        {analysis.readiness.map((item) => (
          <div key={item.name} className="mb-8">
            <div className="mb-2 flex justify-between">
              <span>{item.name}</span>
              <span className="text-emerald-400">{formatPercent(item.score)}</span>
            </div>

            <div className="h-4 rounded-full bg-zinc-800">
              <div
                className="h-4 rounded-full bg-emerald-500"
                style={{ width: `${Math.max(item.score, 4)}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mb-8 rounded-3xl bg-zinc-900 p-10">
        <h2 className="mb-8 text-3xl font-bold">Companies Detected</h2>

        <div className="flex flex-wrap gap-4">
          {companies.length ? (
            companies.map((company) => (
              <span
                key={company}
                className="rounded-full bg-blue-500/10 px-6 py-3 text-xl text-blue-300"
              >
                {company}
              </span>
            ))
          ) : (
            <p className="text-zinc-400">No companies detected yet.</p>
          )}
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="rounded-3xl bg-zinc-900 p-10">
          <h2 className="mb-8 text-3xl font-bold">Missing Keywords</h2>

          <div className="flex flex-wrap gap-4">
            {analysis.missingKeywords.length ? (
              analysis.missingKeywords.map((keyword) => (
                <span
                  key={keyword}
                  className="rounded-full border border-red-500/20 bg-red-500/10 px-6 py-3 text-xl text-red-400"
                >
                  {keyword}
                </span>
              ))
            ) : (
              <p className="text-emerald-400">No major target keywords missing.</p>
            )}
          </div>
        </div>

        <div className="rounded-3xl bg-zinc-900 p-10">
          <h2 className="mb-8 text-3xl font-bold">Resume Strengths</h2>

          <div className="space-y-5">
            {analysis.strengths.map((item) => (
              <p key={item} className="text-xl text-emerald-400">
                {item}
              </p>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
