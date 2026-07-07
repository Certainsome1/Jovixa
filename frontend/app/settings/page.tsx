export default function SettingsPage() {
  return (
    <main className="min-h-screen bg-zinc-950 p-10 text-white">

      {/* Header */}

      <div className="mb-10">
        <h1 className="text-7xl font-bold">
          Settings
        </h1>

        <p className="mt-4 text-2xl text-zinc-400">
          Manage your account and preferences.
        </p>
      </div>

      {/* Account Settings */}

      <div className="mb-8 rounded-3xl bg-zinc-900 p-10">

        <h2 className="mb-8 text-4xl font-bold">
          Account Settings
        </h2>

        <div className="grid gap-6 md:grid-cols-2">

          <div>
            <label className="mb-2 block text-zinc-400">
              Full Name
            </label>

            <input
              defaultValue="Somesh"
              className="
                w-full
                rounded-xl
                border border-zinc-700
                bg-zinc-800
                p-4
              "
            />
          </div>

          <div>
            <label className="mb-2 block text-zinc-400">
              Email
            </label>

            <input
              defaultValue="somesh@email.com"
              className="
                w-full
                rounded-xl
                border border-zinc-700
                bg-zinc-800
                p-4
              "
            />
          </div>

          <div>
            <label className="mb-2 block text-zinc-400">
              Phone
            </label>

            <input
              defaultValue="+91 9876543210"
              className="
                w-full
                rounded-xl
                border border-zinc-700
                bg-zinc-800
                p-4
              "
            />
          </div>

        </div>

        <button
          className="
            mt-8
            rounded-xl
            bg-white
            px-6
            py-3
            font-semibold
            text-black
          "
        >
          Change Password
        </button>

      </div>

      {/* Job Preferences */}

      <div className="mb-8 rounded-3xl bg-zinc-900 p-10">

        <h2 className="mb-8 text-4xl font-bold">
          Job Preferences
        </h2>

        <div className="grid gap-6 md:grid-cols-2">

          <input
            defaultValue="Senior NX Designer"
            className="
              rounded-xl
              border border-zinc-700
              bg-zinc-800
              p-4
            "
          />

          <input
            defaultValue="Pune / Mumbai"
            className="
              rounded-xl
              border border-zinc-700
              bg-zinc-800
              p-4
            "
          />

          <input
            defaultValue="₹14-18 LPA"
            className="
              rounded-xl
              border border-zinc-700
              bg-zinc-800
              p-4
            "
          />

          <input
            defaultValue="30 Days"
            className="
              rounded-xl
              border border-zinc-700
              bg-zinc-800
              p-4
            "
          />

        </div>

      </div>

      {/* AI Preferences */}

      <div className="mb-8 rounded-3xl bg-zinc-900 p-10">

        <h2 className="mb-8 text-4xl font-bold">
          AI Matching Preferences
        </h2>

        <div className="space-y-6">

          <div className="flex justify-between">
            <span>Auto Match Jobs</span>
            <span className="text-emerald-400">Enabled</span>
          </div>

          <div className="flex justify-between">
            <span>Weekly Recommendations</span>
            <span className="text-emerald-400">Enabled</span>
          </div>

          <div className="flex justify-between">
            <span>Resume Auto Analysis</span>
            <span className="text-emerald-400">Enabled</span>
          </div>

        </div>

      </div>

      {/* Notifications */}

      <div className="mb-8 rounded-3xl bg-zinc-900 p-10">

        <h2 className="mb-8 text-4xl font-bold">
          Notifications
        </h2>

        <div className="space-y-6">

          <div className="flex justify-between">
            <span>Email Alerts</span>
            <span className="text-emerald-400">ON</span>
          </div>

          <div className="flex justify-between">
            <span>Job Match Alerts</span>
            <span className="text-emerald-400">ON</span>
          </div>

          <div className="flex justify-between">
            <span>Application Updates</span>
            <span className="text-emerald-400">ON</span>
          </div>

        </div>

      </div>

      {/* Subscription */}

      <div className="mb-8 rounded-3xl bg-zinc-900 p-10">

        <h2 className="mb-8 text-4xl font-bold">
          Subscription
        </h2>

        <div className="flex items-center justify-between">

          <div>
            <p className="text-zinc-400">
              Current Plan
            </p>

            <h3 className="text-3xl font-bold">
              Free Plan
            </h3>
          </div>

          <button
            className="
              rounded-xl
              bg-emerald-500
              px-6
              py-3
              font-semibold
              text-black
            "
          >
            Upgrade
          </button>

        </div>

      </div>

      {/* Danger Zone */}

      <div className="rounded-3xl border border-red-500/30 p-10">

        <h2 className="mb-6 text-4xl font-bold text-red-400">
          Danger Zone
        </h2>

        <p className="mb-6 text-zinc-400">
          Permanently delete your account and data.
        </p>

        <button
          className="
            rounded-xl
            bg-red-600
            px-6
            py-3
            font-semibold
          "
        >
          Delete Account
        </button>

      </div>

    </main>
  );
}