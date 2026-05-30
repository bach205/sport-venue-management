/**
 * Auth API
 *
 * POST /api/v1/auth/login
 * Body:    { email: string, password: string }
 * 200:     { message, data: { token, user: { _id, email, status, is_verified }, profile: { _id, user_id, name, sport_preference, reputation_score } } }
 * 400:     { message: "Email hoặc mật khẩu không chính xác." }
 * 400:     { errors: ["Vui lòng nhập email."] }
 * 403:     { message: "Vui lòng xác thực email của bạn trước khi đăng nhập." }
 * 403:     { message: "Tài khoản này đã bị khóa." }
 *
 * POST /api/v1/auth/logout
 * Headers: Authorization: Bearer <token>
 * 200:     { message: "Đăng xuất thành công." }
 * 401:     { message: "Không có quyền truy cập." | "Token không hợp lệ hoặc đã hết hạn." | "Không tìm thấy người dùng." }
 * 403:     { message: "Tài khoản này đã bị khóa." }
 *
 * POST /api/v1/auth/register
 * Body:    { email: string, password: string }  (password min 6 chars)
 * 201:     { message, data: { user: { _id, email, status, is_verified, createdAt, updatedAt } } }
 * 400:     { message: "Người dùng đã tồn tại." }
 * 400:     { message: "Email này đã được đăng ký. Vui lòng kiểm tra hộp thư đến để xác thực tài khoản của bạn." }
 * 400:     { errors: ["Vui lòng nhập email.", "Mật khẩu phải có ít nhất 6 ký tự."] }
 * 500:     { message: "Không thể hoàn tất đăng ký." }
 *
 * POST /api/v1/auth/verify-email
 * Body:    { token: string }  (raw token extracted from email link ?token=xxx)
 * 200:     { message: "Xác thực email thành công.", data: { user: { _id, email, status, is_verified } } }
 * 400:     { message: "Mã xác thực không hợp lệ." }
 * 400:     { message: "Mã xác thực này đã được sử dụng." }
 * 400:     { message: "Mã xác thực đã hết hạn." }
 * 400:     { errors: ["Vui lòng cung cấp mã xác thực."] }
 * 404:     { message: "Không tìm thấy người dùng." }
 */

import axios from 'axios';
import { isMockApi, API_BASE_URL } from '../../../shared/constants/api';
import i18n from '../../../shared/i18n/i18n';
import { getToken } from '../store/authStore';
import type {
  LoginPayload,
  RegisterPayload,
  VerifyEmailPayload,
  ForgotPasswordPayload,
  ResetPasswordPayload,
  ApiResponse,
  LoginResponseData,
  RegisterResponseData,
  VerifyEmailResponseData,
  ApiUser,
  ApiProfile,
} from '../types/auth.types';

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));
const authMessage = (key: string) => i18n.t(`api.${key}`, { ns: 'auth' });

// ─── Mock data shaped exactly like API responses ──────────────────────────────

const MOCK_USER_PLAYER: ApiUser = {
  _id: 'u-player',
  email: 'player@demo.com',
  status: 'active' as const,
  is_verified: true,
  role: 'user',
};
const MOCK_PROFILE_PLAYER: ApiProfile = {
  _id: 'prof-player',
  user_id: 'u-player',
  name: 'Alex Nguyen',
  age: 26,
  gender: 'male',
  sport_preference: ['badminton', 'tennis', 'pickleball'],
  skill_level: 'intermediate',
  location: 'Ho Chi Minh City',
  reputation_score: 755,
};

const MOCK_USER_OWNER: ApiUser = {
  _id: 'u-owner',
  email: 'owner@demo.com',
  status: 'active' as const,
  is_verified: true,
  role: 'owner',
};
const MOCK_PROFILE_OWNER: ApiProfile = {
  _id: 'prof-owner',
  user_id: 'u-owner',
  name: 'Minh Tran',
  age: 34,
  gender: 'male',
  sport_preference: ['tennis', 'badminton'],
  skill_level: 'competitive',
  location: 'Ho Chi Minh City',
  reputation_score: 2100,
};

const MOCK_USER_ADMIN: ApiUser = {
  _id: 'u-admin',
  email: 'admin@demo.com',
  status: 'active' as const,
  is_verified: true,
  role: 'admin',
};
const MOCK_PROFILE_ADMIN: ApiProfile = {
  _id: 'prof-admin',
  user_id: 'u-admin',
  name: 'Admin System',
  age: null,
  gender: 'prefer_not_to_say',
  sport_preference: [] as string[],
  skill_level: 'casual',
  location: 'Ho Chi Minh City',
  reputation_score: 9999,
};

const MOCK_ACCOUNTS: Record<string, { user: ApiUser; profile: ApiProfile }> = {
  'player@demo.com': { user: MOCK_USER_PLAYER, profile: MOCK_PROFILE_PLAYER },
  'owner@demo.com':  { user: MOCK_USER_OWNER,  profile: MOCK_PROFILE_OWNER },
  'admin@demo.com':  { user: MOCK_USER_ADMIN,  profile: MOCK_PROFILE_ADMIN },
};

// ─── API functions ────────────────────────────────────────────────────────────

export async function login(payload: LoginPayload): Promise<ApiResponse<LoginResponseData>> {
  if (isMockApi) {
    await delay(700);
    const account = MOCK_ACCOUNTS[payload.email.toLowerCase()];
    if (account && payload.password.length >= 6) {
      return {
        success: true,
        message: authMessage('loginSuccess'),
        data: {
          token: `mock_jwt_${account.user._id}_${Date.now()}`,
          user: account.user,
          profile: account.profile,
        },
      };
    }
    return { success: false, message: authMessage('invalidCredentials') };
  }

  try {
    const res = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: payload.email,
      password: payload.password,
    });
    return { success: true, message: res.data.message || authMessage('loginSuccess'), data: res.data.data };
  } catch (err: any) {
    const msg = err.response?.data?.message || authMessage('loginFailed');
    return { success: false, message: msg };
  }
}

export async function logout(): Promise<ApiResponse> {
  if (isMockApi) {
    await delay(400);
    return { success: true, message: authMessage('logoutSuccess') };
  }

  try {
    const token = getToken();
    await axios.post(
      `${API_BASE_URL}/auth/logout`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return { success: true, message: authMessage('logoutSuccess') };
  } catch (err: any) {
    const msg = err.response?.data?.message || authMessage('logoutFailed');
    return { success: false, message: msg };
  }
}

export async function register(payload: RegisterPayload): Promise<ApiResponse<RegisterResponseData>> {
  if (isMockApi) {
    await delay(800);
    if (Object.values(MOCK_ACCOUNTS).some(a => a.user.email === payload.email.toLowerCase())) {
      return { success: false, message: authMessage('userExists') };
    }
    return {
      success: true,
      message: authMessage('registerVerifyEmail'),
      data: {
        user: {
          _id: `u-new-${Date.now()}`,
          email: payload.email.toLowerCase(),
          status: 'active',
          is_verified: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      },
    };
  }

  try {
    const res = await axios.post(`${API_BASE_URL}/auth/register`, {
      email: payload.email,
      password: payload.password,
    });
    return { success: true, message: res.data.message || authMessage('registerSuccess'), data: res.data.data };
  } catch (err: any) {
    const errors: string[] = err.response?.data?.errors;
    if (errors?.length) return { success: false, message: errors.join(' ') };
    const msg = err.response?.data?.message || authMessage('registerFailed');
    return { success: false, message: msg };
  }
}

export async function verifyEmail(payload: VerifyEmailPayload): Promise<ApiResponse<VerifyEmailResponseData>> {
  if (isMockApi) {
    await delay(700);
    // Any non-empty token is valid in mock mode
    if (payload.token && payload.token.length > 0) {
      return {
        success: true,
        message: authMessage('verifySuccess'),
        data: {
          user: {
            _id: 'u-new',
            email: 'user@example.com',
            status: 'active',
            is_verified: true,
          },
        },
      };
    }
    return { success: false, message: authMessage('invalidVerificationCode') };
  }

  try {
    const res = await axios.post(`${API_BASE_URL}/auth/verify-email`, {
      token: payload.token,
    });
    return { success: true, message: res.data.message || authMessage('verifySuccess'), data: res.data.data };
  } catch (err: any) {
    const errors: string[] = err.response?.data?.errors;
    if (errors?.length) return { success: false, message: errors.join(' ') };
    const msg = err.response?.data?.message || authMessage('verifyFailed');
    return { success: false, message: msg };
  }
}

/** Not in API docs — kept for FE UX (forgot password flow) */
export async function forgotPassword(payload: ForgotPasswordPayload): Promise<ApiResponse> {
  if (isMockApi) {
    await delay(800);
    return { success: true, message: authMessage('resetLinkSent') };
  }

  try {
    const res = await axios.post(`${API_BASE_URL}/auth/forgot-password`, payload);
    return { success: true, message: res.data.message || authMessage('resetLinkRequestSuccess') };
  } catch (err: any) {
    return { success: false, message: err.response?.data?.message || authMessage('requestFailed') };
  }
}

/** Not in API docs — kept for FE UX (reset password flow) */
export async function resetPassword(payload: ResetPasswordPayload): Promise<ApiResponse> {
  if (isMockApi) {
    await delay(800);
    return { success: true, message: authMessage('passwordResetSuccess') };
  }

  try {
    const res = await axios.post(`${API_BASE_URL}/auth/reset-password`, {
      token: payload.token,
      newPassword: payload.newPassword,
    });
    return { success: true, message: res.data.message || authMessage('passwordResetSuccess') };
  } catch (err: any) {
    return { success: false, message: err.response?.data?.message || authMessage('passwordResetFailed') };
  }
}
