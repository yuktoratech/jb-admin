"use client";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Table, type TableColumn } from "@/components/ui/Table";
import { INVENTORY_IMPORT_COLUMNS, inventoryApi } from "./inventory.api";
import type { InventoryImportBatch, InventoryImportPreviewRow, InventoryImportValidationError } from "./inventory.types";
import { getApiErrorMessage } from "@/lib/api";

export function InventoryImportModal({ isOpen, onClose, onImported }: { isOpen: boolean; onClose: () => void; onImported: () => void | Promise<void> }) {
  const [file,setFile]=useState<File|null>(null); const [batch,setBatch]=useState<InventoryImportBatch|null>(null); const [error,setError]=useState<string|null>(null); const [busy,setBusy]=useState(false);
  const preview=async()=>{if(!file)return;setBusy(true);setError(null);try{setBatch(await inventoryApi.previewImport(file));}catch(e){setError(getApiErrorMessage(e,"Unable to preview inventory workbook."));}finally{setBusy(false)}};
  const apply=async()=>{if(!batch||batch.status!=="VALID")return;setBusy(true);setError(null);try{setBatch(await inventoryApi.applyImport(batch.id));await onImported();}catch(e){setError(getApiErrorMessage(e,"Unable to apply inventory batch. Preview it again before retrying."));}finally{setBusy(false)}};
  const rows:Array<TableColumn<InventoryImportPreviewRow>>=[{key:"row",header:"Row",render:r=>r.rowNumber},{key:"sku",header:"SKU",render:r=><code>{r.sku}</code>},{key:"type",header:"Type",render:r=>r.type},{key:"quantity",header:"Quantity",render:r=>r.quantity},{key:"shelf",header:"Shelf",render:r=>r.shelf},{key:"toShelf",header:"To Shelf",render:r=>r.toShelf||"—"},{key:"resolution",header:"Resolution",render:r=>r.resolution}];
  const errors:Array<TableColumn<InventoryImportValidationError>>=[{key:"row",header:"Row",render:r=>r.rowNumber},{key:"sku",header:"SKU",render:r=>r.sku||"—"},{key:"field",header:"Field",render:r=>r.field},{key:"code",header:"Code",render:r=>r.code},{key:"message",header:"Message",render:r=>r.message}];
  return <Modal isOpen={isOpen} onClose={onClose} closeOnBackdrop={!busy} title="Import Inventory" description="Upload, review the server-verified preview, then submit a valid batch." size="lg" footer={<><Button variant="secondary" disabled={busy} onClick={onClose}>Close</Button>{!batch?<Button disabled={!file} isLoading={busy} onClick={()=>void preview()}>Preview</Button>:batch.status==="VALID"?<Button isLoading={busy} onClick={()=>void apply()}>Submit verified batch</Button>:null}</>}><div className="space-y-4"><div className="flex flex-wrap gap-2">{INVENTORY_IMPORT_COLUMNS.map(c=><code key={c} className="border bg-neutral-50 px-2 py-1 text-xs">{c}</code>)}</div>{!batch?<input type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={e=>setFile(e.target.files?.[0]??null)} />:<><p className="text-sm">Status: <strong>{batch.status}</strong> · Total: {batch.totalRows} · Valid: {batch.validRows} · Invalid: {batch.invalidRows}</p>{batch.rows.length?<Table columns={rows} rows={batch.rows} rowKey={r=>String(r.rowNumber)}/>:null}{batch.errors.length?<Table columns={errors} rows={batch.errors} rowKey={r=>`${r.rowNumber}-${r.field}-${r.code}`}/>:null}</>}{error?<div className="bg-red-50 p-3 text-sm text-red-800">{error}</div>:null}</div></Modal>;
}
