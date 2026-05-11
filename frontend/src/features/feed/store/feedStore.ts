/**
 * Feed Store — in-memory social posts
 *
 * Real API Routes:
 *   GET  /api/feed                        → { data: FeedPost[], total, cursor }
 *     Query: ?sport=&location=&cursor=
 *   POST /api/feed                        → { data: FeedPost }
 *     Body: { content, sport?, location?, images[] }
 *   POST /api/feed/:id/like               → { data: { likedBy: string[] } }
 *   DELETE /api/feed/:id/like             → { data: { likedBy: string[] } }
 *   POST /api/feed/:id/save               → { data: { savedBy: string[] } }
 *   DELETE /api/feed/:id/save             → { data: { savedBy: string[] } }
 *   POST /api/feed/:id/comments           → { data: FeedComment }
 *     Body: { content }
 *   POST /api/feed/:id/comments/:cid/like → { data: FeedComment }
 *   DELETE /api/feed/:postId              → { success }
 */

import type { FeedPost, FeedComment, Sport } from '../types/feed.types';

const IMG_BADMINTON  = 'https://images.unsplash.com/photo-1771854400123-2a23cb720c04?w=900&q=80';
const IMG_TENNIS     = 'https://images.unsplash.com/photo-1756477558468-b3e485757470?w=900&q=80';
const IMG_FOOTBALL   = 'https://images.unsplash.com/photo-1772388196724-71af87cee7df?w=900&q=80';
const IMG_SWIMMING   = 'https://images.unsplash.com/photo-1661370476755-6d8435ef9a4e?w=900&q=80';
const IMG_PICKLEBALL = 'https://images.unsplash.com/photo-1761644707612-adf8354c7576?w=900&q=80';
const IMG_BASKETBALL = 'https://images.unsplash.com/photo-1765301657537-1b0ea5325867?w=900&q=80';

function now(minutesAgo: number): string {
  return new Date(Date.now() - minutesAgo * 60 * 1000).toISOString();
}

let _posts: FeedPost[] = [
  {
    id: 'p-001',
    authorId: 'u-004',
    authorName: 'Nguyen Van Anh',
    authorAvatar: 'https://api.dicebear.com/8.x/avataaars/svg?seed=VanAnh',
    sport: 'badminton',
    location: 'Sân Sky Court Hoà Lạc, Thạch Thất, Hà Nội',
    content: 'Tìm 2 người chơi cầu lông doubles cuối tuần này 🏸 Sân Sky Court Hoà Lạc, thứ 7 lúc 7h sáng. Ai muốn tham gia comment bên dưới nhé!',
    images: [IMG_BADMINTON],
    likedBy: ['u-005', 'u-008', 'u-player'],
    savedBy: ['u-008'],
    comments: [
      {
        id: 'c-001-1',
        authorId: 'u-005',
        authorName: 'Tuan Vo',
        authorAvatar: 'https://api.dicebear.com/8.x/avataaars/svg?seed=Tuan',
        content: 'Mình quan tâm! Level intermediate có được không bạn? 😄',
        createdAt: now(100),
        likedBy: ['u-004'],
      },
      {
        id: 'c-001-2',
        authorId: 'u-008',
        authorName: 'Phuong Trinh',
        authorAvatar: 'https://api.dicebear.com/8.x/avataaars/svg?seed=Phuong',
        content: 'Mình cũng muốn tham gia nè! Cho mình xin SĐT để liên hệ nhé 🙏',
        createdAt: now(85),
        likedBy: [],
      },
    ],
    shareCount: 3,
    createdAt: now(120),
  },
  {
    id: 'p-002',
    authorId: 'u-015',
    authorName: 'Tran Thi Mai',
    authorAvatar: 'https://api.dicebear.com/8.x/avataaars/svg?seed=ThiMai',
    sport: 'tennis',
    location: 'Hoà Lạc Tennis Center, Thạch Thất',
    content: 'Trận tennis hôm qua cực đỉnh! Lần đầu tiên thắng set thứ 3 sau khi bị dẫn 0-2 🎾🔥 Cảm ơn đối thủ đã cạnh tranh nhiệt tình. See you next time!',
    images: [IMG_TENNIS, IMG_BADMINTON],
    likedBy: ['u-004', 'u-005', 'u-008', 'u-player', 'u-009'],
    savedBy: ['u-player', 'u-004'],
    comments: [
      {
        id: 'c-002-1',
        authorId: 'u-player',
        authorName: 'Alex Nguyen',
        authorAvatar: 'https://api.dicebear.com/8.x/avataaars/svg?seed=Alex',
        content: 'Đỉnh quá! Comeback từ 0-2 không phải ai cũng làm được 💪',
        createdAt: now(280),
        likedBy: ['u-015', 'u-004'],
      },
    ],
    shareCount: 7,
    createdAt: now(300),
  },
  {
    id: 'p-003',
    authorId: 'u-player',
    authorName: 'Alex Nguyen',
    authorAvatar: 'https://api.dicebear.com/8.x/avataaars/svg?seed=Alex',
    sport: 'pickleball',
    location: 'District 7 Pickleball Club, TP.HCM',
    content: '🏓 Ai chơi Pickleball ở Quận 7 không? Mình mới bắt đầu được 2 tháng, đang tìm partner level tương đương để luyện tập thêm vào buổi chiều tối. Drop a comment nhé!',
    images: [IMG_PICKLEBALL],
    likedBy: ['u-008', 'u-015'],
    savedBy: [],
    comments: [],
    shareCount: 2,
    createdAt: now(480),
  },
  {
    id: 'p-004',
    authorId: 'u-owner',
    authorName: 'Minh Tran',
    authorAvatar: 'https://api.dicebear.com/8.x/avataaars/svg?seed=Minh',
    sport: 'football',
    location: 'Sân Tao Đàn, Quận 1, TP.HCM',
    content: '⚽ Đội mình vừa thắng giải phong trào cuối tuần này! Score: 3-1 🏆 Cảm ơn toàn đội đã chiến đấu hết mình. Ai muốn gia nhập đội cho mùa giải sau thì inbox mình nhé — đang cần thêm midfield!',
    images: [IMG_FOOTBALL],
    likedBy: ['u-004', 'u-005', 'u-player', 'u-009', 'u-008', 'u-015'],
    savedBy: ['u-player'],
    comments: [
      {
        id: 'c-004-1',
        authorId: 'u-009',
        authorName: 'Nam Bui',
        authorAvatar: 'https://api.dicebear.com/8.x/avataaars/svg?seed=Nam',
        content: 'Gg ez 🔥 Chúc mừng đội nhé! Mình đá midfield được, cho mình join với!',
        createdAt: now(1200),
        likedBy: ['u-owner', 'u-004'],
      },
      {
        id: 'c-004-2',
        authorId: 'u-005',
        authorName: 'Tuan Vo',
        authorAvatar: 'https://api.dicebear.com/8.x/avataaars/svg?seed=Tuan',
        content: 'Đỉnh! Mùa sau cho mình xin thử với nhé anh 🙏',
        createdAt: now(1080),
        likedBy: [],
      },
    ],
    shareCount: 12,
    createdAt: now(1440),
  },
  {
    id: 'p-005',
    authorId: 'u-004',
    authorName: 'Nguyen Van Anh',
    authorAvatar: 'https://api.dicebear.com/8.x/avataaars/svg?seed=VanAnh',
    sport: 'swimming',
    location: 'Hồ bơi Lam Sơn, Bình Thạnh, TP.HCM',
    content: '🏊 Tips cải thiện kỹ thuật bơi freestyle từ 1:45/100m xuống 1:30/100m trong 3 tháng:\n\n1️⃣ Tập kick board 15 phút mỗi buổi\n2️⃣ Drill "catch-up" để cải thiện timing\n3️⃣ Video lại mình bơi để phát hiện lỗi kỹ thuật\n\nAi đang luyện bơi thì thử đi! 💪',
    images: [IMG_SWIMMING],
    likedBy: ['u-player', 'u-008', 'u-015', 'u-009'],
    savedBy: ['u-player', 'u-009', 'u-008'],
    comments: [
      {
        id: 'c-005-1',
        authorId: 'u-008',
        authorName: 'Phuong Trinh',
        authorAvatar: 'https://api.dicebear.com/8.x/avataaars/svg?seed=Phuong',
        content: 'Hữu ích quá! Mình đang stuck ở 1:50 mãi rồi. Cảm ơn bạn 🙏',
        createdAt: now(2100),
        likedBy: ['u-004'],
      },
    ],
    shareCount: 18,
    createdAt: now(2880),
  },
  {
    id: 'p-006',
    authorId: 'u-009',
    authorName: 'Nam Bui',
    authorAvatar: 'https://api.dicebear.com/8.x/avataaars/svg?seed=Nam',
    sport: 'basketball',
    location: 'Sân Binh Thanh Basketball Center, TP.HCM',
    content: '🏀 3v3 pickup game tối nay lúc 7pm tại sân Bình Thạnh! Còn 2 slot. Ai casual-intermediate thì nhảy vào. Không cần đăng ký trước, cứ đến là chơi 🤙',
    images: [IMG_BASKETBALL],
    likedBy: ['u-player', 'u-005'],
    savedBy: [],
    comments: [],
    shareCount: 5,
    createdAt: now(240),
  },
];

const _listeners = new Set<() => void>();
function emit() { _listeners.forEach(fn => fn()); }

export function subscribeFeed(fn: () => void) {
  _listeners.add(fn);
  return () => _listeners.delete(fn);
}

export function getPosts(sport?: Sport | null): FeedPost[] {
  const sorted = [..._posts].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  if (!sport) return sorted;
  return sorted.filter(p => p.sport === sport);
}

export function createPost(data: {
  authorId: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  sport: Sport | null;
  location: string;
  images: string[];
}): FeedPost {
  const post: FeedPost = {
    id: `p-${Date.now()}`,
    ...data,
    likedBy: [],
    savedBy: [],
    comments: [],
    shareCount: 0,
    createdAt: new Date().toISOString(),
  };
  _posts = [post, ..._posts];
  emit();
  return post;
}

export function toggleLike(postId: string, userId: string): void {
  _posts = _posts.map(p => {
    if (p.id !== postId) return p;
    const has = p.likedBy.includes(userId);
    return { ...p, likedBy: has ? p.likedBy.filter(id => id !== userId) : [...p.likedBy, userId] };
  });
  emit();
}

export function toggleSave(postId: string, userId: string): void {
  _posts = _posts.map(p => {
    if (p.id !== postId) return p;
    const has = p.savedBy.includes(userId);
    return { ...p, savedBy: has ? p.savedBy.filter(id => id !== userId) : [...p.savedBy, userId] };
  });
  emit();
}

export function addComment(postId: string, comment: {
  authorId: string;
  authorName: string;
  authorAvatar: string;
  content: string;
}): void {
  _posts = _posts.map(p => {
    if (p.id !== postId) return p;
    const newComment: FeedComment = {
      id: `c-${Date.now()}`,
      ...comment,
      createdAt: new Date().toISOString(),
      likedBy: [],
    };
    return { ...p, comments: [...p.comments, newComment] };
  });
  emit();
}

export function toggleCommentLike(postId: string, commentId: string, userId: string): void {
  _posts = _posts.map(p => {
    if (p.id !== postId) return p;
    return {
      ...p,
      comments: p.comments.map(c => {
        if (c.id !== commentId) return c;
        const has = c.likedBy.includes(userId);
        return { ...c, likedBy: has ? c.likedBy.filter(id => id !== userId) : [...c.likedBy, userId] };
      }),
    };
  });
  emit();
}

export function deletePost(postId: string, userId: string): boolean {
  const post = _posts.find(p => p.id === postId);
  if (!post || post.authorId !== userId) return false;
  _posts = _posts.filter(p => p.id !== postId);
  emit();
  return true;
}

export function incrementShare(postId: string): void {
  _posts = _posts.map(p =>
    p.id === postId ? { ...p, shareCount: p.shareCount + 1 } : p
  );
  emit();
}
