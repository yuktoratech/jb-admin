"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { WholesalerForm } from "@/features/accounts/WholesalerForm";
import type { Wholesaler } from "@/features/accounts/account.types";

async function copyText(value: string) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(value);
      return;
    } catch {
      // LAN HTTP can expose the API while still denying clipboard permission.
    }
  }

  const textArea = document.createElement("textarea");
  textArea.value = value;
  textArea.setAttribute("readonly", "");
  textArea.style.position = "fixed";
  textArea.style.opacity = "0";
  document.body.appendChild(textArea);
  textArea.select();

  try {
    if (!document.execCommand("copy")) {
      throw new Error("Copy command was rejected");
    }
  } finally {
    textArea.remove();
  }
}

export default function NewWholesalerPage() {
  const [created, setCreated] = useState<{
    user: Wholesaler;
    password: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);

  if (created) {
    const details = `Just BLACK Wholesaler Account\nName: ${created.user.name}\nEmail: ${created.user.email}\nTemporary password: ${created.password}`;
    const phone = (created.user.phone || "").replace(/\D/g, "");
    const whatsappUrl = phone
      ? `https://wa.me/${phone}?text=${encodeURIComponent(details)}`
      : null;

    const handleCopy = async () => {
      setCopyError(null);
      try {
        await copyText(details);
        setCopied(true);
      } catch {
        setCopied(false);
        setCopyError(
          "Copy was blocked by the browser. Copy the displayed details manually.",
        );
      }
    };

    return (
      <div className="mx-auto max-w-3xl">
        <PageHeader
          title="Wholesaler Created"
          description="Share these one-time credentials securely, then leave this page."
        />
        <section className="rounded-lg border border-green-200 bg-white p-6">
          <p className="text-sm text-green-800">
            Account created successfully.
          </p>
          <dl className="mt-5 grid gap-4 sm:grid-cols-2">
            <Info label="Name" value={created.user.name} />
            <Info label="Email" value={created.user.email} />
            <Info label="Phone" value={created.user.phone || "—"} />
            <Info
              label="Temporary password"
              value={created.password}
              mono
            />
          </dl>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button onClick={() => void handleCopy()}>
              {copied ? "Copied" : "Copy Account Details"}
            </Button>
            {whatsappUrl ? (
              <a
                className="inline-flex h-10 items-center rounded-md border border-neutral-300 px-4 text-sm font-semibold"
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
              >
                Open WhatsApp Chat
              </a>
            ) : null}
            <Link
              className="inline-flex h-10 items-center rounded-md border border-neutral-300 px-4 text-sm font-semibold"
              href={`/wholesalers/${created.user._id}`}
            >
              View Wholesaler
            </Link>
          </div>
          {copyError ? (
            <p role="alert" className="mt-3 text-sm text-red-700">
              {copyError}
            </p>
          ) : null}
          <p className="mt-5 text-xs text-amber-800">
            The temporary password is shown only on this success screen and is
            not stored by the admin frontend.
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Create Wholesaler"
        description="The server generates a one-time temporary password after successful creation."
        actions={
          <Link className="text-sm font-semibold" href="/wholesalers">
            Back to Wholesalers
          </Link>
        }
      />
      <section className="rounded-lg border border-neutral-200 bg-white p-5 sm:p-6">
        <WholesalerForm
          onSaved={(user, password) =>
            setCreated({ user, password: password! })
          }
        />
      </section>
    </div>
  );
}

function Info({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-neutral-500">
        {label}
      </dt>
      <dd className={`mt-1 ${mono ? "font-mono" : "font-medium"}`}>
        {value}
      </dd>
    </div>
  );
}
