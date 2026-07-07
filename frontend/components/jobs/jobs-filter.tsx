export default function JobsFilter() {
  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">

      <h2 className="mb-6 text-xl font-semibold text-white">
        Filters
      </h2>

      {/* Experience */}
      <div className="mb-6">
        <h3 className="mb-3 text-sm font-medium text-zinc-400">
          Experience
        </h3>

        <div className="space-y-2 text-sm text-zinc-300">
          <label className="flex items-center gap-2">
            <input type="checkbox" />
            0 - 2 Years
          </label>

          <label className="flex items-center gap-2">
            <input type="checkbox" />
            3 - 5 Years
          </label>

          <label className="flex items-center gap-2">
            <input type="checkbox" />
            6+ Years
          </label>
        </div>
      </div>

      {/* Location */}
      <div className="mb-6">
        <h3 className="mb-3 text-sm font-medium text-zinc-400">
          Location
        </h3>

        <div className="space-y-2 text-sm text-zinc-300">
          <label className="flex items-center gap-2">
            <input type="checkbox" />
            Pune
          </label>

          <label className="flex items-center gap-2">
            <input type="checkbox" />
            Mumbai
          </label>

          <label className="flex items-center gap-2">
            <input type="checkbox" />
            Bangalore
          </label>
        </div>
      </div>

      {/* Match Score */}
      <div>
        <h3 className="mb-3 text-sm font-medium text-zinc-400">
          Match Score
        </h3>

        <div className="space-y-2 text-sm text-zinc-300">
          <label className="flex items-center gap-2">
            <input type="checkbox" />
            90%+
          </label>

          <label className="flex items-center gap-2">
            <input type="checkbox" />
            80%+
          </label>

          <label className="flex items-center gap-2">
            <input type="checkbox" />
            70%+
          </label>
        </div>
      </div>

    </div>
  );
}