import { beforeEach, describe, expect, it, vi } from "vitest";

import { api } from "@/lib/api";
import { orderApi } from "@/features/orders/order.api";

vi.mock("@/lib/api", () => ({
  api: { get: vi.fn() },
}));

describe("orderApi.metrics", () => {
  beforeEach(() => {
    vi.mocked(api.get).mockReset();
  });

  it("uses authoritative pagination totals for every card", async () => {
    vi.mocked(api.get).mockImplementation(async (path) => {
      const url = String(path);
      const total = url.includes("PENDING_ADMIN") ? 7 : url.includes("CONFIRMED") ? 19 : url.includes("CANCELLED") ? 3 : 31;
      return { data: { orders: [], pagination: { page: 1, limit: 1, total, totalPages: total } } } as never;
    });

    await expect(orderApi.metrics()).resolves.toEqual({
      total: 31,
      pendingAdmin: 7,
      confirmed: 19,
      cancelled: 3,
    });
    expect(api.get).toHaveBeenCalledTimes(4);
  });
});
