import React, { useState } from "react";
import {
  Heart,
  MessageCircle,
  MoreHorizontal,
  Trash2,
  Send,
  Edit3,
  Check,
  X,
  Loader2,
  ChevronDown,
  AlertTriangle,
} from "lucide-react";
import type { ApiPost, ApiComment } from "../types/feed.types";
import {
  likePost,
  unlikePost,
  updatePost,
  deletePost,
  getComments,
  createComment,
  updateComment,
  deleteComment,
} from "../api/socialApi";
import { getCurrentUser } from "../../auth/store/authStore";
import { toast } from "sonner";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (m < 1) return "Vừa xong";
  if (m < 60) return `${m} phút trước`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} giờ trước`;
  return `${Math.floor(h / 24)} ngày trước`;
}

function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(-2)
    .join("")
    .toUpperCase();
}

// ─── Comment section ──────────────────────────────────────────────────────────

function CommentSection({
  postId,
  onCountChange,
}: {
  postId: string;
  onCountChange: (delta: number) => void;
}) {
  const user = getCurrentUser();
  const [comments, setComments] = useState<ApiComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingComment, setSendingComment] = useState(false);
  const [text, setText] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  React.useEffect(() => {
    getComments(postId).then((r) => {
      if (r.success && r.data) setComments(r.data.items);
      setLoading(false);
    });
  }, [postId]);

  const handleSend = async () => {
    if (!text.trim() || !user) return;
    setSendingComment(true);
    const r = await createComment(postId, text.trim());
    if (r.success && r.data) {
      setComments((prev) => [...prev, r.data!]);
      setText("");
      onCountChange(1);
    } else {
      toast.error(r.message);
    }
    setSendingComment(false);
  };

  const handleEdit = async (commentId: string) => {
    if (!editText.trim()) return;
    const r = await updateComment(commentId, editText.trim());
    if (r.success && r.data) {
      setComments((prev) => prev.map((c) => (c.id === commentId ? r.data! : c)));
      setEditingId(null);
    } else {
      toast.error(r.message);
    }
  };

  const handleDelete = async (commentId: string) => {
    setDeletingId(commentId);
    const r = await deleteComment(commentId);
    if (r.success) {
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      onCountChange(-1);
      toast.success("Đã xóa bình luận");
    } else {
      toast.error(r.message);
    }
    setDeletingId(null);
    setConfirmDeleteId(null);
  };

  if (loading) {
    return (
      <div className="px-4 py-4 flex items-center gap-2 text-brand-muted text-sm">
        <Loader2 size={14} className="animate-spin" /> Đang tải bình luận...
      </div>
    );
  }

  return (
    <div className="px-4 pb-4 flex flex-col gap-3">
      {comments.map((c) => (
        <div key={c.id} className="flex gap-2.5">
          <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold text-white gradient-orange-diag font-heading">
            {initials(c.author.name)}
          </div>
          <div className="flex-1 min-w-0">
            {editingId === c.id ? (
              <div className="flex gap-2">
                <input
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleEdit(c.id);
                    if (e.key === "Escape") setEditingId(null);
                  }}
                  className="flex-1 rounded-xl px-3 py-2 text-[13px] bg-brand-surface border border-brand-teal outline-none text-brand-dark"
                  autoFocus
                />
                <button
                  onClick={() => handleEdit(c.id)}
                  className="p-2 rounded-lg text-brand-teal hover:bg-brand-surface-teal transition-colors"
                >
                  <Check size={14} />
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  className="p-2 rounded-lg text-brand-muted hover:bg-brand-surface transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div className="rounded-2xl px-3.5 py-2.5 bg-[#f4f0ee] inline-block max-w-full">
                <span className="text-[13px] font-bold text-brand-dark font-heading mr-1.5">
                  {c.author.name}
                </span>
                <span className="text-[13px] text-brand-dark leading-relaxed">{c.content}</span>
              </div>
            )}

            <div className="flex items-center gap-4 mt-1 pl-1">
              <span className="text-[11px] text-brand-muted">{timeAgo(c.createdAt)}</span>
              {c.updatedAt !== c.createdAt && (
                <span className="text-[11px] text-brand-muted italic">đã chỉnh sửa</span>
              )}
              {c.isOwner && editingId !== c.id && (
                <>
                  <button
                    onClick={() => {
                      setEditingId(c.id);
                      setEditText(c.content);
                      setConfirmDeleteId(null);
                    }}
                    className="flex items-center gap-1 text-[11px] text-brand-muted hover:text-brand-teal transition-colors"
                  >
                    <Edit3 size={10} /> Sửa
                  </button>
                  {confirmDeleteId === c.id ? (
                    <span className="flex items-center gap-1.5">
                      <span className="text-[11px] text-brand-red">Xóa?</span>
                      <button
                        onClick={() => handleDelete(c.id)}
                        disabled={deletingId === c.id}
                        className="text-[11px] text-brand-red hover:underline disabled:opacity-50"
                      >
                        {deletingId === c.id ? (
                          <Loader2 size={10} className="animate-spin" />
                        ) : (
                          "Xác nhận"
                        )}
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="text-[11px] text-brand-muted hover:underline"
                      >
                        Hủy
                      </button>
                    </span>
                  ) : (
                    <button
                      onClick={() => setConfirmDeleteId(c.id)}
                      className="flex items-center gap-1 text-[11px] text-brand-muted hover:text-brand-red transition-colors"
                    >
                      <Trash2 size={10} /> Xóa
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      ))}

      {/* New comment input */}
      {user ? (
        <div className="flex gap-2.5">
          <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold text-white gradient-orange-diag font-heading">
            {initials(user.name)}
          </div>
          <div className="flex-1 flex items-center gap-2 px-3 rounded-2xl bg-[#f4f0ee] min-h-[38px]">
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Viết bình luận..."
              className="flex-1 bg-transparent outline-none py-2 text-[13px] text-brand-dark border-none"
            />
            <button
              onClick={handleSend}
              disabled={!text.trim() || sendingComment}
              className="shrink-0 disabled:opacity-40 hover:opacity-80 text-brand-teal transition-opacity"
            >
              {sendingComment ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            </button>
          </div>
        </div>
      ) : (
        <p className="text-[13px] text-brand-muted text-center py-1">Đăng nhập để bình luận</p>
      )}
    </div>
  );
}

// ─── Delete confirm banner ─────────────────────────────────────────────────────

function DeleteConfirmBanner({
  onConfirm,
  onCancel,
  loading,
}: {
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  return (
    <div className="mx-4 mb-3 flex items-center gap-3 px-4 py-3 rounded-xl bg-[#fff5f5] border border-[#fecdca]">
      <AlertTriangle size={16} className="text-brand-red shrink-0" />
      <p className="flex-1 text-[13px] text-brand-red">
        Xóa bài viết không thể hoàn tác. Tiếp tục?
      </p>
      <button
        onClick={onCancel}
        className="h-7 px-3 rounded-lg border border-[#fecdca] text-[12px] text-brand-body hover:bg-white transition-colors"
      >
        Hủy
      </button>
      <button
        onClick={onConfirm}
        disabled={loading}
        className="h-7 px-3 rounded-lg bg-brand-red text-[12px] text-white hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center gap-1"
      >
        {loading ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
        Xóa
      </button>
    </div>
  );
}

// ─── PostCard ──────────────────────────────────────────────────────────────────

export function PostCard({
  post: initialPost,
  onUpdated,
  onDeleted,
}: {
  post: ApiPost;
  onUpdated: (updated: ApiPost) => void;
  onDeleted: (postId: string) => void;
}) {
  const user = getCurrentUser();
  const [post, setPost] = useState(initialPost);
  const [showComments, setShowComments] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [liking, setLiking] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [savingEdit, setSavingEdit] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  React.useEffect(() => {
    setPost(initialPost);
  }, [initialPost]);

  const handleLikeToggle = async () => {
    if (!user) {
      toast.error("Đăng nhập để thích bài viết");
      return;
    }
    if (liking) return;
    setLiking(true);
    const fn = post.hasLiked ? unlikePost : likePost;
    const r = await fn(post.id);
    if (r.success && r.data) {
      setPost(r.data);
      onUpdated(r.data);
    } else {
      toast.error(r.message);
    }
    setLiking(false);
  };

  const handleSaveEdit = async () => {
    if (!editContent.trim()) return;
    setSavingEdit(true);
    const r = await updatePost(post.id, editContent.trim());
    if (r.success && r.data) {
      setPost(r.data);
      onUpdated(r.data);
      setEditing(false);
      toast.success("Đã cập nhật bài viết");
    } else {
      toast.error(r.message);
    }
    setSavingEdit(false);
  };

  const handleDelete = async () => {
    setDeleting(true);
    const r = await deletePost(post.id);
    if (r.success) {
      toast.success("Đã xóa bài viết");
      onDeleted(post.id);
    } else {
      toast.error(r.message);
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  const handleCommentCountChange = (delta: number) => {
    setPost((p) => ({ ...p, commentCount: Math.max(0, p.commentCount + delta) }));
  };

  return (
    <article className="flex flex-col rounded-2xl overflow-hidden bg-white border border-[#e8e0dc] shadow-[0_1px_4px_rgba(36,25,20,0.06)]">
      {/* Header */}
      <div className="flex items-start gap-3 px-4 pt-4 pb-2">
        <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-sm font-bold text-white gradient-orange-diag font-heading">
          {initials(post.author.name)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-bold text-brand-dark font-heading">{post.author.name}</p>
              <p className="text-xs text-brand-muted mt-0.5">
                {timeAgo(post.createdAt)}
                {post.updatedAt !== post.createdAt && " · đã chỉnh sửa"}
              </p>
            </div>
            {post.isOwner && (
              <div className="relative shrink-0">
                <button
                  onClick={() => {
                    setMenuOpen((o) => !o);
                    setConfirmDelete(false);
                  }}
                  className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-[#f4f0ee] transition-colors text-brand-muted"
                >
                  <MoreHorizontal size={16} />
                </button>
                {menuOpen && (
                  <>
                    <div className="fixed inset-0 z-20" onClick={() => setMenuOpen(false)} />
                    <div className="absolute right-0 top-8 z-30 rounded-xl overflow-hidden bg-white border-[1.5px] border-brand-border w-44 shadow-[0_8px_24px_rgba(36,25,20,0.18)]">
                      <button
                        onClick={() => {
                          setEditing(true);
                          setEditContent(post.content);
                          setMenuOpen(false);
                          setConfirmDelete(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-brand-surface-orange transition-colors text-left text-[13px] text-brand-dark"
                      >
                        <Edit3 size={14} className="text-brand-orange" /> Chỉnh sửa
                      </button>
                      <button
                        onClick={() => {
                          setConfirmDelete(true);
                          setMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-[#fff5f5] transition-colors text-left text-[13px] text-brand-red"
                      >
                        <Trash2 size={14} /> Xóa bài viết
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-3">
        {editing ? (
          <div className="flex flex-col gap-2">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={4}
              className="w-full resize-none rounded-xl border border-brand-teal px-3 py-2.5 text-sm text-brand-dark outline-none bg-brand-surface leading-relaxed"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={handleSaveEdit}
                disabled={savingEdit || !editContent.trim()}
                className="flex items-center gap-1.5 h-9 px-4 rounded-xl gradient-orange text-sm font-bold text-white font-heading disabled:opacity-60"
              >
                {savingEdit ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                Lưu
              </button>
              <button
                onClick={() => setEditing(false)}
                className="flex items-center gap-1.5 h-9 px-4 rounded-xl border border-brand-border text-sm text-brand-body hover:bg-brand-surface-orange transition-colors"
              >
                <X size={14} /> Hủy
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-brand-dark leading-relaxed whitespace-pre-wrap">
            {post.content}
          </p>
        )}
      </div>

      {/* Delete confirm banner */}
      {confirmDelete && (
        <DeleteConfirmBanner
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(false)}
          loading={deleting}
        />
      )}

      {/* Stats bar */}
      {(post.likeCount > 0 || post.commentCount > 0) && (
        <div className="flex items-center justify-between px-4 py-2 border-t border-b border-[#f4ede9]">
          {post.likeCount > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs bg-brand-orange text-white">
                ❤
              </span>
              <span className="text-[13px] text-brand-body">{post.likeCount}</span>
            </div>
          )}
          {post.commentCount > 0 && (
            <button
              onClick={() => setShowComments((s) => !s)}
              className="ml-auto flex items-center gap-1 text-[13px] text-brand-body hover:text-brand-teal transition-colors"
            >
              {post.commentCount} bình luận
            </button>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center px-2 py-1 border-b border-[#f4ede9]">
        {/* Like */}
        <button
          onClick={handleLikeToggle}
          disabled={liking}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl transition-all hover:bg-[#f4f0ee] text-[13px]
            ${post.hasLiked ? "text-[#c0392b] font-bold" : "text-brand-body font-medium"}`}
        >
          <Heart
            size={17}
            fill={post.hasLiked ? "#c0392b" : "none"}
            color={post.hasLiked ? "#c0392b" : "currentColor"}
            className={`transition-transform ${liking ? "scale-125" : ""}`}
          />
          Thích
          {post.likeCount > 0 && (
            <span className="text-xs text-brand-muted font-normal">({post.likeCount})</span>
          )}
        </button>

        {/* Comment */}
        <button
          onClick={() => setShowComments((s) => !s)}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl transition-all hover:bg-[#f4f0ee] text-[13px]
            ${showComments ? "text-brand-teal font-bold" : "text-brand-body font-medium"}`}
        >
          <MessageCircle size={17} />
          Bình luận
          {post.commentCount > 0 && (
            <span className="text-xs text-brand-muted font-normal">({post.commentCount})</span>
          )}
          {post.commentCount > 0 && (
            <ChevronDown
              size={13}
              className={`transition-transform ${showComments ? "rotate-180" : ""}`}
            />
          )}
        </button>
      </div>

      {/* Comments */}
      {showComments && (
        <div className="pt-3">
          <CommentSection postId={post.id} onCountChange={handleCommentCountChange} />
        </div>
      )}
    </article>
  );
}
