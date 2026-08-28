"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { AdminHeader } from "@/components/layout/AdminHeader";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useAuth } from "@/features/auth/AuthProvider";

type AdminLayoutProps = {
  children: ReactNode;
};

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [isLoading, router, user]);

  const handleRestrictedLogout = () => {
    logout();
    router.replace("/login");
    router.refresh();
  };

  if (isLoading || !user) {
    return <LoadingSpinner fullScreen label="Verifying administrator access" />;
  }

  if (user.role !== "admin" || user.status !== "active") {
    const isWrongRole = user.role !== "admin";

    return (
      <main className="flex min-h-svh items-center justify-center bg-slate-100 px-5 py-12">
        <section className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl shadow-slate-900/5 sm:p-10">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-amber-50 text-amber-700">
            <svg
              className="h-7 w-7"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              aria-hidden="true"
            >
              <path d="M12 3 4 6v5c0 5.1 3.4 8.6 8 10 4.6-1.4 8-4.9 8-10V6l-8-3Z" />
              <path d="M12 8v4M12 16h.01" />
            </svg>
          </div>
          <p className="mt-6 text-sm font-semibold text-amber-700">Access restricted</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
            Administrator access required
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            {isWrongRole
              ? "This account is authenticated, but it does not have the administrator role required for this workspace."
              : `This administrator account is currently ${user.status}. Only active accounts can open the admin workspace.`}
          </p>
          <button
            type="button"
            onClick={handleRestrictedLogout}
            className="mt-7 inline-flex h-11 items-center justify-center rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus-visible:ring-4 focus-visible:ring-slate-300"
          >
            Sign out and return to login
          </button>
        </section>
      </main>
    );
  }

  return (
    <div className="flex min-h-svh bg-slate-100">
      <AdminSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminHeader onMenuClick={() => setIsSidebarOpen(true)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
