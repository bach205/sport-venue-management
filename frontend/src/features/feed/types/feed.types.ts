/** Author object embedded in every post and comment */
export interface ApiAuthor {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string | null;
}

/** Single post/listing as returned by GET /social/feed and POST /social/posts */
export interface ApiPost {
  id: string;
  content?: string;
  imageUrl?: string | null;
  intentType: "buy" | "sell";
  sport: string;
  category: string;
  itemType: string;
  title: string;
  details?: string;
  quantity: number;
  priceType: "fixed" | "range" | "negotiable" | "quote_requested";
  priceMin?: number;
  priceMax?: number;
  currency: string;
  condition?: "new" | "like_new" | "used";
  status: "open" | "matched" | "closed" | "expired";
  author: ApiAuthor;
  createdAt: string;
  updatedAt: string;
  likeCount: number;
  commentCount: number;
  isOwner: boolean;
  hasLiked: boolean;
}

export interface FeedFilters {
  intentType?: "buy" | "sell";
  sport?: string;
  category?: string;
  location?: string;
  priceType?: "fixed" | "range" | "negotiable" | "quote_requested";
  condition?: "new" | "like_new" | "used";
  status?: "open" | "matched" | "closed" | "expired";
  sort?: "newest" | "price_asc" | "price_desc" | "recently_active";
  page?: number;
  limit?: number;
}

/** Single comment as returned by GET/POST /social/posts/:id/comments */
export interface ApiComment {
  id: string;
  postId: string;
  content: string;
  author: ApiAuthor;
  createdAt: string;
  updatedAt: string;
  isOwner: boolean;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface FeedData {
  items: ApiPost[];
  pagination: Pagination;
  meta: { scope: string; query?: string };
}

export interface CommentsData {
  items: ApiComment[];
  pagination: Pagination;
}
