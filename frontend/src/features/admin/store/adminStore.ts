/**
 * Admin Store — mock user management
 *
 * Real API Routes:
 *   GET  /api/admin/users              → { data: AdminUser[], total, page }
 *     Query: ?search=&role=&status=&page=
 *   GET  /api/admin/users/:id          → { data: AdminUser }
 *   PATCH /api/admin/users/:id/role    → { data: AdminUser }  Body: { role }
 *   PATCH /api/admin/users/:id/status  → { data: AdminUser }  Body: { status }
 *   DELETE /api/admin/users/:id        → { success }
 *   GET  /api/admin/stats              → { data: AdminStats }
 */

import type { UserRole } from '../../auth/store/authStore';

export type UserStatus = 'active' | 'suspended' | 'pending_verification';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  avatar: string;
  city: string;
  joinedAt: string;
  lastActiveAt: string;
  totalBookings: number;
  totalRevenue: number;  // only for owners
  sportPreferences: string[];
  ownedVenueCount: number;
  isFlagged: boolean;
  flagReason?: string;
}

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  newThisWeek: number;
  totalPlayers: number;
  totalOwners: number;
  totalAdmins: number;
  totalBookings: number;
  totalRevenue: number;
  pendingVerification: number;
}

// ─── Mock data ────────────────────────────────────────────────────────────────
let _users: AdminUser[] = [
  {
    id: 'u-player', name: 'Alex Nguyen', email: 'player@demo.com', role: 'user',
    status: 'active', avatar: 'https://api.dicebear.com/8.x/avataaars/svg?seed=Alex',
    city: 'Ho Chi Minh City', joinedAt: '2026-03-01', lastActiveAt: '2026-05-08',
    totalBookings: 4, totalRevenue: 0, sportPreferences: ['badminton', 'tennis'], ownedVenueCount: 0, isFlagged: false,
  },
  {
    id: 'u-owner', name: 'Minh Tran', email: 'owner@demo.com', role: 'owner',
    status: 'active', avatar: 'https://api.dicebear.com/8.x/avataaars/svg?seed=Minh',
    city: 'Ho Chi Minh City', joinedAt: '2025-11-10', lastActiveAt: '2026-05-08',
    totalBookings: 12, totalRevenue: 24_000_000, sportPreferences: ['tennis'], ownedVenueCount: 3, isFlagged: false,
  },
  {
    id: 'u-admin', name: 'Admin System', email: 'admin@demo.com', role: 'admin',
    status: 'active', avatar: 'https://api.dicebear.com/8.x/avataaars/svg?seed=Admin',
    city: 'Ho Chi Minh City', joinedAt: '2025-01-01', lastActiveAt: '2026-05-08',
    totalBookings: 0, totalRevenue: 0, sportPreferences: [], ownedVenueCount: 0, isFlagged: false,
  },
  {
    id: 'u-004', name: 'Linh Pham', email: 'linh.pham@gmail.com', role: 'user',
    status: 'active', avatar: 'https://api.dicebear.com/8.x/avataaars/svg?seed=Linh',
    city: 'Hanoi', joinedAt: '2026-01-15', lastActiveAt: '2026-05-06',
    totalBookings: 8, totalRevenue: 0, sportPreferences: ['badminton', 'volleyball'], ownedVenueCount: 0, isFlagged: false,
  },
  {
    id: 'u-005', name: 'Tuan Vo', email: 'tuanvo.hcm@email.com', role: 'user',
    status: 'active', avatar: 'https://api.dicebear.com/8.x/avataaars/svg?seed=Tuan',
    city: 'Ho Chi Minh City', joinedAt: '2026-02-20', lastActiveAt: '2026-05-05',
    totalBookings: 2, totalRevenue: 0, sportPreferences: ['football', 'basketball'], ownedVenueCount: 0, isFlagged: false,
  },
  {
    id: 'u-006', name: 'Hoa Nguyen', email: 'hoa.nguyen@ymail.com', role: 'user',
    status: 'suspended', avatar: 'https://api.dicebear.com/8.x/avataaars/svg?seed=Hoa',
    city: 'Da Nang', joinedAt: '2026-01-05', lastActiveAt: '2026-04-10',
    totalBookings: 1, totalRevenue: 0, sportPreferences: ['tennis'], ownedVenueCount: 0,
    isFlagged: true, flagReason: 'No-show on 2 consecutive bookings',
  },
  {
    id: 'u-007', name: 'Duc Le', email: 'duc.le.sports@gmail.com', role: 'owner',
    status: 'pending_verification', avatar: 'https://api.dicebear.com/8.x/avataaars/svg?seed=Duc',
    city: 'Ho Chi Minh City', joinedAt: '2026-04-28', lastActiveAt: '2026-05-02',
    totalBookings: 0, totalRevenue: 0, sportPreferences: ['badminton'], ownedVenueCount: 1,
    isFlagged: false,
  },
  {
    id: 'u-008', name: 'Phuong Trinh', email: 'phuongtrinh@outlook.com', role: 'user',
    status: 'active', avatar: 'https://api.dicebear.com/8.x/avataaars/svg?seed=Phuong',
    city: 'Ho Chi Minh City', joinedAt: '2026-03-10', lastActiveAt: '2026-05-07',
    totalBookings: 6, totalRevenue: 0, sportPreferences: ['pickleball', 'tennis'], ownedVenueCount: 0, isFlagged: false,
  },
  {
    id: 'u-009', name: 'Nam Bui', email: 'nambui.athlete@gmail.com', role: 'user',
    status: 'active', avatar: 'https://api.dicebear.com/8.x/avataaars/svg?seed=Nam',
    city: 'Can Tho', joinedAt: '2026-02-14', lastActiveAt: '2026-05-04',
    totalBookings: 3, totalRevenue: 0, sportPreferences: ['football'], ownedVenueCount: 0, isFlagged: false,
  },
  {
    id: 'u-010', name: 'Thu Ha', email: 'thuha.sport@gmail.com', role: 'owner',
    status: 'active', avatar: 'https://api.dicebear.com/8.x/avataaars/svg?seed=Thu',
    city: 'Ho Chi Minh City', joinedAt: '2025-12-01', lastActiveAt: '2026-05-08',
    totalBookings: 5, totalRevenue: 8_400_000, sportPreferences: ['volleyball'], ownedVenueCount: 2, isFlagged: false,
  },
  {
    id: 'u-011', name: 'Khoa Dang', email: 'khoadang.hcm@icloud.com', role: 'user',
    status: 'active', avatar: 'https://api.dicebear.com/8.x/avataaars/svg?seed=Khoa',
    city: 'Binh Duong', joinedAt: '2026-04-01', lastActiveAt: '2026-05-03',
    totalBookings: 1, totalRevenue: 0, sportPreferences: ['basketball'], ownedVenueCount: 0, isFlagged: false,
  },
  {
    id: 'u-012', name: 'My Hanh', email: 'myhanh.badminton@gmail.com', role: 'user',
    status: 'suspended', avatar: 'https://api.dicebear.com/8.x/avataaars/svg?seed=My',
    city: 'Ho Chi Minh City', joinedAt: '2026-01-20', lastActiveAt: '2026-03-15',
    totalBookings: 0, totalRevenue: 0, sportPreferences: ['badminton'],
    ownedVenueCount: 0, isFlagged: true, flagReason: 'Abusive messages to other players',
  },
  {
    id: 'u-013', name: 'Viet Hung', email: 'viethung.court@mail.com', role: 'owner',
    status: 'active', avatar: 'https://api.dicebear.com/8.x/avataaars/svg?seed=Viet',
    city: 'Vung Tau', joinedAt: '2025-10-15', lastActiveAt: '2026-05-06',
    totalBookings: 20, totalRevenue: 32_500_000, sportPreferences: ['volleyball', 'football'], ownedVenueCount: 1, isFlagged: false,
  },
  {
    id: 'u-014', name: 'Lan Anh', email: 'lananh.tennis@gmail.com', role: 'user',
    status: 'pending_verification', avatar: 'https://api.dicebear.com/8.x/avataaars/svg?seed=Lan',
    city: 'Ha Noi', joinedAt: '2026-05-01', lastActiveAt: '2026-05-01',
    totalBookings: 0, totalRevenue: 0, sportPreferences: ['tennis'],
    ownedVenueCount: 0, isFlagged: false,
  },
  {
    id: 'u-015', name: 'Duy Anh', email: 'duyanh.sports@gmail.com', role: 'user',
    status: 'active', avatar: 'https://api.dicebear.com/8.x/avataaars/svg?seed=Duy',
    city: 'Ho Chi Minh City', joinedAt: '2026-03-22', lastActiveAt: '2026-05-07',
    totalBookings: 7, totalRevenue: 0, sportPreferences: ['pickleball', 'badminton'], ownedVenueCount: 0, isFlagged: false,
  },
];

const _listeners = new Set<() => void>();
function emit() { _listeners.forEach(fn => fn()); }

export function subscribeAdmin(fn: () => void) {
  _listeners.add(fn);
  return () => _listeners.delete(fn);
}

export function getAdminUsers(): AdminUser[] {
  return [..._users];
}

export function getAdminStats(): AdminStats {
  const total = _users.length;
  return {
    totalUsers: total,
    activeUsers: _users.filter(u => u.status === 'active').length,
    suspendedUsers: _users.filter(u => u.status === 'suspended').length,
    newThisWeek: 3,
    totalPlayers: _users.filter(u => u.role === 'user').length,
    totalOwners: _users.filter(u => u.role === 'owner').length,
    totalAdmins: _users.filter(u => u.role === 'admin').length,
    totalBookings: _users.reduce((s, u) => s + u.totalBookings, 0),
    totalRevenue: _users.reduce((s, u) => s + u.totalRevenue, 0),
    pendingVerification: _users.filter(u => u.status === 'pending_verification').length,
  };
}

export function updateUserRole(userId: string, role: UserRole): boolean {
  const idx = _users.findIndex(u => u.id === userId);
  if (idx === -1) return false;
  _users = [..._users];
  _users[idx] = { ..._users[idx], role };
  emit();
  return true;
}

export function updateUserStatus(userId: string, status: UserStatus): boolean {
  const idx = _users.findIndex(u => u.id === userId);
  if (idx === -1) return false;
  _users = [..._users];
  _users[idx] = { ..._users[idx], status };
  emit();
  return true;
}

export function deleteUser(userId: string): boolean {
  const before = _users.length;
  _users = _users.filter(u => u.id !== userId);
  const deleted = _users.length < before;
  if (deleted) emit();
  return deleted;
}
