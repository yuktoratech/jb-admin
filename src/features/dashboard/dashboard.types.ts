import type { Product } from "@/features/products/product.types";

export interface DashboardInventoryItem {
  inventoryId: string | null;
  variantId: string;
  productId: string;
  categoryId: string;
  sku: string;
  productName: string;
  productCode?: string;
  color: string;
  sizeSet: string;
  variantStatus: "active" | "inactive";
  totalQuantity: number;
  availableQuantity: number;
  reservedQuantity: number;
  status: "in_stock" | "out_of_stock";
  updatedAt: string | null;
}

export interface DashboardTotals {
  categories: number;
  products: number;
  skus: number;
  inStockSkus: number;
  outOfStockSkus: number;
}

export interface DashboardOverview {
  totals: DashboardTotals;
  recentProducts: Product[];
  inventoryAttention: DashboardInventoryItem[];
}
