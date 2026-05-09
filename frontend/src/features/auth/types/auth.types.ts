export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface VerifyEmailPayload {
  email: string;
  code: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  role: 'user' | 'venue_owner' | 'admin';
  isVerified: boolean;
  avatarUrl?: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export interface ApiResponse<T = void> {
  success: boolean;
  message: string;
  data?: T;
}
