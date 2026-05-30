import type { Sport, SkillLevel, PostType } from '../../discover/types/discover.types';

export type MatchingStatus = 'idle' | 'searching' | 'matched' | 'expired';

export interface MatchRequest {
  sport: Sport;
  location: string;
  locationLat?: number;
  locationLng?: number;
  searchRadiusKm?: number;
  date: string;       // e.g. "2026-05-09"
  time: string;       // e.g. "18:00"
  skillLevel: SkillLevel;
  type: PostType;
}

export interface MatchedOpponent {
  id: string;
  name: string;
  avatar: string;
  rating: number;
  matchCount: number;
  tier: 'Rookie' | 'Semi-Pro' | 'Pro';
}

export interface MatchResult {
  matchId?: string;
  requestId: string;
  sport: Sport;
  skillLevel: SkillLevel;
  venue: string;
  venueDetail: string;
  time: string;       // display string e.g. "Today, 18:00"
  opponent: MatchedOpponent;
  conversationId: string;
}
