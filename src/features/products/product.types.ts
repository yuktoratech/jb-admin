import type { Category, CatalogStatus, Colour, Fabric, Fit, SizeSet, SubCategory } from "@/features/catalog/catalog.types";
import type { Pagination } from "@/types/api";
export type { CatalogStatus } from "@/features/catalog/catalog.types";
export interface Product { _id: string; catalogVersion: 2; name: string; description?: string; category: Category; subCategory: SubCategory; fitId: Fit; fabricId: Fabric; mrpPerPieceMinor: number; status: CatalogStatus; createdAt: string; updatedAt: string; }
export interface ProductColourImage { _id: string; objectKey: string; originalFilename: string; contentType: "image/jpeg" | "image/png" | "image/webp"; size: number; sortIndex: number; altText: string; createdAt: string; url: string; }
export interface ProductColour { _id: string; product: string | Product; colour: string | Colour; productCode: string; images: ProductColourImage[]; status: CatalogStatus; createdAt: string; updatedAt: string; }
export interface ProductVariant { _id: string; catalogVersion: 2; product: string; productColour: string | ProductColour; sizeSetRef: string | SizeSet; sku: string; status: CatalogStatus; createdAt: string; updatedAt: string; }
export interface ProductColourWithSkus extends ProductColour { colour: Colour; skus: ProductVariant[]; }
export interface ProductDetailData { product: Product; productColours: ProductColourWithSkus[]; }
export interface ProductListData { products: Product[]; pagination: Pagination; }
export interface ProductListParams { page?: number; limit?: number; search?: string; categoryId?: string; subCategoryId?: string; status?: CatalogStatus | ""; }
export interface CreateSkuInput { sizeSetId: string; status?: CatalogStatus; }
export interface CreateProductColourInput { colourId: string; productCode: string; status?: CatalogStatus; skus: CreateSkuInput[]; }
export interface ProductPayload { name: string; description?: string; categoryId: string; subCategoryId: string; fitId: string; fabricId: string; mrpPerPieceMinor: number; status?: CatalogStatus; productColours: CreateProductColourInput[]; }
export type ProductUpdatePayload = Partial<Omit<ProductPayload, "productColours">>;
export interface CreateVariantPayload { productColourId: string; sizeSetId: string; status?: CatalogStatus; }
export interface UpdateVariantPayload { status: CatalogStatus; }
export interface ProductColourPayload { productId: string; colourId: string; productCode: string; status?: CatalogStatus; }
export interface ProductColourListParams { page?: number; limit?: number; productId?: string; colourId?: string; status?: CatalogStatus | ""; }
export interface ProductColourListData { productColours: ProductColour[]; pagination: Pagination; }
export type ProductImportStatus = "VALID" | "INVALID" | "APPLIED";
export interface ProductImportIssue { rowNumber: number; field: string; code: string; message: string; }
export interface ProductImportRow { rowNumber: number; productName?: string; categoryName?: string; subCategoryName?: string; fitName?: string; fabricName?: string; description?: string; mrpPerPieceMinor?: number | null; colourName?: string; productCode?: string; sizeSetLabel?: string; expectedSku?: string; status?: CatalogStatus; validationStatus?: "VALID" | "INVALID"; legacySku?: string; }
export interface ProductImportBatch { id: string; status: ProductImportStatus; originalFilename: string; contentHash: string; totalRows: number; validRows: number; invalidRows: number; normalizedRows: ProductImportRow[]; errors: ProductImportIssue[]; warnings: ProductImportIssue[]; createdAt: string; expiresAt: string; appliedAt?: string; result?: ProductImportResult; }
export interface ProductImportResult { batchId: string; status: "APPLIED"; appliedAt: string; createdProducts: number; existingProducts: number; createdProductColours: number; existingProductColours: number; createdVariants: number; existingVariants: number; }
