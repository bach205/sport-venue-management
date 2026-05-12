/**
 * Auth Slice — Redux source of truth for authentication.
 *
 * State is persisted to localStorage via redux-persist (see src/app/store/index.ts).
 *
 * Consumers:
 *   - React components  → useAppSelector(state => state.auth), useAppDispatch()
 *   - Non-React code    → authStore.ts (thin bridge over store.getState / store.dispatch)
 */

import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { UserStatus } from '../types/auth.types';

// ─── Types ────────────────────────────────────────────────────────────────────

export type UserRole = 'player' | 'owner' | 'admin';

/**
 * Internal FE auth user — combines data from API `user` + `profile` objects.
 * API-sourced fields use snake_case to match the server exactly.
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
  // FE-only (not from API)
  role: UserRole;
  avatar: string;
  ownedVenueIds: string[];
}

// ─── State ────────────────────────────────────────────────────────────────────

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  token: null,
  user: null,
  isAuthenticated: false,
};

// ─── Slice ────────────────────────────────────────────────────────────────────

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    /**
     * Called after a successful login (both real API and demo).
     * Stores JWT token + mapped AuthUser into state → persisted to localStorage.
     */
    loginSuccess(state, action: PayloadAction<{ token: string; user: AuthUser }>) {
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.isAuthenticated = true;
    },

    /**
     * Clear auth state on logout.
     * ProfileSlice listens to this action via extraReducers to clear profile too.
     */
    logout(state) {
      state.token = null;
      state.user = null;
      state.isAuthenticated = false;
    },

    /** Patch a subset of the current user (e.g. after profile update). */
    patchUser(state, action: PayloadAction<Partial<AuthUser>>) {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
  },
});

export const { loginSuccess, logout, patchUser } = authSlice.actions;
export default authSlice.reducer;
