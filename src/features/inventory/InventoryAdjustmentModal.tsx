"use client";

import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { inventoryApi } from "@/features/inventory/inventory.api";
import type {
  InventoryAdjustmentPayload,
  InventoryAdjustmentResult,
  InventoryAdjustmentType,
  InventoryShelf,
} from "@/features/inventory/inventory.types";
import { getApiErrorMessage } from "@/lib/api";

interface InventoryAdjustmentModalProps {
  isOpen: boolean;
  initialSku?: string;
  shelves?: InventoryShelf[];
  onClose: () => void;
  onAdjusted: (result: InventoryAdjustmentResult) => void | Promise<void>;
}

interface AdjustmentErrors {
  sku?: string;
  quantity?: string;
  shelf?: string;
  toShelf?: string;
  note?: string;
}

export function InventoryAdjustmentModal({
  isOpen,
  initialSku = "",
  shelves = [],
  onClose,
  onAdjusted,
}: InventoryAdjustmentModalProps) {
  const firstShelf = shelves[0]?.shelf ?? "";
  const [sku, setSku] = useState(initialSku);
  const [type, setType] = useState<InventoryAdjustmentType>("ADD");
  const [quantity, setQuantity] = useState("");
  const [shelf, setShelf] = useState("");
  const [toShelf, setToShelf] = useState("");
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<AdjustmentErrors>({});
  const [requestError, setRequestError] = useState<string | null>(null);
  const [pendingPayload, setPendingPayload] = useState<InventoryAdjustmentPayload | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reviewAdjustment = () => {
    const nextErrors: AdjustmentErrors = {};
    const trimmedSku = sku.trim();
    const trimmedShelf = shelf.trim();
    const trimmedToShelf = toShelf.trim();
    const numericQuantity = Number(quantity);

    if (!trimmedSku) nextErrors.sku = "SKU is required.";
    else if (trimmedSku.length > 255) nextErrors.sku = "SKU cannot exceed 255 characters.";

    if (!Number.isSafeInteger(numericQuantity) || numericQuantity <= 0) {
      nextErrors.quantity = "Quantity must be a positive whole number.";
    }

    if (!trimmedShelf) nextErrors.shelf = type === "ADD" ? "Shelf is required." : "Source shelf is required.";
    else if (trimmedShelf.length > 100) nextErrors.shelf = "Shelf cannot exceed 100 characters.";

    if (type === "TRANSFER") {
      if (!trimmedToShelf) nextErrors.toShelf = "Destination shelf is required.";
      else if (trimmedToShelf.length > 100) nextErrors.toShelf = "Destination shelf cannot exceed 100 characters.";
      else if (trimmedShelf.toUpperCase() === trimmedToShelf.toUpperCase()) nextErrors.toShelf = "Source and destination shelves must be different.";
    }

    if (note.trim().length > 1000) nextErrors.note = "Note cannot exceed 1000 characters.";

    setErrors(nextErrors);
    setRequestError(null);
    if (Object.keys(nextErrors).length > 0) return;

    const commonPayload = {
      sku: trimmedSku.toUpperCase(),
      quantity: numericQuantity,
      shelf: trimmedShelf.toUpperCase(),
      ...(note.trim() ? { note: note.trim() } : {}),
    };

    const payload: InventoryAdjustmentPayload = type === "TRANSFER"
      ? { ...commonPayload, type, toShelf: trimmedToShelf.toUpperCase() }
      : { ...commonPayload, type };

    setPendingPayload(payload);
  };

  const submitAdjustment = async () => {
    if (!pendingPayload) return;
    setIsSubmitting(true);
    setRequestError(null);
    try {
      const result = await inventoryApi.adjust(pendingPayload);
      await onAdjusted(result);
      onClose();
    } catch (error) {
      setRequestError(getApiErrorMessage(error, "Unable to adjust inventory."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTypeChange = (nextType: InventoryAdjustmentType) => {
    setType(nextType);
    setErrors({});
    setRequestError(null);
    if (nextType !== "ADD" && !shelf && firstShelf) setShelf(firstShelf);
    if (nextType !== "TRANSFER") setToShelf("");
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      closeOnBackdrop={!isSubmitting}
      title={pendingPayload ? "Confirm Stock Adjustment" : "Adjust Stock"}
      description={pendingPayload ? "Inventory changes are applied only after the backend confirms this request." : "Add, remove, or transfer physical stock for a backend SKU."}
      size="md"
      footer={pendingPayload ? (
        <>
          <Button variant="secondary" disabled={isSubmitting} onClick={() => { setPendingPayload(null); setRequestError(null); }}>Back</Button>
          <Button isLoading={isSubmitting} loadingLabel="Applying adjustment" onClick={() => void submitAdjustment()}>Confirm Adjustment</Button>
        </>
      ) : (
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={reviewAdjustment}>Review Adjustment</Button>
        </>
      )}
    >
      {requestError ? <div className="mb-5 border-l-2 border-red-700 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">{requestError}</div> : null}

      {pendingPayload ? (
        <dl className="divide-y divide-neutral-200 rounded-md border border-neutral-200">
          <ReviewRow label="SKU" value={pendingPayload.sku} mono />
          <ReviewRow label="Adjustment" value={pendingPayload.type} />
          <ReviewRow label="Quantity" value={String(pendingPayload.quantity)} />
          <ReviewRow label={pendingPayload.type === "ADD" ? "Shelf" : "From Shelf"} value={pendingPayload.shelf} />
          {pendingPayload.type === "TRANSFER" ? <ReviewRow label="To Shelf" value={pendingPayload.toShelf} /> : null}
          {pendingPayload.note ? <ReviewRow label="Note" value={pendingPayload.note} /> : null}
        </dl>
      ) : (
        <div className="space-y-5">
          <Select label="Adjustment Type" value={type} onChange={(event) => handleTypeChange(event.target.value as InventoryAdjustmentType)} required>
            <option value="ADD">ADD</option>
            <option value="REMOVE">REMOVE</option>
            <option value="TRANSFER">TRANSFER</option>
          </Select>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Input label="SKU" value={sku} onChange={(event) => setSku(event.target.value)} error={errors.sku} maxLength={255} required autoComplete="off" />
            </div>
            <Input label="Quantity" type="number" min="1" step="1" value={quantity} onChange={(event) => setQuantity(event.target.value)} error={errors.quantity} required />
            <Input
              label={type === "ADD" ? "Shelf" : "From Shelf"}
              value={shelf}
              onChange={(event) => setShelf(event.target.value)}
              error={errors.shelf}
              list={shelves.length ? "inventory-shelf-options" : undefined}
              maxLength={100}
              required
            />
            {type === "TRANSFER" ? (
              <Input label="To Shelf" value={toShelf} onChange={(event) => setToShelf(event.target.value)} error={errors.toShelf} maxLength={100} required />
            ) : null}
            <datalist id="inventory-shelf-options">
              {shelves.map((item) => <option key={item.shelf} value={item.shelf}>{item.quantity} units</option>)}
            </datalist>
          </div>

          <Textarea label="Note" value={note} onChange={(event) => setNote(event.target.value)} error={errors.note} maxLength={1000} hint="Optional audit note stored with the transaction." />
          {type !== "ADD" && shelves.length === 0 && initialSku ? (
            <p className="text-xs leading-5 text-neutral-500">No stocked shelves are currently listed for this SKU. The backend will reject removal or transfer when source stock is unavailable.</p>
          ) : null}
        </div>
      )}
    </Modal>
  );
}

function ReviewRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="grid grid-cols-[120px_1fr] gap-4 px-4 py-3 text-sm">
      <dt className="text-neutral-500">{label}</dt>
      <dd className={mono ? "break-all font-mono text-xs font-semibold text-neutral-950" : "font-medium text-neutral-950"}>{value}</dd>
    </div>
  );
}
