import type {
  InventoryAdjustmentPayload,
  InventoryAdjustmentResult,
  InventoryDetail,
  InventoryImportResult,
  InventoryImportValidationData,
  InventoryImportValidationError,
  InventoryListData,
  InventoryListParams,
  InventoryTransactionListData,
  InventoryTransactionListParams,
} from "@/features/inventory/inventory.types";
import { api, ApiError } from "@/lib/api";
import { buildQueryString } from "@/lib/utils";
import type { ApiResponse } from "@/types/api";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isNonNegativeNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isInteger(value) && value >= 0;

const parseValidationError = (
  value: unknown,
): InventoryImportValidationError | null => {
  if (
    !isRecord(value) ||
    !isNonNegativeNumber(value.row) ||
    typeof value.field !== "string" ||
    typeof value.message !== "string"
  ) {
    return null;
  }

  if (value.sku !== undefined && typeof value.sku !== "string") {
    return null;
  }

  return {
    row: value.row,
    ...(typeof value.sku === "string" ? { sku: value.sku } : {}),
    field: value.field,
    message: value.message,
  };
};

export function extractInventoryImportValidation(
  error: unknown,
): InventoryImportValidationData | null {
  if (!(error instanceof ApiError) || !isRecord(error.details)) {
    return null;
  }

  const data = error.details.data;

  if (
    !isRecord(data) ||
    !isNonNegativeNumber(data.totalRows) ||
    !isNonNegativeNumber(data.validRows) ||
    !isNonNegativeNumber(data.invalidRows) ||
    !Array.isArray(data.errors)
  ) {
    return null;
  }

  const errors = data.errors.map(parseValidationError);

  if (errors.some((item) => item === null)) {
    return null;
  }

  return {
    totalRows: data.totalRows,
    validRows: data.validRows,
    invalidRows: data.invalidRows,
    errors: errors as InventoryImportValidationError[],
  };
}

export const inventoryApi = {
  async list(params: InventoryListParams = {}): Promise<InventoryListData> {
    const query = buildQueryString({
      page: params.page,
      limit: params.limit,
      search: params.search,
      sku: params.sku,
      product: params.product,
      category: params.category,
      stockStatus: params.stockStatus,
    });
    const response = await api.get<ApiResponse<InventoryListData>>(
      `/inventory${query}`,
    );
    return response.data;
  },

  async getByVariantId(variantId: string): Promise<InventoryDetail> {
    const response = await api.get<ApiResponse<InventoryDetail>>(
      `/inventory/${encodeURIComponent(variantId)}`,
    );
    return response.data;
  },

  async getBySku(sku: string): Promise<InventoryDetail> {
    const response = await api.get<ApiResponse<InventoryDetail>>(
      `/inventory/sku/${encodeURIComponent(sku)}`,
    );
    return response.data;
  },

  async adjust(
    payload: InventoryAdjustmentPayload,
  ): Promise<InventoryAdjustmentResult> {
    const response = await api.post<ApiResponse<InventoryAdjustmentResult>>(
      "/inventory/adjust",
      payload,
    );
    return response.data;
  },

  async listTransactions(
    variantId: string,
    params: InventoryTransactionListParams = {},
  ): Promise<InventoryTransactionListData> {
    const query = buildQueryString({
      page: params.page,
      limit: params.limit,
      type: params.type,
      source: params.source,
    });
    const response = await api.get<ApiResponse<InventoryTransactionListData>>(
      `/inventory/${encodeURIComponent(variantId)}/transactions${query}`,
    );
    return response.data;
  },

  async importAdjustments(file: File): Promise<InventoryImportResult> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post<ApiResponse<InventoryImportResult>>(
      "/inventory/import-adjustments",
      formData,
    );
    return response.data;
  },
};
