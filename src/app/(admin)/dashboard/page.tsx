"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ErrorState, LoadingState } from "@/components/ui/StateDisplay";
import { useAuth } from "@/features/auth/AuthProvider";
import { dashboardApi } from "@/features/dashboard/dashboard.api";
import type { DashboardOverview, DashboardTotals } from "@/features/dashboard/dashboard.types";
import type { Order } from "@/features/orders/order.types";
import { ApiError, getApiErrorMessage } from "@/lib/api";
import { formatDateTime, formatMinorCurrency } from "@/lib/utils";

const metricLabels: Array<{ key: keyof DashboardTotals; label: string; note: string }> = [
  { key: "wholesalers", label: "Wholesalers", note: "All accounts" },
  { key: "retailers", label: "Retailers", note: "All linked accounts" },
  { key: "products", label: "Products", note: "All catalogue records" },
  { key: "skus", label: "SKUs", note: "All product variants" },
  { key: "inStockSkus", label: "In Stock", note: "Available SKUs" },
  { key: "outOfStockSkus", label: "Out of Stock", note: "SKUs needing attention" },
  { key: "orders", label: "Orders", note: "All order records" },
  { key: "pendingAdminOrders", label: "Pending Admin", note: "Awaiting final review" },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const firstName = user?.name?.trim().split(/\s+/)[0] || "Administrator";

  useEffect(() => {
    const controller = new AbortController();
    async function loadOverview() {
      setIsLoading(true);
      setError(null);
      try {
        setOverview(await dashboardApi.getOverview(controller.signal));
      } catch (requestError) {
        if (requestError instanceof ApiError && requestError.code === "REQUEST_ABORTED") return;
        setError(getApiErrorMessage(requestError, "Unable to load the dashboard."));
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }
    void loadOverview();
    return () => controller.abort();
  }, [reloadKey]);

  return (
    <div className="mx-auto w-full max-w-[1600px]">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7A1F2B]">Operations overview</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-neutral-950">Welcome back, {firstName}</h1>
          <p className="mt-1.5 text-sm text-neutral-500">Live account, catalogue, stock, and order queues from the backend.</p>
        </div>
        <Button variant="secondary" onClick={() => setReloadKey((key) => key + 1)} disabled={isLoading}>Refresh</Button>
      </div>

      {isLoading && !overview ? <LoadingState label="Loading dashboard" /> : null}
      {error && !overview ? <div className="border border-neutral-200 bg-white"><ErrorState message={error} onRetry={() => setReloadKey((key) => key + 1)} /></div> : null}

      {overview ? (
        <>
          {error ? <div className="mb-5 flex items-center justify-between gap-4 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"><span>{error}</span><button type="button" className="font-semibold underline" onClick={() => setReloadKey((key) => key + 1)}>Retry</button></div> : null}
          <section aria-label="Operational totals" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {metricLabels.map((metric) => (
              <article key={metric.key} className="rounded-lg border border-neutral-200 bg-white p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{metric.label}</p>
                <p className={`mt-3 text-3xl font-semibold tabular-nums tracking-tight ${metric.key === "pendingAdminOrders" || metric.key === "outOfStockSkus" ? "text-[#7A1F2B]" : "text-neutral-950"}`}>{overview.totals[metric.key].toLocaleString("en-IN")}</p>
                <p className="mt-2 text-xs text-neutral-400">{metric.note}</p>
              </article>
            ))}
          </section>

          <section className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_0.85fr]">
            <OrderQueue title="Pending Admin Orders" description="Newest orders awaiting final Admin review" orders={overview.pendingOrders} empty="No orders are awaiting Admin review." />
            <article className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
              <QueueHeader title="Out-of-stock Queue" description="Most recently updated unavailable SKUs" href="/inventory?stockStatus=out_of_stock" />
              {overview.inventoryAttention.length ? (
                <ul className="divide-y divide-neutral-100">
                  {overview.inventoryAttention.map((item) => (
                    <li key={item.variantId} className="flex items-center justify-between gap-4 px-5 py-4">
                      <div className="min-w-0">
                        <Link href={`/inventory/${item.variantId}`} className="block truncate text-sm font-semibold text-neutral-950 hover:text-[#7A1F2B]">{item.sku}</Link>
                        <p className="mt-1 truncate text-xs text-neutral-500">{item.productName} · {typeof item.colour === "string" ? item.colour : item.colour?.name || "—"} · {typeof item.sizeSet === "string" ? item.sizeSet : item.sizeSet.label}</p>
                      </div>
                      <Badge tone="inactive">Out of stock</Badge>
                    </li>
                  ))}
                </ul>
              ) : <EmptyQueue message="No SKUs are currently out of stock." />}
            </article>
          </section>

          <section className="mt-6">
            <OrderQueue title="Recent Orders" description="Newest orders across every workflow status" orders={overview.recentOrders} empty="No orders have been submitted yet." />
          </section>
          <p className="mt-4 text-xs text-neutral-400">Totals come from API pagination metadata; queue requests fetch only their five newest records.</p>
        </>
      ) : null}
    </div>
  );
}

function QueueHeader({ title, description, href }: { title: string; description: string; href: string }) {
  return <div className="flex items-center justify-between gap-4 border-b border-neutral-200 px-5 py-4"><div><h2 className="text-sm font-semibold text-neutral-950">{title}</h2><p className="mt-0.5 text-xs text-neutral-500">{description}</p></div><Link href={href} className="shrink-0 text-xs font-semibold text-[#7A1F2B] hover:underline">View all</Link></div>;
}

function OrderQueue({ title, description, orders, empty }: { title: string; description: string; orders: Order[]; empty: string }) {
  return (
    <article className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
      <QueueHeader title={title} description={description} href="/orders" />
      {orders.length ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left">
            <thead className="bg-neutral-50 text-[11px] font-semibold uppercase tracking-wide text-neutral-500"><tr><th className="px-5 py-3">Order</th><th className="px-4 py-3">Account</th><th className="px-4 py-3">Amount</th><th className="px-4 py-3">Status</th><th className="px-5 py-3 text-right">Placed</th></tr></thead>
            <tbody className="divide-y divide-neutral-100">
              {orders.map((order) => (
                <tr key={order._id} className="text-sm text-neutral-700">
                  <td className="px-5 py-3.5"><Link href={`/orders/${order._id}`} className="font-semibold text-[#7A1F2B] hover:underline">{order.orderNumber}</Link></td>
                  <td className="px-4 py-3.5">{partyName(order.sourceRole === "retailer" ? order.retailer : order.wholesaler)}</td>
                  <td className="whitespace-nowrap px-4 py-3.5 font-medium text-neutral-950">{formatMinorCurrency(order.finalAmountMinor)}</td>
                  <td className="px-4 py-3.5"><OrderStatusBadge status={order.status} /></td>
                  <td className="whitespace-nowrap px-5 py-3.5 text-right text-xs text-neutral-500">{formatDateTime(order.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <EmptyQueue message={empty} />}
    </article>
  );
}

function EmptyQueue({ message }: { message: string }) { return <div className="px-5 py-10 text-center text-sm text-neutral-500">{message}</div>; }
function partyName(party: Order["wholesaler"] | Order["retailer"]): string { if (!party) return "—"; return typeof party === "string" ? party : party.name; }
function OrderStatusBadge({ status }: { status: Order["status"] }) { const tone = status === "CONFIRMED" ? "active" : status === "CANCELLED" ? "inactive" : status === "PENDING_ADMIN" ? "maroon" : "warning"; return <Badge tone={tone}>{status.replaceAll("_", " ")}</Badge>; }
