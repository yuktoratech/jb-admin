import type { CategoryListData } from "@/features/categories/category.types";
import type { DashboardInventoryItem, DashboardOverview } from "@/features/dashboard/dashboard.types";
import type { ProductListData } from "@/features/products/product.types";
import { api } from "@/lib/api";
import type { ApiResponse, Pagination } from "@/types/api";

interface DashboardInventoryListData {
  inventory: DashboardInventoryItem[];
  pagination: Pagination;
}

export const dashboardApi = {
  async getOverview(signal?: AbortSignal): Promise<DashboardOverview> {
    const [categories, products, allInventory, inStockInventory, outOfStockInventory] =
      await Promise.all([
        api.get<ApiResponse<CategoryListData>>("/categories?page=1&limit=1", { signal }),
        api.get<ApiResponse<ProductListData>>("/products?page=1&limit=5", { signal }),
        api.get<ApiResponse<DashboardInventoryListData>>("/inventory?page=1&limit=1", { signal }),
        api.get<ApiResponse<DashboardInventoryListData>>(
          "/inventory?page=1&limit=1&stockStatus=in_stock",
          { signal },
        ),
        api.get<ApiResponse<DashboardInventoryListData>>(
          "/inventory?page=1&limit=5&stockStatus=out_of_stock",
          { signal },
        ),
      ]);

    return {
      totals: {
        categories: categories.data.pagination.total,
        products: products.data.pagination.total,
        skus: allInventory.data.pagination.total,
        inStockSkus: inStockInventory.data.pagination.total,
        outOfStockSkus: outOfStockInventory.data.pagination.total,
      },
      recentProducts: products.data.products,
      inventoryAttention: outOfStockInventory.data.inventory,
    };
  },
};
