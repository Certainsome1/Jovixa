"use client";

import { Search } from "lucide-react";

interface JobsSearchProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export default function JobsSearch({
  value,
  onChange,
  disabled = false,
}: JobsSearchProps) {
  return (
    <div
      className="
        flex
        items-center
        rounded-3xl
        border
        border-zinc-800
        bg-zinc-900
        px-5
        py-4
      "
    >
      <Search className="h-5 w-5 text-zinc-500" />

      <input
        type="text"
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search jobs, companies, skills..."
        className="
          ml-3
          w-full
          bg-transparent
          text-white
          outline-none
          placeholder:text-zinc-500
        "
      />
    </div>
  );
}
