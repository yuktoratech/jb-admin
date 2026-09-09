import { describe, expect, it, vi } from "vitest";

import { collectAllPages } from "@/lib/pagination";

describe("collectAllPages", () => {
  it("collects every server page in order", async () => {
    const fetchPage = vi.fn(async (page: number, limit: number) => ({
      records: [`record-${page}-a`, `record-${page}-b`],
      pagination: { page, limit, total: 6, totalPages: 3 },
    }));

    const records = await collectAllPages({
      fetchPage,
      getItems: (data) => data.records,
      pageSize: 2,
    });

    expect(records).toEqual([
      "record-1-a", "record-1-b",
      "record-2-a", "record-2-b",
      "record-3-a", "record-3-b",
    ]);
    expect(fetchPage.mock.calls).toEqual([[1, 2], [2, 2], [3, 2]]);
  });

  it("does not make phantom requests for an empty result", async () => {
    const fetchPage = vi.fn(async () => ({
      records: [] as string[],
      pagination: { page: 1, limit: 100, total: 0, totalPages: 0 },
    }));

    await expect(collectAllPages({ fetchPage, getItems: (data) => data.records })).resolves.toEqual([]);
    expect(fetchPage).toHaveBeenCalledTimes(1);
  });
});
