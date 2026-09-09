import type { Order } from "@/features/orders/order.types";

export interface DashboardInventoryItem {
  inventoryId: string | null;
  variantId: string;
  productId: string;
  categoryId: string;
  sku: string;
  productName: string;
  productCode?: string;
  colour: { name: string } | string | null;
  sizeSet: { label: string } | string;
  variantStatus: "active" | "inactive";
  totalQuantity: number;
  availableQuantity: number;
  status: "in_stock" | "out_of_stock";
  updatedAt: string | null;
}

export interface DashboardTotals {
  wholesalers: number;
  retailers: number;
  products: number;
  skus: number;
  inStockSkus: number;
  outOfStockSkus: number;
  orders: number;
  pendingAdminOrders: number;
}

export interface DashboardOverview {
  totals: DashboardTotals;
  pendingOrders: Order[];
  recentOrders: Order[];
  inventoryAttention: DashboardInventoryItem[];
}
