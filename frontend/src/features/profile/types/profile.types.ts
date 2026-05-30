import type { SportOptionValue, SkillLevelOptionValue } from '@/shared/constants/matchOptions';

/**
 * Profile types — field names match PUT /api/v1/users/profile and GET /api/v1/users/me responses exactly.
 *
 * API profile fields:
 *   _id, user_id, name, age, gender, sport_preference, skill_level, location, reputation_score
 */

export type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say';
export type SkillLevel = SkillLevelOptionValue;
export type Sport = SportOptionValue;

export interface Achievement {
  id: string;
  icon: string;
  title: string;
  description: string;
  category: 'booking' | 'social' | 'skill' | 'loyalty';
  xp: number;
  unlockedAt: string | null;
  progress?: number;    // 0–100 for locked achievements
  requirement?: string;
}

export interface ActivityItem {
  id: string;
  type: 'booking' | 'match' | 'message' | 'achievement';
  date: string;
  icon: string;
}

/**
 * Extended profile — wraps the API profile fields and adds FE-only display data.
 * API fields use snake_case to match server exactly.
 */
export interface UserProfile {
  // ── API fields (from GET /api/v1/users/me & PUT /api/v1/users/profile) ──
  _id: string;
  user_id: string;
  name: string;               // was displayName
  age: number | null;
  gender: Gender;
  sport_preference: Sport[];  // was sportPreferences
  skill_level: SkillLevel;    // was skillLevel
  location: string;           // was city
  reputation_score: number;   // was xp/level

  // ── FE-only display fields (not from API) ──
  avatarUrl: string;
  coverUrl: string;
  totalBookings: number;
  totalMatchesPlayed: number;
  rating: number;
  reviewCount: number;
  joinedAt: string;
  is_verified: boolean;       // mirrors user.is_verified
  achievements: Achievement[];
  recentActivity: ActivityItem[];
}
