// ─── API exact types (match server response field names 1-to-1) ───────────────

export type UserStatus = 'active' | 'warning' | 'banned';
export type UserRole = 'user' | 'owner' | 'admin';

/** Returned inside data.user from login / register / verify-email / get-me */
export interface ApiUser {
  _id: string;
  email: string;
  status: UserStatus;
  is_verified: boolean;
  role?: UserRole;
  createdAt?: string;
  updatedAt?: string;
}

/** Returned inside data.profile from login / get-me / update-profile */
export interface ApiProfile {
  _id: string;
  user_id: ApiUser | string;  // populated or just id string
  name: string;
  age?: number | null;
  gender?: string;
  sport_preference: string[];
  skill_level?: string;
  location?: string;
  avatar_url?: string | null;
  reputation_score: number;
}

// ─── Request payloads ─────────────────────────────────────────────────────────

/** POST /api/v1/auth/login */
export interface LoginPayload {
  email: string;
  password: string;
}

/**
 * POST /api/v1/auth/register
 * API only accepts email + password (min 6 chars). No fullName.
 */
export interface RegisterPayload {
  email: string;
  password: string;
}

/**
 * POST /api/v1/auth/verify-email
 * Raw token from the URL query string (e.g. ?token=xxx), sent in body.
 */
export interface VerifyEmailPayload {
  token: string;
}

/** POST /api/v1/auth/forgot-password (not yet documented — kept for FE) */
export interface ForgotPasswordPayload {
  email: string;
}

/** POST /api/v1/auth/reset-password (not yet documented — kept for FE) */
export interface ResetPasswordPayload {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

/**
 * PUT /api/v1/users/profile
 * All fields are optional / partial.
 */
export interface UpdateProfilePayload {
  name?: string;
  age?: number | null;
  gender?: string;
  sport_preference?: string[];
  skill_level?: string;
  location?: string;
  avatar_url?: string | null;
}

// ─── Response data shapes ─────────────────────────────────────────────────────

/** data inside POST /api/v1/auth/login 200 */
export interface LoginResponseData {
  token: string;
  user: ApiUser;
  profile: ApiProfile;
}

/** data inside POST /api/v1/auth/register 201 */
export interface RegisterResponseData {
  user: ApiUser;
}

/** data inside POST /api/v1/auth/verify-email 200 */
export interface VerifyEmailResponseData {
  user: ApiUser;
}

/** data inside GET /api/v1/users/me 200 */
export interface GetMeResponseData {
  user: ApiUser;
  profile: ApiProfile;
}

// ─── Generic API envelope ─────────────────────────────────────────────────────

export interface ApiResponse<T = void> {
  success: boolean;
  message: string;
  data?: T;
}
