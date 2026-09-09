"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, type FormEvent, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { AuthPageShell } from "@/features/auth/AuthPageShell";
import { authApi } from "@/features/auth/auth.api";
import { ApiError } from "@/lib/api";

interface FieldErrors {
  newPassword?: string;
  confirmPassword?: string;
}

function validatePasswords(newPassword: string, confirmPassword: string): FieldErrors {
  const errors: FieldErrors = {};
  if (!newPassword) errors.newPassword = "New password is required.";
  else if (newPassword.length < 8) errors.newPassword = "New password must contain at least 8 characters.";
  else if (newPassword.length > 128) errors.newPassword = "New password cannot exceed 128 characters.";
  else if (!/[a-z]/.test(newPassword)) errors.newPassword = "New password must contain a lowercase letter.";
  else if (!/[A-Z]/.test(newPassword)) errors.newPassword = "New password must contain an uppercase letter.";
  else if (!/\d/.test(newPassword)) errors.newPassword = "New password must contain a number.";

  if (!confirmPassword) errors.confirmPassword = "Confirm your new password.";
  else if (confirmPassword !== newPassword) errors.confirmPassword = "Passwords do not match.";
  return errors;
}

function friendlyResetError(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 400) return "This reset link is invalid or expired. Request a new link and try again.";
    if (error.status === 429) return "Too many reset attempts. Please wait before trying again.";
    if (error.code === "API_CONFIGURATION_ERROR") return "The admin service is not configured. Please contact the administrator.";
    if (error.code === "NETWORK_ERROR" || error.status >= 500) return "The admin service is currently unreachable. Please try again shortly.";
  }
  return "We could not reset your password. Please request a new link and try again.";
}

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const hasValidToken = /^[a-f\d]{64}$/i.test(token);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError(undefined);
    if (!hasValidToken) return;
    const nextErrors = validatePasswords(newPassword, confirmPassword);
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsSubmitting(true);
    try {
      await authApi.resetPassword({ token: token.toLowerCase(), newPassword });
      setIsComplete(true);
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      setSubmitError(friendlyResetError(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthPageShell
      eyebrow="Account recovery"
      title="Choose a new password"
      description="Set a strong password for your administrator account."
    >
      {isComplete ? (
        <div className="mt-8">
          <div className="border-l-2 border-green-700 bg-green-50 px-4 py-3 text-sm leading-6 text-green-900" role="status" aria-live="polite">
            Your password has been reset successfully. You can now sign in with the new password.
          </div>
          <Link href="/login" className="mt-5 inline-flex h-12 w-full items-center justify-center rounded-md border border-[#7A1F2B] bg-[#7A1F2B] px-5 text-sm font-semibold text-white hover:border-[#641924] hover:bg-[#641924]">
            Continue to sign in
          </Link>
        </div>
      ) : !hasValidToken ? (
        <div className="mt-8">
          <div className="border-l-2 border-red-700 bg-red-50 px-4 py-3 text-sm leading-6 text-red-800" role="alert">
            This reset link is incomplete or malformed. Request a new link to continue.
          </div>
          <Link href="/forgot-password" className="mt-5 inline-flex h-12 w-full items-center justify-center rounded-md border border-[#7A1F2B] bg-[#7A1F2B] px-5 text-sm font-semibold text-white hover:border-[#641924] hover:bg-[#641924]">
            Request a new link
          </Link>
        </div>
      ) : (
        <form className="mt-8 space-y-5" onSubmit={handleSubmit} noValidate>
          {submitError ? (
            <div className="border-l-2 border-red-700 bg-red-50 px-4 py-3 text-sm leading-6 text-red-800" role="alert">{submitError}</div>
          ) : null}
          <Input
            label="New password"
            id="newPassword"
            name="newPassword"
            type="password"
            autoComplete="new-password"
            minLength={8}
            maxLength={128}
            value={newPassword}
            onChange={(event) => {
              setNewPassword(event.target.value);
              if (fieldErrors.newPassword) setFieldErrors((current) => ({ ...current, newPassword: undefined }));
            }}
            error={fieldErrors.newPassword}
            hint="8–128 characters with an uppercase letter, a lowercase letter, and a number."
          />
          <Input
            label="Confirm new password"
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            maxLength={128}
            value={confirmPassword}
            onChange={(event) => {
              setConfirmPassword(event.target.value);
              if (fieldErrors.confirmPassword) setFieldErrors((current) => ({ ...current, confirmPassword: undefined }));
            }}
            error={fieldErrors.confirmPassword}
          />
          <Button type="submit" size="lg" className="w-full" isLoading={isSubmitting} loadingLabel="Resetting password">
            Reset password
          </Button>
        </form>
      )}

      {!isComplete ? (
        <p className="mt-7 border-t border-neutral-200 pt-5 text-center text-sm text-neutral-600">
          <Link href="/login" className="font-semibold text-[#7A1F2B] hover:underline">Back to sign in</Link>
        </p>
      ) : null}
    </AuthPageShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<LoadingSpinner fullScreen label="Checking reset link" />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
