/**
 * Auth Store — in-memory session (demo / mock mode)
 * In production: store token in httpOnly cookie or localStorage,
 * and rehydrate user from GET /api/v1/users/me on app mount.
 */

import type { ApiUser, ApiProfile, UserStatus } from '../types/auth.types';

export type { UserStatus };
export type UserRole = 'player' | 'owner' | 'admin';

/**
 * Internal FE auth user — combines data from API `user` + `profile` objects.
 * Field names match the API response exactly where they originate from the API.
 * `role`, `avatar`, `ownedVenueIds` are FE-only (not returned by API).
 */
export interface AuthUser {
  // From API user object
  _id: string;
  email: string;
  status: UserStatus;
  is_verified: boolean;
  // From API profile object
  name: string;
  sport_preference: string[];
  reputation_score: number;
  // FE-only fields (not from API)
  role: UserRole;
  avatar: string;
  ownedVenueIds: string[];
}

// ─── Demo accounts (mock API response shaped to AuthUser) ─────────────────────
export const DEMO_ACCOUNTS: Record<string, AuthUser> = {
  'player@demo.com': {
    _id: 'u-player',
    email: 'player@demo.com',
    status: 'active',
    is_verified: true,
    name: 'Alex Nguyen',
    sport_preference: ['badminton', 'tennis', 'pickleball'],
    reputation_score: 755,
    role: 'player',
    avatar: 'https://api.dicebear.com/8.x/avataaars/svg?seed=Alex',
    ownedVenueIds: [],
  },
  'owner@demo.com': {
    _id: 'u-owner',
    email: 'owner@demo.com',
    status: 'active',
    is_verified: true,
    name: 'Minh Tran',
    sport_preference: ['tennis', 'badminton'],
    reputation_score: 2100,
    role: 'owner',
    avatar: 'https://api.dicebear.com/8.x/avataaars/svg?seed=Minh',
    ownedVenueIds: ['v-001', 'v-002', 'v-003'],
  },
  'admin@demo.com': {
    _id: 'u-admin',
    email: 'admin@demo.com',
    status: 'active',
    is_verified: true,
    name: 'Admin System',
    sport_preference: [],
    reputation_score: 9999,
    role: 'admin',
    avatar: 'https://api.dicebear.com/8.x/avataaars/svg?seed=Admin',
    ownedVenueIds: [],
  },
};

// ─── State ────────────────────────────────────────────────────────────────────
let _currentUser: AuthUser | null = null;
let _token: string | null = null;
const _listeners = new Set<() => void>();

function emit() { _listeners.forEach(fn => fn()); }

// ─── Public API ───────────────────────────────────────────────────────────────

export function subscribeAuth(fn: () => void): () => void {
  _listeners.add(fn);
  return () => _listeners.delete(fn);
}

export function getCurrentUser(): AuthUser | null {
  return _currentUser;
}

export function getToken(): string | null {
  return _token;
}

/**
 * Called after a real API login succeeds.
 * Maps { ApiUser + ApiProfile } → AuthUser and stores the JWT.
 */
export function loginWithApiData(token: string, user: ApiUser, profile: ApiProfile): AuthUser {
  const authUser: AuthUser = {
    _id: user._id,
    email: user.email,
    status: user.status,
    is_verified: user.is_verified,
    name: profile.name,
    sport_preference: profile.sport_preference,
    reputation_score: profile.reputation_score,
    // FE-only defaults (role not returned by API yet)
    role: 'player',
    avatar: `https://api.dicebear.com/8.x/avataaars/svg?seed=${encodeURIComponent(profile.name)}`,
    ownedVenueIds: [],
  };
  _token = token;
  _currentUser = authUser;
  emit();
  return authUser;
}

/**
 * Demo shortcut: bypass API, log in directly as a demo account.
 * Sets a fake token for mock API calls.
 */
export function loginAs(email: string): AuthUser | null {
  const user = DEMO_ACCOUNTS[email] ?? null;
  _currentUser = user;
  _token = user ? `mock_demo_${user._id}` : null;
  emit();
  return user;
}

export function logout(): void {
  _currentUser = null;
  _token = null;
  emit();
}

/** Update the in-memory user fields (e.g. after profile update) */
export function patchCurrentUser(patch: Partial<AuthUser>): void {
  if (!_currentUser) return;
  _currentUser = { ..._currentUser, ...patch };
  emit();
}
