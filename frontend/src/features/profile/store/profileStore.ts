/**
 * Profile Store — FE-only display data
 *
 * This store does NOT call any API. It holds data that is not returned by the
 * server (achievements, activity feed, avatar/cover URLs, stats) and provides
 * utility helpers for the profile feature.
 *
 * For API calls (GET /users/me, PUT /users/profile) use:
 *   → src/features/profile/api/profileApi.ts
 */

import type { Achievement, ActivityItem } from '../types/profile.types';

// ─── Achievements catalogue ───────────────────────────────────────────────────

const ALL_ACHIEVEMENTS: Achievement[] = [
  { id: 'first_booking',  icon: '🎾', title: 'Tân binh sân đấu',      description: 'Thực hiện lượt đặt sân đầu tiên của bạn',                     category: 'booking', xp: 50,  unlockedAt: '2026-03-15T10:00:00Z', requirement: 'Đạt 1 lượt đặt sân' },
  { id: 'five_bookings',  icon: '🔥', title: 'Phong độ thăng hoa',            description: 'Đặt sân thành công 5 lần — bạn đang làm rất tốt!',             category: 'booking', xp: 150, unlockedAt: '2026-04-20T14:30:00Z', requirement: 'Đạt 5 lượt đặt sân', progress: 100 },
  { id: 'ten_bookings',   icon: '👑', title: 'Vua sân đấu',         description: 'Đạt tổng cộng 10 lượt đặt sân thành công',                       category: 'booking', xp: 300, unlockedAt: null,                   requirement: 'Đạt 10 lượt đặt sân', progress: 40 },
  { id: 'first_match',    icon: '🤝', title: 'Đồng đội mẫu mực',        description: 'Tìm được trận đấu đầu tiên thông qua Matchill',        category: 'social',  xp: 100, unlockedAt: '2026-03-20T09:00:00Z', requirement: 'Tìm được 1 trận đấu' },
  { id: 'five_matches',   icon: '⚡', title: 'Kẻ hủy diệt ghép cặp',      description: 'Đã thi đấu 5 trận thông qua Matchill',                     category: 'social',  xp: 200, unlockedAt: null,                   requirement: 'Hoàn thành 5 trận đấu', progress: 60 },
  { id: 'complete_profile',icon: '⭐',title: 'Rising Star',        description: 'Điền đầy đủ tất cả thông tin hồ sơ của bạn',                     category: 'skill',   xp: 75,  unlockedAt: '2026-03-16T11:00:00Z', requirement: 'Hoàn thiện hồ sơ 100%' },
  { id: 'three_sports',   icon: '🏆', title: 'Chiến binh đa năng',        description: 'Thêm 3 môn thể thao yêu thích trở lên vào hồ sơ',            category: 'skill',   xp: 125, unlockedAt: null,                   requirement: 'Thêm 3 môn thể thao yêu thích', progress: 66 },
  { id: 'competitive',    icon: '🎯', title: 'Sẵn sàng thi đấu',   description: 'Đạt trình độ kỹ năng Cạnh tranh',                       category: 'skill',   xp: 250, unlockedAt: null,                   requirement: 'Đặt trình độ là Cạnh tranh', progress: 0 },
  { id: 'weekly_warrior', icon: '📅', title: 'Chiến binh hàng tuần',     description: 'Đặt sân 3 tuần liên tiếp',                       category: 'loyalty', xp: 200, unlockedAt: null,                   requirement: 'Đặt sân 3 tuần liên tiếp', progress: 33 },
  { id: 'early_bird',     icon: '🌅', title: 'Chú chim sớm mai',         description: 'Đặt khung giờ sáng sớm trước 8:00 sáng',                     category: 'loyalty', xp: 80,  unlockedAt: '2026-04-05T07:30:00Z', requirement: 'Đặt khung giờ trước 08:00' },
  { id: 'refund_never',   icon: '💎', title: 'Không hối tiếc',         description: 'Chưa bao giờ hủy lịch đặt sân — một cam kết thực sự!',           category: 'loyalty', xp: 300, unlockedAt: null,                   requirement: 'Đạt 10 lượt đặt sân và không hoàn tiền', progress: 40 },
  { id: 'community_50',   icon: '🌟', title: 'Anh hùng cộng đồng',     description: 'Gửi hơn 50 tin nhắn cho đồng đội',                        category: 'social',  xp: 175, unlockedAt: null,                   requirement: 'Gửi 50 tin nhắn', progress: 24 },
];

const RECENT_ACTIVITY: ActivityItem[] = [
  { id: 'a1', type: 'booking',     title: 'Đã đặt Sân bóng rổ Bình Thạnh', subtitle: '2 khung giờ · 150.000₫',         date: '2026-05-07', icon: '🏀' },
  { id: 'a2', type: 'achievement', title: 'Mở khóa thành tựu: Chú chim sớm mai',    subtitle: 'Nhận +80 XP',              date: '2026-05-05', icon: '🌅' },
  { id: 'a3', type: 'match',       title: 'Tìm thấy trận đấu qua Matchill',            subtitle: 'Cầu lông · Trung bình · Gò Vấp', date: '2026-04-28', icon: '🏸' },
  { id: 'a4', type: 'booking',     title: 'Đã đặt Nhà thi đấu Cầu lông Gò Vấp',        subtitle: '3 khung giờ · 240.000₫',         date: '2026-04-22', icon: '🏸' },
  { id: 'a5', type: 'message',     title: 'Đã chấp nhận yêu cầu ghép cặp mới',          subtitle: 'Từ: Tuấn Phạm',             date: '2026-04-20', icon: '✉️' },
  { id: 'a6', type: 'achievement', title: 'Mở khóa thành tựu: Phong độ thăng hoa',       subtitle: 'Nhận +150 XP',             date: '2026-04-20', icon: '🔥' },
  { id: 'a7', type: 'booking',     title: 'Đã đặt CLB Pickleball Quận 7',   subtitle: '1 khung giờ · 100.000₫',          date: '2026-04-12', icon: '🏓' },
  { id: 'a8', type: 'match',       title: 'Đã đăng yêu cầu tìm đồng đội',             subtitle: 'Cầu lông · Quận 3',     date: '2026-04-08', icon: '🤝' },
];

// ─── FE-only display data (not returned by API) ───────────────────────────────

export interface FEProfileData {
  avatarUrl: string;
  coverUrl: string;
  totalBookings: number;
  totalMatchesPlayed: number;
  rating: number;
  reviewCount: number;
  joinedAt: string;
  achievements: Achievement[];
  recentActivity: ActivityItem[];
}

const FE_DATA: Record<string, FEProfileData> = {
  'u-player': {
    avatarUrl: 'https://images.unsplash.com/photo-1770664612860-1f69b26b1682?w=200&q=80',
    coverUrl:  'https://images.unsplash.com/photo-1613918431703-aa50889e3be9?w=1200&q=80',
    totalBookings: 4,
    totalMatchesPlayed: 3,
    rating: 4.8,
    reviewCount: 12,
    joinedAt: '2026-03-01T00:00:00Z',
    achievements: ALL_ACHIEVEMENTS,
    recentActivity: RECENT_ACTIVITY,
  },
  'u-owner': {
    avatarUrl: 'https://api.dicebear.com/8.x/avataaars/svg?seed=Minh',
    coverUrl:  'https://images.unsplash.com/photo-1761941336817-1c258e7ef78c?w=1200&q=80',
    totalBookings: 12,
    totalMatchesPlayed: 28,
    rating: 4.9,
    reviewCount: 45,
    joinedAt: '2025-11-10T00:00:00Z',
    achievements: ALL_ACHIEVEMENTS.map(a => ({ ...a, unlockedAt: a.unlockedAt ?? '2026-01-01T00:00:00Z' })),
    recentActivity: RECENT_ACTIVITY,
  },
  'u-admin': {
    avatarUrl: 'https://api.dicebear.com/8.x/avataaars/svg?seed=Admin',
    coverUrl:  'https://images.unsplash.com/photo-1761941336817-1c258e7ef78c?w=1200&q=80',
    totalBookings: 0,
    totalMatchesPlayed: 0,
    rating: 5.0,
    reviewCount: 0,
    joinedAt: '2025-01-01T00:00:00Z',
    achievements: ALL_ACHIEVEMENTS.map(a => ({ ...a, unlockedAt: '2025-01-01T00:00:00Z' })),
    recentActivity: [],
  },
};

const DEFAULT_FE_DATA: FEProfileData = {
  avatarUrl: 'https://api.dicebear.com/8.x/avataaars/svg?seed=default',
  coverUrl:  'https://images.unsplash.com/photo-1613918431703-aa50889e3be9?w=1200&q=80',
  totalBookings: 0,
  totalMatchesPlayed: 0,
  rating: 0,
  reviewCount: 0,
  joinedAt: new Date().toISOString(),
  achievements: ALL_ACHIEVEMENTS.map(a => ({ ...a, unlockedAt: null })),
  recentActivity: [],
};

/** Returns FE-only display data for a user. Never calls the API. */
export function getFEOnlyData(userId: string): FEProfileData {
  return FE_DATA[userId] ?? DEFAULT_FE_DATA;
}

/** Derive display level from reputation_score (pure FE utility). */
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
