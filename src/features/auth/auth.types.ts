import type { ApiResponse } from "@/types/api";

export type UserRole = "admin" | "wholesaler" | "retailer";

export type UserStatus = "active" | "inactive" | "pending" | "rejected";

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  isEmailVerified?: boolean;
  lastLoginAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
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

