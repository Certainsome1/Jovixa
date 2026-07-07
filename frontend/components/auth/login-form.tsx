"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState, useTransition } from "react";
import { Lock, LogIn, Mail, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type LoginFormProps = {
  authError?: string;
  redirectTo: string;
};

function safeRedirectPath(path: string) {
  if (!path || !path.startsWith("/") || path.startsWith("//")) {
    return "/dashboard";
  }

  return path;
}

export default function LoginForm({ authError, redirectTo }: LoginFormProps) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState(authError || "");
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    startTransition(() => {
      router.replace(safeRedirectPath(redirectTo));
      router.refresh();
    });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 py-10 text-white">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900 shadow-2xl shadow-black/40 lg:grid-cols-[1fr_0.9fr]">
        <section className="hidden bg-zinc-950 p-10 lg:block">
          <div className="flex h-full flex-col justify-between">
            <div>
              <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-black">
                <Sparkles className="h-7 w-7" />
              </div>
              <h1 className="text-5xl font-bold tracking-tight">Jovixa</h1>
              <p className="mt-4 max-w-md text-lg leading-8 text-zinc-400">
                Sign in to continue matching your resume with saved jobs and
                AI-ranked opportunities.
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 text-sm text-zinc-400">
              Your resumes, job board, and match history stay connected to your
              account.
            </div>
          </div>
        </section>

        <section className="p-8 sm:p-10">
          <div className="mb-8">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-blue-400">
              Welcome back
            </p>
            <h2 className="mt-3 text-3xl font-bold">Log in</h2>
            <p className="mt-2 text-sm text-zinc-400">
              Use your account credentials.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-zinc-300">
                Email
              </span>
              <span className="flex items-center rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3 transition focus-within:border-blue-500">
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
              <span className="flex items-center rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3 transition focus-within:border-blue-500">
                <Lock className="h-5 w-5 text-zinc-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full bg-transparent px-3 text-white outline-none placeholder:text-zinc-600"
                  placeholder="Your password"
                />
              </span>
            </label>

            {message ? (
              <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
                {message}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isPending}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-5 py-4 font-semibold text-black transition hover:bg-zinc-200 disabled:opacity-60"
            >
              <LogIn className="h-5 w-5" />
              {isPending ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-zinc-400">
            New to Jovixa?{" "}
            <Link
              href="/signup"
              className="font-semibold text-white hover:text-blue-300"
            >
              Create an account
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
}
