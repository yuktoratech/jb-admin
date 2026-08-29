import type {
  CatalogStatus,
  ProductDetailData,
  ProductListData,
  ProductListParams,
  ProductPayload,
  ProductUpdatePayload,
  ProductVariant,
  VariantPayload,
} from "@/features/products/product.types";
import { api } from "@/lib/api";
import { buildQueryString } from "@/lib/utils";
import type { ApiResponse } from "@/types/api";

export const productApi = {
  async list(params: ProductListParams = {}): Promise<ProductListData> {
    const response = await api.get<ApiResponse<ProductListData>>(`/products${buildQueryString(params)}`);
    return response.data;
  },

  async get(id: string): Promise<ProductDetailData> {
    const response = await api.get<ApiResponse<ProductDetailData>>(`/products/${encodeURIComponent(id)}`);
    return response.data;
  },

  async create(payload: ProductPayload): Promise<ProductDetailData> {
    const response = await api.post<ApiResponse<ProductDetailData>>("/products", payload);
    return response.data;
  },

  async update(id: string, payload: ProductUpdatePayload): Promise<ProductDetailData> {
    const response = await api.patch<ApiResponse<ProductDetailData>>(`/products/${encodeURIComponent(id)}`, payload);
    return response.data;
  },

  async deactivate(id: string): Promise<ProductDetailData> {
    const response = await api.delete<ApiResponse<ProductDetailData>>(`/products/${encodeURIComponent(id)}`);
    return response.data;
  },

  async listVariants(productId: string, status?: CatalogStatus): Promise<{ product: Pick<ProductDetailData["product"], "_id" | "productName" | "productCode" | "title" | "status">; variants: ProductDetailData["variants"] }> {
    const response = await api.get<ApiResponse<{ product: Pick<ProductDetailData["product"], "_id" | "productName" | "productCode" | "title" | "status">; variants: ProductDetailData["variants"] }>>(
      `/products/${encodeURIComponent(productId)}/variants${buildQueryString({ status })}`,
    );
    return response.data;
  },

  async createVariant(productId: string, payload: VariantPayload): Promise<ProductVariant> {
    const response = await api.post<ApiResponse<ProductVariant>>(`/products/${encodeURIComponent(productId)}/variants`, payload);
    return response.data;
  },

  async updateVariant(variantId: string, payload: Partial<VariantPayload>): Promise<ProductVariant> {
    const response = await api.patch<ApiResponse<ProductVariant>>(`/variants/${encodeURIComponent(variantId)}`, payload);
    return response.data;
  },

  async deactivateVariant(variantId: string): Promise<ProductVariant> {
    const response = await api.delete<ApiResponse<ProductVariant>>(`/variants/${encodeURIComponent(variantId)}`);
    return response.data;
  },
};
