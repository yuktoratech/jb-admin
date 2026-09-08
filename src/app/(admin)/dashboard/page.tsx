"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ErrorState, LoadingState } from "@/components/ui/StateDisplay";
import { useAuth } from "@/features/auth/AuthProvider";
import { dashboardApi } from "@/features/dashboard/dashboard.api";
import type { DashboardOverview, DashboardTotals } from "@/features/dashboard/dashboard.types";
import { ApiError, getApiErrorMessage } from "@/lib/api";
import { formatMinorCurrency, formatDate } from "@/lib/utils";

const metricLabels: Array<{ key: keyof DashboardTotals; label: string; note: string }> = [
  { key: "categories", label: "Total Categories", note: "All category records" },
  { key: "products", label: "Total Products", note: "All product records" },
  { key: "skus", label: "Total SKUs", note: "Product variants" },
  { key: "inStockSkus", label: "In Stock SKUs", note: "Available inventory" },
  { key: "outOfStockSkus", label: "Out of Stock SKUs", note: "Needs attention" },
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
        const data = await dashboardApi.getOverview(controller.signal);
        setOverview(data);
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
    <div className="mx-auto w-full max-w-7xl">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7A1F2B]">
            Business overview
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-neutral-950">
            Welcome back, {firstName}
          </h1>
          <p className="mt-1.5 text-sm text-neutral-500">
            Live catalogue and inventory information from the Just Black backend.
          </p>
        </div>
        <Button variant="secondary" onClick={() => setReloadKey((key) => key + 1)} disabled={isLoading}>
          Refresh
        </Button>
      </div>

      {isLoading && !overview ? <LoadingState label="Loading dashboard" /> : null}

      {error && !overview ? (
        <div className="border border-neutral-200 bg-white">
          <ErrorState message={error} onRetry={() => setReloadKey((key) => key + 1)} />
        </div>
      ) : null}

      {overview ? (
        <>
          {error ? (
            <div className="mb-5 flex items-center justify-between gap-4 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              <span>{error}</span>
              <button type="button" className="font-semibold underline" onClick={() => setReloadKey((key) => key + 1)}>
                Retry
              </button>
            </div>
          ) : null}

          <section aria-label="Catalogue and inventory totals" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {metricLabels.map((metric) => (
              <article key={metric.key} className="border border-neutral-200 bg-white p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{metric.label}</p>
                <p className="mt-3 text-3xl font-semibold tabular-nums tracking-tight text-neutral-950">
                  {overview.totals[metric.key].toLocaleString("en-IN")}
                </p>
                <p className="mt-2 text-xs text-neutral-400">{metric.note}</p>
              </article>
            ))}
          </section>

          <section className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_0.85fr]">
            <article className="overflow-hidden border border-neutral-200 bg-white">
              <div className="flex items-center justify-between gap-4 border-b border-neutral-200 px-5 py-4">
                <div>
                  <h2 className="text-sm font-semibold text-neutral-950">Recent Products</h2>
                  <p className="mt-0.5 text-xs text-neutral-500">Latest products returned by the catalogue API</p>
                </div>
                <Link href="/products" className="text-xs font-semibold text-[#7A1F2B] hover:underline">
                  View all
                </Link>
              </div>

              {overview.recentProducts.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[620px] text-left">
                    <thead className="bg-neutral-50 text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
                      <tr>
                        <th className="px-5 py-3">Product</th>
                        <th className="px-4 py-3">Category</th>
                        <th className="px-4 py-3">MRP</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-5 py-3 text-right">Created</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {overview.recentProducts.map((product) => (
                        <tr key={product._id} className="text-sm text-neutral-700">
                          <td className="px-5 py-3.5">
                            <Link href={`/products/${product._id}`} className="font-semibold text-neutral-950 hover:text-[#7A1F2B]">
                              {product.name}
                            </Link>
                            <p className="mt-0.5 max-w-[260px] truncate text-xs text-neutral-500">
                              {product.description || "No description"}
                            </p>
                          </td>
                          <td className="px-4 py-3.5">{product.category?.name || "—"}</td>
                          <td className="whitespace-nowrap px-4 py-3.5 font-medium text-neutral-950">{formatMinorCurrency(product.mrpPerPieceMinor)}</td>
                          <td className="px-4 py-3.5">
                            <Badge tone={product.status === "active" ? "active" : "inactive"}>{product.status}</Badge>
                          </td>
                          <td className="whitespace-nowrap px-5 py-3.5 text-right text-xs text-neutral-500">{formatDate(product.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="px-5 py-12 text-center">
                  <p className="text-sm font-semibold text-neutral-900">No products found</p>
                  <p className="mt-1 text-sm text-neutral-500">Create a product to start building the catalogue.</p>
                  <Link href="/products/new" className="mt-4 inline-block text-sm font-semibold text-[#7A1F2B] hover:underline">
                    Add product
                  </Link>
                </div>
              )}
            </article>

            <article className="overflow-hidden border border-neutral-200 bg-white">
              <div className="flex items-center justify-between gap-4 border-b border-neutral-200 px-5 py-4">
                <div>
                  <h2 className="text-sm font-semibold text-neutral-950">Inventory Attention</h2>
                  <p className="mt-0.5 text-xs text-neutral-500">Most recently updated out-of-stock SKUs</p>
                </div>
                <Link href="/inventory" className="text-xs font-semibold text-[#7A1F2B] hover:underline">
                  View all
                </Link>
              </div>

              {overview.inventoryAttention.length ? (
                <ul className="divide-y divide-neutral-100">
                  {overview.inventoryAttention.map((item) => (
                    <li key={item.variantId} className="flex items-center justify-between gap-4 px-5 py-4">
                      <div className="min-w-0">
                        <Link href={`/inventory/${item.variantId}`} className="block truncate text-sm font-semibold text-neutral-950 hover:text-[#7A1F2B]">
                          {item.sku}
                        </Link>
                        <p className="mt-1 truncate text-xs text-neutral-500">
                          {item.productName} · {typeof item.colour === "string" ? item.colour : item.colour?.name || "—"} · {typeof item.sizeSet === "string" ? item.sizeSet : item.sizeSet.label}
                        </p>
                      </div>
                      <Badge tone="inactive">Out of stock</Badge>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="px-5 py-12 text-center">
                  <p className="text-sm font-semibold text-neutral-900">No inventory needs attention</p>
                  <p className="mt-1 text-sm text-neutral-500">There are no out-of-stock SKUs in the current inventory.</p>
                </div>
              )}
            </article>
          </section>

          <p className="mt-4 text-xs text-neutral-400">
            Counts come from API pagination metadata; the dashboard does not download entire datasets.
          </p>
        </>
      ) : null}
    </div>
  );
}
