import type { Category, CategoryListData, CategoryListParams, CategoryPayload } from "@/features/categories/category.types";
import { api } from "@/lib/api";
import { buildQueryString } from "@/lib/utils";
import type { ApiResponse } from "@/types/api";

export const categoryApi = {
  async list(params: CategoryListParams = {}): Promise<CategoryListData> {
    const response = await api.get<ApiResponse<CategoryListData>>(`/categories${buildQueryString(params)}`);
    return response.data;
  },

  async get(id: string): Promise<Category> {
    const response = await api.get<ApiResponse<Category>>(`/categories/${encodeURIComponent(id)}`);
    return response.data;
  },

  async create(payload: CategoryPayload): Promise<Category> {
    const response = await api.post<ApiResponse<Category>>("/categories", payload);
    return response.data;
  },

  async update(id: string, payload: Partial<CategoryPayload>): Promise<Category> {
    const response = await api.patch<ApiResponse<Category>>(`/categories/${encodeURIComponent(id)}`, payload);
    return response.data;
  },

  async deactivate(id: string): Promise<Category> {
    const response = await api.delete<ApiResponse<Category>>(`/categories/${encodeURIComponent(id)}`);
    return response.data;
  },
};
