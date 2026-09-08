import type { Category, CatalogStatus } from "@/features/catalog/catalog.types";
import type { Pagination } from "@/types/api";
export type { Category } from "@/features/catalog/catalog.types";
export type CategoryStatus = CatalogStatus;

export interface CategoryListData {
  categories: Category[];
  pagination: Pagination;
}

export interface CategoryListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: CategoryStatus | "";
}

export interface CategoryPayload {
  name: string;
  description?: string;
  status?: CategoryStatus;
}
