"use client";

import { useRef, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Table, type TableColumn } from "@/components/ui/Table";
import {
  extractInventoryImportValidation,
  inventoryApi,
} from "@/features/inventory/inventory.api";
import type {
  InventoryImportResult,
  InventoryImportValidationData,
  InventoryImportValidationError,
} from "@/features/inventory/inventory.types";
import { ApiError, getApiErrorMessage } from "@/lib/api";

const MAX_FILE_BYTES = 5 * 1024 * 1024;

interface InventoryImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImported: () => void | Promise<void>;
}

export function InventoryImportModal({ isOpen, onClose, onImported }: InventoryImportModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [validation, setValidation] = useState<InventoryImportValidationData | null>(null);
  const [result, setResult] = useState<InventoryImportResult | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const selectFile = (selected: File | null) => {
    setFile(null);
    setFileError(null);
    setRequestError(null);
    setValidation(null);
    setResult(null);

    if (!selected) return;
    if (!selected.name.toLowerCase().endsWith(".xlsx")) {
      setFileError("Select an .xlsx workbook. Inventory was not updated.");
      return;
    }
    if (selected.size > MAX_FILE_BYTES) {
      setFileError("The workbook must be 5 MB or smaller. Inventory was not updated.");
      return;
    }
    setFile(selected);
  };

  const upload = async () => {
    if (!file) {
      setFileError("Select an .xlsx workbook before uploading.");
      return;
    }

    setIsUploading(true);
    setRequestError(null);
    setValidation(null);
    try {
      const importResult = await inventoryApi.importAdjustments(file);
      setResult(importResult);
      await onImported();
    } catch (error) {
      const validationData = extractInventoryImportValidation(error);
      setValidation(validationData);
      const rejectedBeforeProcessing = validationData || (error instanceof ApiError && (error.status === 400 || error.status === 422));
      setRequestError(`${getApiErrorMessage(error, "Unable to import inventory adjustments.")}${rejectedBeforeProcessing ? " Inventory was not updated." : ""}`);
    } finally {
      setIsUploading(false);
    }
  };

  const resetUpload = () => {
    setFile(null);
    setFileError(null);
    setRequestError(null);
    setValidation(null);
    setResult(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const errorColumns: Array<TableColumn<InventoryImportValidationError>> = [
    { key: "row", header: "Row", render: (error) => error.row },
    { key: "sku", header: "SKU", className: "min-w-44", render: (error) => <code className="text-xs">{error.sku || "—"}</code> },
    { key: "field", header: "Field", render: (error) => error.field },
    { key: "error", header: "Error", className: "min-w-64", render: (error) => <span className="text-red-800">{error.message}</span> },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      closeOnBackdrop={!isUploading}
      title="Import Inventory"
      description="Upload an atomic batch of stock adjustments using the backend XLSX importer."
      size={validation ? "lg" : "md"}
      footer={result ? (
        <>
          <Button variant="secondary" onClick={resetUpload}>Upload Another</Button>
          <Button onClick={onClose}>Done</Button>
        </>
      ) : (
        <>
          <Button variant="secondary" disabled={isUploading} onClick={onClose}>Cancel</Button>
          <Button isLoading={isUploading} loadingLabel="Uploading workbook" disabled={!file} onClick={() => void upload()}>Upload</Button>
        </>
      )}
    >
      {result ? (
        <div>
          <div className="border-l-2 border-[#7A1F2B] bg-[#7A1F2B]/5 px-4 py-3 text-sm text-neutral-800" role="status">Inventory adjustments were processed successfully.</div>
          <dl className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-md border border-neutral-200 bg-neutral-200 sm:grid-cols-3">
            <ResultMetric label="Total Rows" value={result.totalRows} />
            <ResultMetric label="Processed" value={result.processedRows} />
            <ResultMetric label="ADD" value={result.addCount} />
            <ResultMetric label="REMOVE" value={result.removeCount} />
            <ResultMetric label="TRANSFER" value={result.transferCount} />
            <ResultMetric label="Reference" value={result.referenceId} compact />
          </dl>
        </div>
      ) : (
        <div className="space-y-5">
          <section className="rounded-md border border-neutral-200 bg-neutral-50 p-4">
            <h3 className="text-sm font-semibold text-neutral-950">Required columns</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {["SKU", "QTY", "SHELF", "ADJUSTMENT TYPE", "TO SHELF"].map((column) => <code key={column} className="rounded border border-neutral-200 bg-white px-2 py-1 text-[11px] font-semibold text-neutral-700">{column}</code>)}
            </div>
            <p className="mt-3 text-xs leading-5 text-neutral-500">Use TO SHELF only for TRANSFER rows. The workbook may contain up to 10,000 non-empty rows and must be 5 MB or smaller.</p>
          </section>

          <div>
            <label htmlFor="inventory-import-file" className="mb-1.5 block text-sm font-medium text-neutral-800">XLSX Workbook <span className="text-[#7A1F2B]">*</span></label>
            <input
              ref={inputRef}
              id="inventory-import-file"
              type="file"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              onChange={(event) => selectFile(event.target.files?.[0] ?? null)}
              className="block w-full rounded-md border border-neutral-300 bg-white text-sm text-neutral-600 file:mr-4 file:border-0 file:border-r file:border-neutral-300 file:bg-neutral-100 file:px-4 file:py-3 file:text-sm file:font-semibold file:text-neutral-800 hover:file:bg-neutral-200"
            />
            {file ? <p className="mt-2 text-xs text-neutral-600">Selected: <span className="font-semibold text-neutral-900">{file.name}</span> · {(file.size / 1024).toFixed(1)} KB</p> : null}
            {fileError ? <p className="mt-2 text-xs text-red-700" role="alert">{fileError}</p> : null}
          </div>

          {requestError ? <div className="border-l-2 border-red-700 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">{requestError}</div> : null}

          {validation ? (
            <section className="overflow-hidden rounded-md border border-red-200">
              <div className="flex flex-wrap gap-x-5 gap-y-1 bg-red-50 px-4 py-3 text-xs text-red-900">
                <span>Total rows: <strong>{validation.totalRows}</strong></span>
                <span>Valid: <strong>{validation.validRows}</strong></span>
                <span>Invalid: <strong>{validation.invalidRows}</strong></span>
              </div>
              <Table columns={errorColumns} rows={validation.errors} rowKey={(error) => `${error.row}-${error.sku ?? ""}-${error.field}-${error.message}`} />
            </section>
          ) : null}
        </div>
      )}
    </Modal>
  );
}

function ResultMetric({ label, value, compact = false }: { label: string; value: number | string; compact?: boolean }) {
  return (
    <div className="bg-white p-4">
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">{label}</dt>
      <dd className={compact ? "mt-2 break-all font-mono text-[11px] text-neutral-800" : "mt-2 text-xl font-semibold text-neutral-950"}>{value}</dd>
    </div>
  );
}
