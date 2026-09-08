"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/StateDisplay";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pagination } from "@/components/ui/Pagination";
import { Select } from "@/components/ui/Select";
import { Table, type TableColumn } from "@/components/ui/Table";
import { inventoryApi } from "@/features/inventory/inventory.api";
import type {
  InventoryDetail,
  InventoryShelf,
  InventoryTransaction,
  InventoryTransactionSource,
  InventoryTransactionType,
} from "@/features/inventory/inventory.types";
import { getApiErrorMessage } from "@/lib/api";
import { formatDateTime } from "@/lib/utils";
import type { Pagination as PaginationData } from "@/types/api";

const TRANSACTION_PAGE_SIZE = 20;
const emptyPagination: PaginationData = { page: 1, limit: TRANSACTION_PAGE_SIZE, total: 0, totalPages: 0 };

export default function InventoryDetailPage() {
  const params = useParams<{ variantId: string }>();
  const router = useRouter();
  const variantId = params.variantId;
  const [inventory, setInventory] = useState<InventoryDetail | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(true);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [transactionPagination, setTransactionPagination] = useState(emptyPagination);
  const [transactionPage, setTransactionPage] = useState(1);
  const [transactionType, setTransactionType] = useState<InventoryTransactionType | "">("");
  const [transactionSource, setTransactionSource] = useState<InventoryTransactionSource | "">("");
  const [transactionError, setTransactionError] = useState<string | null>(null);
  const [isTransactionsLoading, setIsTransactionsLoading] = useState(true);
  const [detailReloadKey, setDetailReloadKey] = useState(0);
  const [transactionReloadKey, setTransactionReloadKey] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadDetail() {
      setIsDetailLoading(true);
      setDetailError(null);
      try {
        const data = await inventoryApi.getByVariantId(variantId);
        if (active) setInventory(data);
      } catch (error) {
        if (active) setDetailError(getApiErrorMessage(error, "Unable to load inventory details."));
      } finally {
        if (active) setIsDetailLoading(false);
      }
    }

    void loadDetail();
    return () => { active = false; };
  }, [detailReloadKey, variantId]);

  useEffect(() => {
    let active = true;

    async function loadTransactions() {
      setIsTransactionsLoading(true);
      setTransactionError(null);
      try {
        const data = await inventoryApi.listTransactions(variantId, {
          page: transactionPage,
          limit: TRANSACTION_PAGE_SIZE,
          type: transactionType,
          source: transactionSource,
        });
        if (!active) return;
        setTransactions(data.transactions);
        setTransactionPagination(data.pagination);
      } catch (error) {
        if (active) setTransactionError(getApiErrorMessage(error, "Unable to load inventory transactions."));
      } finally {
        if (active) setIsTransactionsLoading(false);
      }
    }

    void loadTransactions();
    return () => { active = false; };
  }, [transactionPage, transactionReloadKey, transactionSource, transactionType, variantId]);

  const retryDetail = () => {
    setDetailReloadKey((key) => key + 1);
  };

  const retryTransactions = () => {
    setTransactionReloadKey((key) => key + 1);
  };

  if (isDetailLoading) return <LoadingState label="Loading inventory details" />;
  if (detailError || !inventory) return <ErrorState message={detailError ?? "Inventory details are unavailable."} onRetry={retryDetail} />;

  const shelfColumns: Array<TableColumn<InventoryShelf>> = [
    { key: "shelf", header: "Shelf", render: (item) => <span className="font-medium text-neutral-950">{item.shelf}</span> },
    { key: "quantity", header: "Quantity (Sets)", className: "text-right", render: (item) => <span className="font-semibold text-neutral-950">{item.quantity}</span> },
  ];

  const transactionColumns: Array<TableColumn<InventoryTransaction>> = [
    { key: "date", header: "Date", className: "min-w-40", render: (item) => formatDateTime(item.createdAt) },
    { key: "type", header: "Type", render: (item) => <Badge tone={item.type === "ADD" || item.type === "TRANSFER" ? "maroon" : "neutral"}>{formatLabel(item.type)}</Badge> },
    { key: "quantity", header: "Quantity (Sets)", className: "text-right", render: (item) => <span className={`font-semibold ${item.type === "REMOVE" || item.type === "ORDER_DEDUCT" ? "text-red-700" : item.type === "ADD" ? "text-green-700" : "text-blue-700"}`}>{item.type === "ADD" ? "+" : item.type === "REMOVE" || item.type === "ORDER_DEDUCT" ? "−" : ""}{item.quantity}</span> },
    { key: "fromShelf", header: "From Shelf", render: (item) => item.fromShelf || "—" },
    { key: "toShelf", header: "To Shelf", render: (item) => item.toShelf || "—" },
    { key: "source", header: "Source", render: (item) => formatLabel(item.source) },
    { key: "result", header: "Resulting Balance", className: "text-right", render: (item) => item.newQuantity ?? "—" },
    { key: "performedBy", header: "Performed By", className: "min-w-40", render: (item) => formatActor(item.performedBy) },
  ];

  return (
    <div className="mx-auto w-full max-w-[1500px]">
      <PageHeader
        title={inventory.sku}
        description={`${inventory.product.name} · ${typeof inventory.colour === "string" ? inventory.colour : inventory.colour?.name || "—"} · ${typeof inventory.sizeSet === "string" ? inventory.sizeSet : inventory.sizeSet.label}`}
        actions={
          <>
            <Button variant="secondary" onClick={() => router.push("/inventory")}>Back to Inventory</Button>
          </>
        }
      />

      <section className="rounded-lg border border-neutral-200 bg-white">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 px-5 py-4 sm:px-6">
          <div>
            <h2 className="text-sm font-semibold text-neutral-950">Inventory Information</h2>
            <Link href={`/products/${inventory.product._id}`} className="mt-1 inline-block text-xs font-medium text-[#7A1F2B] hover:underline">Open product</Link>
          </div>
          <Badge tone={inventory.status === "in_stock" ? "active" : "inactive"}>{inventory.status === "in_stock" ? "In Stock" : "Out of Stock"}</Badge>
        </header>
        <dl className="grid gap-x-8 gap-y-5 p-5 sm:grid-cols-2 sm:p-6 lg:grid-cols-4">
          <Detail label="SKU" value={inventory.sku} mono />
          <Detail label="Product" value={inventory.product.name} />
          <Detail label="Product Code" value={inventory.productColour?.productCode || "—"} />
          <Detail label="Category" value={inventory.product.category.name} />
          <Detail label="Colour" value={typeof inventory.colour === "string" ? inventory.colour : inventory.colour?.name || "—"} />
          <Detail label="Size Set" value={typeof inventory.sizeSet === "string" ? inventory.sizeSet : inventory.sizeSet.label} />
          <Detail label="Pieces per Set" value={typeof inventory.sizeSet === "string" ? "—" : String(inventory.sizeSet.pieceCount)} />
          <Detail label="Variant Status" value={formatLabel(inventory.variantStatus)} />
          <Detail label="Last Updated" value={formatDateTime(inventory.updatedAt)} />
        </dl>
      </section>

      <section className="mt-6 grid gap-px overflow-hidden rounded-lg border border-neutral-200 bg-neutral-200 sm:grid-cols-2">
        <QuantityMetric label="Available Quantity" value={inventory.availableQuantity} emphasized />
        <QuantityMetric label="Total Quantity" value={inventory.totalQuantity} />
      </section>

      <section className="mt-6 overflow-hidden rounded-lg border border-neutral-200 bg-white">
        <header className="border-b border-neutral-200 px-5 py-4 sm:px-6">
          <h2 className="text-sm font-semibold text-neutral-950">Shelf Stock</h2>
          <p className="mt-1 text-xs text-neutral-500">Physical stock by backend-normalized shelf.</p>
        </header>
        {inventory.shelves.length ? <Table columns={shelfColumns} rows={inventory.shelves} rowKey={(item) => item.shelf} /> : <EmptyState title="No shelf stock" description="This SKU has no physical stock assigned to a shelf." />}
      </section>

      <section className="mt-6 overflow-hidden rounded-lg border border-neutral-200 bg-white">
        <header className="flex flex-col gap-4 border-b border-neutral-200 px-5 py-4 sm:px-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-neutral-950">Transaction History</h2>
            <p className="mt-1 text-xs text-neutral-500">Backend audit trail for this variant.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:w-[420px]">
            <Select aria-label="Filter transactions by type" value={transactionType} onChange={(event) => { setTransactionPage(1); setTransactionType(event.target.value as InventoryTransactionType | ""); }}>
              <option value="">All types</option>
              {["ADD", "REMOVE", "TRANSFER", "ORDER_DEDUCT", "MANUAL_ADJUSTMENT"].map((type) => <option key={type} value={type}>{formatLabel(type)}</option>)}
            </Select>
            <Select aria-label="Filter transactions by source" value={transactionSource} onChange={(event) => { setTransactionPage(1); setTransactionSource(event.target.value as InventoryTransactionSource | ""); }}>
              <option value="">All sources</option>
              {["admin", "import", "order", "system"].map((source) => <option key={source} value={source}>{formatLabel(source)}</option>)}
            </Select>
          </div>
        </header>

        {isTransactionsLoading ? <LoadingState label="Loading transactions" /> : transactionError ? <ErrorState title="Unable to load transactions" message={transactionError} onRetry={retryTransactions} /> : transactions.length === 0 ? (
          <EmptyState title="No transactions found" description={transactionType || transactionSource ? "Try changing the transaction filters." : "Stock adjustments will appear here after the backend processes them."} />
        ) : (
          <>
            <Table columns={transactionColumns} rows={transactions} rowKey={(item) => item._id} />
            <Pagination
              page={transactionPagination.page}
              totalPages={transactionPagination.totalPages}
              total={transactionPagination.total}
              pageSize={transactionPagination.limit}
              onPageChange={setTransactionPage}
            />
          </>
        )}
      </section>

    </div>
  );
}

function Detail({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return <div><dt className="text-xs font-medium uppercase tracking-wide text-neutral-500">{label}</dt><dd className={mono ? "mt-1.5 break-all font-mono text-xs font-semibold text-neutral-950" : "mt-1.5 text-sm font-medium text-neutral-950"}>{value}</dd></div>;
}

function QuantityMetric({ label, value, emphasized = false }: { label: string; value: number; emphasized?: boolean }) {
  return <div className="bg-white p-5 sm:p-6"><dt className="text-xs font-medium uppercase tracking-wide text-neutral-500">{label}</dt><dd className={emphasized ? "mt-2 text-3xl font-semibold text-[#7A1F2B]" : "mt-2 text-3xl font-semibold text-neutral-950"}>{value}</dd></div>;
}

function formatLabel(value: string): string {
  return value.toLowerCase().split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}

function formatActor(actor: InventoryTransaction["performedBy"]): string {
  if (!actor) return "System";
  if (typeof actor === "string") return actor;
  return actor.name || actor.email;
}
