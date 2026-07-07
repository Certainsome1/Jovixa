export default function UploadCard() {
  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-10">

      <h2 className="mb-3 text-2xl font-bold">
        Upload Resume
      </h2>

      <p className="mb-8 text-zinc-400">
        Upload your latest resume for AI analysis.
      </p>

      <div
        className="
          rounded-2xl
          border-2
          border-dashed
          border-zinc-700
          p-16
          text-center
        "
      >
        <p className="mb-4 text-zinc-400">
          Drag & Drop Resume (PDF)
        </p>

        <button
          className="
            rounded-xl
            bg-white
            px-6
            py-3
            font-semibold
            text-black
          "
        >
          Upload Resume
        </button>
      </div>

    </div>
  );
}