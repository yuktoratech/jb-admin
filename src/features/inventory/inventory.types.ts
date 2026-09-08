import type { Category, CatalogStatus, Colour, SizeSet } from "@/features/catalog/catalog.types";
import type { Product, ProductColour } from "@/features/products/product.types";
import type { Pagination } from "@/types/api";
export type InventoryStockStatus = "in_stock" | "out_of_stock";
export type InventoryTransactionType = "ADD" | "REMOVE" | "TRANSFER" | "ORDER_DEDUCT" | "MANUAL_ADJUSTMENT";
export type InventoryTransactionSource = "admin" | "import" | "order" | "system";
export interface InventoryShelf { shelf: string; quantity: number; }
export interface InventoryListItem { inventoryId: string | null; variantId: string; productId: string; productColourId?: string; colourId?: string; sizeSetId?: string; categoryId: string; sku: string; productName: string; productCode?: string; productColour?: ProductColour; colour: Colour | string | null; sizeSet: SizeSet | string; variantStatus: CatalogStatus; totalQuantity: number; availableQuantity: number; shelves: InventoryShelf[]; status: InventoryStockStatus; updatedAt: string | null; }
export interface InventoryListData { inventory: InventoryListItem[]; pagination: Pagination; }
export interface InventoryListParams { page?: number; limit?: number; search?: string; sku?: string; product?: string; category?: string; stockStatus?: InventoryStockStatus | ""; }
export interface InventoryRecord { inventoryId: string; variantId: string; sku: string; availableQuantity: number; totalQuantity: number; shelves: InventoryShelf[]; status: InventoryStockStatus; createdAt: string; updatedAt: string; }
export interface InventoryDetail extends InventoryRecord { product: Product & { category: Category }; productColour: ProductColour | null; colour: Colour | string | null; sizeSet: SizeSet | string; variantStatus: CatalogStatus; }
export interface InventoryTransactionActor { _id: string; name: string; email: string; role: string; }
export interface InventoryTransaction { _id: string; inventory: string; variant: string; sku: string; type: InventoryTransactionType; quantity: number; fromShelf?: string; toShelf?: string; previousQuantity?: number; newQuantity?: number; source: InventoryTransactionSource; referenceId?: string; performedBy?: string | InventoryTransactionActor | null; note?: string; createdAt: string; }
export interface InventoryTransactionListParams { page?: number; limit?: number; type?: InventoryTransactionType | ""; source?: InventoryTransactionSource | ""; }
export interface InventoryTransactionListData { transactions: InventoryTransaction[]; pagination: Pagination; }
export type InventoryImportBatchStatus = "VALID" | "INVALID" | "APPLIED";
export type InventoryImportResolution = "EXISTING_SKU" | "CREATE_SKU";
export interface InventoryImportPreviewRow { rowNumber: number; sku: string; type: "ADD" | "REMOVE" | "TRANSFER"; quantity: number; shelf: string; toShelf?: string; resolution: InventoryImportResolution; skuId?: string; productId: string; productColourId: string; sizeSetId: string; productName: string; productCode: string; colourName: string; sizeSetLabel: string; sizes: string[]; pieceCount: number; }
export interface InventoryImportValidationError { rowNumber: number; sku?: string; field: string; code: string; message: string; }
export interface InventoryImportBatch { id: string; status: InventoryImportBatchStatus; totalRows: number; validRows: number; invalidRows: number; rows: InventoryImportPreviewRow[]; errors: InventoryImportValidationError[]; appliedAt?: string; }
