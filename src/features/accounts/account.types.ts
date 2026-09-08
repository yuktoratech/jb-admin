import type { Pagination } from "@/types/api";
import type { UserStatus } from "@/features/auth/auth.types";

export interface Account { _id: string; name: string; email: string; phone?: string; status: UserStatus; discountPercent: number; isEmailVerified: boolean; lastLoginAt?: string | null; createdAt: string; updatedAt: string; }
export interface Wholesaler extends Account { role: "wholesaler"; parentWholesaler: null; retailerCount?: number; }
export interface RetailerWholesaler { _id: string; name: string; email: string; status: UserStatus; }
export interface Retailer extends Account { role: "retailer"; parentWholesaler: string | RetailerWholesaler; }
export interface AccountListParams { page?: number; limit?: number; search?: string; status?: "active" | "inactive" | ""; }
export interface WholesalerListData { wholesalers: Wholesaler[]; pagination: Pagination; }
export interface RetailerListParams extends AccountListParams { wholesalerId?: string; }
export interface RetailerListData { retailers: Retailer[]; pagination: Pagination; }
export interface ManagedAccountPayload { name: string; email: string; phone: string; discountPercent?: number; }
export type ManagedAccountUpdatePayload = Partial<Omit<ManagedAccountPayload, "phone">> & { phone?: string | null };
export interface CreatedWholesaler { user: Wholesaler; temporaryPassword: string; }
