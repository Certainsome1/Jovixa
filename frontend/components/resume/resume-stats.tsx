export default function ResumeStats() {
  return (
    <div className="grid gap-6 md:grid-cols-3">

      <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
        <p className="text-zinc-400">ATS Score</p>
        <h3 className="mt-2 text-4xl font-bold text-emerald-400">
          92%
        </h3>
      </div>

      <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
        <p className="text-zinc-400">Skills Found</p>
        <h3 className="mt-2 text-4xl font-bold">
          28
        </h3>
      </div>

      <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
        <p className="text-zinc-400">Experience</p>
        <h3 className="mt-2 text-4xl font-bold">
          4 Years
        </h3>
      </div>

    </div>
  );
}