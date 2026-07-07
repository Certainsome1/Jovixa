"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/sidebar";

function isAuthPath(pathname: string) {
  return (
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname.startsWith("/auth/")
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (isAuthPath(pathname)) {
    return <main className="min-h-screen w-full bg-zinc-950">{children}</main>;
  }

  return (
    <div className="flex min-h-screen w-full bg-zinc-950">
      <Sidebar />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
