import { iamServiceClient } from "@/shared/api/axiosClient";
import {
  type LoginRequest,
  type RegisterRequest,
  type AuthResponse,
} from "@/features/auth/types/authTypes";

export const authApi = {
  login: (data: LoginRequest) => iamServiceClient.post<AuthResponse>("/auth/login", data),

  register: (data: RegisterRequest) => iamServiceClient.post<AuthResponse>("/auth/register", data),

  logout: () => iamServiceClient.post("/auth/logout"),

  getMe: () => iamServiceClient.get<AuthResponse["user"]>("/auth/me"),
};
