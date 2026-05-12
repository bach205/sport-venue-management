/**
 * Auth Store — thin bridge over the Redux store.
 *
 * PURPOSE: Provides imperative getters/setters for non-React contexts
 *   (API files, utility modules) that cannot use React hooks.
 *
 * React components should use the typed hooks instead:
 *   useAppSelector(state => state.auth.user)
 *   useAppDispatch() + loginSuccess / logout / patchUser actions
 *
 * IMPORTANT: Do NOT add local state here. All state lives in Redux.
 */

import { loginSuccess, logout as logoutAction, patchUser } from "./authSlice";
import type { ApiUser, ApiProfile } from "../types/auth.types";

// ─── Re-exports (so existing imports stay unchanged) ─────────────────────────

export type { AuthUser, UserRole } from "./authSlice";
export type { UserStatus } from "../types/auth.types";

// ─── Demo accounts (mock API shaped to AuthUser) ──────────────────────────────

import type { AuthUser } from "./authSlice";
import { store } from "@/app/store";

export const DEMO_ACCOUNTS: Record<string, AuthUser> = {
  "player@demo.com": {
    _id: "u-player",
    email: "player@demo.com",
    status: "active",
    is_verified: true,
    name: "Alex Nguyen",
    sport_preference: ["badminton", "tennis", "pickleball"],
    reputation_score: 755,
    role: "player",
    avatar: "https://api.dicebear.com/8.x/avataaars/svg?seed=Alex",
    ownedVenueIds: [],
  },
  "owner@demo.com": {
    _id: "u-owner",
    email: "owner@demo.com",
    status: "active",
    is_verified: true,
    name: "Minh Tran",
    sport_preference: ["tennis", "badminton"],
    reputation_score: 2100,
    role: "owner",
    avatar: "https://api.dicebear.com/8.x/avataaars/svg?seed=Minh",
    ownedVenueIds: ["v-001", "v-002", "v-003"],
  },
  "admin@demo.com": {
    _id: "u-admin",
    email: "admin@demo.com",
    status: "active",
    is_verified: true,
    name: "Admin System",
    sport_preference: [],
    reputation_score: 9999,
    role: "admin",
    avatar: "https://api.dicebear.com/8.x/avataaars/svg?seed=Admin",
    ownedVenueIds: [],
  },
};

// ─── Non-React getters (for API files / utilities) ────────────────────────────

/** Read JWT from Redux state — for use in Axios auth headers. */
export function getToken(): string | null {
  return store.getState().auth.token;
}

/** Read current user from Redux state — for use in mock API handlers. */
export function getCurrentUser(): AuthUser | null {
  return store.getState().auth.user;
}

/**
 * Subscribe to any Redux state change.
 * Returns an unsubscribe function (matches the original pub-sub API).
 * Note: fires on ALL store changes, not just auth. Prefer useAppSelector in React.
 */
export function subscribeAuth(fn: () => void): () => void {
  return store.subscribe(fn);
}

// ─── Auth actions (dispatch wrappers) ────────────────────────────────────────

/**
 * Maps { ApiUser + ApiProfile } from login response → AuthUser,
 * then dispatches loginSuccess to Redux (persisted to localStorage).
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
    role: "player",
    avatar: `https://api.dicebear.com/8.x/avataaars/svg?seed=${encodeURIComponent(profile.name)}`,
    ownedVenueIds: [],
  };
  store.dispatch(loginSuccess({ token, user: authUser }));
  return authUser;
}

/**
 * Demo shortcut — bypasses API, logs in as a demo account.
 * Dispatches loginSuccess with a fake JWT token.
 */
export function loginAs(email: string): AuthUser | null {
  const user = DEMO_ACCOUNTS[email.toLowerCase()] ?? null;
  if (user) {
    store.dispatch(
      loginSuccess({
        token: `mock_demo_${user._id}_${Date.now()}`,
        user,
      })
    );
  }
  return user;
}

/**
 * Log out — dispatches logout action.
 * Profile slice will auto-clear via its extraReducers.
 */
export function logout(): void {
  store.dispatch(logoutAction());
}

/** Patch a subset of the current user in Redux (e.g. after profile update). */
export function patchCurrentUser(patch: Partial<AuthUser>): void {
  store.dispatch(patchUser(patch));
}
