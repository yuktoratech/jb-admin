import { api } from "@/lib/api";
import { buildQueryString } from "@/lib/utils";
import type { ApiResponse } from "@/types/api";
import type { AccountListParams, CreatedWholesaler, ManagedAccountPayload, ManagedAccountUpdatePayload, Retailer, RetailerListData, RetailerListParams, Wholesaler, WholesalerListData } from "./account.types";

export const wholesalerApi = {
  list: async (params: AccountListParams = {}) => (await api.get<ApiResponse<WholesalerListData>>(`/wholesalers${buildQueryString(params)}`)).data,
  get: async (id: string) => (await api.get<ApiResponse<Wholesaler>>(`/wholesalers/${encodeURIComponent(id)}`)).data,
  create: async (payload: ManagedAccountPayload) => (await api.post<ApiResponse<CreatedWholesaler>>("/wholesalers", payload)).data,
  update: async (id: string, payload: ManagedAccountUpdatePayload) => (await api.patch<ApiResponse<Wholesaler>>(`/wholesalers/${encodeURIComponent(id)}`, payload)).data,
  updateStatus: async (id: string, status: "active" | "inactive") => (await api.patch<ApiResponse<Wholesaler>>(`/wholesalers/${encodeURIComponent(id)}/status`, { status })).data,
};
export const retailerApi = {
  list: async (params: RetailerListParams = {}) => (await api.get<ApiResponse<RetailerListData>>(`/retailers${buildQueryString(params)}`)).data,
  get: async (id: string) => (await api.get<ApiResponse<Retailer>>(`/retailers/${encodeURIComponent(id)}`)).data,
};
