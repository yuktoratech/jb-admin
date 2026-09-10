import type { Pagination } from "@/types/api";

export type CatalogStatus = "active" | "inactive";
export interface CatalogMaster { _id: string; name: string; status: CatalogStatus; createdAt: string; updatedAt: string; }
export type SizeFamily = "ALPHA" | "NUMERIC";
export interface Category extends CatalogMaster { description?: string; sizeFamily?: SizeFamily; }
export interface SubCategory extends CatalogMaster { category: string | Category; }
export type Colour = CatalogMaster;
export type Fit = CatalogMaster;
export type Fabric = CatalogMaster;
export interface SizeSet { _id: string; label: string; sizes: string[]; pieceCount: number; status: CatalogStatus; createdAt: string; updatedAt: string; }
export interface MasterListData { pagination: Pagination; }
export type NamedMasterListData<K extends string, T> = MasterListData & Record<K, T[]>;
export interface MasterListParams { page?: number; limit?: number; search?: string; status?: CatalogStatus | ""; }
export interface SubCategoryListParams extends MasterListParams { categoryId?: string; }
export interface MasterPayload { name: string; status?: CatalogStatus; }
export interface SubCategoryPayload extends MasterPayload { categoryId: string; }
export interface SizeSetPayload { label: string; status?: CatalogStatus; }
