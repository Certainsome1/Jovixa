export default function CareerReadiness() {
  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-8">

      <h2 className="mb-6 text-2xl font-bold">
        Career Readiness
      </h2>

      <div className="space-y-5">

        <div>
          <div className="mb-2 flex justify-between">
            <span>Resume Quality</span>
            <span className="text-emerald-400">
              92%
            </span>
          </div>

          <div className="h-3 rounded-full bg-zinc-800">
            <div
              className="h-3 rounded-full bg-emerald-500"
              style={{ width: "92%" }}
            />
          </div>
        </div>

        <div>
          <div className="mb-2 flex justify-between">
            <span>Interview Readiness</span>
            <span className="text-emerald-400">
              84%
            </span>
          </div>

          <div className="h-3 rounded-full bg-zinc-800">
            <div
              className="h-3 rounded-full bg-emerald-500"
              style={{ width: "84%" }}
            />
          </div>
        </div>

        <div>
          <div className="mb-2 flex justify-between">
            <span>Market Competitiveness</span>
            <span className="text-emerald-400">
              88%
            </span>
          </div>

          <div className="h-3 rounded-full bg-zinc-800">
            <div
              className="h-3 rounded-full bg-emerald-500"
              style={{ width: "88%" }}
            />
          </div>
        </div>

      </div>

    </div>
  );
}