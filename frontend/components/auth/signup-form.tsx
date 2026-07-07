"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState, useTransition } from "react";
import { Lock, Mail, Sparkles, UserPlus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function SignupForm() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsSuccess(false);

    if (password.length < 6) {
      setMessage("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
      },
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    if (data.session) {
      startTransition(() => {
        router.replace("/dashboard");
        router.refresh();
      });
      return;
    }

    setIsSuccess(true);
    setMessage("Account created. Check your email to confirm your signup.");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 py-10 text-white">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900 shadow-2xl shadow-black/40 lg:grid-cols-[0.9fr_1fr]">
        <section className="p-8 sm:p-10">
          <div className="mb-8">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-emerald-400">
              Start matching
            </p>
            <h1 className="mt-3 text-3xl font-bold">Create account</h1>
            <p className="mt-2 text-sm text-zinc-400">
              Create a secure workspace for your resumes and job matches.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-zinc-300">
                Email
              </span>
              <span className="flex items-center rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3 transition focus-within:border-emerald-500">
                <Mail className="h-5 w-5 text-zinc-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  autoComplete="email"
                  className="w-full bg-transparent px-3 text-white outline-none placeholder:text-zinc-600"
                  placeholder="you@example.com"
                />
              </span>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-zinc-300">
                Password
              </span>
              <span className="flex items-center rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3 transition focus-within:border-emerald-500">
                <Lock className="h-5 w-5 text-zinc-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  autoComplete="new-password"
                  className="w-full bg-transparent px-3 text-white outline-none placeholder:text-zinc-600"
                  placeholder="At least 6 characters"
                />
              </span>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-zinc-300">
                Confirm password
              </span>
              <span className="flex items-center rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3 transition focus-within:border-emerald-500">
                <Lock className="h-5 w-5 text-zinc-500" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  required
                  autoComplete="new-password"
                  className="w-full bg-transparent px-3 text-white outline-none placeholder:text-zinc-600"
                  placeholder="Repeat password"
                />
              </span>
            </label>

            {message ? (
              <div
                className={`rounded-2xl border p-4 text-sm ${
                  isSuccess
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                    : "border-red-500/30 bg-red-500/10 text-red-300"
                }`}
              >
                {message}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isPending}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-400 px-5 py-4 font-semibold text-black transition hover:bg-emerald-300 disabled:opacity-60"
            >
              <UserPlus className="h-5 w-5" />
              {isPending ? "Creating..." : "Create account"}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-zinc-400">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-semibold text-white hover:text-emerald-300"
            >
              Sign in
            </Link>
          </p>
        </section>

        <section className="hidden bg-zinc-950 p-10 lg:block">
          <div className="flex h-full flex-col justify-between">
            <div>
              <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-black">
                <Sparkles className="h-7 w-7" />
              </div>
              <h2 className="text-5xl font-bold tracking-tight">AI Job Matcher</h2>
              <p className="mt-4 max-w-md text-lg leading-8 text-zinc-400">
                Save resumes, rank opportunities, and keep your job search
                workspace private.
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 text-sm text-zinc-400">
              Once your account is ready, you can continue directly from your
              dashboard.
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
