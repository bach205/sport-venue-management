/**
 * Profile Slice — Redux source of truth for the loaded user profile.
 *
 * State is persisted to localStorage via redux-persist (see src/app/store/index.ts).
 * On app load the cached profile is rehydrated immediately (stale-while-revalidate).
 * ProfilePage always calls getMe() on mount to refresh from API.
 *
 * Automatic cleanup: when auth/logout is dispatched, this slice clears itself
 * via extraReducers — no need to manually dispatch clearProfile on logout.
 *
 * For API calls (GET /users/me, PUT /users/profile) see:
 *   → src/features/profile/api/profileApi.ts
 *
 * For FE-only display data (achievements, activity, avatar) see:
 *   → src/features/profile/store/profileStore.ts
 */

import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { logout } from '../../auth/store/authSlice';
import type { UserProfile } from '../types/profile.types';

// ─── State ────────────────────────────────────────────────────────────────────

export type ProfileStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

interface ProfileState {
  data: UserProfile | null;
  status: ProfileStatus;
  error: string | null;
}

const initialState: ProfileState = {
  data: null,
  status: 'idle',
  error: null,
};

// ─── Slice ────────────────────────────────────────────────────────────────────

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    /** Mark as loading before calling getMe(). */
    fetchProfileStart(state) {
      state.status = 'loading';
      state.error = null;
    },

    /** Called when getMe() succeeds — stores merged API + FE-only profile. */
    fetchProfileSuccess(state, action: PayloadAction<UserProfile>) {
      state.data = action.payload;
      state.status = 'succeeded';
      state.error = null;
    },

    /** Called when getMe() fails. */
    fetchProfileFailed(state, action: PayloadAction<string>) {
      state.status = 'failed';
      state.error = action.payload;
    },

    /**
     * Patch profile fields after a successful updateProfile() call.
     * Merges API response fields into the existing state.data.
     */
    updateProfileData(state, action: PayloadAction<Partial<UserProfile>>) {
      if (state.data) {
        state.data = { ...state.data, ...action.payload };
      }
    },

    /** Manually clear profile (e.g. when switching accounts). */
    clearProfile(state) {
      state.data = null;
      state.status = 'idle';
      state.error = null;
    },
  },

  /** Auto-clear profile when the user logs out. */
  extraReducers: (builder) => {
    builder.addCase(logout, (state) => {
      state.data = null;
      state.status = 'idle';
      state.error = null;
    });
  },
});

export const {
  fetchProfileStart,
  fetchProfileSuccess,
  fetchProfileFailed,
  updateProfileData,
  clearProfile,
} = profileSlice.actions;

export default profileSlice.reducer;
