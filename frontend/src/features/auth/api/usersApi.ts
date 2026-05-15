/**
 * Users API
 *
 * GET /api/v1/users/me
 *   Headers: Authorization: Bearer <token>
 *   200:     { message: "User profile fetched successfully.", data: { user: { _id, email, status, is_verified }, profile: { _id, user_id, name, age, gender, sport_preference, skill_level, location, reputation_score } } }
 *   401:     { message: "Unauthorized." | "Invalid or expired token." | "User not found." }
 *   403:     { message: "This account has been banned." }
 *   404:     { message: "User not found" }
 *
 * PUT /api/v1/users/profile
 *   Headers: Authorization: Bearer <token>
 *   Body:    { name?, age?, gender?, sport_preference?, skill_level?, location? }
 *   200:     { message: "User profile updated successfully.", data: { _id, user_id: { _id, email, status, is_verified }, name, age, gender, sport_preference, skill_level, location, reputation_score } }
 *   400:     { message: "Profile validation error message" }
 *   401:     { message: "Unauthorized." | "Invalid or expired token." | "User not found." }
 *   403:     { message: "This account has been banned." }
 */

import axios from 'axios';
import { isMockApi, API_BASE_URL } from '../../../shared/constants/api';
import { getToken, getCurrentUser } from '../store/authStore';
import type {
  ApiResponse,
  GetMeResponseData,
  ApiProfile,
  UpdateProfilePayload,
} from '../types/auth.types';

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

function authHeader() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ─── Mock profile store ───────────────────────────────────────────────────────
// Keyed by user _id. Updated when updateProfile is called in mock mode.
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
    reputation_score: 9999,
  },
};

export async function getMe(): Promise<ApiResponse<GetMeResponseData>> {
  if (isMockApi) {
    await delay(500);
    const user = getCurrentUser();
    if (!user) return { success: false, message: 'Unauthorized.' };
    const profile = _mockProfiles[user._id];
    if (!profile) return { success: false, message: 'User not found' };
    return {
      success: true,
      message: 'User profile fetched successfully.',
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
    const res = await axios.get(`${API_BASE_URL}/users/me`, {
      headers: authHeader(),
    });
    return { success: true, message: res.data.message, data: res.data.data };
  } catch (err: any) {
    return { success: false, message: err.response?.data?.message || 'Failed to fetch profile.' };
  }
}

export async function updateProfile(payload: UpdateProfilePayload): Promise<ApiResponse<ApiProfile>> {
  if (isMockApi) {
    await delay(600);
    const user = getCurrentUser();
    if (!user) return { success: false, message: 'Unauthorized.' };

    const existing = _mockProfiles[user._id] ?? {
      _id: `prof-${user._id}`,
      user_id: user._id,
      name: '',
      sport_preference: [],
      reputation_score: 0,
    };
    const updated: ApiProfile = { ...existing, ...payload };
    _mockProfiles[user._id] = updated;

    return {
      success: true,
      message: 'User profile updated successfully.',
      data: updated,
    };
  }

  try {
    const res = await axios.put(`${API_BASE_URL}/users/profile`, payload, {
      headers: { ...authHeader(), 'Content-Type': 'application/json' },
    });
    return { success: true, message: res.data.message, data: res.data.data };
  } catch (err: any) {
    return { success: false, message: err.response?.data?.message || 'Update failed.' };
  }
}