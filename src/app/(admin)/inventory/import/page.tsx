import Link from "next/link";
import { InventoryImportFlow } from "@/features/inventory/InventoryImportFlow";

export default function InventoryImportPage() {
  return <div className="mx-auto w-full max-w-[1600px]"><div className="mb-6"><Link href="/inventory" className="text-xs font-semibold text-[#7A1F2B] hover:underline">Inventory</Link><h1 className="mt-2 text-2xl font-semibold tracking-tight text-neutral-950">Stock Upload</h1><p className="mt-1.5 max-w-3xl text-sm leading-6 text-neutral-500">Upload, verify, and atomically apply ADD, REMOVE, and TRANSFER operations from one XLSX workbook.</p></div><InventoryImportFlow /></div>;
}
