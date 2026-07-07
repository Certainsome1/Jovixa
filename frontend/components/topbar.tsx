"use client";

import { Bell, Sparkles, User, Search } from "lucide-react";

export default function Topbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-xl">

      <div className="flex h-20 items-center justify-between px-6 lg:px-8">

        {/* Logo */}
        <div className="flex items-center gap-3">

          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-black font-bold">
            J
          </div>

          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">
              Jovixa
            </h1>

            <p className="text-xs text-zinc-500">
              AI Career Intelligence
            </p>
          </div>

        </div>

        {/* Search */}
        <div className="hidden md:flex w-full max-w-xl mx-8">

          <div
            className="
              flex
              w-full
              items-center
              rounded-2xl
              border
              border-zinc-800
              bg-zinc-900
              px-4
              py-3
              transition-all
              duration-300
              focus-within:border-blue-500
            "
          >
            <Search className="h-4 w-4 text-zinc-500" />

            <input
              type="text"
              placeholder="Search jobs, skills, companies..."
              className="
                w-full
                bg-transparent
                px-3
                text-sm
                text-white
                outline-none
                placeholder:text-zinc-500
              "
            />
          </div>

        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">

          {/* Notifications */}
          <button
            className="
              relative
              rounded-xl
              p-2.5
              text-zinc-400
              transition-all
              hover:bg-zinc-900
              hover:text-white
            "
          >
            <Bell className="h-5 w-5" />

            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
          </button>

          {/* AI Button */}
          <button
            className="
              hidden
              md:flex
              items-center
              gap-2
              rounded-2xl
              border
              border-blue-500/30
              bg-blue-500/10
              px-4
              py-2
              text-blue-400
              transition-all
              duration-300
              hover:bg-blue-500/20
            "
          >
            <Sparkles className="h-4 w-4" />

            <span className="text-sm font-medium">
              AI Assistant
            </span>
          </button>

          {/* User */}
          <button
            className="
              flex
              h-10
              w-10
              items-center
              justify-center
              rounded-full
              border
              border-zinc-700
              bg-zinc-900
              text-zinc-300
              transition-all
              duration-300
              hover:border-zinc-600
              hover:text-white
            "
          >
            <User className="h-5 w-5" />
          </button>

        </div>

      </div>

    </header>
  );
}