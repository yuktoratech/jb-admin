import { api } from "@/lib/api";
import { buildQueryString } from "@/lib/utils";
import type { ApiResponse } from "@/types/api";
import type { InventoryDetail, InventoryImportBatch, InventoryListData, InventoryListParams, InventoryTransactionListData, InventoryTransactionListParams } from "./inventory.types";
export const INVENTORY_IMPORT_COLUMNS = ["SKU", "TYPE", "QUANTITY", "SHELF", "TO SHELF"] as const;
export const inventoryApi = {
  list: async (params: InventoryListParams = {}) => (await api.get<ApiResponse<InventoryListData>>(`/inventory${buildQueryString(params)}`)).data,
  getByVariantId: async (id: string) => (await api.get<ApiResponse<InventoryDetail>>(`/inventory/${encodeURIComponent(id)}`)).data,
  getBySku: async (sku: string) => (await api.get<ApiResponse<InventoryDetail>>(`/inventory/sku/${encodeURIComponent(sku)}`)).data,
  listTransactions: async (id: string, params: InventoryTransactionListParams = {}) => (await api.get<ApiResponse<InventoryTransactionListData>>(`/inventory/${encodeURIComponent(id)}/transactions${buildQueryString(params)}`)).data,
  previewImport: async (file: File) => { const body = new FormData(); body.append("file", file); return (await api.post<ApiResponse<InventoryImportBatch>>("/inventory/imports/preview", body)).data; },
  applyImport: async (batchId: string) => (await api.post<ApiResponse<InventoryImportBatch>>(`/inventory/imports/${encodeURIComponent(batchId)}/apply`)).data,
};
