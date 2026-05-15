import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { UserStatus, UserRole } from '../types/auth.types';

export type { UserRole };

export interface AuthUser {
  _id: string;
  email: string;
  status: UserStatus;
  is_verified: boolean;
  name: string;
  sport_preference: string[];
  reputation_score: number;
  role: UserRole;
  avatar: string;
  ownedVenueIds: string[];
}

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

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginSuccess(state, action: PayloadAction<{ token: string; user: AuthUser }>) {
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.isAuthenticated = true;
    },
    logout(state) {
      state.token = null;
      state.user = null;
      state.isAuthenticated = false;
    },
    patchUser(state, action: PayloadAction<Partial<AuthUser>>) {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
  },
});

export const { loginSuccess, logout, patchUser } = authSlice.actions;
export default authSlice.reducer;
