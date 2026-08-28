"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type AdminSidebarProps = {
  isOpen: boolean;
  onClose: () => void;
};

const navigation = [
  {
    label: "Dashboard",
    href: "/dashboard",
  },
];

function DashboardIcon() {
  return (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}

export function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {isOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-slate-950/45 backdrop-blur-[1px] lg:hidden"
          onClick={onClose}
          aria-label="Close navigation"
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-slate-800 bg-slate-950 text-slate-100 shadow-2xl transition-transform duration-200 ease-out lg:static lg:z-auto lg:visible lg:translate-x-0 lg:shadow-none ${
          isOpen ? "visible translate-x-0" : "invisible -translate-x-full"
        }`}
        aria-label="Admin navigation"
      >
        <div className="flex h-20 shrink-0 items-center justify-between border-b border-slate-800 px-6">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
            onClick={onClose}
          >
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-sky-500 font-semibold text-white shadow-lg shadow-sky-950/30">
              W
            </span>
            <span>
              <span className="block text-sm font-semibold tracking-wide text-white">
                Wholesale Admin
              </span>
              <span className="block text-xs text-slate-400">Management portal</span>
            </span>
          </Link>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 lg:hidden"
            aria-label="Close navigation"
          >
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="m6 6 12 12M18 6 6 18" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 px-4 py-6">
          <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
            Overview
          </p>
          <ul className="space-y-1">
            {navigation.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    aria-current={isActive ? "page" : undefined}
                    className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${
                      isActive
                        ? "bg-sky-500 text-white shadow-lg shadow-sky-950/25"
                        : "text-slate-300 hover:bg-slate-900 hover:text-white"
                    }`}
                  >
                    <DashboardIcon />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t border-slate-800 p-5">
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400" aria-hidden="true" />
              Admin foundation active
            </div>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              Additional business tools will appear as their APIs become available.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
