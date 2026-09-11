"use client";
/* eslint-disable react-hooks/set-state-in-effect */
import Link from "next/link";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Input } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pagination } from "@/components/ui/Pagination";
import { Select } from "@/components/ui/Select";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/components/ui/StateDisplay";
import { Table, type TableColumn } from "@/components/ui/Table";
import { categoryApi } from "@/features/categories/category.api";
import { subCategoryApi } from "@/features/catalog/catalog.api";
import type { Category, SubCategory } from "@/features/catalog/catalog.types";
import { productApi } from "@/features/products/product.api";
import type { CatalogStatus, Product } from "@/features/products/product.types";
import { getApiErrorMessage } from "@/lib/api";
import { collectAllPages } from "@/lib/pagination";
import { formatDate, formatMinorCurrency } from "@/lib/utils";
import type { Pagination as PaginationData } from "@/types/api";

const empty: PaginationData = { page: 1, limit: 20, total: 0, totalPages: 0 };
export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState(empty);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [subCategoryId, setSubCategoryId] = useState("");
  const [status, setStatus] = useState<CatalogStatus | "">("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);
  const [target, setTarget] = useState<Product | null>(null);
  const [permanentTarget, setPermanentTarget] = useState<Product | null>(null);
  const [working, setWorking] = useState(false);
  useEffect(() => {
    collectAllPages({
      fetchPage: (page, limit) =>
        categoryApi.list({ page, limit, status: "active" }),
      getItems: (data) => data.categories,
    })
      .then(setCategories)
      .catch(() => undefined);
  }, []);
  useEffect(() => {
    setSubCategoryId("");
    if (!categoryId) return setSubCategories([]);
    collectAllPages({
      fetchPage: (page, limit) =>
        subCategoryApi.list({ page, limit, status: "active", categoryId }),
      getItems: (data) => data.subCategories,
    })
      .then(setSubCategories)
      .catch(() => setSubCategories([]));
  }, [categoryId]);
  useEffect(() => {
    let active = true;
    setLoading(true);
    productApi
      .list({
        page,
        limit: 20,
        search: search.trim() || undefined,
        categoryId: categoryId || undefined,
        subCategoryId: subCategoryId || undefined,
        status,
      })
      .then((data) => {
        if (active) {
          setProducts(data.products);
          setPagination(data.pagination);
          setError(null);
        }
      })
      .catch((reason) => {
        if (active)
          setError(getApiErrorMessage(reason, "Unable to load Products."));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [page, search, categoryId, subCategoryId, status, reload]);
  const changeStatus = async () => {
    if (!target) return;
    setWorking(true);
    try {
      if (target.status === "active") await productApi.deactivate(target._id);
      else await productApi.update(target._id, { status: "active" });
      setTarget(null);
      setReload((value) => value + 1);
    } catch (reason) {
      setError(getApiErrorMessage(reason, "Unable to change Product status."));
      setTarget(null);
    } finally {
      setWorking(false);
    }
  };
  const permanentlyDelete = async () => {
    if (!permanentTarget) return;
    setWorking(true);
    try {
      await productApi.permanentlyDelete(permanentTarget._id);
      setPermanentTarget(null);
      setReload((value) => value + 1);
    } catch (reason) {
      setError(
        getApiErrorMessage(reason, "Unable to permanently delete Product."),
      );
      setPermanentTarget(null);
    } finally {
      setWorking(false);
    }
  };
  const columns: Array<TableColumn<Product>> = [
    {
      key: "name",
      header: "Product",
      render: (item) => (
        <Link
          className="font-semibold text-neutral-950 hover:text-[#7A1F2B]"
          href={`/products/${item._id}`}
        >
          {item.name}
        </Link>
      ),
    },
    {
      key: "category",
      header: "Category",
      render: (item) => item.category?.name ?? "—",
    },
    {
      key: "subcategory",
      header: "Sub-category",
      render: (item) => item.subCategory?.name ?? "—",
    },
    { key: "fit", header: "Fit", render: (item) => item.fitId?.name ?? "—" },
    {
      key: "fabric",
      header: "Fabric",
      render: (item) => item.fabricId?.name ?? "—",
    },
    {
      key: "mrp",
      header: "MRP / piece",
      render: (item) => formatMinorCurrency(item.mrpPerPieceMinor),
    },
    {
      key: "status",
      header: "Status",
      render: (item) => (
        <Badge tone={item.status === "active" ? "active" : "inactive"}>
          {item.status}
        </Badge>
      ),
    },
    {
      key: "created",
      header: "Created",
      render: (item) => formatDate(item.createdAt),
    },
    {
      key: "actions",
      header: "Actions",
      render: (item) => (
        <div className="flex gap-2">
          <Link href={`/products/${item._id}`}>
            <Button size="sm" variant="ghost">
              View
            </Button>
          </Link>
          <Link href={`/products/${item._id}/edit`}>
            <Button size="sm" variant="ghost">
              Edit
            </Button>
          </Link>
          <Button size="sm" variant="ghost" onClick={() => setTarget(item)}>
            {item.status === "active" ? "Deactivate" : "Activate"}
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => setPermanentTarget(item)}
          >
            Delete Permanently
          </Button>
        </div>
      ),
    },
  ];
  return (
    <div className="mx-auto w-full max-w-[1500px]">
      <PageHeader
        title="Products"
        description="Finalized Product catalogue using master relationships and immutable SKUs."
        actions={
          <>
            <Link href="/products/import">
              <Button variant="secondary">Import XLSX</Button>
            </Link>
            <Link href="/products/new">
              <Button>Add Product</Button>
            </Link>
          </>
        }
      />
      <section className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <div className="grid gap-3 border-b p-4 lg:grid-cols-[2fr_1fr_1fr_1fr]">
          <Input
            placeholder="Search Product name or description"
            value={search}
            onChange={(event) => {
              setPage(1);
              setSearch(event.target.value);
            }}
          />
          <Select
            aria-label="Category filter"
            value={categoryId}
            onChange={(event) => {
              setPage(1);
              setCategoryId(event.target.value);
            }}
          >
            <option value="">All Categories</option>
            {categories.map((entry) => (
              <option key={entry._id} value={entry._id}>
                {entry.name}
              </option>
            ))}
          </Select>
          <Select
            aria-label="Sub-category filter"
            value={subCategoryId}
            disabled={!categoryId}
            onChange={(event) => {
              setPage(1);
              setSubCategoryId(event.target.value);
            }}
          >
            <option value="">All Sub-categories</option>
            {subCategories.map((entry) => (
              <option key={entry._id} value={entry._id}>
                {entry.name}
              </option>
            ))}
          </Select>
          <Select
            aria-label="Status filter"
            value={status}
            onChange={(event) => {
              setPage(1);
              setStatus(event.target.value as CatalogStatus | "");
            }}
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </Select>
        </div>
        {loading ? (
          <LoadingState label="Loading Products" />
        ) : error ? (
          <ErrorState
            message={error}
            onRetry={() => setReload((value) => value + 1)}
          />
        ) : products.length ? (
          <>
            <Table
              columns={columns}
              rows={products}
              rowKey={(item) => item._id}
            />
            <Pagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              total={pagination.total}
              pageSize={pagination.limit}
              onPageChange={setPage}
            />
          </>
        ) : (
          <EmptyState
            title="No Products found"
            description="No finalized Products match the current filters."
          />
        )}
      </section>
      <ConfirmDialog
        isOpen={Boolean(target)}
        title={
          target?.status === "active"
            ? "Deactivate this product?"
            : "Activate Product?"
        }
        description={
          target?.status === "active"
            ? "This will hide it from future orders. Existing order history will remain."
            : "This reactivates the Product only; dependent ProductColours and SKUs retain their current statuses."
        }
        confirmLabel={target?.status === "active" ? "Deactivate" : "Activate"}
        tone={target?.status === "active" ? "danger" : "primary"}
        isConfirming={working}
        onClose={() => !working && setTarget(null)}
        onConfirm={changeStatus}
      />
      <ConfirmDialog
        isOpen={Boolean(permanentTarget)}
        title="Permanently delete this product?"
        description="This action cannot be undone. Permanent deletion is only allowed when the product has no inventory or order history."
        confirmLabel="Delete Permanently"
        tone="danger"
        isConfirming={working}
        onClose={() => !working && setPermanentTarget(null)}
        onConfirm={() => void permanentlyDelete()}
      />
    </div>
  );
}
