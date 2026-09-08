import type { ApiResponse } from "@/types/api";

export type UserRole = "admin" | "wholesaler" | "retailer";

export type UserStatus = "active" | "inactive" | "pending" | "rejected";

export interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  isEmailVerified?: boolean;
  lastLoginAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  discountPercent: number;
  parentWholesaler: string | null;
}

export interface AdminUser extends User {
  role: "admin";
  parentWholesaler: null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginData {
  accessToken: string;
  user: User;
}

export type LoginResponse = ApiResponse<LoginData>;

export type CurrentUserResponse = ApiResponse<User>;

export interface ForgotPasswordPayload { email: string; }
export interface ResetPasswordPayload { token: string; newPassword: string; }
export interface ChangePasswordPayload { currentPassword: string; newPassword: string; }
export interface PasswordActionData { message: string; }

export interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
  refreshCurrentUser: () => Promise<User | null>;
  clearError: () => void;
}
