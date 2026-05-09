/**
 * Auth API Routes
 *
 * POST /auth/login
 *   - Data send:    { email: string, password: string }
 *   - Data receive: { success: true, message: "Login successful", data: { token: "jwt_token", user: { id, fullName, email, role, isVerified, avatarUrl } } }
 *
 * POST /auth/register
 *   - Data send:    { fullName: string, email: string, password: string }
 *   - Data receive: { success: true, message: "Registration successful. Please check your email.", data: { email: string } }
 *
 * POST /auth/verify-email
 *   - Data send:    { email: string, code: string }
 *   - Data receive: { success: true, message: "Email verified successfully" }
 *
 * POST /auth/resend-verification
 *   - Data send:    { email: string }
 *   - Data receive: { success: true, message: "Verification email resent" }
 *
 * POST /auth/forgot-password
 *   - Data send:    { email: string }
 *   - Data receive: { success: true, message: "Password reset link sent to your email" }
 *
 * POST /auth/reset-password
 *   - Data send:    { token: string, newPassword: string }
 *   - Data receive: { success: true, message: "Password reset successfully" }
 *
 * GET /auth/verify-reset-token?token=xxx
 *   - Query param:  token (string)
 *   - Data receive: { success: true, message: "Token valid", data: { email: string } }
 */

import axios from 'axios';
import { isMockApi, API_BASE_URL } from '../../../shared/constants/api';
import type {
  LoginPayload,
  RegisterPayload,
  VerifyEmailPayload,
  ForgotPasswordPayload,
  ResetPasswordPayload,
  AuthResponse,
  ApiResponse,
} from '../types/auth.types';

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

// ─── MOCK DATA ───────────────────────────────────────────────────────────────

const mockUser = {
  id: 'usr_001',
  fullName: 'Nguyễn Văn A',
  email: 'test@matchill.com',
  role: 'user' as const,
  isVerified: true,
  avatarUrl: undefined,
};

// ─── API FUNCTIONS ────────────────────────────────────────────────────────────

export async function login(payload: LoginPayload): Promise<ApiResponse<AuthResponse>> {
  if (isMockApi) {
    await delay(800);
    if (payload.email === 'test@matchill.com' && payload.password === 'password123') {
      return {
        success: true,
        message: 'Đăng nhập thành công',
        data: { token: 'mock_jwt_token_xyz', user: mockUser },
      };
    }
    return { success: false, message: 'Email hoặc mật khẩu không đúng' };
  }

  const res = await axios.post(`${API_BASE_URL}/auth/login`, payload);
  return res.data;
}

export async function register(payload: RegisterPayload): Promise<ApiResponse<{ email: string }>> {
  if (isMockApi) {
    await delay(900);
    return {
      success: true,
      message: 'Đăng ký thành công. Vui lòng kiểm tra email để xác thực tài khoản.',
      data: { email: payload.email },
    };
  }

  const res = await axios.post(`${API_BASE_URL}/auth/register`, {
    fullName: payload.fullName,
    email: payload.email,
    password: payload.password,
  });
  return res.data;
}

export async function verifyEmail(payload: VerifyEmailPayload): Promise<ApiResponse> {
  if (isMockApi) {
    await delay(700);
    if (payload.code === '123456') {
      return { success: true, message: 'Email đã được xác thực thành công!' };
    }
    return { success: false, message: 'Mã xác thực không đúng hoặc đã hết hạn.' };
  }

  const res = await axios.post(`${API_BASE_URL}/auth/verify-email`, payload);
  return res.data;
}

export async function resendVerification(email: string): Promise<ApiResponse> {
  if (isMockApi) {
    await delay(600);
    return { success: true, message: 'Email xác thực đã được gửi lại.' };
  }

  const res = await axios.post(`${API_BASE_URL}/auth/resend-verification`, { email });
  return res.data;
}

export async function forgotPassword(payload: ForgotPasswordPayload): Promise<ApiResponse> {
  if (isMockApi) {
    await delay(800);
    return {
      success: true,
      message: 'Link đặt lại mật khẩu đã được gửi đến email của bạn.',
    };
  }

  const res = await axios.post(`${API_BASE_URL}/auth/forgot-password`, payload);
  return res.data;
}

export async function resetPassword(payload: ResetPasswordPayload): Promise<ApiResponse> {
  if (isMockApi) {
    await delay(800);
    return { success: true, message: 'Mật khẩu đã được đặt lại thành công!' };
  }

  const res = await axios.post(`${API_BASE_URL}/auth/reset-password`, {
    token: payload.token,
    newPassword: payload.newPassword,
  });
  return res.data;
}
