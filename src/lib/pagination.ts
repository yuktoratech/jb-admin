import type { Pagination } from "@/types/api";

interface PaginatedData {
  pagination: Pagination;
}

interface CollectAllPagesOptions<T, TData extends PaginatedData> {
  fetchPage: (page: number, limit: number) => Promise<TData>;
  getItems: (data: TData) => T[];
  pageSize?: number;
}

/**
 * Loads every page for controls whose option list must be complete.
 * List screens should keep using server pagination instead of this helper.
 */
export async function collectAllPages<T, TData extends PaginatedData>({
  fetchPage,
  getItems,
  pageSize = 100,
}: CollectAllPagesOptions<T, TData>): Promise<T[]> {
  const firstPage = await fetchPage(1, pageSize);
  const items = [...getItems(firstPage)];

  for (let page = 2; page <= firstPage.pagination.totalPages; page += 1) {
    const data = await fetchPage(page, pageSize);
    items.push(...getItems(data));
  }

  return items;
}
