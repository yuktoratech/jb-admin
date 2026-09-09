"use client";

import { type FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useAuth } from "@/features/auth/AuthProvider";
import { ApiError } from "@/lib/api";

type FieldErrors = { email?: string; password?: string };

function validate(email: string, password: string): FieldErrors {
  const errors: FieldErrors = {};
  const normalizedEmail = email.trim();

  if (!normalizedEmail) errors.email = "Email is required.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) errors.email = "Enter a valid email address.";
  if (!password) errors.password = "Password is required.";

  return errors;
}

function friendlyLoginError(error: unknown) {
  if (error instanceof ApiError) {
    if ([400, 401].includes(error.status)) return error.message;
    if (error.status === 429) return "Too many sign-in attempts. Please wait a moment and try again.";
    if (error.code === "NETWORK_ERROR" || error.status >= 500) return "The admin service is currently unreachable. Please try again shortly.";
    if (error.code === "API_CONFIGURATION_ERROR") return "The admin service is not configured. Please contact the administrator.";
  }

  return "We could not sign you in. Please check your details and try again.";
}

export default function LoginPage() {
  const router = useRouter();
  const { user, isLoading, error: authError, login, logout, clearError } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && user?.role === "admin" && user.status === "active") router.replace("/dashboard");
  }, [isLoading, router, user]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    clearError();
    setSubmitError(null);
    const nextErrors = validate(email, password);
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

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

  if (isLoading && !isSubmitting) return <LoadingSpinner fullScreen label="Checking your session" />;

  const visibleError = submitError ?? authError;

  return (
    <main className="flex min-h-svh items-center justify-center bg-[#F7F7F7] px-4 py-8">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-xl border border-neutral-200 bg-white lg:grid-cols-[0.9fr_1.1fr]">
        <section className="hidden min-h-[620px] flex-col justify-between bg-black p-10 text-white lg:flex">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded bg-[#7A1F2B] text-xs font-bold tracking-wide">JB</span>
            <div>
              <p className="text-sm font-bold tracking-[0.15em]">JUST BLACK</p>
              <p className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">Administration</p>
            </div>
          </div>

          <div className="max-w-md">
            <div className="mb-5 h-0.5 w-12 bg-[#7A1F2B]" />
            <h1 className="text-3xl font-semibold leading-tight tracking-tight">Internal wholesale management</h1>
            <p className="mt-4 text-sm leading-7 text-neutral-400">Secure access for managing the Just Black product catalog, variants, and inventory.</p>
          </div>

          <p className="text-xs text-neutral-600">Authorized administrators only</p>
        </section>

        <section className="flex min-h-[560px] items-center justify-center px-5 py-10 sm:px-12 lg:min-h-[620px] lg:px-20">
          <div className="w-full max-w-sm">
            <div className="mb-9 flex items-center gap-3 lg:hidden">
              <span className="grid h-9 w-9 place-items-center rounded bg-[#7A1F2B] text-xs font-bold tracking-wide text-white">JB</span>
              <div>
                <p className="text-sm font-bold tracking-[0.15em] text-black">JUST BLACK</p>
                <p className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">Administration</p>
              </div>
            </div>

            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7A1F2B]">Admin access</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-black">Sign in</h2>
            <p className="mt-2 text-sm leading-6 text-neutral-500">Use your existing administrator credentials.</p>

            <form className="mt-8 space-y-5" onSubmit={handleSubmit} noValidate>
              {visibleError ? (
                <div className="border-l-2 border-red-700 bg-red-50 px-4 py-3 text-sm leading-6 text-red-800" role="alert">{visibleError}</div>
              ) : null}

              <Input
                label="Email address"
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  if (fieldErrors.email) setFieldErrors((current) => ({ ...current, email: undefined }));
                }}
                error={fieldErrors.email}
                placeholder="admin@company.com"
              />
              <Input
                label="Password"
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  if (fieldErrors.password) setFieldErrors((current) => ({ ...current, password: undefined }));
                }}
                error={fieldErrors.password}
                placeholder="Enter your password"
              />

              <div className="text-right">
                <Link href="/forgot-password" className="text-sm font-semibold text-[#7A1F2B] hover:underline">
                  Forgot password?
                </Link>
              </div>

              <Button type="submit" size="lg" className="w-full" isLoading={isSubmitting} loadingLabel="Signing in">
                Sign in
              </Button>
            </form>

            <p className="mt-7 border-t border-neutral-200 pt-5 text-xs leading-5 text-neutral-500">Your session is verified by the backend. Never share credentials or access tokens.</p>
          </div>
        </section>
      </div>
    </main>
  );
}
