import {
  MapPin,
  Briefcase,
  Clock3,
  ExternalLink,
} from "lucide-react";

interface JobCardProps {
  role: string;
  company: string;
  location: string;
  source: string;
  posted: string;
  skills: string[];
  isApplied: boolean;
  isApplying: boolean;
  url: string;
  onApply: () => void;
}

export default function JobCard({
  role,
  company,
  location,
  source,
  posted,
  skills,
  isApplied,
  isApplying,
  url,
  onApply,
}: JobCardProps) {
  return (
    <div
      className="
        rounded-3xl
        border
        border-zinc-800
        bg-zinc-900
        p-6
        transition-all
        duration-300
        hover:-translate-y-1
        hover:border-zinc-700
      "
    >
      {/* Header */}
      <div className="mb-5 flex items-start justify-between">

        <div>
          <h3 className="text-2xl font-semibold text-white">
            {role}
          </h3>

          <p className="mt-1 text-lg text-zinc-400">
            {company}
          </p>

          <div className="mt-3 flex items-center gap-2 text-emerald-400">
            <Briefcase className="h-4 w-4" />
            <span className="font-medium">{source}</span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">

          <div
            className="
              rounded-full
              border
              border-blue-500/30
              bg-blue-500/10
              px-4
              py-2
              text-sm
              font-semibold
              text-blue-300
            "
          >
            {isApplied ? "Applied" : "Open"}
          </div>

          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <Clock3 className="h-3 w-3" />
            {posted}
          </div>

        </div>

      </div>

      {/* Skills */}
      <div className="mb-5 flex flex-wrap gap-2">

        {skills.map((skill) => (
          <span
            key={skill}
            className="
              rounded-full
              bg-zinc-800
              px-3
              py-1
              text-xs
              text-zinc-300
            "
          >
            {skill}
          </span>
        ))}

      </div>

      {/* Meta */}
      <div className="mb-6 flex flex-wrap gap-5 text-sm text-zinc-400">

        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          {location}
        </div>

        <div className="flex items-center gap-2">
          <Briefcase className="h-4 w-4" />
          {source}
        </div>

      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">

        <button
          type="button"
          onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
          className="
            flex
            items-center
            gap-2
            rounded-xl
            border
            border-zinc-700
            px-4
            py-2
            text-sm
            text-zinc-300
            transition
            hover:border-zinc-600
            hover:text-white
          "
        >
          <ExternalLink className="h-4 w-4" />
          View Job
        </button>

        <button
          type="button"
          onClick={onApply}
          disabled={isApplying}
          className="
            rounded-xl
            bg-white
            px-5
            py-2
            text-sm
            font-semibold
            text-black
            transition
            hover:bg-zinc-200
            disabled:cursor-not-allowed
            disabled:bg-zinc-500
          "
        >
          {isApplying ? "Saving..." : isApplied ? "Mark Not Applied" : "Mark Applied"}
        </button>

      </div>
    </div>
  );
}
