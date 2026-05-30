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
import { API_BASE_URL } from "../../../shared/constants/api";
import i18n from "../../../shared/i18n/i18n";
import { getToken } from "../../auth/store/authStore";
import type { ApiPost, ApiComment, FeedData, CommentsData, FeedFilters } from "../types/feed.types";
import type { ApiResponse } from "../../auth/types/auth.types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const feedMessage = (key: string) => i18n.t(`feed.api.${key}`, { ns: "matching" });

function authHeader(): Record<string, string> {
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

// ─── API functions ─────────────────────────────────────────────────────────────

export async function getFeed(
  filters: Partial<FeedFilters> = {}
): Promise<ApiResponse<FeedData>> {
  try {
    const res = await axios.get(`${API_BASE_URL}/social/feed`, {
      headers: authHeader(),
      params: filters,
    });
    return { success: true, message: res.data.message || feedMessage("feedLoaded"), data: res.data.data };
  } catch (err: any) {
    return { success: false, message: err.response?.data?.message ?? feedMessage("feedLoadError") };
  }
}

export async function searchFeed(
  q: string,
  page: number = 1,
  limit: number = 20
): Promise<ApiResponse<FeedData>> {
  try {
    const res = await axios.get(`${API_BASE_URL}/social/posts/search`, {
      headers: authHeader(),
      params: { q, page, limit },
    });
    return { success: true, message: res.data.message || feedMessage("feedSearched"), data: res.data.data };
  } catch (err: any) {
    return { success: false, message: err.response?.data?.message ?? feedMessage("feedSearchError") };
  }
}

export async function getPostDetail(postId: string): Promise<ApiResponse<ApiPost>> {
  try {
    const res = await axios.get(`${API_BASE_URL}/social/posts/${postId}`, {
      headers: authHeader(),
    });
    return { success: true, message: res.data.message || feedMessage("postDetailLoaded"), data: res.data.data };
  } catch (err: any) {
    return { success: false, message: err.response?.data?.message ?? feedMessage("postDetailError") };
  }
}

export async function createPost(
  payload: Partial<ApiPost>
): Promise<ApiResponse<ApiPost>> {
  try {
    const res = await axios.post(
      `${API_BASE_URL}/social/posts`,
      { ...payload, image_url: payload.imageUrl },
      {
        headers: { ...authHeader(), "Content-Type": "application/json" },
      }
    );
    return { success: true, message: res.data.message || feedMessage("postCreated"), data: res.data.data };
  } catch (err: any) {
    const msg =
      err.response?.data?.errors?.[0] ?? err.response?.data?.message ?? feedMessage("postCreateError");
    if (msg === "Content is required.") return { success: false, message: feedMessage("postContentRequired") };
    return { success: false, message: msg };
  }
}

export async function updatePost(postId: string, payload: Partial<ApiPost>): Promise<ApiResponse<ApiPost>> {
  try {
    const res = await axios.patch(
      `${API_BASE_URL}/social/posts/${postId}`,
      { ...payload, image_url: payload.imageUrl },
      {
        headers: { ...authHeader(), "Content-Type": "application/json" },
      }
    );
    return { success: true, message: res.data.message || feedMessage("postUpdated"), data: res.data.data };
  } catch (err: any) {
    return { success: false, message: err.response?.data?.message ?? feedMessage("postUpdateError") };
  }
}

export async function deletePost(postId: string): Promise<ApiResponse<void>> {
  try {
    const res = await axios.delete(`${API_BASE_URL}/social/posts/${postId}`, {
      headers: authHeader(),
    });
    return { success: true, message: res.data.message || feedMessage("postDeleted") };
  } catch (err: any) {
    return { success: false, message: err.response?.data?.message ?? feedMessage("postDeleteError") };
  }
}

export async function likePost(postId: string): Promise<ApiResponse<ApiPost>> {
  try {
    const res = await axios.post(
      `${API_BASE_URL}/social/posts/${postId}/like`,
      {},
      { headers: authHeader() }
    );
    return { success: true, message: res.data.message || feedMessage("postLiked"), data: res.data.data };
  } catch (err: any) {
    return { success: false, message: err.response?.data?.message ?? feedMessage("postLikeError") };
  }
}

export async function unlikePost(postId: string): Promise<ApiResponse<ApiPost>> {
  try {
    const res = await axios.delete(`${API_BASE_URL}/social/posts/${postId}/like`, {
      headers: authHeader(),
    });
    return { success: true, message: res.data.message || feedMessage("postUnliked"), data: res.data.data };
  } catch (err: any) {
    return { success: false, message: err.response?.data?.message ?? feedMessage("postUnlikeError") };
  }
}

export async function getComments(
  postId: string,
  page: number = 1,
  limit: number = 20
): Promise<ApiResponse<CommentsData>> {
  try {
    const res = await axios.get(`${API_BASE_URL}/social/posts/${postId}/comments`, {
      headers: authHeader(),
      params: { page, limit },
    });
    return { success: true, message: res.data.message || feedMessage("commentsLoaded"), data: res.data.data };
  } catch (err: any) {
    return { success: false, message: err.response?.data?.message ?? feedMessage("commentsLoadError") };
  }
}

export async function createComment(
  postId: string,
  content: string
): Promise<ApiResponse<ApiComment>> {
  try {
    const res = await axios.post(
      `${API_BASE_URL}/social/posts/${postId}/comments`,
      { content },
      {
        headers: { ...authHeader(), "Content-Type": "application/json" },
      }
    );
    return { success: true, message: res.data.message || feedMessage("commentCreated"), data: res.data.data };
  } catch (err: any) {
    const msg =
      err.response?.data?.errors?.[0] ?? err.response?.data?.message ?? feedMessage("commentCreateError");
    if (msg === "Content is required.") return { success: false, message: feedMessage("commentRequired") };
    return { success: false, message: msg };
  }
}

export async function updateComment(
  commentId: string,
  content: string
): Promise<ApiResponse<ApiComment>> {
  try {
    const res = await axios.patch(
      `${API_BASE_URL}/social/comments/${commentId}`,
      { content },
      {
        headers: { ...authHeader(), "Content-Type": "application/json" },
      }
    );
    return { success: true, message: res.data.message || feedMessage("commentUpdated"), data: res.data.data };
  } catch (err: any) {
    return { success: false, message: err.response?.data?.message ?? feedMessage("commentUpdateError") };
  }
}

export async function deleteComment(commentId: string): Promise<ApiResponse<void>> {
  try {
    const res = await axios.delete(`${API_BASE_URL}/social/comments/${commentId}`, {
      headers: authHeader(),
    });
    return { success: true, message: res.data.message || feedMessage("commentDeleted") };
  } catch (err: any) {
    return { success: false, message: err.response?.data?.message ?? feedMessage("commentDeleteError") };
  }
}