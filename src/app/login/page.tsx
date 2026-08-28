"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useAuth } from "@/features/auth/AuthProvider";
import { ApiError } from "@/lib/api";

type FieldErrors = {
  email?: string;
  password?: string;
};

function validate(email: string, password: string): FieldErrors {
  const errors: FieldErrors = {};
  const normalizedEmail = email.trim();

  if (!normalizedEmail) {
    errors.email = "Email is required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    errors.email = "Enter a valid email address.";
  }

  if (!password) {
    errors.password = "Password is required.";
  }

  return errors;
}

function friendlyLoginError(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 400 || error.status === 401) {
      return error.message;
    }

    if (error.status === 429) {
      return "Too many sign-in attempts. Please wait a moment and try again.";
    }

    if (error.code === "NETWORK_ERROR" || error.status >= 500) {
      return "The admin service is currently unreachable. Please try again shortly.";
    }

    if (error.code === "API_CONFIGURATION_ERROR") {
      return "The admin service is not configured. Please contact the administrator.";
    }
  }

  return "We could not sign you in. Please check your details and try again.";
}

export default function LoginPage() {
  const router = useRouter();
  const {
    user,
    isLoading,
    error: authError,
    login,
    logout,
    clearError,
  } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && user?.role === "admin" && user.status === "active") {
      router.replace("/dashboard");
    }
  }, [isLoading, router, user]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    clearError();
    setSubmitError(null);

    const nextErrors = validate(email, password);
    setFieldErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      const authenticatedUser = await login(email.trim(), password);

      if (authenticatedUser.role !== "admin") {
        logout();
        setSubmitError("This account does not have administrator access.");
        return;
      }

      if (authenticatedUser.status !== "active") {
        logout();
        setSubmitError("This administrator account is not active.");
        return;
      }

      router.replace("/dashboard");
      router.refresh();
    } catch (error) {
      setSubmitError(friendlyLoginError(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading && !isSubmitting) {
    return <LoadingSpinner fullScreen label="Checking your session" />;
  }

  const visibleError = submitError ?? authError;

  return (
    <main className="min-h-svh bg-slate-100 p-3 sm:p-6 lg:p-8">
      <div className="mx-auto grid min-h-[calc(100svh-1.5rem)] max-w-7xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-900/5 sm:min-h-[calc(100svh-3rem)] lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative hidden overflow-hidden bg-slate-950 p-12 text-white lg:flex lg:flex-col lg:justify-between">
          <div
            className="absolute -right-28 -top-28 h-96 w-96 rounded-full bg-sky-500/20 blur-3xl"
            aria-hidden="true"
          />
          <div
            className="absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-indigo-500/15 blur-3xl"
            aria-hidden="true"
          />

          <div className="relative flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-sky-500 text-lg font-semibold shadow-lg shadow-sky-950/40">
              W
            </span>
            <div>
              <p className="font-semibold tracking-wide">Wholesale Admin</p>
              <p className="text-xs text-slate-400">Management portal</p>
            </div>
          </div>

          <div className="relative max-w-xl">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/70 px-3 py-1.5 text-xs font-medium text-slate-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400" aria-hidden="true" />
              Secure administrative access
            </div>
            <h1 className="text-4xl font-semibold leading-tight tracking-tight xl:text-5xl">
              Your wholesale operations, in one focused workspace.
            </h1>
            <p className="mt-6 max-w-lg text-base leading-7 text-slate-400">
              Sign in to access the protected administration foundation and manage the
              platform as new business capabilities become available.
            </p>
          </div>

          <p className="relative text-xs text-slate-500">
            Access is restricted to authorized administrators.
          </p>
        </section>

        <section className="flex items-center justify-center px-5 py-10 sm:px-12 lg:px-16 xl:px-24">
          <div className="w-full max-w-md">
            <div className="mb-9 lg:hidden">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-slate-950 font-semibold text-white">
                  W
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-950">Wholesale Admin</p>
                  <p className="text-xs text-slate-500">Management portal</p>
                </div>
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-sky-600">Administrator sign in</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                Welcome back
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                Enter your existing admin credentials to continue.
              </p>
            </div>

            <form className="mt-8 space-y-5" onSubmit={handleSubmit} noValidate>
              {visibleError ? (
                <div
                  className="flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-5 text-red-700"
                  role="alert"
                >
                  <svg
                    className="mt-0.5 h-5 w-5 shrink-0"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 8v5M12 16.5v.5" />
                  </svg>
                  <span>{visibleError}</span>
                </div>
              ) : null}

              <div>
                <label htmlFor="email" className="text-sm font-medium text-slate-700">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    if (fieldErrors.email) {
                      setFieldErrors((current) => ({ ...current, email: undefined }));
                    }
                  }}
                  aria-invalid={Boolean(fieldErrors.email)}
                  aria-describedby={fieldErrors.email ? "email-error" : undefined}
                  placeholder="admin@company.com"
                  className={`mt-2 block h-12 w-full rounded-xl border bg-white px-4 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:ring-4 ${
                    fieldErrors.email
                      ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                      : "border-slate-300 focus:border-sky-500 focus:ring-sky-100"
                  }`}
                />
                {fieldErrors.email ? (
                  <p id="email-error" className="mt-2 text-xs text-red-600">
                    {fieldErrors.email}
                  </p>
                ) : null}
              </div>

              <div>
                <label htmlFor="password" className="text-sm font-medium text-slate-700">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    if (fieldErrors.password) {
                      setFieldErrors((current) => ({ ...current, password: undefined }));
                    }
                  }}
                  aria-invalid={Boolean(fieldErrors.password)}
                  aria-describedby={fieldErrors.password ? "password-error" : undefined}
                  placeholder="Enter your password"
                  className={`mt-2 block h-12 w-full rounded-xl border bg-white px-4 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:ring-4 ${
                    fieldErrors.password
                      ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                      : "border-slate-300 focus:border-sky-500 focus:ring-sky-100"
                  }`}
                />
                {fieldErrors.password ? (
                  <p id="password-error" className="mt-2 text-xs text-red-600">
                    {fieldErrors.password}
                  </p>
                ) : null}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white shadow-lg shadow-slate-900/10 transition hover:bg-slate-800 focus:outline-none focus-visible:ring-4 focus-visible:ring-slate-300 disabled:cursor-not-allowed disabled:opacity-65"
              >
                {isSubmitting ? (
                  <>
                    <svg
                      className="h-4 w-4 animate-spin"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden="true"
                    >
                      <circle
                        className="opacity-30"
                        cx="12"
                        cy="12"
                        r="9"
                        stroke="currentColor"
                        strokeWidth="3"
                      />
                      <path
                        d="M21 12a9 9 0 0 0-9-9"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
                    </svg>
                    Signing in
                  </>
                ) : (
                  "Sign in"
                )}
              </button>
            </form>

            <div className="mt-8 flex items-start gap-3 border-t border-slate-200 pt-6 text-xs leading-5 text-slate-500">
              <svg
                className="mt-0.5 h-4 w-4 shrink-0 text-slate-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <rect x="5" y="10" width="14" height="10" rx="2" />
                <path d="M8 10V7a4 4 0 0 1 8 0v3" />
              </svg>
              Your session is verified by the backend. Never share your admin
              credentials or access token.
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
