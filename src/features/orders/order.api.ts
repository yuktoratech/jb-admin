import { api } from "@/lib/api";
import { buildQueryString } from "@/lib/utils";
import type { ApiResponse } from "@/types/api";
import type { AdminOrderAdjustmentPayload, CancelOrderPayload, Order, OrderListData, OrderListParams } from "./order.types";

export const orderApi = {
  list: async (params: OrderListParams = {}) => (await api.get<ApiResponse<OrderListData>>(`/orders${buildQueryString(params)}`)).data,
  get: async (id: string) => (await api.get<ApiResponse<Order>>(`/orders/${encodeURIComponent(id)}`)).data,
  adjust: async (id: string, payload: AdminOrderAdjustmentPayload) => (await api.patch<ApiResponse<Order>>(`/orders/${encodeURIComponent(id)}/admin-adjust`, payload)).data,
  confirm: async (id: string) => (await api.post<ApiResponse<Order>>(`/orders/${encodeURIComponent(id)}/admin-confirm`)).data,
  cancel: async (id: string, payload: CancelOrderPayload = {}) => (await api.post<ApiResponse<Order>>(`/orders/${encodeURIComponent(id)}/admin-cancel`, payload)).data,
};
