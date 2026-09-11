"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { PageHeader } from "@/components/ui/PageHeader";
import { ErrorState, LoadingState } from "@/components/ui/StateDisplay";
import { retailerApi } from "@/features/accounts/account.api";
import type { Retailer } from "@/features/accounts/account.types";
import { getApiErrorMessage } from "@/lib/api";
import { formatDateTime } from "@/lib/utils";
export default function RetailerDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [item, setItem] = useState<Retailer | null>(null),
    [error, setError] = useState<string | null>(null),
    [loading, setLoading] = useState(true),
    [confirmingDelete, setConfirmingDelete] = useState(false),
    [deleting, setDeleting] = useState(false);
  useEffect(() => {
    retailerApi
      .get(id)
      .then(setItem)
      .catch((e) => setError(getApiErrorMessage(e, "Unable to load Retailer.")))
      .finally(() => setLoading(false));
  }, [id]);
  const permanentlyDelete = async () => {
    setDeleting(true);
    setError(null);
    try {
      await retailerApi.permanentlyDelete(id);
      router.push("/retailers");
    } catch (reason) {
      setError(
        getApiErrorMessage(reason, "Unable to permanently delete Retailer."),
      );
      setConfirmingDelete(false);
      setDeleting(false);
    }
  };
  if (loading) return <LoadingState label="Loading Retailer" />;
  if (!item) return <ErrorState message={error || "Retailer not found."} />;
  const parent =
    typeof item.parentWholesaler === "string" ? null : item.parentWholesaler;
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title={item.name}
        description="Retailer account details. Account changes remain managed by the owning Wholesaler."
        actions={
          <>
            <Link className="text-sm font-semibold" href="/retailers">
              Back to Retailers
            </Link>
            <Button variant="danger" onClick={() => setConfirmingDelete(true)}>
              Delete Permanently
            </Button>
          </>
        }
      />
      {error ? (
        <div
          role="alert"
          className="mb-5 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800"
        >
          {error}
        </div>
      ) : null}
      <section className="rounded-lg border bg-white">
        <div className="flex justify-between border-b p-5">
          <h2 className="font-semibold">Account Information</h2>
          <Badge tone={item.status === "active" ? "active" : "inactive"}>
            {item.status}
          </Badge>
        </div>
        <dl className="grid gap-5 p-5 sm:grid-cols-2 lg:grid-cols-3">
          <Info label="Email" value={item.email} />
          <Info label="Phone" value={item.phone || "—"} />
          <Info label="Retailer Discount" value={`${item.discountPercent}%`} />
          <Info
            label="Parent Wholesaler"
            value={
              parent ? (
                <Link
                  className="text-[#7A1F2B] hover:underline"
                  href={`/wholesalers/${parent._id}`}
                >
                  {parent.name}
                </Link>
              ) : (
                "Unavailable"
              )
            }
          />
          <Info label="Created" value={formatDateTime(item.createdAt)} />
          <Info label="Updated" value={formatDateTime(item.updatedAt)} />
          <Info label="Last Login" value={formatDateTime(item.lastLoginAt)} />
        </dl>
      </section>
      <div className="mt-5 rounded-md border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
        Profile and status changes are managed by the owning Wholesaler.
        Permanent deletion is a separate Admin-only safety action.
      </div>
      <ConfirmDialog
        isOpen={confirmingDelete}
        title="Permanently delete this retailer?"
        description="This action cannot be undone. Permanent deletion is only allowed when the retailer has no order history."
        confirmLabel="Delete Permanently"
        tone="danger"
        isConfirming={deleting}
        onClose={() => !deleting && setConfirmingDelete(false)}
        onConfirm={() => void permanentlyDelete()}
      />
    </div>
  );
}
function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-neutral-500">
        {label}
      </dt>
      <dd className="mt-1 break-words text-sm font-medium">{value}</dd>
    </div>
  );
}
