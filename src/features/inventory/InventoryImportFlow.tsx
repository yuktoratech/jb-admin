"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Table, type TableColumn } from "@/components/ui/Table";
import { ApiError, getApiErrorMessage } from "@/lib/api";
import { formatDateTime } from "@/lib/utils";
import { INVENTORY_IMPORT_COLUMNS, inventoryApi } from "./inventory.api";
import type { InventoryImportBatch, InventoryImportPreviewRow, InventoryImportValidationError } from "./inventory.types";

type Stage = "upload" | "preview" | "submit" | "result";

const rowColumns: Array<TableColumn<InventoryImportPreviewRow>> = [
  { key: "row", header: "Row", render: (row) => row.rowNumber },
  { key: "sku", header: "SKU", className: "min-w-52", render: (row) => <code className="text-xs font-semibold text-neutral-950">{row.sku}</code> },
  { key: "product", header: "Product", render: (row) => row.productName },
  { key: "type", header: "Type", render: (row) => <OperationBadge type={row.type} /> },
  { key: "quantity", header: "Quantity (Sets)", className: "text-right", render: (row) => row.quantity },
  { key: "shelf", header: "Shelf", render: (row) => row.shelf },
  { key: "toShelf", header: "To Shelf", render: (row) => row.type === "TRANSFER" ? row.toShelf || "—" : "—" },
  { key: "status", header: "Validation", render: () => <Badge tone="active">Valid</Badge> },
];

const errorColumns: Array<TableColumn<InventoryImportValidationError>> = [
  { key: "row", header: "Row", render: (error) => error.rowNumber },
  { key: "sku", header: "SKU", className: "min-w-48", render: (error) => error.sku ? <code className="text-xs">{error.sku}</code> : "—" },
  { key: "field", header: "Field", render: (error) => error.field },
  { key: "code", header: "Code", render: (error) => <Badge tone="inactive">{error.code}</Badge> },
  { key: "message", header: "Blocking error", className: "min-w-72", render: (error) => error.message || (error.code === "DUPLICATE_OPERATION" ? "Duplicate inventory operation detected in the uploaded file." : "Invalid row") },
];

export function InventoryImportFlow() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [stage, setStage] = useState<Stage>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [batch, setBatch] = useState<InventoryImportBatch | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConflict, setIsConflict] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const canApply = batch?.status === "VALID" && batch.invalidRows === 0;

  const chooseFile = (selected: File | null) => {
    setError(null); setIsConflict(false); setBatch(null); setStage("upload");
    if (!selected) return setFile(null);
    if (!selected.name.toLowerCase().endsWith(".xlsx")) { setFile(null); setError("Choose an XLSX workbook. Other file formats are not accepted."); return; }
    setFile(selected);
  };

  const preview = async () => {
    if (!file || isBusy) return;
    setIsBusy(true); setError(null); setIsConflict(false);
    try { setBatch(await inventoryApi.previewImport(file)); setStage("preview"); }
    catch (requestError) { setError(getApiErrorMessage(requestError, "Unable to upload and preview this workbook.")); }
    finally { setIsBusy(false); }
  };

  const apply = async () => {
    if (!batch || !canApply || isBusy) return;
    setIsConfirmOpen(false); setIsBusy(true); setError(null); setIsConflict(false);
    try { setBatch(await inventoryApi.applyImport(batch.id)); setStage("result"); }
    catch (requestError) { setIsConflict(requestError instanceof ApiError && requestError.status === 409); setError(getApiErrorMessage(requestError, "Unable to apply this inventory batch.")); }
    finally { setIsBusy(false); }
  };

  const startAgain = () => {
    setFile(null); setBatch(null); setError(null); setIsConflict(false); setStage("upload");
    if (inputRef.current) inputRef.current.value = "";
  };

  return <div className="space-y-5">
    <ol className="grid overflow-hidden rounded-lg border border-neutral-200 bg-white md:grid-cols-4">
      {(["Upload XLSX", "Preview & Verify", "Submit", "Result"] as const).map((label, index) => {
        const stages: Stage[] = ["upload", "preview", "submit", "result"];
        const active = stages.indexOf(stage) === index; const complete = stages.indexOf(stage) > index;
        return <li key={label} className={`flex items-center gap-3 border-b px-5 py-4 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0 ${active ? "bg-[#7A1F2B]/5 text-[#7A1F2B]" : "text-neutral-500"}`}><span className={`grid h-7 w-7 place-items-center rounded-full text-xs font-bold ${active || complete ? "bg-[#7A1F2B] text-white" : "bg-neutral-200 text-neutral-600"}`}>{complete ? "✓" : index + 1}</span><span className="text-sm font-semibold">{label}</span></li>;
      })}
    </ol>

    {stage === "upload" ? <section className="rounded-lg border border-neutral-200 bg-white p-5 sm:p-7">
      <div className="rounded-lg border-2 border-dashed border-neutral-300 px-6 py-12 text-center hover:border-[#7A1F2B]/50" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); chooseFile(event.dataTransfer.files[0] ?? null); }}>
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#7A1F2B]/5 text-[#7A1F2B]"><UploadIcon /></div>
        <h2 className="mt-4 text-lg font-semibold text-neutral-950">Upload Inventory Adjustment XLSX</h2>
        <p className="mt-1 text-sm text-neutral-500">Drag and drop an XLSX file here, or choose it from your device.</p>
        <input ref={inputRef} className="sr-only" type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={(event) => chooseFile(event.target.files?.[0] ?? null)} />
        <Button className="mt-5" onClick={() => inputRef.current?.click()}>Choose XLSX File</Button><p className="mt-3 text-xs text-neutral-500">Maximum file size: 5 MiB</p>
      </div>
      <div className="mt-5 rounded-md border border-blue-100 bg-blue-50/70 p-4"><p className="text-sm font-semibold text-blue-950">Required workbook columns</p><div className="mt-3 flex flex-wrap gap-2">{INVENTORY_IMPORT_COLUMNS.map((column) => <code key={column} className="rounded border border-blue-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-blue-900">{column}</code>)}</div><p className="mt-3 text-xs leading-5 text-blue-900">TYPE must be ADD, REMOVE, or TRANSFER. Repeated SKUs are allowed; the backend validates every operation in workbook order.</p></div>
      {file ? <div className="mt-5 flex flex-col justify-between gap-4 rounded-md border border-neutral-200 bg-neutral-50 p-4 sm:flex-row sm:items-center"><div><p className="text-sm font-semibold text-neutral-950">{file.name}</p><p className="mt-1 text-xs text-neutral-500">{formatBytes(file.size)} · Ready for server preview</p></div><Button isLoading={isBusy} loadingLabel="Creating preview" onClick={() => void preview()}>Upload & Preview</Button></div> : null}
    </section> : null}

    {(stage === "preview" || stage === "submit") && batch ? <BatchPreview batch={batch} /> : null}
    {stage === "preview" && batch ? <div className="flex flex-wrap justify-between gap-3"><Button variant="secondary" disabled={isBusy} onClick={startAgain}>Upload Another File</Button><Button disabled={!canApply || isBusy} onClick={() => setStage("submit")}>Verify & Continue</Button></div> : null}
    {stage === "submit" && batch ? <section className="rounded-lg border border-neutral-200 bg-white p-5 sm:p-6"><div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950"><strong>Final confirmation required.</strong> Applying this batch changes live shelf quantities. It cannot be partially applied.</div><div className="mt-5 flex flex-wrap justify-between gap-3"><Button variant="secondary" disabled={isBusy} onClick={() => setStage("preview")}>Back to Preview</Button><Button isLoading={isBusy} loadingLabel="Applying batch" disabled={!canApply} onClick={() => setIsConfirmOpen(true)}>Submit Inventory Adjustments</Button></div></section> : null}
    {stage === "result" && batch ? <section className="rounded-lg border border-green-200 bg-green-50/60 p-6 sm:p-8"><div className="flex gap-4"><div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-green-100 text-2xl text-green-700">✓</div><div><h2 className="text-xl font-semibold text-green-950">Inventory batch applied successfully</h2><p className="mt-1 text-sm text-green-900">All {batch.validRows} workbook rows were applied atomically in their original order.</p><dl className="mt-5 grid gap-4 text-sm sm:grid-cols-3"><ResultDetail label="Import ID" value={batch.id} mono /><ResultDetail label="Applied rows" value={String(batch.validRows)} /><ResultDetail label="Applied at" value={formatDateTime(batch.appliedAt)} /></dl></div></div><div className="mt-6 flex flex-wrap gap-3"><Link href="/inventory" className="inline-flex h-10 items-center rounded-md border border-[#7A1F2B] bg-[#7A1F2B] px-4 text-sm font-semibold text-white">Back to Inventory</Link><Button variant="secondary" onClick={startAgain}>Import Another File</Button></div></section> : null}
    {error ? <div role="alert" className={`rounded-md border p-4 text-sm ${isConflict ? "border-amber-300 bg-amber-50 text-amber-950" : "border-red-200 bg-red-50 text-red-800"}`}><p className="font-semibold">{isConflict ? "Inventory changed or this batch cannot be applied" : "Import request failed"}</p><p className="mt-1">{error}</p>{isConflict ? <p className="mt-2 text-xs">Upload the corrected/current workbook again to create a new authoritative preview. The request was not retried.</p> : null}</div> : null}
    <ConfirmDialog isOpen={isConfirmOpen} title="Apply inventory adjustments?" description={`This will apply all ${batch?.validRows ?? 0} valid rows and change live stock quantities in one transaction.`} confirmLabel="Apply Batch" isConfirming={isBusy} onClose={() => setIsConfirmOpen(false)} onConfirm={() => void apply()} />
  </div>;
}

function BatchPreview({ batch }: { batch: InventoryImportBatch }) {
  const valid = batch.status === "VALID" && batch.invalidRows === 0;
  return <section className="overflow-hidden rounded-lg border border-neutral-200 bg-white"><div className="flex flex-col justify-between gap-4 border-b border-neutral-200 p-5 sm:flex-row sm:items-start sm:p-6"><div><h2 className="text-lg font-semibold text-neutral-950">Server-authoritative preview</h2><p className="mt-1 text-sm text-neutral-500">Read only. Correct errors in the XLSX and upload it again.</p><p className="mt-2 break-all font-mono text-[11px] text-neutral-500">Batch {batch.id}</p></div><Badge tone={valid ? "active" : "inactive"}>{batch.status}</Badge></div><div className="grid gap-px border-b border-neutral-200 bg-neutral-200 sm:grid-cols-3"><Metric label="Total Rows" value={batch.totalRows} /><Metric label="Valid Rows" value={batch.validRows} tone="green" /><Metric label="Invalid Rows" value={batch.invalidRows} tone={batch.invalidRows ? "red" : undefined} /></div>{batch.rows.length ? <div><div className="px-5 pt-5 text-sm font-semibold text-neutral-950">Validated rows</div><Table columns={rowColumns} rows={batch.rows} rowKey={(row) => String(row.rowNumber)} /></div> : null}{batch.errors.length ? <div className="border-t border-red-100 bg-red-50/30"><div className="px-5 pt-5"><p className="text-sm font-semibold text-red-900">Blocking validation errors</p>{batch.errors.some((item) => item.code === "DUPLICATE_OPERATION") ? <p className="mt-1 text-xs text-red-800">Duplicate inventory operation detected in the uploaded file.</p> : null}</div><Table columns={errorColumns} rows={batch.errors} rowKey={(item) => `${item.rowNumber}-${item.field}-${item.code}`} /></div> : <div className="border-t border-green-100 bg-green-50 px-5 py-4 text-sm font-medium text-green-800">All rows passed backend validation.</div>}</section>;
}

function OperationBadge({ type }: { type: InventoryImportPreviewRow["type"] }) { return <Badge tone={type === "ADD" ? "active" : type === "TRANSFER" ? "maroon" : "inactive"}>{type}</Badge>; }
function Metric({ label, value, tone }: { label: string; value: number; tone?: "green" | "red" }) { return <div className="bg-white p-5"><p className="text-xs font-medium uppercase tracking-wide text-neutral-500">{label}</p><p className={`mt-2 text-2xl font-semibold ${tone === "green" ? "text-green-700" : tone === "red" ? "text-red-700" : "text-neutral-950"}`}>{value}</p></div>; }
function ResultDetail({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) { return <div><dt className="text-xs font-medium uppercase tracking-wide text-green-700">{label}</dt><dd className={`mt-1 ${mono ? "break-all font-mono text-xs" : "font-semibold"}`}>{value}</dd></div>; }
function formatBytes(bytes: number) { return bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KiB` : `${(bytes / (1024 * 1024)).toFixed(1)} MiB`; }
function UploadIcon() { return <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5"/><path d="M5 13v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5"/></svg>; }
