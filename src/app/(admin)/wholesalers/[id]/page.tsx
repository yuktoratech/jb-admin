"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/StateDisplay";
import { Table, type TableColumn } from "@/components/ui/Table";
import { WholesalerForm } from "@/features/accounts/WholesalerForm";
import { retailerApi, wholesalerApi } from "@/features/accounts/account.api";
import type { Retailer, Wholesaler } from "@/features/accounts/account.types";
import { getApiErrorMessage } from "@/lib/api";
import { formatDateTime } from "@/lib/utils";

const RETAILER_PREVIEW_SIZE = 10;

export default function WholesalerDetail() {
  const { id } = useParams<{ id: string }>();
  const [item, setItem] = useState<Wholesaler | null>(null);
  const [retailers, setRetailers] = useState<Retailer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [wholesaler, retailerData] = await Promise.all([
        wholesalerApi.get(id),
        retailerApi.list({ wholesalerId: id, page: 1, limit: RETAILER_PREVIEW_SIZE }),
      ]);
      setItem(wholesaler);
      setRetailers(retailerData.retailers);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "Unable to load Wholesaler."));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    // The initial route fetch owns the page loading state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  if (loading) return <LoadingState label="Loading Wholesaler" />;
  if (error || !item) return <ErrorState message={error || "Wholesaler not found."} onRetry={() => void load()} />;

  const columns: Array<TableColumn<Retailer>> = [
    { key: "name", header: "Retailer", render: (retailer) => <Link href={`/retailers/${retailer._id}`} className="font-semibold text-[#7A1F2B] hover:underline">{retailer.name}</Link> },
    { key: "email", header: "Email", render: (retailer) => retailer.email },
    { key: "phone", header: "Phone", render: (retailer) => retailer.phone || "—" },
    { key: "discount", header: "Discount", render: (retailer) => `${retailer.discountPercent}%` },
    { key: "status", header: "Status", render: (retailer) => <Badge tone={retailer.status === "active" ? "active" : "inactive"}>{retailer.status}</Badge> },
  ];

  const toggle = async () => {
    setBusy(true);
    setNotice(null);
    try {
      const saved = await wholesalerApi.updateStatus(id, item.status === "active" ? "inactive" : "active");
      setItem(saved);
      setConfirm(false);
      setNotice(`Wholesaler is now ${saved.status}.`);
    } catch (requestError) {
      setNotice(getApiErrorMessage(requestError, "Unable to update status."));
      setConfirm(false);
    } finally {
      setBusy(false);
    }
  };

  const retailerTotal = item.retailerCount ?? retailers.length;

  return <div className="mx-auto max-w-[1400px]">
    <PageHeader title={item.name} description="Wholesaler account details and owned Retailers." actions={<><Button variant="secondary" onClick={() => setEditing((value) => !value)}>{editing ? "Cancel Edit" : "Edit Wholesaler"}</Button><Button variant={item.status === "active" ? "danger" : "primary"} onClick={() => setConfirm(true)}>{item.status === "active" ? "Deactivate" : "Activate"}</Button></>} />
    {notice ? <div role="status" className="mb-5 rounded-md border border-neutral-200 bg-white p-3 text-sm">{notice}</div> : null}
    {editing ? <section className="mb-6 rounded-lg border bg-white p-5 sm:p-6"><h2 className="mb-5 font-semibold">Edit supported account fields</h2><WholesalerForm initial={item} onSaved={(saved) => { setItem(saved); setEditing(false); setNotice("Wholesaler details updated."); }} /></section> : null}

    <section className="rounded-lg border bg-white">
      <div className="flex justify-between border-b p-5"><h2 className="font-semibold">Account Information</h2><Badge tone={item.status === "active" ? "active" : "inactive"}>{item.status}</Badge></div>
      <dl className="grid gap-5 p-5 sm:grid-cols-2 lg:grid-cols-4"><Info label="Email" value={item.email} /><Info label="Phone" value={item.phone || "—"} /><Info label="Account Discount" value={`${item.discountPercent}%`} /><Info label="Retailers" value={String(retailerTotal)} /><Info label="Created" value={formatDateTime(item.createdAt)} /><Info label="Updated" value={formatDateTime(item.updatedAt)} /><Info label="Last Login" value={formatDateTime(item.lastLoginAt)} /></dl>
    </section>

    <section className="mt-6 overflow-hidden rounded-lg border bg-white">
      <div className="flex justify-between border-b p-5"><div><h2 className="font-semibold">Owned Retailers</h2><p className="mt-1 text-xs text-neutral-500">Showing the newest {retailers.length} of {retailerTotal}. This is a read-only Admin preview.</p></div><Link href={`/retailers?wholesalerId=${id}`} className="text-sm font-semibold text-[#7A1F2B]">View all</Link></div>
      {retailers.length ? <Table columns={columns} rows={retailers} rowKey={(retailer) => retailer._id} /> : <EmptyState title="No Retailers" description="This Wholesaler has not created any Retailers." />}
    </section>

    <ConfirmDialog isOpen={confirm} title={`${item.status === "active" ? "Deactivate" : "Activate"} Wholesaler?`} description={item.status === "active" ? "The account will no longer be able to sign in. Pending Retailer orders may block this action." : "The account will regain access."} confirmLabel={item.status === "active" ? "Deactivate" : "Activate"} tone={item.status === "active" ? "danger" : "primary"} isConfirming={busy} onClose={() => setConfirm(false)} onConfirm={() => void toggle()} />
  </div>;
}

function Info({ label, value }: { label: string; value: string }) {
  return <div><dt className="text-xs uppercase tracking-wide text-neutral-500">{label}</dt><dd className="mt-1 break-words text-sm font-medium">{value}</dd></div>;
}
