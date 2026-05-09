/**
 * Discover API
 *
 * Routes:
 *   GET  /api/discover
 *     Response: { success: true, data: DiscoverPost[] }
 *
 *   POST /api/discover
 *     Request:  { sport, location, time, skillLevel, playersNeeded, type, description }
 *     Response: { success: true, data: DiscoverPost }
 *
 *   GET  /api/discover/:id
 *     Response: { success: true, data: DiscoverPost }
 *
 *   DELETE /api/discover/:id
 *     Response: { success: true, message: string }
 */

import axios from 'axios';
import { isMockApi, API_BASE_URL } from '../../../shared/constants/api';
import type { DiscoverPost, CreatePostPayload } from '../types/discover.types';

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

// --- Mock Data ---
const MOCK_POSTS: DiscoverPost[] = [
  {
    id: 'post-1',
    author: {
      id: 'user-sarah',
      name: 'Sarah Jenkins',
      avatar: 'avatar:768be8c6c602934c7f4f0c51ce322a03d7bc3607',
      rating: 4.8,
      postsCount: 12,
    },
    sport: 'tennis',
    location: 'District 1 Sports Center, HCMC',
    time: '2026-05-09T07:00:00',
    skillLevel: 'intermediate',
    playersNeeded: 1,
    currentPlayers: 1,
    type: 'opponent',
    description: "Looking for a competitive 1v1 match this Saturday morning. I've been playing for 3 years, love a long rally. Bring your A-game! 🎾",
    createdAt: '2026-05-08T10:30:00',
  },
  {
    id: 'post-2',
    author: {
      id: 'user-marcus',
      name: 'Marcus Chen',
      avatar: 'avatar:244cc22520475607918c3b4e0806b6cd19231fd4',
      rating: 4.5,
      postsCount: 8,
    },
    sport: 'basketball',
    location: 'Lotte Mart Rooftop Court, District 7',
    time: '2026-05-10T16:00:00',
    skillLevel: 'competitive',
    playersNeeded: 2,
    currentPlayers: 4,
    type: 'teammate',
    description: 'Running a fast-paced 3v3 this Sunday afternoon. Need 2 more ballers who can handle defense and hit threes under pressure. 🏀',
    createdAt: '2026-05-08T09:15:00',
  },
  {
    id: 'post-3',
    author: {
      id: 'user-alex',
      name: 'Alex Rivera',
      avatar: 'avatar:85f2b1fcf9fbde97cb43de566e1fc58d7dc5f9a2',
      rating: 4.2,
      postsCount: 5,
    },
    sport: 'badminton',
    location: 'Binh Thanh Indoor Badminton Club',
    time: '2026-05-09T18:00:00',
    skillLevel: 'casual',
    playersNeeded: 1,
    currentPlayers: 3,
    type: 'teammate',
    description: 'Chill badminton doubles evening! We\'re 3 friends looking for 1 more to make an even 4. All skill levels welcome, vibes only 🏸',
    createdAt: '2026-05-08T08:00:00',
  },
  {
    id: 'post-4',
    author: {
      id: 'user-linh',
      name: 'Linh Nguyễn',
      avatar: 'avatar:a0f2df621eb14a30acc7eee63a30e2de7f9d53d6',
      rating: 4.6,
      postsCount: 20,
    },
    sport: 'football',
    location: 'Go Vap Sports Complex',
    time: '2026-05-10T08:00:00',
    skillLevel: 'intermediate',
    playersNeeded: 3,
    currentPlayers: 7,
    type: 'teammate',
    description: 'Organizing a 5v5 Sunday morning. Currently have 7 confirmed, need 3 more. Intermediate level, no dirty fouls please ⚽',
    createdAt: '2026-05-07T20:00:00',
  },
  {
    id: 'post-5',
    author: {
      id: 'user-james',
      name: 'James Park',
      avatar: 'avatar:95f383dad4232d71e1e9fb7cf04dfe3fdab3bd30',
      rating: 4.0,
      postsCount: 3,
    },
    sport: 'pickleball',
    location: 'Thu Duc Recreation Center',
    time: '2026-05-08T19:00:00',
    skillLevel: 'casual',
    playersNeeded: 1,
    currentPlayers: 3,
    type: 'teammate',
    description: 'Friendly pickleball tonight! Looking for one more doubles partner. Super chill game, beginners absolutely welcome 🏓',
    createdAt: '2026-05-08T11:45:00',
  },
  {
    id: 'post-6',
    author: {
      id: 'user-emma',
      name: 'Emma Torres',
      avatar: 'avatar:fd7d6df8e21abbc14fed92d1c6e27538c3dd4979',
      rating: 4.9,
      postsCount: 31,
    },
    sport: 'tennis',
    location: 'District 3 Tennis Club',
    time: '2026-05-09T09:00:00',
    skillLevel: 'competitive',
    playersNeeded: 1,
    currentPlayers: 1,
    type: 'teammate',
    description: 'Forming a competitive doubles team for weekend tournaments. Looking for a skilled partner with good net game. Let\'s win together! 🏆',
    createdAt: '2026-05-07T15:30:00',
  },
];

let _posts = [...MOCK_POSTS];

// --- API Functions ---

export async function fetchPosts(): Promise<{ success: boolean; data: DiscoverPost[] }> {
  if (isMockApi) {
    await delay(400);
    return { success: true, data: [..._posts] };
  }
  const res = await axios.get(`${API_BASE_URL}/discover`);
  return res.data;
}

export async function createPost(
  payload: CreatePostPayload
): Promise<{ success: boolean; data: DiscoverPost; message: string }> {
  if (isMockApi) {
    await delay(600);
    const newPost: DiscoverPost = {
      id: `post-${Date.now()}`,
      author: {
        id: 'current-user',
        name: 'You',
        avatar: '',
        rating: 4.5,
        postsCount: 1,
      },
      ...payload,
      currentPlayers: 1,
      createdAt: new Date().toISOString(),
    };
    _posts = [newPost, ..._posts];
    return { success: true, data: newPost, message: 'Post created successfully!' };
  }
  const res = await axios.post(`${API_BASE_URL}/discover`, payload);
  return res.data;
}