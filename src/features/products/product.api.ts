import { api } from "@/lib/api";
import { buildQueryString } from "@/lib/utils";
import type { ApiResponse } from "@/types/api";
import type {
  CatalogStatus,
  CreateVariantPayload,
  Product,
  ProductColour,
  ProductColourListData,
  ProductColourListParams,
  ProductColourPayload,
  ProductDetailData,
  ProductImportBatch,
  ProductImportResult,
  ProductListData,
  ProductListParams,
  ProductPayload,
  ProductUpdatePayload,
  ProductVariant,
  UpdateVariantPayload,
} from "./product.types";
export const productApi = {
  list: async (params: ProductListParams = {}) =>
    (
      await api.get<ApiResponse<ProductListData>>(
        `/products${buildQueryString(params)}`,
      )
    ).data,
  get: async (id: string) =>
    (
      await api.get<ApiResponse<ProductDetailData>>(
        `/products/${encodeURIComponent(id)}`,
      )
    ).data,
  create: async (payload: ProductPayload) =>
    (await api.post<ApiResponse<ProductDetailData>>("/products", payload)).data,
  update: async (id: string, payload: ProductUpdatePayload) =>
    (
      await api.patch<ApiResponse<ProductDetailData>>(
        `/products/${encodeURIComponent(id)}`,
        payload,
      )
    ).data,
  deactivate: async (id: string) =>
    (
      await api.delete<ApiResponse<ProductDetailData>>(
        `/products/${encodeURIComponent(id)}`,
      )
    ).data,
  permanentlyDelete: async (id: string) =>
    (
      await api.delete<ApiResponse<null>>(
        `/products/${encodeURIComponent(id)}/permanent`,
      )
    ).data,
  listVariants: async (productId: string, status?: CatalogStatus) =>
    (
      await api.get<
        ApiResponse<{
          product: Pick<Product, "_id" | "name" | "status">;
          variants: Array<{
            productColour: ProductColour;
            skus: ProductVariant[];
          }>;
        }>
      >(
        `/products/${encodeURIComponent(productId)}/variants${buildQueryString({ status })}`,
      )
    ).data,
  createVariant: async (productId: string, payload: CreateVariantPayload) =>
    (
      await api.post<ApiResponse<ProductVariant>>(
        `/products/${encodeURIComponent(productId)}/variants`,
        payload,
      )
    ).data,
  updateVariant: async (variantId: string, payload: UpdateVariantPayload) =>
    (
      await api.patch<ApiResponse<ProductVariant>>(
        `/variants/${encodeURIComponent(variantId)}`,
        payload,
      )
    ).data,
  deactivateVariant: async (variantId: string) =>
    (
      await api.delete<ApiResponse<ProductVariant>>(
        `/variants/${encodeURIComponent(variantId)}`,
      )
    ).data,
};
export const productImportApi = {
  preview: async (file: File) => {
    const body = new FormData();
    body.append("file", file);
    return (
      await api.post<ApiResponse<ProductImportBatch>>(
        "/product-imports/preview",
        body,
      )
    ).data;
  },
  apply: async (batchId: string) =>
    (
      await api.post<ApiResponse<ProductImportResult>>(
        `/product-imports/${encodeURIComponent(batchId)}/apply`,
      )
    ).data,
};
export const productColourApi = {
  list: async (params: ProductColourListParams = {}) =>
    (
      await api.get<ApiResponse<ProductColourListData>>(
        `/product-colours${buildQueryString(params)}`,
      )
    ).data,
  get: async (id: string) =>
    (
      await api.get<ApiResponse<ProductColour>>(
        `/product-colours/${encodeURIComponent(id)}`,
      )
    ).data,
  create: async (payload: ProductColourPayload) =>
    (await api.post<ApiResponse<ProductColour>>("/product-colours", payload))
      .data,
  updateStatus: async (id: string, status: CatalogStatus) =>
    (
      await api.patch<ApiResponse<ProductColour>>(
        `/product-colours/${encodeURIComponent(id)}`,
        { status },
      )
    ).data,
  deactivate: async (id: string) =>
    (
      await api.delete<ApiResponse<ProductColour>>(
        `/product-colours/${encodeURIComponent(id)}`,
      )
    ).data,
  uploadImages: async (id: string, images: File[], altText = "") => {
    const body = new FormData();
    images.forEach((image) => body.append("images", image));
    body.append("altText", altText);
    return (
      await api.post<ApiResponse<ProductColour>>(
        `/product-colours/${encodeURIComponent(id)}/images`,
        body,
      )
    ).data;
  },
  reorderImages: async (id: string, imageIds: string[]) =>
    (
      await api.patch<ApiResponse<ProductColour>>(
        `/product-colours/${encodeURIComponent(id)}/images/reorder`,
        { imageIds },
      )
    ).data,
  deleteImage: async (id: string, imageId: string) =>
    (
      await api.delete<ApiResponse<ProductColour>>(
        `/product-colours/${encodeURIComponent(id)}/images/${encodeURIComponent(imageId)}`,
      )
    ).data,
};
