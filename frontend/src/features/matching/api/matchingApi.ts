/**
 * Real-Time Matching API
 *
 * Routes:
 *   POST /api/matching/request
 *     Request:  { sport, location, date, time, skillLevel, type }
 *     Response: { success: true, data: { requestId: string } }
 *
 *   GET  /api/matching/request/:requestId/status
 *     Response: { success: true, data: { status: 'searching'|'matched'|'expired', result?: MatchResult } }
 *
 *   DELETE /api/matching/request/:requestId
 *     Response: { success: true, message: string }
 */

import axios from 'axios';
import { isMockApi, API_BASE_URL } from '../../../shared/constants/api';
import { getToken } from '@/features/auth/store/authStore';
import type { MatchRequest, MatchResult } from '../types/matching.types';

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

// Mock matched opponents pool
const MOCK_OPPONENTS = [
  {
    id: 'user-alex',
    name: 'Alex R.',
    avatar: 'avatar:85f2b1fcf9fbde97cb43de566e1fc58d7dc5f9a2',
    rating: 4.9,
    matchCount: 24,
    tier: 'Pro' as const,
  },
  {
    id: 'user-sarah',
    name: 'Sarah J.',
    avatar: 'avatar:768be8c6c602934c7f4f0c51ce322a03d7bc3607',
    rating: 4.8,
    matchCount: 18,
    tier: 'Pro' as const,
  },
  {
    id: 'user-marcus',
    name: 'Marcus C.',
    avatar: 'avatar:244cc22520475607918c3b4e0806b6cd19231fd4',
    rating: 4.5,
    matchCount: 31,
    tier: 'Semi-Pro' as const,
  },
  {
    id: 'user-linh',
    name: 'Linh N.',
    avatar: 'avatar:a0f2df621eb14a30acc7eee63a30e2de7f9d53d6',
    rating: 4.6,
    matchCount: 12,
    tier: 'Semi-Pro' as const,
  },
];

const MOCK_VENUES: Record<string, string[]> = {
  tennis: ['Sân Riverside', 'Sân số 3, Sân vận động chính'],
  basketball: ['Trung tâm Thể thao Downtown', 'Sân B, Tầng trên'],
  badminton: ['CLB Trong nhà Bình Thạnh', 'Nhà thi đấu 2, Sân số 1'],
  football: ['Khu Phức hợp Gò Vấp', 'Sân số 4, Khu Đông'],
  pickleball: ['Trung tâm Giải trí Thủ Đức', 'Sân số 6'],
  volleyball: ['Sân Bãi biển Quận 1', 'Khu A'],
};

export async function submitMatchRequest(
  req: MatchRequest
): Promise<{ success: boolean; requestId: string }> {
  // if (isMockApi) {
  //   await delay(300);
  //   return { success: true, requestId: `req-${Date.now()}` };
  // }
  const token = getToken();
  const time = req.date && req.time ? `${req.date}T${req.time}:00` : new Date().toISOString();
  const payload = {
    sport: req.sport,
    location: req.location,
    time,
    time_type: 'fixed',
    skill_level: req.skillLevel,
    match_type: req.type,
    number_of_players: 1,
  };
  const res = await axios.post(`${API_BASE_URL}/matching/requests`, payload, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  return res.data;
}

export async function simulateMatchSearch(
  req: MatchRequest,
  onProgress: (dots: number) => void
): Promise<MatchResult> {
  // Simulate 3-6 seconds search with progress
  const totalMs = 3000 + Math.random() * 3000;
  const interval = setInterval(() => {
    onProgress(Date.now());
  }, 600);

  await delay(totalMs);
  clearInterval(interval);

  // Pick random opponent
  const opponent = MOCK_OPPONENTS[Math.floor(Math.random() * MOCK_OPPONENTS.length)];
  const venues = MOCK_VENUES[req.sport] ?? ['Trung tâm Thể thao', 'Sân số 1'];

  const today = new Date();
  const timeDisplay = req.time
    ? `Hôm nay, ${req.time}`
    : `Hôm nay, ${today.getHours()}:${String(today.getMinutes()).padStart(2, '0')}`;

  return {
    requestId: `req-${Date.now()}`,
    sport: req.sport,
    skillLevel: req.skillLevel,
    venue: venues[0],
    venueDetail: venues[1],
    time: timeDisplay,
    opponent,
    conversationId: `conv-match-${Date.now()}`,
  };
}
