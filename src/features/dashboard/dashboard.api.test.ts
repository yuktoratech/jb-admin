import { beforeEach, describe, expect, it, vi } from "vitest";

import { dashboardApi } from "@/features/dashboard/dashboard.api";
import { api } from "@/lib/api";

vi.mock("@/lib/api", () => ({
  api: { get: vi.fn() },
}));

const response = (collection: string, total: number, items: unknown[] = []) => ({
  data: {
    [collection]: items,
    pagination: { page: 1, limit: 5, total, totalPages: Math.ceil(total / 5) },
  },
});

describe("dashboardApi.getOverview", () => {
  beforeEach(() => {
    vi.mocked(api.get).mockReset();
  });

  it("builds operational totals and queues from existing paginated APIs", async () => {
    const recentOrder = { _id: "recent" };
    const pendingOrder = { _id: "pending" };
    const unavailableSku = { variantId: "variant-1", sku: "sku-1" };

    vi.mocked(api.get).mockImplementation(async (path) => {
      const url = String(path);
      if (url.startsWith("/wholesalers")) return response("wholesalers", 4) as never;
      if (url.startsWith("/retailers")) return response("retailers", 12) as never;
      if (url.startsWith("/products")) return response("products", 21) as never;
      if (url.includes("stockStatus=in_stock")) return response("inventory", 18) as never;
      if (url.includes("stockStatus=out_of_stock")) return response("inventory", 5, [unavailableSku]) as never;
      if (url === "/inventory?page=1&limit=1") return response("inventory", 23) as never;
      if (url.includes("status=PENDING_ADMIN")) return response("orders", 6, [pendingOrder]) as never;
      if (url.startsWith("/orders")) return response("orders", 40, [recentOrder]) as never;
      throw new Error(`Unexpected request: ${url}`);
    });

    const overview = await dashboardApi.getOverview();

    expect(overview.totals).toEqual({
      wholesalers: 4,
      retailers: 12,
      products: 21,
      skus: 23,
      inStockSkus: 18,
      outOfStockSkus: 5,
      orders: 40,
      pendingAdminOrders: 6,
    });
    expect(overview.recentOrders).toEqual([recentOrder]);
    expect(overview.pendingOrders).toEqual([pendingOrder]);
    expect(overview.inventoryAttention).toEqual([unavailableSku]);
    expect(api.get).toHaveBeenCalledTimes(8);
  });
});
