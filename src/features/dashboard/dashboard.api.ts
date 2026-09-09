import type { RetailerListData, WholesalerListData } from "@/features/accounts/account.types";
import type { DashboardInventoryItem, DashboardOverview } from "@/features/dashboard/dashboard.types";
import type { OrderListData } from "@/features/orders/order.types";
import type { ProductListData } from "@/features/products/product.types";
import { api } from "@/lib/api";
import type { ApiResponse, Pagination } from "@/types/api";

interface DashboardInventoryListData {
  inventory: DashboardInventoryItem[];
  pagination: Pagination;
}

export const dashboardApi = {
  async getOverview(signal?: AbortSignal): Promise<DashboardOverview> {
    const [wholesalers, retailers, products, allInventory, inStockInventory, outOfStockInventory, orders, pendingOrders] =
      await Promise.all([
        api.get<ApiResponse<WholesalerListData>>("/wholesalers?page=1&limit=1", { signal }),
        api.get<ApiResponse<RetailerListData>>("/retailers?page=1&limit=1", { signal }),
        api.get<ApiResponse<ProductListData>>("/products?page=1&limit=1", { signal }),
        api.get<ApiResponse<DashboardInventoryListData>>("/inventory?page=1&limit=1", { signal }),
        api.get<ApiResponse<DashboardInventoryListData>>(
          "/inventory?page=1&limit=1&stockStatus=in_stock",
          { signal },
        ),
        api.get<ApiResponse<DashboardInventoryListData>>(
          "/inventory?page=1&limit=5&stockStatus=out_of_stock",
          { signal },
        ),
        api.get<ApiResponse<OrderListData>>("/orders?page=1&limit=5", { signal }),
        api.get<ApiResponse<OrderListData>>("/orders?page=1&limit=5&status=PENDING_ADMIN", { signal }),
      ]);

    return {
      totals: {
        wholesalers: wholesalers.data.pagination.total,
        retailers: retailers.data.pagination.total,
        products: products.data.pagination.total,
        skus: allInventory.data.pagination.total,
        inStockSkus: inStockInventory.data.pagination.total,
        outOfStockSkus: outOfStockInventory.data.pagination.total,
        orders: orders.data.pagination.total,
        pendingAdminOrders: pendingOrders.data.pagination.total,
      },
      pendingOrders: pendingOrders.data.orders,
      recentOrders: orders.data.orders,
      inventoryAttention: outOfStockInventory.data.inventory,
    };
  },
};
