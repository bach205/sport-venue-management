import { store } from "../../../app/store";
import { loginSuccess, logout as logoutAction, patchUser } from "./authSlice";
import type { ApiUser, ApiProfile } from "../types/auth.types";

export type { AuthUser, UserRole } from "./authSlice";
export type { UserStatus } from "../types/auth.types";

import type { AuthUser, UserRole } from "./authSlice";

export const DEMO_ACCOUNTS: Record<string, AuthUser> = {
  "player@demo.com": {
    _id: "u-player",
    email: "player@demo.com",
    status: "active",
    is_verified: true,
    name: "Alex Nguyen",
    sport_preference: ["badminton", "tennis", "pickleball"],
    reputation_score: 755,
    role: "user",
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

export function getToken(): string | null {
  return store.getState().auth.token;
}

export function getCurrentUser(): AuthUser | null {
  return store.getState().auth.user;
}

// Fires on ALL store changes — prefer useAppSelector in React components.
export function subscribeAuth(fn: () => void): () => void {
  return store.subscribe(fn);
}

export function loginWithApiData(token: string, user: ApiUser, profile: ApiProfile): AuthUser {
  // Map server role "user" to frontend role "player"
  let role: UserRole = "user";
  if (user.role === "admin") role = "admin";
  if (user.role === "owner") role = "owner";

  const authUser: AuthUser = {
    _id: user._id,
    email: user.email,
    status: user.status,
    is_verified: user.is_verified,
    name: profile.name,
    sport_preference: profile.sport_preference,
    reputation_score: profile.reputation_score,
    role: user.role ?? "user",
    avatar: `https://api.dicebear.com/8.x/avataaars/svg?seed=${encodeURIComponent(profile.name)}`,
    ownedVenueIds: [],
  };
  store.dispatch(loginSuccess({ token, user: authUser }));
  return authUser;
}

export function loginAs(email: string): AuthUser | null {
  const user = DEMO_ACCOUNTS[email.toLowerCase()] ?? null;
  if (user) {
    store.dispatch(loginSuccess({ token: `mock_demo_${user._id}_${Date.now()}`, user }));
  }
  return user;
}

export function logout(): void {
  store.dispatch(logoutAction());
}

export function patchCurrentUser(patch: Partial<AuthUser>): void {
  store.dispatch(patchUser(patch));
}
