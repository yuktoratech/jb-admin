"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pagination } from "@/components/ui/Pagination";
import { Select } from "@/components/ui/Select";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/StateDisplay";
import { Table, type TableColumn } from "@/components/ui/Table";
import { orderApi } from "@/features/orders/order.api";
import type { Order, OrderSourceRole, OrderStatus } from "@/features/orders/order.types";
import { getApiErrorMessage } from "@/lib/api";
import { formatDateTime, formatMinorCurrency } from "@/lib/utils";
import type { Pagination as PaginationData } from "@/types/api";

const PAGE_SIZE = 20;
const emptyPagination: PaginationData = { page: 1, limit: PAGE_SIZE, total: 0, totalPages: 0 };

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [pagination, setPagination] = useState(emptyPagination);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState<OrderStatus | "">("");
  const [sourceRole, setSourceRole] = useState<OrderSourceRole | "">("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const timeout = window.setTimeout(() => { setDebouncedSearch(search.trim()); setPage(1); }, 300);
    return () => window.clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    let active = true;
    // The request transition intentionally starts when its query dependencies change.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true); setError(null);
    void orderApi.list({ page, limit: PAGE_SIZE, search: debouncedSearch || undefined, status, sourceRole })
      .then((data) => { if (active) { setOrders(data.orders); setPagination(data.pagination); } })
      .catch((requestError) => { if (active) setError(getApiErrorMessage(requestError, "Unable to load orders.")); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [debouncedSearch, page, reloadKey, sourceRole, status]);

  const metrics = useMemo(() => ({ pending: orders.filter((order) => order.status === "PENDING_ADMIN").length, confirmed: orders.filter((order) => order.status === "CONFIRMED").length, cancelled: orders.filter((order) => order.status === "CANCELLED").length }), [orders]);
  const columns: Array<TableColumn<Order>> = [
    { key: "number", header: "Order ID", className: "min-w-44", render: (order) => <Link className="font-semibold text-[#7A1F2B] hover:underline" href={`/orders/${order._id}`}>{order.orderNumber}</Link> },
    { key: "placedBy", header: "Placed By", render: (order) => partyName(order.placedBy) },
    { key: "account", header: "Account", className: "min-w-44", render: (order) => <div><p className="font-medium text-neutral-950">{order.sourceRole === "retailer" ? partyName(order.retailer) : partyName(order.wholesaler)}</p><p className="text-xs capitalize text-neutral-500">{order.sourceRole}</p></div> },
    { key: "items", header: "Items", className: "text-right", render: (order) => order.items.filter((item) => !item.isRemoved).length },
    { key: "sets", header: "Sets", className: "text-right", render: (order) => order.items.reduce((total, item) => total + item.currentSetQty, 0) },
    { key: "amount", header: "Final Amount", className: "text-right", render: (order) => <span className="font-semibold text-neutral-950">{formatMinorCurrency(order.finalAmountMinor)}</span> },
    { key: "status", header: "Status", render: (order) => <StatusBadge status={order.status} /> },
    { key: "date", header: "Placed On", className: "min-w-40", render: (order) => formatDateTime(order.createdAt) },
    { key: "action", header: <span className="sr-only">Action</span>, className: "text-right", render: (order) => <Link href={`/orders/${order._id}`} className="inline-flex h-9 items-center rounded-md px-3 text-xs font-semibold text-neutral-700 hover:bg-neutral-100">View</Link> },
  ];
  const hasFilters = Boolean(search || status || sourceRole);

  return <div className="mx-auto w-full max-w-[1600px]">
    <PageHeader title="Orders" description="Review Wholesaler and Retailer orders, preserved pricing snapshots, and final Admin actions." />
    <section className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Metric label="Orders on this page" value={orders.length} />
      <Metric label="Pending Admin" value={metrics.pending} accent />
      <Metric label="Confirmed" value={metrics.confirmed} />
      <Metric label="Cancelled" value={metrics.cancelled} />
    </section>
    <section className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
      <div className="grid gap-3 border-b border-neutral-200 p-4 md:grid-cols-[minmax(260px,1fr)_230px_220px_auto]">
        <Input aria-label="Search orders" placeholder="Search order ID, SKU, or product" value={search} onChange={(event) => setSearch(event.target.value)} maxLength={150} />
        <Select aria-label="Filter orders by status" value={status} onChange={(event) => { setPage(1); setStatus(event.target.value as OrderStatus | ""); }}><option value="">All statuses</option><option value="PENDING_WHOLESALER">Pending Wholesaler</option><option value="PENDING_ADMIN">Pending Admin</option><option value="CONFIRMED">Confirmed</option><option value="CANCELLED">Cancelled</option></Select>
        <Select aria-label="Filter orders by source" value={sourceRole} onChange={(event) => { setPage(1); setSourceRole(event.target.value as OrderSourceRole | ""); }}><option value="">All sources</option><option value="wholesaler">Wholesaler</option><option value="retailer">Retailer</option></Select>
        <Button variant="secondary" disabled={!hasFilters} onClick={() => { setPage(1); setSearch(""); setStatus(""); setSourceRole(""); }}>Reset</Button>
      </div>
      {loading ? <LoadingState label="Loading orders" /> : error ? <ErrorState message={error} onRetry={() => setReloadKey((key) => key + 1)} /> : !orders.length ? <EmptyState title="No orders found" description={hasFilters ? "Try changing the current order filters." : "Orders will appear here when submitted by Wholesalers or Retailers."} /> : <><Table columns={columns} rows={orders} rowKey={(order) => order._id} /><Pagination page={pagination.page} totalPages={pagination.totalPages} total={pagination.total} pageSize={pagination.limit} onPageChange={setPage} /></>}
    </section>
  </div>;
}

function Metric({ label, value, accent = false }: { label: string; value: number; accent?: boolean }) { return <div className="rounded-lg border border-neutral-200 bg-white p-5"><p className="text-xs font-medium uppercase tracking-wide text-neutral-500">{label}</p><p className={`mt-2 text-3xl font-semibold ${accent ? "text-[#7A1F2B]" : "text-neutral-950"}`}>{value}</p></div>; }
function partyName(party: Order["placedBy"] | Order["retailer"]): string { if (!party) return "—"; return typeof party === "string" ? party : party.name; }
export function StatusBadge({ status }: { status: OrderStatus }) { const tone = status === "CONFIRMED" ? "active" : status === "CANCELLED" ? "inactive" : status === "PENDING_ADMIN" ? "maroon" : "warning"; return <Badge tone={tone}>{status.replaceAll("_", " ")}</Badge>; }
