/**
 * Social Feed API
 *
 * GET /api/v1/social/feed
 * Headers: Authorization: Bearer <token>
 * Query:   ?page=1&limit=20
 * 200:     { message: "Tải bảng tin thành công.", data: { items: Post[], pagination: { page, limit, total, pages }, meta: { scope: "global" } } }
 * 401:     { message: "Không có quyền truy cập." | "Token không hợp lệ hoặc đã hết hạn." | "Không tìm thấy người dùng." }
 *
 * POST /api/v1/social/posts
 * Headers: Authorization: Bearer <token>
 * Body:    { content: string }  (max 2000 chars)
 * 201:     { message: "Tạo bài viết thành công.", data: Post }
 * 400:     { errors: ["Vui lòng nhập nội dung bài viết."] }
 * 401:     { message: "Không có quyền truy cập." }
 *
 * PATCH /api/v1/social/posts/:postId
 * Headers: Authorization: Bearer <token>
 * Body:    { content: string }
 * 200:     { message: "Cập nhật bài viết thành công.", data: Post }
 * 403:     { message: "Bạn chỉ có thể chỉnh sửa bài viết của chính mình." }
 * 404:     { message: "Không tìm thấy bài viết." }
 *
 * POST /api/v1/social/posts/:postId/like
 * Headers: Authorization: Bearer <token>
 * 200:     { message: "Thích bài viết thành công.", data: Post }
 * 400:     { message: "Bạn đã thích bài viết này rồi." }
 *
 * DELETE /api/v1/social/posts/:postId/like
 * Headers: Authorization: Bearer <token>
 * 200:     { message: "Bỏ thích bài viết thành công.", data: Post }
 * 400:     { message: "Bạn chưa thích bài viết này." }
 *
 * DELETE /api/v1/social/posts/:postId
 * Headers: Authorization: Bearer <token>
 * 200:     { message: "Xóa bài viết thành công." }
 * 403:     { message: "Bạn chỉ có thể xóa bài viết của chính mình." }
 * 404:     { message: "Không tìm thấy bài viết." }
 *
 * POST /api/v1/social/posts/:postId/comments
 * Headers: Authorization: Bearer <token>
 * Body:    { content: string }  (max 2000 chars)
 * 201:     { message: "Bình luận thành công.", data: Comment }
 * 400:     { errors: ["Vui lòng nhập nội dung bình luận."] }
 *
 * GET /api/v1/social/posts/:postId/comments
 * Headers: Authorization: Bearer <token>
 * Query:   ?page=1&limit=20
 * 200:     { message: "Tải danh sách bình luận thành công.", data: { items: Comment[], pagination: { page, limit, total, pages } } }
 *
 * PATCH /api/v1/social/comments/:commentId
 * Headers: Authorization: Bearer <token>
 * Body:    { content: string }
 * 200:     { message: "Cập nhật bình luận thành công.", data: Comment }
 * 403:     { message: "Bạn chỉ có thể chỉnh sửa bình luận của chính mình." }
 * 404:     { message: "Không tìm thấy bình luận." }
 *
 * DELETE /api/v1/social/comments/:commentId
 * Headers: Authorization: Bearer <token>
 * 200:     { message: "Xóa bình luận thành công." }
 * 403:     { message: "Bạn chỉ có thể xóa bình luận của chính mình." }
 * 404:     { message: "Không tìm thấy bình luận." }
 */

import axios from "axios";
import { isMockApi, API_BASE_URL } from "../../../shared/constants/api";
import { getCurrentUser, getToken } from "../../auth/store/authStore";
import type { ApiPost, ApiComment, ApiAuthor, FeedData, CommentsData } from "../types/feed.types";
import type { ApiResponse } from "../../auth/types/auth.types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function authHeader(): Record<string, string> {
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

// ─── Mock data ────────────────────────────────────────────────────────────────

interface PostBase {
  id: string;
  content: string;
  imageUrl?: string | null;
  author: ApiAuthor;
  createdAt: string;
  updatedAt: string;
  likeCount: number;
  commentCount: number;
}

interface CommentBase {
  id: string;
  postId: string;
  content: string;
  author: ApiAuthor;
  createdAt: string;
  updatedAt: string;
}

const MOCK_AUTHORS: Record<string, ApiAuthor> = {
  "u-player": { id: "u-player", email: "player@demo.com", name: "Alex Nguyen" },
  "u-owner": { id: "u-owner", email: "owner@demo.com", name: "Minh Tran" },
  "u-admin": { id: "u-admin", email: "admin@demo.com", name: "Admin System" },
  "u-linh": { id: "u-linh", email: "linh@demo.com", name: "Linh Pham" },
  "u-thanh": { id: "u-thanh", email: "thanh@demo.com", name: "Thanh Do" },
  "u-nam": { id: "u-nam", email: "nam@demo.com", name: "Nam Vo" },
};

function minsAgo(min: number): string {
  return new Date(Date.now() - min * 60000).toISOString();
}

const _posts: PostBase[] = [
  {
    id: "post-1",
    content:
      "Hom nay danh cau long tai Phu Nhuan that tuyet! Ai muon danh trinh trung binh ket minh nha 🏸 Minh hay danh chieu T3, T5, T7.",
    author: MOCK_AUTHORS["u-linh"],
    createdAt: minsAgo(12),
    updatedAt: minsAgo(12),
    likeCount: 14,
    commentCount: 3,
  },
  {
    id: "post-2",
    content:
      "Vua book san tennis tai Matchill Sports, san rat dep va gia hop ly. Recommend cho moi nguoi nhe! 🎾\n\nGia khoang 150k/h vao buoi sang weekday.",
    author: MOCK_AUTHORS["u-player"],
    createdAt: minsAgo(45),
    updatedAt: minsAgo(45),
    likeCount: 22,
    commentCount: 5,
  },
  {
    id: "post-3",
    content:
      "Tim 2 nguoi choi pickleball buoi toi thu 6. San o Q.1. Trinh intermediate tro len. DM neu ban co hung thu! 🏓",
    author: MOCK_AUTHORS["u-thanh"],
    createdAt: minsAgo(90),
    updatedAt: minsAgo(90),
    likeCount: 6,
    commentCount: 8,
  },
  {
    id: "post-4",
    content:
      "Chinh thuc khai truong them 3 san cau long tai co so Binh Thanh! Booking ngay tren Matchill de nhan uu dai khai truong 20% 🎉",
    author: MOCK_AUTHORS["u-owner"],
    createdAt: minsAgo(180),
    updatedAt: minsAgo(180),
    likeCount: 31,
    commentCount: 2,
  },
  {
    id: "post-5",
    content:
      "Tips ky thuat: De cai thien backhand trong tennis, hay tap focus vao viec xoay vai som va giu khuu tay cao. Day la diem minh da cai thien rat nhieu trong 3 thang gan day. 💪",
    author: MOCK_AUTHORS["u-nam"],
    createdAt: minsAgo(300),
    updatedAt: minsAgo(300),
    likeCount: 45,
    commentCount: 2,
  },
  {
    id: "post-6",
    content:
      "Ket qua giai dau noi bo Matchill Cup thang 5:\n🥇 1st: Alex Nguyen\n🥈 2nd: Linh Pham\n🥉 3rd: Nam Vo\n\nCam on tat ca moi nguoi da tham gia! 🏆",
    author: MOCK_AUTHORS["u-admin"],
    createdAt: minsAgo(720),
    updatedAt: minsAgo(720),
    likeCount: 58,
    commentCount: 7,
  },
];

const _likedByUser: Record<string, Set<string>> = {};

const _comments: Record<string, CommentBase[]> = {
  "post-1": [
    {
      id: "c1-1",
      postId: "post-1",
      content: "Minh cung hay danh o do! Add zalo minh nha.",
      author: MOCK_AUTHORS["u-player"],
      createdAt: minsAgo(10),
      updatedAt: minsAgo(10),
    },
    {
      id: "c1-2",
      postId: "post-1",
      content: "San nao vay ban?",
      author: MOCK_AUTHORS["u-thanh"],
      createdAt: minsAgo(8),
      updatedAt: minsAgo(8),
    },
    {
      id: "c1-3",
      postId: "post-1",
      content: "Cho minh join voi! Trinh minh cung trung binh.",
      author: MOCK_AUTHORS["u-nam"],
      createdAt: minsAgo(5),
      updatedAt: minsAgo(5),
    },
  ],
  "post-2": [
    {
      id: "c2-1",
      postId: "post-2",
      content: "San nao vay ban, dia chi cu the?",
      author: MOCK_AUTHORS["u-linh"],
      createdAt: minsAgo(40),
      updatedAt: minsAgo(40),
    },
    {
      id: "c2-2",
      postId: "post-2",
      content: "Minh cung book o do roi, rat on!",
      author: MOCK_AUTHORS["u-nam"],
      createdAt: minsAgo(35),
      updatedAt: minsAgo(35),
    },
    {
      id: "c2-3",
      postId: "post-2",
      content: "150k/h re vay? Gio cao diem bao nhieu?",
      author: MOCK_AUTHORS["u-thanh"],
      createdAt: minsAgo(30),
      updatedAt: minsAgo(30),
    },
    {
      id: "c2-4",
      postId: "post-2",
      content: "Cao diem la 250k/h nha ban.",
      author: MOCK_AUTHORS["u-player"],
      createdAt: minsAgo(25),
      updatedAt: minsAgo(25),
    },
    {
      id: "c2-5",
      postId: "post-2",
      content: "Cam on info, se thu!",
      author: MOCK_AUTHORS["u-linh"],
      createdAt: minsAgo(20),
      updatedAt: minsAgo(20),
    },
  ],
  "post-5": [
    {
      id: "c5-1",
      postId: "post-5",
      content: "Tips hay qua! Minh se thu ap dung.",
      author: MOCK_AUTHORS["u-player"],
      createdAt: minsAgo(280),
      updatedAt: minsAgo(280),
    },
    {
      id: "c5-2",
      postId: "post-5",
      content: "Minh bi dung cai loi nay, cam on ban!",
      author: MOCK_AUTHORS["u-linh"],
      createdAt: minsAgo(270),
      updatedAt: minsAgo(270),
    },
  ],
};

let _commentIdCounter = 100;
let _postIdCounter = 10;

function resolvePost(base: PostBase, userId: string | null): ApiPost {
  const liked = userId ? (_likedByUser[userId] ? _likedByUser[userId].has(base.id) : false) : false;
  return {
    id: base.id,
    content: base.content,
    imageUrl: base.imageUrl ?? null,
    author: base.author,
    createdAt: base.createdAt,
    updatedAt: base.updatedAt,
    likeCount: base.likeCount,
    commentCount: base.commentCount,
    isOwner: base.author.id === userId,
    hasLiked: liked,
  };
}

function resolveComment(base: CommentBase, userId: string | null): ApiComment {
  return {
    id: base.id,
    postId: base.postId,
    content: base.content,
    author: base.author,
    createdAt: base.createdAt,
    updatedAt: base.updatedAt,
    isOwner: base.author.id === userId,
  };
}

// ─── API functions ─────────────────────────────────────────────────────────────

export async function getFeed(
  page: number = 1,
  limit: number = 20
): Promise<ApiResponse<FeedData>> {
  if (isMockApi) {
    await delay(600);
    const user = getCurrentUser();
    const userId = user ? user._id : null;
    const sorted = _posts.slice().reverse();
    const start = (page - 1) * limit;
    const items = sorted.slice(start, start + limit).map((p) => resolvePost(p, userId));
    const total = sorted.length;
    const pages = Math.ceil(total / limit);
    return {
      success: true,
      message: "Tải bảng tin thành công.",
      data: { items, pagination: { page, limit, total, pages }, meta: { scope: "global" } },
    };
  }
  try {
    const res = await axios.get(`${API_BASE_URL}/social/feed`, {
      headers: authHeader(),
      params: { page, limit },
    });
    return { success: true, message: res.data.message || "Tải bảng tin thành công.", data: res.data.data };
  } catch (err: any) {
    return { success: false, message: err.response?.data?.message ?? "Không thể tải bảng tin." };
  }
}

export async function searchFeed(
  q: string,
  page: number = 1,
  limit: number = 20
): Promise<ApiResponse<FeedData>> {
  if (isMockApi) {
    await delay(400);
    const user = getCurrentUser();
    const userId = user ? user._id : null;
    const keyword = q.trim().toLowerCase();
    const filtered = _posts
      .filter((p) => !keyword || p.content.toLowerCase().includes(keyword))
      .slice()
      .reverse();
    const start = (page - 1) * limit;
    const items = filtered.slice(start, start + limit).map((p) => resolvePost(p, userId));
    const total = filtered.length;
    const pages = Math.ceil(total / limit) || 1;
    return {
      success: true,
      message: "Tìm kiếm bảng tin thành công.",
      data: { items, pagination: { page, limit, total, pages }, meta: { scope: "search", query: q } },
    };
  }
  try {
    const res = await axios.get(`${API_BASE_URL}/social/posts/search`, {
      headers: authHeader(),
      params: { q, page, limit },
    });
    return { success: true, message: res.data.message || "Tìm kiếm bảng tin thành công.", data: res.data.data };
  } catch (err: any) {
    return { success: false, message: err.response?.data?.message ?? "Không thể tìm kiếm bảng tin." };
  }
}

export async function getPostDetail(postId: string): Promise<ApiResponse<ApiPost>> {
  if (isMockApi) {
    await delay(250);
    const user = getCurrentUser();
    const userId = user ? user._id : null;
    const post = _posts.find((p) => p.id === postId);
    if (!post) return { success: false, message: "Không tìm thấy bài viết." };
    return { success: true, message: "Tải chi tiết bài viết thành công.", data: resolvePost(post, userId) };
  }
  try {
    const res = await axios.get(`${API_BASE_URL}/social/posts/${postId}`, {
      headers: authHeader(),
    });
    return { success: true, message: res.data.message || "Tải chi tiết bài viết thành công.", data: res.data.data };
  } catch (err: any) {
    return { success: false, message: err.response?.data?.message ?? "Không thể tải chi tiết bài viết." };
  }
}

export async function createPost(
  content: string,
  imageUrl?: string | null
): Promise<ApiResponse<ApiPost>> {
  if (isMockApi) {
    await delay(500);
    const user = getCurrentUser();
    if (!user) return { success: false, message: "Không có quyền truy cập." };
    if (!content.trim() && !imageUrl) return { success: false, message: "Vui lòng nhập nội dung hoặc đính kèm hình ảnh." };
    const now = new Date().toISOString();
    const newPost: PostBase = {
      id: `post-${++_postIdCounter}`,
      content: content.trim(),
      imageUrl: imageUrl ?? null,
      author: { id: user._id, email: user.email, name: user.name, avatarUrl: user.avatar },
      createdAt: now,
      updatedAt: now,
      likeCount: 0,
      commentCount: 0,
    };
    _posts.push(newPost);
    return {
      success: true,
      message: "Tạo bài viết thành công.",
      data: resolvePost(newPost, user._id),
    };
  }
  try {
    const res = await axios.post(
      `${API_BASE_URL}/social/posts`,
      { content, image_url: imageUrl },
      {
        headers: { ...authHeader(), "Content-Type": "application/json" },
      }
    );
    return { success: true, message: res.data.message || "Tạo bài viết thành công.", data: res.data.data };
  } catch (err: any) {
    const msg =
      err.response?.data?.errors?.[0] ?? err.response?.data?.message ?? "Không thể tạo bài viết.";
    if (msg === "Content is required.") return { success: false, message: "Vui lòng nhập nội dung bài viết." };
    return { success: false, message: msg };
  }
}

export async function updatePost(postId: string, content: string): Promise<ApiResponse<ApiPost>> {
  if (isMockApi) {
    await delay(400);
    const user = getCurrentUser();
    if (!user) return { success: false, message: "Không có quyền truy cập." };
    const idx = _posts.findIndex((p) => p.id === postId);
    if (idx === -1) return { success: false, message: "Không tìm thấy bài viết." };
    if (_posts[idx].author.id !== user._id)
      return { success: false, message: "Bạn chỉ có thể chỉnh sửa bài viết của chính mình." };
    _posts[idx].content = content.trim();
    _posts[idx].updatedAt = new Date().toISOString();
    return {
      success: true,
      message: "Cập nhật bài viết thành công.",
      data: resolvePost(_posts[idx], user._id),
    };
  }
  try {
    const res = await axios.patch(
      `${API_BASE_URL}/social/posts/${postId}`,
      { content },
      {
        headers: { ...authHeader(), "Content-Type": "application/json" },
      }
    );
    return { success: true, message: res.data.message || "Cập nhật bài viết thành công.", data: res.data.data };
  } catch (err: any) {
    return { success: false, message: err.response?.data?.message ?? "Không thể cập nhật bài viết." };
  }
}

export async function deletePost(postId: string): Promise<ApiResponse<void>> {
  if (isMockApi) {
    await delay(400);
    const user = getCurrentUser();
    if (!user) return { success: false, message: "Không có quyền truy cập." };
    const idx = _posts.findIndex((p) => p.id === postId);
    if (idx === -1) return { success: false, message: "Không tìm thấy bài viết." };
    if (_posts[idx].author.id !== user._id)
      return { success: false, message: "Bạn chỉ có thể xóa bài viết của chính mình." };
    _posts.splice(idx, 1);
    return { success: true, message: "Xóa bài viết thành công." };
  }
  try {
    const res = await axios.delete(`${API_BASE_URL}/social/posts/${postId}`, {
      headers: authHeader(),
    });
    return { success: true, message: res.data.message || "Xóa bài viết thành công." };
  } catch (err: any) {
    return { success: false, message: err.response?.data?.message ?? "Không thể xóa bài viết." };
  }
}

export async function likePost(postId: string): Promise<ApiResponse<ApiPost>> {
  if (isMockApi) {
    await delay(200);
    const user = getCurrentUser();
    if (!user) return { success: false, message: "Không có quyền truy cập." };
    const userId = user._id;
    if (!_likedByUser[userId]) _likedByUser[userId] = new Set();
    if (_likedByUser[userId].has(postId)) return { success: false, message: "Bạn đã thích bài viết này rồi." };
    _likedByUser[userId].add(postId);
    const post = _posts.find((p) => p.id === postId);
    if (!post) return { success: false, message: "Không tìm thấy bài viết." };
    post.likeCount += 1;
    return { success: true, message: "Thích bài viết thành công.", data: resolvePost(post, userId) };
  }
  try {
    const res = await axios.post(
      `${API_BASE_URL}/social/posts/${postId}/like`,
      {},
      { headers: authHeader() }
    );
    return { success: true, message: res.data.message || "Thích bài viết thành công.", data: res.data.data };
  } catch (err: any) {
    return { success: false, message: err.response?.data?.message ?? "Không thể thích bài viết." };
  }
}

export async function unlikePost(postId: string): Promise<ApiResponse<ApiPost>> {
  if (isMockApi) {
    await delay(200);
    const user = getCurrentUser();
    if (!user) return { success: false, message: "Không có quyền truy cập." };
    const userId = user._id;
    if (_likedByUser[userId]) _likedByUser[userId].delete(postId);
    const post = _posts.find((p) => p.id === postId);
    if (!post) return { success: false, message: "Không tìm thấy bài viết." };
    post.likeCount = Math.max(0, post.likeCount - 1);
    return {
      success: true,
      message: "Bỏ thích bài viết thành công.",
      data: resolvePost(post, userId),
    };
  }
  try {
    const res = await axios.delete(`${API_BASE_URL}/social/posts/${postId}/like`, {
      headers: authHeader(),
    });
    return { success: true, message: res.data.message || "Bỏ thích bài viết thành công.", data: res.data.data };
  } catch (err: any) {
    return { success: false, message: err.response?.data?.message ?? "Không thể bỏ thích bài viết." };
  }
}

export async function getComments(
  postId: string,
  page: number = 1,
  limit: number = 20
): Promise<ApiResponse<CommentsData>> {
  if (isMockApi) {
    await delay(400);
    const user = getCurrentUser();
    const userId = user ? user._id : null;
    const all = (_comments[postId] ?? []).slice().reverse();
    const start = (page - 1) * limit;
    const items = all.slice(start, start + limit).map((c) => resolveComment(c, userId));
    const total = all.length;
    const pages = Math.ceil(total / limit) || 1;
    return {
      success: true,
      message: "Tải danh sách bình luận thành công.",
      data: { items, pagination: { page, limit, total, pages } },
    };
  }
  try {
    const res = await axios.get(`${API_BASE_URL}/social/posts/${postId}/comments`, {
      headers: authHeader(),
      params: { page, limit },
    });
    return { success: true, message: res.data.message || "Tải danh sách bình luận thành công.", data: res.data.data };
  } catch (err: any) {
    return { success: false, message: err.response?.data?.message ?? "Không thể tải bình luận." };
  }
}

export async function createComment(
  postId: string,
  content: string
): Promise<ApiResponse<ApiComment>> {
  if (isMockApi) {
    await delay(400);
    const user = getCurrentUser();
    if (!user) return { success: false, message: "Không có quyền truy cập." };
    if (!content.trim()) return { success: false, message: "Vui lòng nhập nội dung bình luận." };
    const now = new Date().toISOString();
    const newComment: CommentBase = {
      id: `c-${++_commentIdCounter}`,
      postId,
      content: content.trim(),
      author: { id: user._id, email: user.email, name: user.name },
      createdAt: now,
      updatedAt: now,
    };
    if (!_comments[postId]) _comments[postId] = [];
    _comments[postId].push(newComment);
    const post = _posts.find((p) => p.id === postId);
    if (post) post.commentCount += 1;
    return {
      success: true,
      message: "Bình luận thành công.",
      data: resolveComment(newComment, user._id),
    };
  }
  try {
    const res = await axios.post(
      `${API_BASE_URL}/social/posts/${postId}/comments`,
      { content },
      {
        headers: { ...authHeader(), "Content-Type": "application/json" },
      }
    );
    return { success: true, message: res.data.message || "Bình luận thành công.", data: res.data.data };
  } catch (err: any) {
    const msg =
      err.response?.data?.errors?.[0] ?? err.response?.data?.message ?? "Không thể gửi bình luận.";
    if (msg === "Content is required.") return { success: false, message: "Vui lòng nhập nội dung bình luận." };
    return { success: false, message: msg };
  }
}

export async function updateComment(
  commentId: string,
  content: string
): Promise<ApiResponse<ApiComment>> {
  if (isMockApi) {
    await delay(400);
    const user = getCurrentUser();
    if (!user) return { success: false, message: "Không có quyền truy cập." };
    for (const postId of Object.keys(_comments)) {
      const idx = _comments[postId].findIndex((c) => c.id === commentId);
      if (idx !== -1) {
        if (_comments[postId][idx].author.id !== user._id)
          return { success: false, message: "Bạn chỉ có thể chỉnh sửa bình luận của chính mình." };
        _comments[postId][idx].content = content.trim();
        _comments[postId][idx].updatedAt = new Date().toISOString();
        return {
          success: true,
          message: "Cập nhật bình luận thành công.",
          data: resolveComment(_comments[postId][idx], user._id),
        };
      }
    }
    return { success: false, message: "Không tìm thấy bình luận." };
  }
  try {
    const res = await axios.patch(
      `${API_BASE_URL}/social/comments/${commentId}`,
      { content },
      {
        headers: { ...authHeader(), "Content-Type": "application/json" },
      }
    );
    return { success: true, message: res.data.message || "Cập nhật bình luận thành công.", data: res.data.data };
  } catch (err: any) {
    return { success: false, message: err.response?.data?.message ?? "Không thể cập nhật bình luận." };
  }
}

export async function deleteComment(commentId: string): Promise<ApiResponse<void>> {
  if (isMockApi) {
    await delay(400);
    const user = getCurrentUser();
    if (!user) return { success: false, message: "Không có quyền truy cập." };
    for (const postId of Object.keys(_comments)) {
      const idx = _comments[postId].findIndex((c) => c.id === commentId);
      if (idx !== -1) {
        if (_comments[postId][idx].author.id !== user._id)
          return { success: false, message: "You can only delete your own comments." };
        _comments[postId].splice(idx, 1);
        const post = _posts.find((p) => p.id === postId);
        if (post) post.commentCount = Math.max(0, post.commentCount - 1);
        return { success: true, message: "Xóa bình luận thành công." };
      }
    }
    return { success: false, message: "Không tìm thấy bình luận." };
  }
  try {
    const res = await axios.delete(`${API_BASE_URL}/social/comments/${commentId}`, {
      headers: authHeader(),
    });
    return { success: true, message: res.data.message || "Xóa bình luận thành công." };
  } catch (err: any) {
    return { success: false, message: err.response?.data?.message ?? "Không thể xóa bình luận." };
  }
}