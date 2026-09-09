"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pagination } from "@/components/ui/Pagination";
import { Select } from "@/components/ui/Select";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/StateDisplay";
import { Table, type TableColumn } from "@/components/ui/Table";
import { categoryApi } from "@/features/categories/category.api";
import type { Category } from "@/features/categories/category.types";
import { inventoryApi } from "@/features/inventory/inventory.api";
import type { InventoryListItem, InventoryStockStatus } from "@/features/inventory/inventory.types";
import { productApi } from "@/features/products/product.api";
import type { Product } from "@/features/products/product.types";
import { getApiErrorMessage } from "@/lib/api";
import { collectAllPages } from "@/lib/pagination";
import { formatDateTime } from "@/lib/utils";
import type { Pagination as PaginationData } from "@/types/api";

const PAGE_SIZE = 20;
const emptyPagination: PaginationData = { page: 1, limit: PAGE_SIZE, total: 0, totalPages: 0 };
const actionLinkClass = "inline-flex h-9 items-center rounded-md px-2.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 hover:text-black focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7A1F2B]/30";

export default function InventoryPage() {
  const searchParams = useSearchParams();
  const [records, setRecords] = useState<InventoryListItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState(emptyPagination);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sku, setSku] = useState("");
  const [debouncedSku, setDebouncedSku] = useState("");
  const [product, setProduct] = useState("");
  const [category, setCategory] = useState("");
  const [stockStatus, setStockStatus] = useState<InventoryStockStatus | "">(() => {
    const requested = searchParams.get("stockStatus");
    return requested === "in_stock" || requested === "out_of_stock" ? requested : "";
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [optionsWarning, setOptionsWarning] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setDebouncedSku(sku.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [search, sku]);

  useEffect(() => {
    let active = true;
    void Promise.allSettled([
      collectAllPages({ fetchPage: (page, limit) => categoryApi.list({ page, limit }), getItems: (data) => data.categories }),
      collectAllPages({ fetchPage: (page, limit) => productApi.list({ page, limit }), getItems: (data) => data.products }),
    ]).then(([categoryResult, productResult]) => {
      if (!active) return;
      const failures: string[] = [];
      if (categoryResult.status === "fulfilled") setCategories(categoryResult.value);
      else failures.push("category");
      if (productResult.status === "fulfilled") setProducts(productResult.value);
      else failures.push("product");
      setOptionsWarning(failures.length ? `Some ${failures.join(" and ")} filter options could not be loaded.` : null);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadInventory() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await inventoryApi.list({
          page,
          limit: PAGE_SIZE,
          search: debouncedSearch || undefined,
          sku: debouncedSku || undefined,
          product: product || undefined,
          category: category || undefined,
          stockStatus,
        });
        if (!active) return;
        setRecords(data.inventory);
        setPagination(data.pagination);
      } catch (requestError) {
        if (active) setError(getApiErrorMessage(requestError, "Unable to load inventory."));
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void loadInventory();
    return () => { active = false; };
  }, [category, debouncedSearch, debouncedSku, page, product, reloadKey, stockStatus]);

  const refreshInventory = () => setReloadKey((key) => key + 1);

  const categoryNames = useMemo(() => new Map(categories.map((item) => [item._id, item.name])), [categories]);

  const columns: Array<TableColumn<InventoryListItem>> = [
    { key: "sku", header: "SKU", className: "min-w-56", render: (item) => <code className="text-xs font-semibold text-neutral-950">{item.sku}</code> },
    { key: "product", header: "Product", className: "min-w-44", render: (item) => <div><p className="font-medium text-neutral-950">{item.productName}</p><p className="mt-0.5 text-xs text-neutral-500">{item.productCode || "No product code"}</p></div> },
    { key: "colour", header: "Colour", render: (item) => typeof item.colour === "string" ? item.colour : item.colour?.name || "—" },
    { key: "sizeSet", header: "Size Set", render: (item) => typeof item.sizeSet === "string" ? item.sizeSet : item.sizeSet.label },
    { key: "category", header: "Category", render: (item) => <span title={categoryNames.has(item.categoryId) ? undefined : `Category ID: ${item.categoryId}`}>{categoryNames.get(item.categoryId) || "Unavailable"}</span> },
    { key: "sets", header: "Sets in Stock", className: "text-right", render: (item) => <span className="font-semibold text-neutral-950">{item.availableQuantity}</span> },
    { key: "shelves", header: "Shelf Summary", className: "min-w-48", render: (item) => item.shelves.length ? item.shelves.map((entry) => `${entry.shelf}: ${entry.quantity}`).join(" · ") : "No shelf stock" },
    { key: "status", header: "Stock Status", render: (item) => <Badge tone={item.status === "in_stock" ? "active" : "inactive"}>{item.status === "in_stock" ? "In Stock" : "Out of Stock"}</Badge> },
    { key: "updated", header: "Updated", className: "min-w-40", render: (item) => formatDateTime(item.updatedAt) },
    { key: "actions", header: <span className="sr-only">Actions</span>, className: "min-w-40 text-right", render: (item) => (
      <div className="flex justify-end gap-1">
        <Link href={`/inventory/${item.variantId}`} className={actionLinkClass}>View</Link>
      </div>
    ) },
  ];

  const hasFilters = Boolean(search || sku || product || category || stockStatus);

  return (
    <div className="mx-auto w-full max-w-[1600px]">
      <PageHeader
        title="Inventory"
        description="Review SKU stock and import validated XLSX adjustment batches."
        actions={
          <>
            <Link href="/inventory/import" className="inline-flex h-10 items-center rounded-md border border-[#7A1F2B] bg-[#7A1F2B] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#641924]">Stock Upload (XLSX)</Link>
          </>
        }
      />

      <section className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
        <div className="grid gap-3 border-b border-neutral-200 p-4 md:grid-cols-2 xl:grid-cols-[minmax(220px,1fr)_210px_220px_220px_180px]">
          <Input aria-label="Search inventory" placeholder="Search SKU, product, color, or size set" value={search} onChange={(event) => setSearch(event.target.value)} maxLength={150} />
          <Input aria-label="Filter by exact SKU" placeholder="Exact SKU" value={sku} onChange={(event) => setSku(event.target.value)} maxLength={255} />
          <Select aria-label="Filter by product" value={product} onChange={(event) => { setPage(1); setProduct(event.target.value); }}>
            <option value="">All products</option>
            {products.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}
          </Select>
          <Select aria-label="Filter by category" value={category} onChange={(event) => { setPage(1); setCategory(event.target.value); }}>
            <option value="">All categories</option>
            {categories.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}
          </Select>
          <Select aria-label="Filter by stock status" value={stockStatus} onChange={(event) => { setPage(1); setStockStatus(event.target.value as InventoryStockStatus | ""); }}>
            <option value="">All stock statuses</option>
            <option value="in_stock">In Stock</option>
            <option value="out_of_stock">Out of Stock</option>
          </Select>
        </div>

        {optionsWarning ? <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-900" role="status">{optionsWarning}</div> : null}
        {isLoading ? <LoadingState label="Loading inventory" /> : error ? <ErrorState message={error} onRetry={refreshInventory} /> : records.length === 0 ? (
          <EmptyState
            title="No inventory records found"
            description={hasFilters ? "Try changing the current inventory filters." : "Inventory records appear automatically when product variants are created."}
            action={hasFilters ? <Button variant="secondary" size="sm" onClick={() => { setPage(1); setSearch(""); setSku(""); setProduct(""); setCategory(""); setStockStatus(""); }}>Clear Filters</Button> : undefined}
          />
        ) : (
          <>
            <Table columns={columns} rows={records} rowKey={(item) => item.variantId} />
            <Pagination page={pagination.page} totalPages={pagination.totalPages} total={pagination.total} pageSize={pagination.limit} onPageChange={setPage} />
          </>
        )}
      </section>

    </div>
  );
}
