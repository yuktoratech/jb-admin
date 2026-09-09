import { api } from "@/lib/api";
import { buildQueryString } from "@/lib/utils";
import type { ApiResponse } from "@/types/api";
import type { AdminOrderAdjustmentPayload, CancelOrderPayload, Order, OrderListData, OrderListParams, OrderMetrics } from "./order.types";

const listOrders = async (params: OrderListParams = {}) => (await api.get<ApiResponse<OrderListData>>(`/orders${buildQueryString(params)}`)).data;

export const orderApi = {
  list: listOrders,
  metrics: async (): Promise<OrderMetrics> => {
    const [all, pendingAdmin, confirmed, cancelled] = await Promise.all([
      listOrders({ page: 1, limit: 1 }),
      listOrders({ page: 1, limit: 1, status: "PENDING_ADMIN" }),
      listOrders({ page: 1, limit: 1, status: "CONFIRMED" }),
      listOrders({ page: 1, limit: 1, status: "CANCELLED" }),
    ]);
    return {
      total: all.pagination.total,
      pendingAdmin: pendingAdmin.pagination.total,
      confirmed: confirmed.pagination.total,
      cancelled: cancelled.pagination.total,
    };
  },
  get: async (id: string) => (await api.get<ApiResponse<Order>>(`/orders/${encodeURIComponent(id)}`)).data,
  adjust: async (id: string, payload: AdminOrderAdjustmentPayload) => (await api.patch<ApiResponse<Order>>(`/orders/${encodeURIComponent(id)}/admin-adjust`, payload)).data,
  confirm: async (id: string) => (await api.post<ApiResponse<Order>>(`/orders/${encodeURIComponent(id)}/admin-confirm`)).data,
  cancel: async (id: string, payload: CancelOrderPayload = {}) => (await api.post<ApiResponse<Order>>(`/orders/${encodeURIComponent(id)}/admin-cancel`, payload)).data,
};
