/**
 * Profile Store — wraps usersApi and maintains local cache
 *
 * Real API Routes:
 *   GET  /api/v1/users/me
 *     Response: { message, data: { user: { _id, email, status, is_verified }, profile: { _id, user_id, name, age, gender, sport_preference, skill_level, location, reputation_score } } }
 *
 *   PUT  /api/v1/users/profile
 *     Body:     { name?, age?, gender?, sport_preference?, skill_level?, location? }
 *     Response: { message: "User profile updated successfully.", data: { _id, user_id, name, age, gender, sport_preference, skill_level, location, reputation_score } }
 */

import type { UserProfile, Achievement, ActivityItem } from '../types/profile.types';

// ─── Achievements catalogue ───────────────────────────────────────────────────
const ALL_ACHIEVEMENTS: Achievement[] = [
  { id: 'first_booking', icon: '🎾', title: 'Court Rookie', description: 'Made your very first court booking', category: 'booking', xp: 50, unlockedAt: '2026-03-15T10:00:00Z', requirement: 'Make 1 booking' },
  { id: 'five_bookings', icon: '🔥', title: 'On Fire', description: "Booked courts 5 times — you're on a roll!", category: 'booking', xp: 150, unlockedAt: '2026-04-20T14:30:00Z', requirement: 'Make 5 bookings', progress: 100 },
  { id: 'ten_bookings', icon: '👑', title: 'Court King', description: 'Reached 10 total court bookings', category: 'booking', xp: 300, unlockedAt: null, requirement: 'Make 10 bookings', progress: 40 },
  { id: 'first_match', icon: '🤝', title: 'Team Player', description: 'Found your first sports match through Matchill', category: 'social', xp: 100, unlockedAt: '2026-03-20T09:00:00Z', requirement: 'Find 1 match' },
  { id: 'five_matches', icon: '⚡', title: 'Match Machine', description: 'Played 5 matches through Matchill', category: 'social', xp: 200, unlockedAt: null, requirement: 'Complete 5 matches', progress: 60 },
  { id: 'complete_profile', icon: '⭐', title: 'Rising Star', description: 'Filled in all profile information', category: 'skill', xp: 75, unlockedAt: '2026-03-16T11:00:00Z', requirement: 'Complete your profile 100%' },
  { id: 'three_sports', icon: '🏆', title: 'All-Rounder', description: 'Added 3+ sport preferences to your profile', category: 'skill', xp: 125, unlockedAt: null, requirement: 'Add 3 sport preferences', progress: 66 },
  { id: 'competitive', icon: '🎯', title: 'Tournament Ready', description: 'Reached Competitive skill level', category: 'skill', xp: 250, unlockedAt: null, requirement: 'Set skill level to Competitive', progress: 0 },
  { id: 'weekly_warrior', icon: '📅', title: 'Weekly Warrior', description: 'Booked a court 3 weeks in a row', category: 'loyalty', xp: 200, unlockedAt: null, requirement: 'Book courts 3 consecutive weeks', progress: 33 },
  { id: 'early_bird', icon: '🌅', title: 'Early Bird', description: 'Booked a morning slot before 8 AM', category: 'loyalty', xp: 80, unlockedAt: '2026-04-05T07:30:00Z', requirement: 'Book a slot before 08:00' },
  { id: 'refund_never', icon: '💎', title: 'No Regrets', description: 'Never cancelled a booking — true commitment', category: 'loyalty', xp: 300, unlockedAt: null, requirement: 'Make 10 bookings with 0 refunds', progress: 40 },
  { id: 'community_50', icon: '🌟', title: 'Community Hero', description: 'Sent 50+ messages to teammates', category: 'social', xp: 175, unlockedAt: null, requirement: 'Send 50 messages', progress: 24 },
];

const RECENT_ACTIVITY: ActivityItem[] = [
  { id: 'a1', type: 'booking', title: 'Booked Binh Thanh Basketball Center', subtitle: '2 slots · 150,000₫', date: '2026-05-07', icon: '🏀' },
  { id: 'a2', type: 'achievement', title: 'Achievement Unlocked: Early Bird', subtitle: '+80 XP earned', date: '2026-05-05', icon: '🌅' },
  { id: 'a3', type: 'match', title: 'Match Found via Matchill', subtitle: 'Badminton · Intermediate · Go Vap', date: '2026-04-28', icon: '🏸' },
  { id: 'a4', type: 'booking', title: 'Booked Go Vap Badminton Hall', subtitle: '3 slots · 240,000₫', date: '2026-04-22', icon: '🏸' },
  { id: 'a5', type: 'message', title: 'New match request accepted', subtitle: 'From: Tuan Pham', date: '2026-04-20', icon: '✉️' },
  { id: 'a6', type: 'achievement', title: 'Achievement Unlocked: On Fire', subtitle: '+150 XP earned', date: '2026-04-20', icon: '🔥' },
  { id: 'a7', type: 'booking', title: 'Booked District 7 Pickleball Club', subtitle: '1 slot · 100,000₫', date: '2026-04-12', icon: '🏓' },
  { id: 'a8', type: 'match', title: 'Posted Teammate request', subtitle: 'Badminton · District 3', date: '2026-04-08', icon: '🤝' },
];

// ─── Default profiles (field names match API response) ────────────────────────
const defaultProfiles: Record<string, UserProfile> = {
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
    // FE-only
    avatarUrl: 'https://images.unsplash.com/photo-1770664612860-1f69b26b1682?w=200&q=80',
    coverUrl: 'https://images.unsplash.com/photo-1613918431703-aa50889e3be9?w=1200&q=80',
    totalBookings: 4,
    totalMatchesPlayed: 3,
    rating: 4.8,
    reviewCount: 12,
    joinedAt: '2026-03-01T00:00:00Z',
    is_verified: true,
    achievements: ALL_ACHIEVEMENTS,
    recentActivity: RECENT_ACTIVITY,
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
    avatarUrl: 'https://api.dicebear.com/8.x/avataaars/svg?seed=Minh',
    coverUrl: 'https://images.unsplash.com/photo-1761941336817-1c258e7ef78c?w=1200&q=80',
    totalBookings: 12,
    totalMatchesPlayed: 28,
    rating: 4.9,
    reviewCount: 45,
    joinedAt: '2025-11-10T00:00:00Z',
    is_verified: true,
    achievements: ALL_ACHIEVEMENTS.map(a => ({ ...a, unlockedAt: a.unlockedAt ?? '2026-01-01T00:00:00Z' })),
    recentActivity: RECENT_ACTIVITY,
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
    avatarUrl: 'https://api.dicebear.com/8.x/avataaars/svg?seed=Admin',
    coverUrl: 'https://images.unsplash.com/photo-1761941336817-1c258e7ef78c?w=1200&q=80',
    totalBookings: 0,
    totalMatchesPlayed: 0,
    rating: 5.0,
    reviewCount: 0,
    joinedAt: '2025-01-01T00:00:00Z',
    is_verified: true,
    achievements: ALL_ACHIEVEMENTS.map(a => ({ ...a, unlockedAt: '2025-01-01T00:00:00Z' })),
    recentActivity: [],
  },
};

const _profiles = new Map<string, UserProfile>(Object.entries(defaultProfiles));
const _listeners = new Set<() => void>();

function emit() { _listeners.forEach(fn => fn()); }

export function subscribeProfile(fn: () => void) {
  _listeners.add(fn);
  return () => _listeners.delete(fn);
}

export function getProfile(userId: string): UserProfile | null {
  return _profiles.get(userId) ?? null;
}

/**
 * Patch the local profile cache.
 * In mock mode, also updates in-memory data.
 * In real mode, call usersApi.updateProfile() first, then call this with the API response data.
 */
export function updateProfile(userId: string, patch: Partial<UserProfile>): UserProfile | null {
  const existing = _profiles.get(userId);
  if (!existing) return null;
  const updated = { ...existing, ...patch };
  _profiles.set(userId, updated);
  emit();
  return updated;
}

/** Derive display level from reputation_score (FE-only calculation) */
export function getLevelProgress(reputation_score: number): {
  level: number;
  currentXp: number;
  nextLevelXp: number;
  pct: number;
} {
  const level = Math.min(50, Math.floor(reputation_score / 200) + 1);
  const levelBase = (level - 1) * 200;
  const nextLevelXp = 200;
  const currentXp = reputation_score - levelBase;
  const pct = Math.min(100, Math.round((currentXp / nextLevelXp) * 100));
  return { level, currentXp, nextLevelXp, pct };
}
