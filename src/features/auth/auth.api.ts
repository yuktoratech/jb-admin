import type { ApiResponse } from "@/types/api";
import type { ChangePasswordPayload, ForgotPasswordPayload, LoginCredentials, LoginData, PasswordActionData, ResetPasswordPayload, User } from "./auth.types";
import { api } from "@/lib/api";

export const authApi = {
  login: async (payload: LoginCredentials) => (await api.post<ApiResponse<LoginData>>("/auth/login", payload, { auth: false })).data,
  me: async () => (await api.get<ApiResponse<User>>("/auth/me")).data,
  forgotPassword: async (payload: ForgotPasswordPayload) => (await api.post<ApiResponse<PasswordActionData>>("/auth/forgot-password", payload, { auth: false })).data,
  resetPassword: async (payload: ResetPasswordPayload) => (await api.post<ApiResponse<PasswordActionData>>("/auth/reset-password", payload, { auth: false })).data,
  changePassword: async (payload: ChangePasswordPayload) => (await api.post<ApiResponse<PasswordActionData>>("/auth/change-password", payload)).data,
};
