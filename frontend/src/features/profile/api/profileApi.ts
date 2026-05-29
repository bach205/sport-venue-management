/**
 * Profile API
 *
 * GET /api/v1/users/me
 * Headers: Authorization: Bearer <token>
 * 200: { message: "Tải thông tin hồ sơ người dùng thành công.",
 * data: { user: { _id, email, status, is_verified },
 * profile: { _id, user_id: { _id, email, status, is_verified },
 * name, age?, gender?, sport_preference, skill_level?,
 * location?, reputation_score } } }
 * 401: { message: "Không có quyền truy cập." | "Token không hợp lệ hoặc đã hết hạn." | "Không tìm thấy người dùng." }
 * 403: { message: "Tài khoản này đã bị khóa." }
 * 404: { message: "Không tìm thấy người dùng." }
 *
 * PUT /api/v1/users/profile
 * Headers: Authorization: Bearer <token>
 * Body: { name?, age?, gender?, sport_preference?, skill_level?, location? }
 * 200: { message: "Cập nhật hồ sơ người dùng thành công.",
 * data: { _id, user_id: { _id, email, status, is_verified },
 * name, age, gender, sport_preference, skill_level,
 * location, reputation_score } }
 * 400: { message: "Thông báo lỗi xác thực dữ liệu hồ sơ" }
 * 401: { message: "Không có quyền truy cập." | "Token không hợp lệ hoặc đã hết hạn." | "Không tìm thấy người dùng." }
 * 403: { message: "Tài khoản này đã bị khóa." }
 */

import axios from 'axios';
import { isMockApi, API_BASE_URL } from '../../../shared/constants/api';
import { store } from '../../../app/store';
import type { ApiResponse, GetMeResponseData, ApiProfile, UpdateProfilePayload } from '../../auth/types/auth.types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const delay = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

/** Đọc JWT từ Redux state — không phụ thuộc vào bridge authStore. */
function authHeader(): Record<string, string> {
  const token = store.getState().auth.token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/** Đọc thông tin người dùng hiện tại từ Redux state cho các mock handler. */
function getAuthUser() {
  return store.getState().auth.user;
}

// ─── Mock data (mô phỏng các bản ghi trong DB thật) ──────────────────────────────

const _mockProfiles: Record<string, ApiProfile> = {
  'u-player': {
    _id: 'prof-player',
    user_id: 'u-player',
    name: 'Alex Nguyen',
    age: 26,
    gender: 'male',
    sport_preference: ['badminton', 'tennis', 'pickleball'],
    skill_level: 'intermediate',
    location: 'Ho Chi Minh City',
    avatar_url: 'https://api.dicebear.com/8.x/avataaars/svg?seed=Alex',
    reputation_score: 755,
  },
  'u-owner': {
    _id: 'prof-owner',
    user_id: 'u-owner',
    name: 'Minh Tran',
    age: 34,
    gender: 'male',
    sport_preference: ['tennis', 'badminton'],
    skill_level: 'competitive',
    location: 'Ho Chi Minh City',
    avatar_url: 'https://api.dicebear.com/8.x/avataaars/svg?seed=Minh',
    reputation_score: 2100,
  },
  'u-admin': {
    _id: 'prof-admin',
    user_id: 'u-admin',
    name: 'Admin System',
    age: null,
    gender: 'prefer_not_to_say',
    sport_preference: [],
    skill_level: 'casual',
    location: 'Ho Chi Minh City',
    avatar_url: 'https://api.dicebear.com/8.x/avataaars/svg?seed=Admin',
    reputation_score: 9999,
  },
};

// ─── API functions ─────────────────────────────────────────────────────────────

export async function getMe(): Promise<ApiResponse<GetMeResponseData>> {
  if (isMockApi) {
    await delay(500);
    const user = getAuthUser();
    if (!user) return { success: false, message: 'Không có quyền truy cập.' };
    const profile = _mockProfiles[user._id];
    if (!profile) return { success: false, message: 'Không tìm thấy người dùng.' };
    return {
      success: true,
      message: 'Tải thông tin hồ sơ người dùng thành công.',
      data: {
        user: {
          _id: user._id,
          email: user.email,
          status: user.status,
          is_verified: user.is_verified,
        },
        profile,
      },
    };
  }

  try {
    const res = await axios.get(`${API_BASE_URL}/users/me`, { headers: authHeader() });
    return { success: true, message: res.data.message || 'Tải thông tin hồ sơ người dùng thành công.', data: res.data.data };
  } catch (err: any) {
    return { success: false, message: err.response?.data?.message ?? 'Không thể tải thông tin hồ sơ.' };
  }
}

export async function updateProfile(payload: UpdateProfilePayload): Promise<ApiResponse<ApiProfile>> {
  if (isMockApi) {
    await delay(600);
    const user = getAuthUser();
    if (!user) return { success: false, message: 'Không có quyền truy cập.' };
    const existing = _mockProfiles[user._id] ?? {
      _id: `prof-${user._id}`,
      user_id: user._id,
      name: user.name,
      sport_preference: [],
      reputation_score: 0,
    };
    const updated: ApiProfile = { ...existing, ...payload };
    _mockProfiles[user._id] = updated;
    return { success: true, message: 'Cập nhật hồ sơ người dùng thành công.', data: updated };
  }

  try {
    const res = await axios.put(`${API_BASE_URL}/users/profile`, payload, {
      headers: { ...authHeader(), 'Content-Type': 'application/json' },
    });
    return { success: true, message: res.data.message || 'Cập nhật hồ sơ người dùng thành công.', data: res.data.data };
  } catch (err: any) {
    return { success: false, message: err.response?.data?.message ?? 'Cập nhật hồ sơ thất bại.' };
  }
}
