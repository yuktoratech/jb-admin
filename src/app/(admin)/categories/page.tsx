"use client";

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
import { CategoryFormModal } from "@/features/categories/CategoryFormModal";
import { categoryApi } from "@/features/categories/category.api";
import type { Category, CategoryStatus } from "@/features/categories/category.types";
import { getApiErrorMessage } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import type { Pagination as PaginationData } from "@/types/api";

const PAGE_SIZE = 20;
const emptyPagination: PaginationData = { page: 1, limit: PAGE_SIZE, total: 0, totalPages: 0 };

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [pagination, setPagination] = useState(emptyPagination);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState<CategoryStatus | "">("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deactivatingCategory, setDeactivatingCategory] = useState<Category | null>(null);
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    let active = true;

    async function loadCategories() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await categoryApi.list({ page, limit: PAGE_SIZE, search: debouncedSearch || undefined, status });
        if (!active) return;
        setCategories(data.categories);
        setPagination(data.pagination);
      } catch (requestError) {
        if (active) setError(getApiErrorMessage(requestError, "Unable to load categories."));
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void loadCategories();
    return () => { active = false; };
  }, [debouncedSearch, page, reloadKey, status]);

  const refreshCategories = () => setReloadKey((key) => key + 1);

  const handleDeactivate = async () => {
    if (!deactivatingCategory) return;
    setIsDeactivating(true);
    setActionError(null);
    try {
      await categoryApi.deactivate(deactivatingCategory._id);
      setActionSuccess("Category deactivated successfully.");
      setDeactivatingCategory(null);
      refreshCategories();
    } catch (requestError) {
      setActionError(getApiErrorMessage(requestError, "Unable to deactivate the category."));
      setDeactivatingCategory(null);
    } finally {
      setIsDeactivating(false);
    }
  };

  const handleActivate = async (category: Category) => {
    setActionError(null);
    try {
      await categoryApi.update(category._id, { status: "active" });
      setActionSuccess("Category activated successfully.");
      refreshCategories();
    } catch (requestError) {
      setActionError(getApiErrorMessage(requestError, "Unable to activate the category."));
    }
  };

  const columns: Array<TableColumn<Category>> = [
    { key: "name", header: "Name", render: (category) => <span className="font-semibold text-neutral-950">{category.name}</span> },
    { key: "slug", header: "Slug", render: (category) => <span className="font-mono text-xs text-neutral-600">{category.slug}</span> },
    { key: "description", header: "Description", className: "min-w-64 max-w-md", render: (category) => <span className="line-clamp-2 text-neutral-600">{category.description || "—"}</span> },
    { key: "status", header: "Status", render: (category) => <Badge tone={category.status === "active" ? "active" : "inactive"}>{category.status}</Badge> },
    { key: "createdAt", header: "Created", render: (category) => <span className="whitespace-nowrap">{formatDate(category.createdAt)}</span> },
    { key: "actions", header: <span className="sr-only">Actions</span>, className: "text-right", render: (category) => (
      <div className="flex justify-end gap-1">
        <Button variant="ghost" size="sm" onClick={() => { setEditingCategory(category); setIsFormOpen(true); }}>Edit</Button>
        {category.status === "active" ? (
          <Button variant="ghost" size="sm" className="text-[#7A1F2B]" onClick={() => setDeactivatingCategory(category)}>Deactivate</Button>
        ) : (
          <Button variant="ghost" size="sm" onClick={() => void handleActivate(category)}>Activate</Button>
        )}
      </div>
    ) },
  ];

  return (
    <div className="mx-auto w-full max-w-[1500px]">
      <PageHeader
        title="Categories"
        description="Organize products into the catalog categories used by the backend."
        actions={<Button onClick={() => { setEditingCategory(null); setIsFormOpen(true); }} leftIcon={<span aria-hidden="true">+</span>}>Add Category</Button>}
      />

      <section className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
        <div className="grid gap-3 border-b border-neutral-200 p-4 sm:grid-cols-[minmax(240px,1fr)_200px]">
          <Input aria-label="Search categories" placeholder="Search categories" value={search} onChange={(event) => setSearch(event.target.value)} />
          <Select aria-label="Filter by status" value={status} onChange={(event) => { setPage(1); setStatus(event.target.value as CategoryStatus | ""); }}>
            <option value="">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option>
          </Select>
        </div>

        {actionSuccess ? <div className="border-b border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800" role="status">{actionSuccess}</div> : null}
        {actionError ? <div className="border-b border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">{actionError}</div> : null}
        {isLoading ? <LoadingState label="Loading categories" /> : error ? <ErrorState message={error} onRetry={refreshCategories} /> : categories.length === 0 ? (
          <EmptyState title="No categories found" description={search || status ? "Try changing the search or status filter." : "Add the first category to begin building the product catalog."} action={!search && !status ? <Button size="sm" onClick={() => setIsFormOpen(true)}>Add Category</Button> : undefined} />
        ) : (
          <><Table columns={columns} rows={categories} rowKey={(category) => category._id} /><Pagination page={pagination.page} totalPages={pagination.totalPages} total={pagination.total} pageSize={pagination.limit} onPageChange={setPage} /></>
        )}
      </section>

      {isFormOpen ? (
        <CategoryFormModal
          key={editingCategory?._id ?? "new-category"}
          isOpen
          category={editingCategory}
          onClose={() => { setIsFormOpen(false); setEditingCategory(null); }}
          onSaved={() => { setActionSuccess(`Category ${editingCategory ? "updated" : "created"} successfully.`); setPage(1); refreshCategories(); }}
        />
      ) : null}
      <ConfirmDialog
        isOpen={Boolean(deactivatingCategory)}
        title="Deactivate category"
        description={`Deactivate ${deactivatingCategory?.name ?? "this category"}? Existing products are not deleted, and the category can be reactivated later.`}
        confirmLabel="Deactivate"
        tone="danger"
        isConfirming={isDeactivating}
        onClose={() => setDeactivatingCategory(null)}
        onConfirm={() => void handleDeactivate()}
      />
    </div>
  );
}
