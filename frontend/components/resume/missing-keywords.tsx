const keywords = [
  "Python",
  "Power BI",
  "Teamcenter Workflow",
  "Data Analytics",
  "Project Management",
];

export default function MissingKeywords() {
  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-8">

      <h2 className="mb-6 text-2xl font-bold">
        Missing Keywords
      </h2>

      <div className="flex flex-wrap gap-3">

        {keywords.map((keyword) => (
          <span
            key={keyword}
            className="
              rounded-full
              border
              border-red-500/20
              bg-red-500/10
              px-4
              py-2
              text-red-400
            "
          >
            {keyword}
          </span>
        ))}

      </div>

    </div>
  );
}