/** Author object embedded in every post and comment */
export interface ApiAuthor {
  id: string;
  email: string;
  name: string;
}

/** Single post as returned by GET /social/feed and POST /social/posts */
export interface ApiPost {
  id: string;
  content: string;
  author: ApiAuthor;
  createdAt: string;
  updatedAt: string;
  likeCount: number;
  commentCount: number;
  isOwner: boolean;
  hasLiked: boolean;
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
  meta: { scope: string };
}

export interface CommentsData {
  items: ApiComment[];
  pagination: Pagination;
}
