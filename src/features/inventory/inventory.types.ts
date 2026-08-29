import type { CatalogStatus } from "@/features/products/product.types";
import type { Pagination } from "@/types/api";

export type InventoryStockStatus = "in_stock" | "out_of_stock";

export type InventoryAdjustmentType = "ADD" | "REMOVE" | "TRANSFER";

export type InventoryTransactionType =
  | InventoryAdjustmentType
  | "ORDER_RESERVE"
  | "ORDER_RELEASE"
  | "ORDER_DEDUCT"
  | "MANUAL_ADJUSTMENT";

export type InventoryTransactionSource =
  | "admin"
  | "import"
  | "order"
  | "system";

export interface InventoryShelf {
  shelf: string;
  quantity: number;
}

export interface InventoryListItem {
  inventoryId: string | null;
  variantId: string;
  productId: string;
  categoryId: string;
  sku: string;
  productName: string;
  productCode?: string;
  color: string;
  sizeSet: string;
  variantStatus: CatalogStatus;
  totalQuantity: number;
  availableQuantity: number;
  reservedQuantity: number;
  shelves: InventoryShelf[];
  status: InventoryStockStatus;
  updatedAt: string;
}

export interface InventoryListData {
  inventory: InventoryListItem[];
  pagination: Pagination;
}

export interface InventoryListParams {
  page?: number;
  limit?: number;
  search?: string;
  sku?: string;
  product?: string;
  category?: string;
  stockStatus?: InventoryStockStatus | "";
}

export interface InventoryProductCategory {
  _id: string;
  name: string;
  slug: string;
  status: CatalogStatus;
}

export interface InventoryProductSummary {
  _id: string;
  productName: string;
  productCode?: string;
  title: string;
  category: InventoryProductCategory;
  status: CatalogStatus;
}

export interface InventoryRecord {
  inventoryId: string;
  variantId: string;
  sku: string;
  availableQuantity: number;
  reservedQuantity: number;
  totalQuantity: number;
  shelves: InventoryShelf[];
  status: InventoryStockStatus;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryDetail extends InventoryRecord {
  product: InventoryProductSummary;
  color: string;
  sizeSet: string;
  variantStatus: CatalogStatus;
}

interface InventoryAdjustmentBase {
  sku: string;
  quantity: number;
  shelf: string;
  referenceId?: string;
  note?: string;
}

export type InventoryAdjustmentPayload =
  | (InventoryAdjustmentBase & {
      type: "ADD" | "REMOVE";
      toShelf?: never;
    })
  | (InventoryAdjustmentBase & {
      type: "TRANSFER";
      toShelf: string;
    });

export interface InventoryTransactionActor {
  _id: string;
  name: string;
  email: string;
  role: string;
}

export interface InventoryTransaction {
  _id: string;
  inventory: string;
  variant: string;
  sku: string;
  type: InventoryTransactionType;
  quantity: number;
  fromShelf?: string;
  toShelf?: string;
  previousQuantity?: number;
  newQuantity?: number;
  source: InventoryTransactionSource;
  referenceId?: string;
  performedBy?: string | InventoryTransactionActor | null;
  note?: string;
  createdAt: string;
}

export interface InventoryAdjustmentResult {
  inventory: InventoryRecord;
  transaction: InventoryTransaction;
}

export interface InventoryTransactionListParams {
  page?: number;
  limit?: number;
  type?: InventoryTransactionType | "";
  source?: InventoryTransactionSource | "";
}

export interface InventoryTransactionListData {
  transactions: InventoryTransaction[];
  pagination: Pagination;
}

export interface InventoryImportResult {
  totalRows: number;
  processedRows: number;
  addCount: number;
  removeCount: number;
  transferCount: number;
  referenceId: string;
}

export interface InventoryImportValidationError {
  row: number;
  sku?: string;
  field: string;
  message: string;
}

export interface InventoryImportValidationData {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  errors: InventoryImportValidationError[];
}
