"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { AuthPageShell } from "@/features/auth/AuthPageShell";
import { authApi } from "@/features/auth/auth.api";
import { ApiError } from "@/lib/api";

const SUCCESS_MESSAGE = "If an account exists for that email, a password reset link will arrive shortly.";

function validateEmail(email: string) {
  const normalizedEmail = email.trim();
  if (!normalizedEmail) return "Email is required.";
  if (normalizedEmail.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return "Enter a valid email address.";
  }
  return undefined;
}

function friendlyRequestError(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 400) return error.message;
    if (error.status === 429) return "Too many reset requests. Please wait before trying again.";
    if (error.code === "API_CONFIGURATION_ERROR") return "The admin service is not configured. Please contact the administrator.";
    if (error.code === "NETWORK_ERROR" || error.status >= 500) return "The admin service is currently unreachable. Please try again shortly.";
  }
  return "We could not submit the request. Please try again.";
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string>();
  const [submitError, setSubmitError] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextEmailError = validateEmail(email);
    setEmailError(nextEmailError);
    setSubmitError(undefined);
    if (nextEmailError) return;

    setIsSubmitting(true);
    try {
      await authApi.forgotPassword({ email: email.trim() });
      setIsSubmitted(true);
    } catch (error) {
      setSubmitError(friendlyRequestError(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthPageShell
      eyebrow="Account recovery"
      title="Forgot password?"
      description="Enter your administrator email address and we will send reset instructions if it matches an account."
    >
      {isSubmitted ? (
        <div className="mt-8">
          <div className="border-l-2 border-green-700 bg-green-50 px-4 py-3 text-sm leading-6 text-green-900" role="status" aria-live="polite">
            {SUCCESS_MESSAGE}
          </div>
          <p className="mt-4 text-xs leading-5 text-neutral-500">Check your spam folder if the message does not appear. The link expires after a short time and can only be used once.</p>
        </div>
      ) : (
        <form className="mt-8 space-y-5" onSubmit={handleSubmit} noValidate>
          {submitError ? (
            <div className="border-l-2 border-red-700 bg-red-50 px-4 py-3 text-sm leading-6 text-red-800" role="alert">{submitError}</div>
          ) : null}
          <Input
            label="Email address"
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            maxLength={254}
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              if (emailError) setEmailError(undefined);
            }}
            error={emailError}
            placeholder="admin@company.com"
          />
          <Button type="submit" size="lg" className="w-full" isLoading={isSubmitting} loadingLabel="Sending instructions">
            Send reset instructions
          </Button>
        </form>
      )}

      <p className="mt-7 border-t border-neutral-200 pt-5 text-center text-sm text-neutral-600">
        <Link href="/login" className="font-semibold text-[#7A1F2B] hover:underline">Back to sign in</Link>
      </p>
    </AuthPageShell>
  );
}
