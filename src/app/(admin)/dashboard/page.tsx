"use client";

import { useAuth } from "@/features/auth/AuthProvider";

type StatusCardProps = {
  eyebrow: string;
  title: string;
  description: string;
  tone: "emerald" | "sky" | "slate";
  icon: "connection" | "shield" | "modules";
};

const toneStyles = {
  emerald: {
    icon: "bg-emerald-50 text-emerald-700",
    dot: "bg-emerald-500",
  },
  sky: {
    icon: "bg-sky-50 text-sky-700",
    dot: "bg-sky-500",
  },
  slate: {
    icon: "bg-slate-100 text-slate-700",
    dot: "bg-slate-400",
  },
};

function StatusIcon({ icon }: Pick<StatusCardProps, "icon">) {
  if (icon === "connection") {
    return (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path d="M8 12.5 10.5 15 16 9.5" />
        <path d="M12 3a9 9 0 1 1-9 9" />
        <path d="M3 5v5h5" />
      </svg>
    );
  }

  if (icon === "shield") {
    return (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path d="M12 3 4 6v5c0 5.1 3.4 8.6 8 10 4.6-1.4 8-4.9 8-10V6l-8-3Z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    );
  }

  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <path d="M14 17.5h7M17.5 14v7" />
    </svg>
  );
}

function StatusCard({ eyebrow, title, description, tone, icon }: StatusCardProps) {
  const styles = toneStyles[tone];

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/[0.02] sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${styles.icon}`}>
          <StatusIcon icon={icon} />
        </div>
        <span className="flex items-center gap-2 rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
          <span className={`h-1.5 w-1.5 rounded-full ${styles.dot}`} aria-hidden="true" />
          {eyebrow}
        </span>
      </div>
      <h2 className="mt-5 text-lg font-semibold text-slate-950">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
    </article>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const firstName = user?.name?.trim().split(/\s+/)[0] || "Administrator";

  return (
    <div className="mx-auto w-full max-w-7xl">
      <section className="relative overflow-hidden rounded-3xl bg-slate-950 px-6 py-8 text-white shadow-xl shadow-slate-900/10 sm:px-8 sm:py-10">
        <div
          className="absolute -right-12 -top-20 h-64 w-64 rounded-full bg-sky-500/20 blur-3xl"
          aria-hidden="true"
        />
        <div className="relative max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1.5 text-xs font-medium text-slate-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400" aria-hidden="true" />
            Authenticated admin workspace
          </div>
          <h1 className="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">
            Welcome back, {firstName}.
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base sm:leading-7">
            The administration foundation is connected and ready. Business modules
            will be added here when their backend APIs are available.
          </p>
        </div>
      </section>

      <section className="mt-8" aria-labelledby="system-status-heading">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sky-700">
              Live session
            </p>
            <h2 id="system-status-heading" className="mt-1 text-xl font-semibold text-slate-950">
              System overview
            </h2>
          </div>
          <p className="hidden text-sm text-slate-500 sm:block">No business data is shown yet</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <StatusCard
            eyebrow="Connected"
            title="Backend connected"
            description="Your authenticated session was verified successfully by the configured API."
            tone="emerald"
            icon="connection"
          />
          <StatusCard
            eyebrow="Active"
            title="Admin authenticated"
            description={`Access is active for ${user?.email ?? "the current administrator"}.`}
            tone="sky"
            icon="shield"
          />
          <StatusCard
            eyebrow="Pending"
            title="Business modules pending"
            description="Products, orders, inventory, and account management will remain unavailable until their APIs exist."
            tone="slate"
            icon="modules"
          />
        </div>
      </section>

      <section className="mt-8 grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/[0.02]">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-sky-50 text-sky-700">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <path d="M4 19V9M10 19V5M16 19v-7M22 19H2" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-950">Available now</p>
              <p className="text-xs text-slate-500">Current frontend foundation</p>
            </div>
          </div>
          <ul className="mt-5 grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
            {["Secure admin login", "Persistent authenticated session", "Protected admin routing", "Responsive management layout"].map((item) => (
              <li key={item} className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3">
                <svg className="h-4 w-4 shrink-0 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
                  <path d="m5 12 4 4L19 6" />
                </svg>
                {item}
              </li>
            ))}
          </ul>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/[0.02]">
          <p className="text-sm font-semibold text-slate-950">Current administrator</p>
          <dl className="mt-5 space-y-4">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <dt className="text-sm text-slate-500">Name</dt>
              <dd className="text-right text-sm font-medium text-slate-900">{user?.name}</dd>
            </div>
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <dt className="text-sm text-slate-500">Role</dt>
              <dd className="text-right text-sm font-medium capitalize text-slate-900">{user?.role}</dd>
            </div>
            <div className="flex items-start justify-between gap-4">
              <dt className="text-sm text-slate-500">Status</dt>
              <dd className="flex items-center gap-2 text-right text-sm font-medium capitalize text-emerald-700">
                <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" />
                {user?.status}
              </dd>
            </div>
          </dl>
        </article>
      </section>
    </div>
  );
}

