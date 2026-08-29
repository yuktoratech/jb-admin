import type { Category } from "@/features/categories/category.types";
import type { Pagination } from "@/types/api";

export type CatalogStatus = "active" | "inactive";

export interface Product {
  _id: string;
  productName: string;
  productCode?: string;
  title: string;
  category: Category;
  description?: string;
  mrp: number;
  fit?: string;
  patternWash?: string;
  fabric?: string;
  sleeves?: string;
  waist?: string;
  images: string[];
  status: CatalogStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ProductVariant {
  _id?: string;
  variantId?: string;
  product?: string;
  color: string;
  sizeSet: string;
  sku: string;
  status: CatalogStatus;
  createdAt: string;
  updatedAt: string;
}

export interface VariantSizeSet {
  variantId: string;
  sizeSet: string;
  sku: string;
  status: CatalogStatus;
  createdAt: string;
  updatedAt: string;
}

export interface VariantGroup {
  color: string;
  sizeSets: VariantSizeSet[];
}

export interface ProductDetailData {
  product: Product;
  variants: VariantGroup[];
}

export interface ProductListData {
  products: Product[];
  pagination: Pagination;
}

export interface ProductListParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  status?: CatalogStatus | "";
}

export interface ProductColorInput {
  color: string;
  sizeSets: string[];
}

export interface ProductPayload {
  productName: string;
  productCode?: string;
  title: string;
  categoryId: string;
  description?: string;
  mrp: number;
  fit?: string;
  patternWash?: string;
  fabric?: string;
  sleeves?: string;
  waist?: string;
  images?: string[];
  status?: CatalogStatus;
  colors: ProductColorInput[];
}

export type ProductUpdatePayload = Partial<Omit<ProductPayload, "colors" | "productCode">> & {
  productCode?: string | null;
};

export interface VariantPayload {
  color: string;
  sizeSet: string;
  sku?: string;
  status?: CatalogStatus;
}
