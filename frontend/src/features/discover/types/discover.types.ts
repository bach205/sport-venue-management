export type Sport = 'tennis' | 'basketball' | 'badminton' | 'football' | 'pickleball' | 'volleyball';
export type SkillLevel = 'casual' | 'intermediate' | 'competitive';
export type PostType = 'teammate' | 'opponent';

export interface PostAuthor {
  id: string;
  name: string;
  avatar: string;
  rating: number;
  postsCount: number;
}

export interface DiscoverPost {
  id: string;
  author: PostAuthor;
  sport: Sport;
  location: string;
  time: string;
  skillLevel: SkillLevel;
  playersNeeded: number;
  currentPlayers: number;
  type: PostType;
  description: string;
  createdAt: string;
}

export interface CreatePostPayload {
  sport: Sport;
  location: string;
  time: string;
  skillLevel: SkillLevel;
  playersNeeded: number;
  type: PostType;
  description: string;
}

export interface DiscoverFilters {
  sport: Sport | 'all';
  skillLevel: SkillLevel | 'all';
  type: PostType | 'all';
  search: string;
}
