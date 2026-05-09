import type { Sport, SkillLevel } from '../../discover/types/discover.types';

export type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say';

export interface Achievement {
  id: string;
  icon: string;
  title: string;
  description: string;
  category: 'booking' | 'social' | 'skill' | 'loyalty';
  xp: number;
  unlockedAt: string | null; // null = locked
  progress?: number;          // 0–100 for locked achievements
  requirement?: string;       // e.g. "Make 5 bookings"
}

export interface ActivityItem {
  id: string;
  type: 'booking' | 'match' | 'message' | 'achievement';
  title: string;
  subtitle: string;
  date: string;
  icon: string;
}

export interface UserProfile {
  userId: string;
  displayName: string;
  bio: string;
  avatarUrl: string;
  coverUrl: string;
  age: number | null;
  gender: Gender;
  city: string;
  sportPreferences: Sport[];
  skillLevel: SkillLevel;
  totalBookings: number;
  totalMatchesPlayed: number;
  rating: number;
  reviewCount: number;
  joinedAt: string;
  isVerified: boolean;
  level: number;   // 1–50
  xp: number;
  achievements: Achievement[];
  recentActivity: ActivityItem[];
}
