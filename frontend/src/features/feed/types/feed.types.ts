export type Sport = 'badminton' | 'tennis' | 'pickleball' | 'football' | 'basketball' | 'volleyball' | 'swimming' | 'table_tennis';

export interface FeedComment {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  createdAt: string;
  likedBy: string[];
}

export interface FeedPost {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  sport: Sport | null;
  location: string;
  content: string;
  images: string[];
  likedBy: string[];    // user IDs
  savedBy: string[];    // user IDs
  comments: FeedComment[];
  shareCount: number;
  createdAt: string;
}
