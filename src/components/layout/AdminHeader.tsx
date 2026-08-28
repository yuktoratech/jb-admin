"use client";

import { useRouter } from "next/navigation";

import { useAuth } from "@/features/auth/AuthProvider";

type AdminHeaderProps = {
  onMenuClick: () => void;
};

function getInitials(name?: string) {
  if (!name) {
    return "A";
  }

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function AdminHeader({ onMenuClick }: AdminHeaderProps) {
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.replace("/login");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-20 flex h-20 shrink-0 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-xl border border-slate-200 p-2.5 text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 lg:hidden"
          aria-label="Open navigation"
        >
          <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>

        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900 sm:text-base">
            Administration
          </p>
          <p className="hidden text-xs text-slate-500 sm:block">
            Secure wholesale management workspace
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <div className="hidden min-w-0 text-right sm:block">
          <p className="max-w-48 truncate text-sm font-semibold text-slate-900">
            {user?.name ?? "Administrator"}
          </p>
          <p className="max-w-48 truncate text-xs text-slate-500">{user?.email}</p>
        </div>

        <div
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-900 text-sm font-semibold text-white"
          aria-hidden="true"
        >
          {getInitials(user?.name)}
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 sm:px-4"
        >
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path d="M10 17 15 12 10 7M15 12H3M14 3h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5" />
          </svg>
          <span className="hidden sm:inline">Log out</span>
          <span className="sr-only sm:hidden">Log out</span>
        </button>
      </div>
    </header>
  );
}

