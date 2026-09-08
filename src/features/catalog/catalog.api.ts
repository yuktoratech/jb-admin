import { api } from "@/lib/api";
import { buildQueryString } from "@/lib/utils";
import type { ApiResponse } from "@/types/api";
import type { CatalogMaster, Colour, Fabric, Fit, MasterListParams, MasterPayload, NamedMasterListData, SizeSet, SizeSetPayload, SubCategory, SubCategoryListParams, SubCategoryPayload } from "./catalog.types";

const masterApi = <T extends CatalogMaster, K extends string>(path: string) => ({
  list: async (params: MasterListParams = {}) => (await api.get<ApiResponse<NamedMasterListData<K, T>>>(`${path}${buildQueryString(params)}`)).data,
  get: async (id: string) => (await api.get<ApiResponse<T>>(`${path}/${encodeURIComponent(id)}`)).data,
  create: async (payload: MasterPayload) => (await api.post<ApiResponse<T>>(path, payload)).data,
  update: async (id: string, payload: Partial<MasterPayload>) => (await api.patch<ApiResponse<T>>(`${path}/${encodeURIComponent(id)}`, payload)).data,
  deactivate: async (id: string) => (await api.delete<ApiResponse<T>>(`${path}/${encodeURIComponent(id)}`)).data,
});
export const colourApi = masterApi<Colour, "colours">("/colours");
export const fitApi = masterApi<Fit, "fits">("/fits");
export const fabricApi = masterApi<Fabric, "fabrics">("/fabrics");
export const subCategoryApi = {
  list: async (params: SubCategoryListParams = {}) => (await api.get<ApiResponse<NamedMasterListData<"subCategories", SubCategory>>>(`/subcategories${buildQueryString(params)}`)).data,
  get: async (id: string) => (await api.get<ApiResponse<SubCategory>>(`/subcategories/${encodeURIComponent(id)}`)).data,
  create: async (payload: SubCategoryPayload) => (await api.post<ApiResponse<SubCategory>>("/subcategories", payload)).data,
  update: async (id: string, payload: Partial<SubCategoryPayload>) => (await api.patch<ApiResponse<SubCategory>>(`/subcategories/${encodeURIComponent(id)}`, payload)).data,
  deactivate: async (id: string) => (await api.delete<ApiResponse<SubCategory>>(`/subcategories/${encodeURIComponent(id)}`)).data,
};
export const sizeSetApi = {
  list: async (params: MasterListParams = {}) => (await api.get<ApiResponse<NamedMasterListData<"sizeSets", SizeSet>>>(`/size-sets${buildQueryString(params)}`)).data,
  get: async (id: string) => (await api.get<ApiResponse<SizeSet>>(`/size-sets/${encodeURIComponent(id)}`)).data,
  create: async (payload: SizeSetPayload) => (await api.post<ApiResponse<SizeSet>>("/size-sets", payload)).data,
  update: async (id: string, payload: Partial<SizeSetPayload>) => (await api.patch<ApiResponse<SizeSet>>(`/size-sets/${encodeURIComponent(id)}`, payload)).data,
  deactivate: async (id: string) => (await api.delete<ApiResponse<SizeSet>>(`/size-sets/${encodeURIComponent(id)}`)).data,
};
