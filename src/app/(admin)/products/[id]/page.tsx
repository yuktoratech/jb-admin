"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/StateDisplay";
import { Table, type TableColumn } from "@/components/ui/Table";
import { VariantFormModal, type EditableVariant } from "@/features/products/VariantFormModal";
import { productApi } from "@/features/products/product.api";
import type { ProductDetailData, VariantSizeSet } from "@/features/products/product.types";
import { getApiErrorMessage } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const productId = params.id;
  const [data, setData] = useState<ProductDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isVariantModalOpen, setIsVariantModalOpen] = useState(false);
  const [editingVariant, setEditingVariant] = useState<EditableVariant | null>(null);
  const [deactivatingVariant, setDeactivatingVariant] = useState<EditableVariant | null>(null);
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadProduct() {
      setIsLoading(true);
      setError(null);
      try {
        const productData = await productApi.get(productId);
        if (active) setData(productData);
      } catch (requestError) {
        if (active) setError(getApiErrorMessage(requestError, "Unable to load the product."));
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void loadProduct();
    return () => { active = false; };
  }, [productId, reloadKey]);

  const refreshProduct = () => setReloadKey((key) => key + 1);

  const variantCount = useMemo(() => data?.variants.reduce((count, group) => count + group.sizeSets.length, 0) ?? 0, [data]);

  const deactivateVariant = async () => {
    if (!deactivatingVariant) return;
    setIsDeactivating(true);
    setActionError(null);
    try {
      await productApi.deactivateVariant(deactivatingVariant.variantId);
      setDeactivatingVariant(null);
      refreshProduct();
    } catch (requestError) {
      setActionError(getApiErrorMessage(requestError, "Unable to deactivate the variant."));
      setDeactivatingVariant(null);
    } finally {
      setIsDeactivating(false);
    }
  };

  const activateVariant = async (variant: EditableVariant) => {
    setActionError(null);
    try {
      await productApi.updateVariant(variant.variantId, { status: "active" });
      refreshProduct();
    } catch (requestError) {
      setActionError(getApiErrorMessage(requestError, "Unable to activate the variant."));
    }
  };

  if (isLoading) return <LoadingState label="Loading product" />;
  if (error || !data) return <ErrorState message={error ?? "Product data is unavailable."} onRetry={refreshProduct} />;

  const product = data.product;

  return (
    <div className="mx-auto w-full max-w-[1400px]">
      <PageHeader
        title={product.productName}
        description={product.title}
        actions={
          <>
            <Button variant="secondary" onClick={() => router.push("/products")}>Back to Products</Button>
            <Button onClick={() => router.push(`/products/${product._id}/edit`)}>Edit Product</Button>
          </>
        }
      />

      {actionError ? <div className="mb-5 border-l-2 border-red-700 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">{actionError}</div> : null}

      <section className="rounded-lg border border-neutral-200 bg-white">
        <header className="flex items-center justify-between border-b border-neutral-200 px-5 py-4 sm:px-6">
          <h2 className="text-sm font-semibold text-neutral-950">Product Information</h2>
          <Badge tone={product.status === "active" ? "active" : "inactive"}>{product.status}</Badge>
        </header>
        <dl className="grid gap-x-8 gap-y-5 p-5 sm:grid-cols-2 sm:p-6 lg:grid-cols-4">
          <Detail label="Product Code" value={product.productCode || "—"} />
          <Detail label="Category" value={product.category?.name || "—"} />
          <Detail label="MRP" value={formatCurrency(product.mrp)} />
          <Detail label="Created" value={formatDate(product.createdAt)} />
          <Detail label="Fit" value={product.fit || "—"} />
          <Detail label="Pattern / Wash" value={product.patternWash || "—"} />
          <Detail label="Fabric" value={product.fabric || "—"} />
          <Detail label="Sleeves" value={product.sleeves || "—"} />
          <Detail label="Waist" value={product.waist || "—"} />
          <Detail label="SKU Count" value={String(variantCount)} />
          {product.description ? <div className="sm:col-span-2 lg:col-span-4"><dt className="text-xs font-medium uppercase tracking-wide text-neutral-500">Description</dt><dd className="mt-1.5 whitespace-pre-wrap text-sm leading-6 text-neutral-700">{product.description}</dd></div> : null}
          {product.images?.length ? <div className="sm:col-span-2 lg:col-span-4"><dt className="text-xs font-medium uppercase tracking-wide text-neutral-500">Image References</dt><dd className="mt-2 space-y-1">{product.images.map((image) => <p key={image} className="break-all text-sm text-[#7A1F2B]">{image}</p>)}</dd></div> : null}
        </dl>
      </section>

      <section className="mt-6 rounded-lg border border-neutral-200 bg-white">
        <header className="flex flex-col gap-3 border-b border-neutral-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div><h2 className="text-sm font-semibold text-neutral-950">Variants</h2><p className="mt-1 text-xs text-neutral-500">Grouped by color · {variantCount} SKU{variantCount === 1 ? "" : "s"}</p></div>
          <Button disabled={product.status !== "active"} title={product.status !== "active" ? "Reactivate the product before adding variants" : undefined} onClick={() => { setEditingVariant(null); setIsVariantModalOpen(true); }}>+ Add Variant</Button>
        </header>

        {data.variants.length === 0 ? <EmptyState title="No variants found" description="Add a color and size set to create the first backend-generated SKU." action={product.status === "active" ? <Button size="sm" onClick={() => setIsVariantModalOpen(true)}>Add Variant</Button> : undefined} /> : (
          <div className="divide-y divide-neutral-200">
            {data.variants.map((group) => {
              const columns: Array<TableColumn<VariantSizeSet>> = [
                { key: "sku", header: "SKU", className: "min-w-52", render: (variant) => <code className="text-xs font-semibold text-neutral-900">{variant.sku}</code> },
                { key: "sizeSet", header: "Size Set", render: (variant) => variant.sizeSet },
                { key: "status", header: "Status", render: (variant) => <Badge tone={variant.status === "active" ? "active" : "inactive"}>{variant.status}</Badge> },
                { key: "actions", header: <span className="sr-only">Actions</span>, className: "min-w-64 text-right", render: (variant) => {
                  const editable: EditableVariant = { variantId: variant.variantId, color: group.color, sizeSet: variant.sizeSet, sku: variant.sku, status: variant.status };
                  return <div className="flex justify-end gap-1"><Button variant="ghost" size="sm" disabled={product.status !== "active"} title={product.status !== "active" ? "Reactivate the product before editing variants" : undefined} onClick={() => { setEditingVariant(editable); setIsVariantModalOpen(true); }}>Edit</Button><Button variant="ghost" size="sm" onClick={() => router.push(`/inventory/${variant.variantId}`)}>Inventory</Button>{variant.status === "active" ? <Button variant="ghost" size="sm" className="text-[#7A1F2B]" onClick={() => setDeactivatingVariant(editable)}>Deactivate</Button> : <Button variant="ghost" size="sm" disabled={product.status !== "active"} title={product.status !== "active" ? "Reactivate the product before activating variants" : undefined} onClick={() => void activateVariant(editable)}>Activate</Button>}</div>;
                } },
              ];
              return <div key={group.color}><div className="bg-neutral-50 px-5 py-3 sm:px-6"><h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-700">{group.color}</h3></div><Table columns={columns} rows={group.sizeSets} rowKey={(variant) => variant.variantId} /></div>;
            })}
          </div>
        )}
      </section>

      {isVariantModalOpen ? (
        <VariantFormModal
          key={editingVariant?.variantId ?? "new-variant"}
          isOpen
          productId={product._id}
          productName={product.productName}
          variant={editingVariant}
          onClose={() => { setIsVariantModalOpen(false); setEditingVariant(null); }}
          onSaved={refreshProduct}
        />
      ) : null}
      <ConfirmDialog isOpen={Boolean(deactivatingVariant)} title="Deactivate variant" description={`Deactivate ${deactivatingVariant?.sku ?? "this SKU"}? Its inventory history remains available.`} confirmLabel="Deactivate" tone="danger" isConfirming={isDeactivating} onClose={() => setDeactivatingVariant(null)} onConfirm={() => void deactivateVariant()} />
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div><dt className="text-xs font-medium uppercase tracking-wide text-neutral-500">{label}</dt><dd className="mt-1.5 text-sm font-medium text-neutral-900">{value}</dd></div>;
}
