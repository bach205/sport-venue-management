/**
 * Simple in-memory auth store (demo only)
 * In production: integrate with Redux + JWT
 */

export type UserRole = 'player' | 'owner' | 'admin';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  /** Venue IDs owned by this user (only for 'owner' role) */
  ownedVenueIds: string[];
}

export const DEMO_ACCOUNTS: Record<string, AuthUser> = {
  'player@demo.com': {
    id: 'u-player',
    name: 'Alex Nguyen',
    email: 'player@demo.com',
    role: 'player',
    avatar: 'https://api.dicebear.com/8.x/avataaars/svg?seed=Alex',
    ownedVenueIds: [],
  },
  'owner@demo.com': {
    id: 'u-owner',
    name: 'Minh Tran',
    email: 'owner@demo.com',
    role: 'owner',
    avatar: 'https://api.dicebear.com/8.x/avataaars/svg?seed=Minh',
    ownedVenueIds: ['v-001', 'v-002', 'v-003'],
  },
  'admin@demo.com': {
    id: 'u-admin',
    name: 'Admin System',
    email: 'admin@demo.com',
    role: 'admin',
    avatar: 'https://api.dicebear.com/8.x/avataaars/svg?seed=Admin',
    ownedVenueIds: [],
  },
};

let _currentUser: AuthUser | null = null;
const _listeners = new Set<() => void>();

export function loginAs(email: string): AuthUser | null {
  const user = DEMO_ACCOUNTS[email] ?? null;
  _currentUser = user;
  _listeners.forEach(fn => fn());
  return user;
}

export function logout() {
  _currentUser = null;
  _listeners.forEach(fn => fn());
}

export function getCurrentUser(): AuthUser | null {
  return _currentUser;
}

export function subscribeAuth(fn: () => void): () => void {
  _listeners.add(fn);
  return () => _listeners.delete(fn);
}
