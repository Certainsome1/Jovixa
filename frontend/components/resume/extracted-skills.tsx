const skills = [
  "CATIA V5",
  "NX CAD",
  "Teamcenter",
  "PLM",
  "GD&T",
  "Automation",
  "BOM",
  "Creo",
];

export default function ExtractedSkills() {
  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-8">

      <h2 className="mb-6 text-2xl font-bold">
        Extracted Skills
      </h2>

      <div className="flex flex-wrap gap-3">

        {skills.map((skill) => (
          <span
            key={skill}
            className="
              rounded-full
              bg-emerald-500/10
              px-4
              py-2
              text-emerald-400
            "
          >
            {skill}
          </span>
        ))}

      </div>

    </div>
  );
}