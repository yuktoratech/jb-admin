"use client";

import { type FormEvent, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { productApi } from "@/features/products/product.api";
import type { CatalogStatus, ProductVariant, VariantPayload } from "@/features/products/product.types";
import { getApiErrorMessage, getApiFieldErrors } from "@/lib/api";
import { normalizeSkuPart } from "@/lib/utils";

export interface EditableVariant {
  variantId: string;
  color: string;
  sizeSet: string;
  sku: string;
  status: CatalogStatus;
}

interface VariantFormModalProps {
  isOpen: boolean;
  productId: string;
  productName: string;
  variant?: EditableVariant | null;
  onClose: () => void;
  onSaved: (variant: ProductVariant) => void;
}

export function VariantFormModal({ isOpen, productId, productName, variant, onClose, onSaved }: VariantFormModalProps) {
  const [color, setColor] = useState(variant?.color ?? "");
  const [sizeSet, setSizeSet] = useState(variant?.sizeSet ?? "");
  const [sku, setSku] = useState(variant?.sku ?? "");
  const [status, setStatus] = useState<CatalogStatus>(variant?.status ?? "active");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [requestError, setRequestError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const generatedPreview = [normalizeSkuPart(productName), normalizeSkuPart(color), normalizeSkuPart(sizeSet)].filter(Boolean).join("_");
  const originalGeneratedSku = variant
    ? [normalizeSkuPart(productName), normalizeSkuPart(variant.color), normalizeSkuPart(variant.sizeSet)].filter(Boolean).join("_")
    : "";

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!normalizeSkuPart(color)) nextErrors.color = "Color must contain letters or numbers.";
    if (!normalizeSkuPart(sizeSet)) nextErrors.sizeSet = "Size set must contain letters or numbers.";
    if (variant && !sku.trim()) nextErrors.sku = "SKU is required.";
    setErrors(nextErrors);
    setRequestError(null);
    if (Object.keys(nextErrors).length > 0) return;

    let editPayload: Partial<VariantPayload> | null = null;
    if (variant) {
      editPayload = {};
      const nextColor = color.trim();
      const nextSizeSet = sizeSet.trim();
      const dimensionsChanged = nextColor !== variant.color || nextSizeSet !== variant.sizeSet;
      const skuChanged = sku.trim() !== variant.sku;

      if (nextColor !== variant.color) editPayload.color = nextColor;
      if (nextSizeSet !== variant.sizeSet) editPayload.sizeSet = nextSizeSet;
      if (status !== variant.status) editPayload.status = status;
      if (skuChanged) editPayload.sku = sku.trim();
      else if (dimensionsChanged && variant.sku !== originalGeneratedSku) editPayload.sku = variant.sku;

      if (Object.keys(editPayload).length === 0) {
        onClose();
        return;
      }
    }

    setIsSaving(true);
    try {
      let saved: ProductVariant;
      if (variant && editPayload) {
        saved = await productApi.updateVariant(variant.variantId, editPayload);
      } else {
        saved = await productApi.createVariant(productId, {
          color: color.trim(),
          sizeSet: sizeSet.trim(),
          status,
        });
      }
      onSaved(saved);
      onClose();
    } catch (error) {
      setErrors(getApiFieldErrors(error));
      setRequestError(getApiErrorMessage(error, "Unable to save the variant."));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={variant ? "Edit variant" : "Add variant"}
      description="The backend remains the source of truth for SKU generation and uniqueness."
      closeOnBackdrop={!isSaving}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSaving}>Cancel</Button>
          <Button type="submit" form="variant-form" isLoading={isSaving} loadingLabel="Saving">{variant ? "Save changes" : "Add variant"}</Button>
        </>
      }
    >
      <form id="variant-form" className="space-y-5" onSubmit={handleSubmit} noValidate>
        {requestError ? <div className="border-l-2 border-red-700 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">{requestError}</div> : null}
        <div className="grid gap-5 sm:grid-cols-2">
          <Input label="Color" name="color" value={color} onChange={(event) => setColor(event.target.value)} error={errors.color} maxLength={100} required />
          <Input label="Size Set" name="sizeSet" value={sizeSet} onChange={(event) => setSizeSet(event.target.value)} error={errors.sizeSet} maxLength={100} placeholder="e.g. 30-38 or S-XL" required />
        </div>
        {variant ? (
          <Input label="SKU" name="sku" value={sku} onChange={(event) => setSku(event.target.value)} error={errors.sku} maxLength={255} hint={variant.sku === originalGeneratedSku ? "When color or size set changes, leaving this SKU unchanged lets the backend regenerate it." : "This custom SKU is preserved unless you change it."} />
        ) : null}
        <Select label="Status" name="status" value={status} onChange={(event) => setStatus(event.target.value as CatalogStatus)} error={errors.status}>
          <option value="active">Active</option><option value="inactive">Inactive</option>
        </Select>
        <div className="border border-neutral-200 bg-neutral-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">SKU Preview</p>
          <code className="mt-2 block break-all text-sm font-semibold text-neutral-900">{variant && (sku.trim() !== variant.sku || variant.sku !== originalGeneratedSku) ? (sku.trim().toUpperCase() || "Complete the fields above") : generatedPreview || "Complete the fields above"}</code>
          <p className="mt-2 text-xs text-neutral-500">Preview only; backend output is authoritative.</p>
        </div>
      </form>
    </Modal>
  );
}
