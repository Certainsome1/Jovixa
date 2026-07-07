export default function ProfilePage() {
  const skills = [
    "CATIA V5",
    "NX CAD",
    "Teamcenter",
    "PLM",
    "GD&T",
    "Automation",
    "Creo",
    "BOM",
  ];

  return (
    <main className="min-h-screen bg-zinc-950 p-10 text-white">

      {/* Header */}

      <div className="mb-10">
        <h1 className="text-7xl font-bold">
          Profile
        </h1>

        <p className="mt-4 text-2xl text-zinc-400">
          Manage your professional identity.
        </p>
      </div>

      {/* Profile Completion */}

      <div className="mb-8 rounded-3xl bg-zinc-900 p-8">

        <div className="flex items-center justify-between">

          <div>
            <h2 className="text-2xl font-bold">
              Profile Completion
            </h2>

            <p className="mt-2 text-zinc-400">
              Complete your profile to improve AI matching accuracy.
            </p>
          </div>

          <div className="text-right">
            <h3 className="text-5xl font-bold text-emerald-400">
              85%
            </h3>

            <p className="text-zinc-400">
              Complete
            </p>
          </div>

        </div>

        <div className="mt-6 h-4 rounded-full bg-zinc-800">

          <div
            className="h-4 rounded-full bg-emerald-500"
            style={{ width: "85%" }}
          />

        </div>

      </div>

      {/* Profile Card */}

      <div className="mb-8 rounded-3xl bg-zinc-900 p-10">

        <div className="flex items-center justify-between">

          <div>

            <h2 className="text-5xl font-bold">
              Somesh
            </h2>

            <p className="mt-3 text-2xl text-zinc-400">
              Senior NX Designer
            </p>

            <div className="mt-8 flex gap-10 text-xl">
              <span>4 Years Experience</span>
              <span>Mumbai</span>
            </div>

          </div>

          <button
            className="
              rounded-2xl
              bg-white
              px-8
              py-4
              font-semibold
              text-black
            "
          >
            Edit Profile
          </button>

        </div>

      </div>

      {/* Professional Summary */}

      <div className="mb-8 rounded-3xl bg-zinc-900 p-10">

        <h2 className="mb-6 text-4xl font-bold">
          Professional Summary
        </h2>

        <p className="text-xl leading-relaxed text-zinc-300">
          Mechanical Design Engineer with 4+ years of experience
          in NX CAD, Teamcenter and PLM environments.
          Experienced in product design, engineering automation
          and lifecycle management.
        </p>

      </div>

      {/* Career Snapshot */}

      <div className="mb-8 grid gap-6 md:grid-cols-4">

        <div className="rounded-3xl bg-zinc-900 p-6">
          <p className="text-zinc-400">
            AI Match Score
          </p>

          <h3 className="mt-2 text-5xl font-bold text-emerald-400">
            92%
          </h3>
        </div>

        <div className="rounded-3xl bg-zinc-900 p-6">
          <p className="text-zinc-400">
            Jobs Matched
          </p>

          <h3 className="mt-2 text-5xl font-bold">
            148
          </h3>
        </div>

        <div className="rounded-3xl bg-zinc-900 p-6">
          <p className="text-zinc-400">
            Skills
          </p>

          <h3 className="mt-2 text-5xl font-bold">
            28
          </h3>
        </div>

        <div className="rounded-3xl bg-zinc-900 p-6">
          <p className="text-zinc-400">
            Resume Score
          </p>

          <h3 className="mt-2 text-5xl font-bold text-blue-400">
            92%
          </h3>
        </div>

      </div>

      {/* Skills */}

      <div className="mb-8 rounded-3xl bg-zinc-900 p-10">

        <h2 className="mb-8 text-4xl font-bold">
          Skills
        </h2>

        <div className="flex flex-wrap gap-4">

          {skills.map((skill) => (
            <span
              key={skill}
              className="
                rounded-full
                bg-emerald-500/10
                px-6
                py-3
                text-emerald-400
              "
            >
              {skill}
            </span>
          ))}

        </div>

      </div>

      {/* Career Preferences */}

      <div className="mb-8 rounded-3xl bg-zinc-900 p-10">

        <h2 className="mb-10 text-4xl font-bold">
          Career Preferences
        </h2>

        <div className="grid gap-10 md:grid-cols-2">

          <div>
            <p className="text-zinc-400">
              Preferred Role
            </p>

            <h3 className="mt-2 text-2xl">
              Senior NX Designer
            </h3>
          </div>

          <div>
            <p className="text-zinc-400">
              Preferred Location
            </p>

            <h3 className="mt-2 text-2xl">
              Pune / Mumbai
            </h3>
          </div>

          <div>
            <p className="text-zinc-400">
              Expected Salary
            </p>

            <h3 className="mt-2 text-2xl">
              ₹14-18 LPA
            </h3>
          </div>

          <div>
            <p className="text-zinc-400">
              Notice Period
            </p>

            <h3 className="mt-2 text-2xl">
              30 Days
            </h3>
          </div>

        </div>

      </div>

      {/* Education + Certifications */}

      <div className="mb-8 grid gap-8 md:grid-cols-2">

        <div className="rounded-3xl bg-zinc-900 p-10">

          <h2 className="mb-8 text-4xl font-bold">
            Education
          </h2>

          <h3 className="text-2xl">
            B.E Mechanical Engineering
          </h3>

          <p className="mt-3 text-zinc-400">
            Mumbai University
          </p>

        </div>

        <div className="rounded-3xl bg-zinc-900 p-10">

          <h2 className="mb-8 text-4xl font-bold">
            Certifications
          </h2>

          <div className="space-y-4 text-xl">

            <p>NX CAD Professional</p>

            <p>Teamcenter Basics</p>

            <p>PLM Fundamentals</p>

          </div>

        </div>

      </div>

      {/* Achievements */}

      <div className="rounded-3xl bg-zinc-900 p-10">

        <h2 className="mb-8 text-4xl font-bold">
          Achievements
        </h2>

        <div className="space-y-4 text-xl">

          <p>🏆 Top 10% Resume Score</p>

          <p>🏆 90%+ AI Match Achieved</p>

          <p>🏆 25+ Engineering Skills Added</p>

          <p>🏆 Profile 85% Complete</p>

        </div>

      </div>

    </main>
  );
}