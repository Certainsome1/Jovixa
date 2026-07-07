"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import { createClient } from "@/lib/supabase/client";

import {
  LayoutDashboard,
  BriefcaseBusiness,
  Sparkles,
  FileText,
  Settings,
  User,
  LogOut,
} from "lucide-react";

const items = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Jobs",
    href: "/jobs",
    icon: BriefcaseBusiness,
  },
  {
    title: "AI Match",
    href: "/ai-match", // ✅ Fixed
    icon: Sparkles,
  },
  {
    title: "Resume",
    href: "/resume",
    icon: FileText,
  },
  {
    title: "Profile",
    href: "/profile",
    icon: User,
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();

    startTransition(() => {
      router.replace("/login");
      router.refresh();
    });
  }

  return (
    <aside
      className="
        hidden md:flex
        w-64 h-screen
        bg-zinc-950
        border-r border-zinc-800
        text-white
        p-4
        sticky top-0
        flex-col
      "
    >
      {/* Branding */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight">
          Jovixa
        </h1>

        <p className="mt-1 text-sm text-zinc-400">
          AI Career Intelligence
        </p>
      </div>

      {/* Navigation */}
      <nav className="space-y-2">
        {items.map((item) => {
          const Icon = item.icon;

          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.title}
              href={item.href}
              className={`
                flex items-center gap-3
                px-4 py-3
                rounded-xl
                transition-all duration-200

                ${
                  isActive
                    ? "bg-white text-black font-medium shadow-sm"
                    : "hover:bg-zinc-800 text-white"
                }
              `}
            >
              <Icon size={20} />

              <span>{item.title}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="mt-auto border-t border-zinc-800 pt-6">
        <button
          type="button"
          onClick={handleSignOut}
          disabled={isPending}
          className="
            mb-4
            flex w-full items-center gap-3
            rounded-xl
            px-4 py-3
            text-left
            text-zinc-300
            transition-all duration-200
            hover:bg-zinc-800
            hover:text-white
          "
        >
          <LogOut size={20} />
          <span>{isPending ? "Signing out..." : "Sign out"}</span>
        </button>

        <div className="rounded-xl bg-zinc-900 p-4">
          <p className="text-sm font-medium">
            Jovixa MVP
          </p>

          <p className="mt-1 text-xs text-zinc-400">
            AI-powered engineering career platform.
          </p>
        </div>
      </div>
    </aside>
  );
}
