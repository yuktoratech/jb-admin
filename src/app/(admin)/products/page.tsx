"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Input } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pagination } from "@/components/ui/Pagination";
import { Select } from "@/components/ui/Select";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/StateDisplay";
import { Table, type TableColumn } from "@/components/ui/Table";
import { categoryApi } from "@/features/categories/category.api";
import type { Category } from "@/features/categories/category.types";
import { productApi } from "@/features/products/product.api";
import type { CatalogStatus, Product } from "@/features/products/product.types";
import { getApiErrorMessage } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import type { Pagination as PaginationData } from "@/types/api";

const PAGE_SIZE = 20;
const emptyPagination: PaginationData = { page: 1, limit: PAGE_SIZE, total: 0, totalPages: 0 };
const actionLinkClass = "inline-flex h-9 items-center rounded-md px-2.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 hover:text-black focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7A1F2B]/30";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [pagination, setPagination] = useState(emptyPagination);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState<CatalogStatus | "">("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [deactivatingProduct, setDeactivatingProduct] = useState<Product | null>(null);
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    categoryApi.list({ page: 1, limit: 100 })
      .then((data) => setCategories(data.categories))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    let active = true;

    async function loadProducts() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await productApi.list({ page, limit: PAGE_SIZE, search: debouncedSearch || undefined, category: category || undefined, status });
        if (!active) return;
        setProducts(data.products);
        setPagination(data.pagination);
      } catch (requestError) {
        if (active) setError(getApiErrorMessage(requestError, "Unable to load products."));
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void loadProducts();
    return () => { active = false; };
  }, [category, debouncedSearch, page, reloadKey, status]);

  const refreshProducts = () => setReloadKey((key) => key + 1);

  const deactivateProduct = async () => {
    if (!deactivatingProduct) return;
    setIsDeactivating(true);
    setActionError(null);
    try {
      await productApi.deactivate(deactivatingProduct._id);
      setDeactivatingProduct(null);
      refreshProducts();
    } catch (requestError) {
      setActionError(getApiErrorMessage(requestError, "Unable to deactivate the product."));
      setDeactivatingProduct(null);
    } finally {
      setIsDeactivating(false);
    }
  };

  const activateProduct = async (product: Product) => {
    setActionError(null);
    try {
      await productApi.update(product._id, { status: "active" });
      refreshProducts();
    } catch (requestError) {
      setActionError(getApiErrorMessage(requestError, "Unable to activate the product."));
    }
  };

  const columns: Array<TableColumn<Product>> = [
    { key: "productName", header: "Product Name", className: "min-w-44", render: (product) => <div><p className="font-semibold text-neutral-950">{product.productName}</p><p className="mt-0.5 text-xs text-neutral-500">{product.productCode || "No product code"}</p></div> },
    { key: "title", header: "Title", className: "min-w-52", render: (product) => <span className="line-clamp-2">{product.title}</span> },
    { key: "category", header: "Category", render: (product) => product.category?.name || "—" },
    { key: "mrp", header: "MRP", render: (product) => <span className="whitespace-nowrap font-medium text-neutral-900">{formatCurrency(product.mrp)}</span> },
    { key: "variants", header: "SKUs", render: (product) => <Link href={`/products/${product._id}`} className="text-xs font-semibold text-[#7A1F2B] hover:underline" title="SKU count is not included by the product list API">View SKUs</Link> },
    { key: "status", header: "Status", render: (product) => <Badge tone={product.status === "active" ? "active" : "inactive"}>{product.status}</Badge> },
    { key: "actions", header: <span className="sr-only">Actions</span>, className: "min-w-60 text-right", render: (product) => (
      <div className="flex justify-end gap-1">
        <Link href={`/products/${product._id}`} className={actionLinkClass}>View</Link>
        <Link href={`/products/${product._id}/edit`} className={actionLinkClass}>Edit</Link>
        {product.status === "active" ? <Button variant="ghost" size="sm" className="text-[#7A1F2B]" onClick={() => setDeactivatingProduct(product)}>Deactivate</Button> : <Button variant="ghost" size="sm" onClick={() => void activateProduct(product)}>Activate</Button>}
      </div>
    ) },
  ];

  return (
    <div className="mx-auto w-full max-w-[1500px]">
      <PageHeader
        title="Products"
        description="Manage product information and open each product to work with its variants and SKUs."
        actions={<Link href="/products/new" className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#7A1F2B] bg-[#7A1F2B] px-4 text-sm font-semibold text-white hover:bg-[#641924]">+ Add Product</Link>}
      />

      <section className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
        <div className="grid gap-3 border-b border-neutral-200 p-4 md:grid-cols-[minmax(240px,1fr)_220px_180px]">
          <Input aria-label="Search products" placeholder="Search name, code, or title" value={search} onChange={(event) => setSearch(event.target.value)} />
          <Select aria-label="Filter by category" value={category} onChange={(event) => { setPage(1); setCategory(event.target.value); }}>
            <option value="">All categories</option>{categories.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}
          </Select>
          <Select aria-label="Filter by status" value={status} onChange={(event) => { setPage(1); setStatus(event.target.value as CatalogStatus | ""); }}>
            <option value="">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option>
          </Select>
        </div>
        {actionError ? <div className="border-b border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">{actionError}</div> : null}
        {isLoading ? <LoadingState label="Loading products" /> : error ? <ErrorState message={error} onRetry={refreshProducts} /> : products.length === 0 ? (
          <EmptyState title="No products found" description={search || category || status ? "Try changing the current filters." : "Create the first product and its color/size-set variants."} action={!search && !category && !status ? <Link href="/products/new" className="inline-flex h-9 items-center rounded-md bg-[#7A1F2B] px-3 text-xs font-semibold text-white">Add Product</Link> : undefined} />
        ) : <><Table columns={columns} rows={products} rowKey={(product) => product._id} /><Pagination page={pagination.page} totalPages={pagination.totalPages} total={pagination.total} pageSize={pagination.limit} onPageChange={setPage} /></>}
      </section>

      <ConfirmDialog
        isOpen={Boolean(deactivatingProduct)}
        title="Deactivate product"
        description={`Deactivate ${deactivatingProduct?.productName ?? "this product"}? The backend will also deactivate all of its variants.`}
        confirmLabel="Deactivate"
        tone="danger"
        isConfirming={isDeactivating}
        onClose={() => setDeactivatingProduct(null)}
        onConfirm={() => void deactivateProduct()}
      />
    </div>
  );
}
