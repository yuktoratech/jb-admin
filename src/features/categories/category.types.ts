import type { Pagination } from "@/types/api";

export type CategoryStatus = "active" | "inactive";

export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  status: CategoryStatus;
  createdAt: string;
  updatedAt: string;
}

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
