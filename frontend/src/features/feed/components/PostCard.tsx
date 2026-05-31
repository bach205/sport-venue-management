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
  Share2,
  ExternalLink,
  MessageSquare,
  Package,
  MapPin,
  Clock,
} from "lucide-react";
import { Link, useNavigate } from "react-router";
import type { ApiPost, ApiComment } from "../types/feed.types";
import {
  likePost,
  unlikePost,
  deletePost,
  getComments,
  createComment,
  updateComment,
  deleteComment,
} from "../api/socialApi";
import { getCurrentUser } from "../../auth/store/authStore";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { CreatePostModal } from "./CreatePostModal";

// ── Helpers ──────────────────────────────────────────────────
function timeAgo(iso: string, t: TFunction<"matching">): string {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (m < 1) return t("timeAgo.now");
  if (m < 60) return t("timeAgo.minutes", { count: m });
  const h = Math.floor(m / 60);
  if (h < 24) return t("timeAgo.hours", { count: h });
  return t("timeAgo.days", { count: Math.floor(h / 24) });
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(-2)
    .join("")
    .toUpperCase();
}

function formatPrice(post: ApiPost): { main: string; sub?: string } {
  if (post.priceType === "fixed" && post.priceMin != null)
    return { main: post.priceMin.toLocaleString(), sub: post.currency };
  if (post.priceType === "range" && post.priceMin != null && post.priceMax != null)
    return {
      main: `${post.priceMin.toLocaleString()} – ${post.priceMax.toLocaleString()}`,
      sub: post.currency,
    };
  if (post.priceType === "negotiable") return { main: "Thỏa thuận" };
  return { main: "Yêu cầu báo giá" };
}

const CONDITION_MAP = {
  new: { label: "Mới 100%", cls: "bg-[#e7f8f7] text-[#006a65] border-[#006a65]/25" },
  like_new: { label: "Như mới", cls: "bg-[#fff8f0] text-[#a04100] border-[#a04100]/25" },
  used: { label: "Đã dùng", cls: "bg-[#f5f0ed] text-[#584238] border-[#dfc0b3]" },
};

const SPORT_COLOR: Record<string, string> = {
  Pickleball: "bg-[#e7f8f7] text-[#006a65] border-[#006a65]/20",
  Tennis: "bg-[#faeeda] text-[#854F0B] border-[#854F0B]/20",
  Badminton: "bg-[#eeedfe] text-[#534AB7] border-[#534AB7]/20",
  Football: "bg-[#eaf3de] text-[#3B6D11] border-[#3B6D11]/20",
};

const AUTHOR_BG = ["#006a65", "#1a5fb4", "#a04100", "#854F0B", "#534AB7", "#3B6D11"];

function authorBg(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h + name.charCodeAt(i)) % AUTHOR_BG.length;
  return AUTHOR_BG[h];
}

// ── Avatar ────────────────────────────────────────────────────
function Avatar({ name, src, size = 36 }: { name: string; src?: string | null; size?: number }) {
  return src ? (
    <img
      src={src}
      alt={name}
      style={{ width: size, height: size }}
      className="rounded-full object-cover flex-shrink-0"
    />
  ) : (
    <div
      style={{ width: size, height: size, background: authorBg(name), fontSize: size * 0.32 }}
      className="rounded-full flex items-center justify-center text-white font-bold font-heading flex-shrink-0"
    >
      {getInitials(name)}
    </div>
  );
}

// ── CommentSection ───────────────────────────────────────────
function CommentSection({
  postId,
  onCountChange,
}: {
  postId: string;
  onCountChange: (delta: number) => void;
}) {
  const { t } = useTranslation("matching");
  const user = getCurrentUser();
  const [comments, setComments] = useState<ApiComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
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
    setSending(true);
    const r = await createComment(postId, text.trim());
    if (r.success && r.data) {
      setComments((p) => [...p, r.data!]);
      setText("");
      onCountChange(1);
    } else toast.error(r.message);
    setSending(false);
  };

  const handleEdit = async (id: string) => {
    if (!editText.trim()) return;
    const r = await updateComment(id, editText.trim());
    if (r.success && r.data) {
      setComments((p) => p.map((c) => (c.id === id ? r.data! : c)));
      setEditingId(null);
    } else toast.error(r.message);
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    const r = await deleteComment(id);
    if (r.success) {
      setComments((p) => p.filter((c) => c.id !== id));
      onCountChange(-1);
      toast.success(t("feed.comment.deleted"));
    } else toast.error(r.message);
    setDeletingId(null);
    setConfirmDeleteId(null);
  };

  if (loading)
    return (
      <div className="px-4 py-3 flex items-center gap-2 text-brand-muted text-[13px]">
        <Loader2 size={13} className="animate-spin" /> {t("feed.comment.loading")}
      </div>
    );

  return (
    <div className="px-4 pb-4 flex flex-col gap-3">
      {comments.map((c) => (
        <div key={c.id} className="flex gap-2.5">
          <Avatar name={c.author.name} src={c.author.avatarUrl} size={30} />
          <div className="flex-1 min-w-0">
            {editingId === c.id ? (
              <div className="flex gap-1.5">
                <input
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleEdit(c.id);
                    if (e.key === "Escape") setEditingId(null);
                  }}
                  className="flex-1 rounded-xl px-3 py-2 text-[13px] bg-brand-surface border border-brand-orange outline-none"
                  autoFocus
                />
                <button
                  onClick={() => handleEdit(c.id)}
                  className="p-2 rounded-lg text-brand-orange hover:bg-brand-surface-orange"
                >
                  <Check size={13} />
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  className="p-2 rounded-lg text-brand-muted hover:bg-brand-surface"
                >
                  <X size={13} />
                </button>
              </div>
            ) : (
              <div className="bg-[#f5f0ed] rounded-2xl px-3.5 py-2.5 inline-block max-w-full">
                <span className="text-[12px] font-bold text-brand-dark font-heading mr-1.5">
                  {c.isOwner ? "Bạn" : c.author.name}
                </span>
                <span className="text-[13px] text-brand-dark leading-relaxed">{c.content}</span>
              </div>
            )}
            <div className="flex items-center gap-3 mt-1 pl-1">
              <span className="text-[11px] text-brand-muted">{timeAgo(c.createdAt, t)}</span>
              {c.updatedAt !== c.createdAt && (
                <span className="text-[11px] text-brand-muted italic">{t("feed.edited")}</span>
              )}
              {c.isOwner && editingId !== c.id && (
                <>
                  <button
                    onClick={() => {
                      setEditingId(c.id);
                      setEditText(c.content);
                      setConfirmDeleteId(null);
                    }}
                    className="text-[11px] text-brand-muted hover:text-brand-orange flex items-center gap-1"
                  >
                    <Edit3 size={10} /> Sửa
                  </button>
                  {confirmDeleteId === c.id ? (
                    <span className="flex items-center gap-1.5">
                      <span className="text-[11px] text-brand-red">Xoá?</span>
                      <button
                        onClick={() => handleDelete(c.id)}
                        disabled={deletingId === c.id}
                        className="text-[11px] text-brand-red hover:underline disabled:opacity-50"
                      >
                        {deletingId === c.id ? (
                          <Loader2 size={10} className="animate-spin" />
                        ) : (
                          "Có"
                        )}
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="text-[11px] text-brand-muted hover:underline"
                      >
                        Không
                      </button>
                    </span>
                  ) : (
                    <button
                      onClick={() => setConfirmDeleteId(c.id)}
                      className="text-[11px] text-brand-muted hover:text-brand-red flex items-center gap-1"
                    >
                      <Trash2 size={10} /> Xoá
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      ))}
      {user ? (
        <div className="flex gap-2.5">
          <Avatar name={user.name} src={user.avatar} size={30} />
          <div className="flex-1 flex items-center gap-2 px-3 rounded-2xl bg-[#f5f0ed] min-h-[38px]">
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
              placeholder={t("feed.comment.placeholder")}
              className="flex-1 bg-transparent outline-none py-2 text-[13px] text-brand-dark border-none"
            />
            <button
              onClick={handleSend}
              disabled={!text.trim() || sending}
              className="text-brand-orange disabled:opacity-40 hover:opacity-80 transition-opacity shrink-0"
            >
              {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            </button>
          </div>
        </div>
      ) : (
        <p className="text-[13px] text-brand-muted text-center py-1">
          {t("feed.comment.loginRequired")}
        </p>
      )}
    </div>
  );
}

// ── DeleteConfirmBanner ──────────────────────────────────────
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
      <AlertTriangle size={14} className="text-brand-red shrink-0" />
      <p className="flex-1 text-[12px] text-brand-red">Xoá tin này? Không thể hoàn tác.</p>
      <button
        onClick={onCancel}
        className="h-7 px-3 rounded-lg border border-[#fecdca] text-[12px] text-brand-body hover:bg-white transition-colors"
      >
        Huỷ
      </button>
      <button
        onClick={onConfirm}
        disabled={loading}
        className="h-7 px-3 rounded-lg bg-brand-red text-[12px] text-white hover:opacity-90 disabled:opacity-60 flex items-center gap-1"
      >
        {loading ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={11} />} Xoá
      </button>
    </div>
  );
}

// ── Shared action bar ────────────────────────────────────────
function ActionBar({
  post,
  liking,
  showComments,
  onLike,
  onToggleComments,
  onShare,
}: {
  post: ApiPost;
  liking: boolean;
  showComments: boolean;
  onLike: () => void;
  onToggleComments: () => void;
  onShare: () => void;
}) {
  const { t } = useTranslation("matching");
  return (
    <div className="flex items-center border-t border-[#f0ebe7]">
      <button
        onClick={onLike}
        disabled={liking}
        className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 hover:bg-[#f5f0ed] transition-colors text-[12px] font-medium ${
          post.hasLiked ? "text-[#c0392b] font-bold" : "text-brand-body"
        }`}
      >
        <Heart
          size={14}
          fill={post.hasLiked ? "#c0392b" : "none"}
          color={post.hasLiked ? "#c0392b" : "currentColor"}
          className={liking ? "scale-125 transition-transform" : ""}
        />
        {t("feed.like")}
        {post.likeCount > 0 && (
          <span className="text-[11px] text-brand-muted font-normal">({post.likeCount})</span>
        )}
      </button>
      <span className="w-px h-4 bg-[#f0ebe7]" />
      <button
        onClick={onToggleComments}
        className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 hover:bg-[#f5f0ed] transition-colors text-[12px] font-medium ${
          showComments ? "text-brand-orange font-bold" : "text-brand-body"
        }`}
      >
        <MessageCircle size={14} />
        {t("feed.comment.action")}
        {post.commentCount > 0 && (
          <span className="text-[11px] text-brand-muted font-normal">({post.commentCount})</span>
        )}
        {post.commentCount > 0 && (
          <ChevronDown
            size={11}
            className={`transition-transform ${showComments ? "rotate-180" : ""}`}
          />
        )}
      </button>
      <span className="w-px h-4 bg-[#f0ebe7]" />
      <button
        onClick={onShare}
        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 hover:bg-[#f5f0ed] transition-colors text-[12px] text-brand-body font-medium"
      >
        <Share2 size={14} />
        {t("feed.share")}
      </button>
    </div>
  );
}

// ── SellCard ─────────────────────────────────────────────────
function SellCard({
  post: initialPost,
  onUpdated,
  onDeleted,
}: {
  post: ApiPost;
  onUpdated: (p: ApiPost) => void;
  onDeleted: (id: string) => void;
}) {
  const { t } = useTranslation("matching");
  const navigate = useNavigate();
  const user = getCurrentUser();
  const [post, setPost] = useState(initialPost);
  const [showComments, setShowComments] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [liking, setLiking] = useState(false);
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  React.useEffect(() => setPost(initialPost), [initialPost]);

  const handleLike = async () => {
    if (!user) {
      toast.error(t("feed.likeLoginRequired"));
      return;
    }
    if (liking) return;
    setLiking(true);
    const fn = post.hasLiked ? unlikePost : likePost;
    const r = await fn(post.id);
    if (r.success && r.data) {
      setPost(r.data);
      onUpdated(r.data);
    } else toast.error(r.message);
    setLiking(false);
  };

  const handleDelete = async () => {
    setDeleting(true);
    const r = await deletePost(post.id);
    if (r.success) {
      toast.success(t("feed.deleted"));
      onDeleted(post.id);
    } else {
      toast.error(r.message);
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/feed/${post.id}`);
      toast.success(t("feed.shareCopied"));
    } catch {
      toast.error(t("feed.shareFailed"));
    }
  };

  const handleContact = () => {
    if (!user || user._id === post.author.id) return;
    navigate(
      `/messages?with=${post.author.id}&name=${encodeURIComponent(
        post.author.name
      )}&avatar=${encodeURIComponent(post.author.avatarUrl || "")}`
    );
  };

  const price = formatPrice(post);
  const cond = post.condition ? CONDITION_MAP[post.condition] : null;
  const sportCls = SPORT_COLOR[post.sport] ?? "bg-[#f5f0ed] text-brand-body border-brand-border";

  return (
    <article className="flex flex-col bg-white rounded-2xl overflow-hidden border border-[#e8e0dc]">
      {/* ── Product image ── */}
      <div className="relative">
        {post.imageUrl ? (
          <img
            src={post.imageUrl}
            alt={post.title}
            className="w-full h-52 object-cover bg-[#f0e8e3]"
          />
        ) : (
          <div className="w-full h-40 bg-[#f5f0ed] flex flex-col items-center justify-center gap-2 text-brand-muted">
            <Package size={36} className="text-[#dfc0b3]" />
            <span className="text-[12px]">Chưa có ảnh</span>
          </div>
        )}
        {/* Overlay badges */}
        <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-brand-orange text-white font-heading tracking-wide">
          BÁN
        </span>
        {cond && (
          <span
            className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-bold border bg-white/90 ${cond.cls}`}
          >
            {cond.label}
          </span>
        )}
        {/* Like button on image */}
        <button
          onClick={handleLike}
          disabled={liking}
          className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-white/90 border border-white/50 flex items-center justify-center text-brand-muted hover:text-[#c0392b] transition-colors"
        >
          <Heart
            size={15}
            fill={post.hasLiked ? "#c0392b" : "none"}
            color={post.hasLiked ? "#c0392b" : "currentColor"}
          />
        </button>
        {/* Status overlay if not open */}
        {post.status !== "open" && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="px-4 py-2 rounded-full bg-white/90 text-[13px] font-bold text-brand-dark font-heading">
              {post.status === "matched"
                ? "Đã khớp"
                : post.status === "closed"
                  ? "Đã bán"
                  : "Hết hạn"}
            </span>
          </div>
        )}
      </div>
      {/* ── Body ── */}
      <div className="px-4 pt-3 pb-1">
        {/* Title */}
        <h3 className="font-heading text-[15px] font-bold text-brand-dark leading-snug mb-2">
          {post.title}
        </h3>
        {/* Price */}
        <div className="flex items-end justify-between mb-3">
          <div>
            <div className="font-heading text-[20px] font-extrabold text-brand-orange leading-none">
              {price.main}
            </div>
            {price.sub && (
              <div className="text-[11px] text-brand-muted mt-0.5">
                {price.sub}
                {post.priceType === "negotiable"
                  ? ""
                  : post.priceType === "range"
                    ? ""
                    : " · Giá cố định"}
              </div>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {post.quantity != null && post.quantity > 0 && (
              <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#f5f0ed] text-brand-body border border-[#e8e0dc]">
                Còn {post.quantity}
              </span>
            )}
          </div>
        </div>
        {/* Tags row */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          <span
            className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${sportCls}`}
          >
            {post.sport}
          </span>
          {post.category && (
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#f5f0ed] text-brand-body border border-[#e8e0dc]">
              {post.category}
            </span>
          )}
        </div>
        {/* Details snippet */}
        {post.details && (
          <p className="text-[13px] text-brand-body leading-relaxed line-clamp-2 mb-3">
            {post.details}
          </p>
        )}
      </div>
      {/* Delete confirm */}
      {confirmDelete && (
        <DeleteConfirmBanner
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(false)}
          loading={deleting}
        />
      )}
      {/* ── Seller row ── */}
      <div className="flex items-center gap-3 px-4 py-3 border-t border-[#f0ebe7]">
        <Avatar name={post.author.name} src={post.author.avatarUrl} size={34} />
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-brand-dark truncate">
            {post.isOwner ? "Bạn" : post.author.name}
          </p>
          <div className="flex items-center gap-1 text-[11px] text-brand-muted">
            <Clock size={10} />
            <span>{timeAgo(post.createdAt, t)}</span>
          </div>
        </div>
        {/* Owner actions or Contact CTA */}
        {post.isOwner ? (
          <div className="relative">
            <button
              onClick={() => {
                setMenuOpen((o) => !o);
                setConfirmDelete(false);
              }}
              className="w-8 h-8 rounded-full border border-[#e8e0dc] flex items-center justify-center hover:bg-[#f5f0ed] transition-colors text-brand-muted"
            >
              <MoreHorizontal size={15} />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 bottom-9 z-30 rounded-2xl overflow-hidden bg-white border border-[#e8e0dc] w-40 shadow-[0_8px_32px_rgba(36,25,20,0.14)]">
                  <button
                    onClick={() => {
                      setEditing(true);
                      setMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-[#f5f0ed] text-left text-[13px] text-brand-dark"
                  >
                    <Edit3 size={13} className="text-brand-orange" /> Chỉnh sửa
                  </button>
                  <button
                    onClick={() => {
                      setConfirmDelete(true);
                      setMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-[#fff5f5] text-left text-[13px] text-brand-red"
                  >
                    <Trash2 size={13} /> Xoá tin
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <button
            onClick={handleContact}
            className="flex items-center gap-2 h-9 px-4 rounded-xl bg-brand-orange text-[12px] font-bold text-white font-heading hover:opacity-90 transition-opacity flex-shrink-0"
          >
            <MessageSquare size={13} /> Nhắn tin
          </button>
        )}
      </div>
      {/* View detail */}
      <div className="px-4 py-1.5 border-t border-[#f0ebe7]">
        <Link
          to={`/feed/${post.id}`}
          className="inline-flex items-center gap-1 text-[12px] text-brand-orange hover:underline"
        >
          <ExternalLink size={11} /> Xem chi tiết
        </Link>
      </div>
      {/* Stats */}
      {(post.likeCount > 0 || post.commentCount > 0) && (
        <div className="flex items-center justify-between px-4 py-1.5 border-t border-[#f0ebe7]">
          {post.likeCount > 0 && (
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded-full bg-[#c0392b] flex items-center justify-center">
                <Heart size={8} fill="white" color="white" />
              </div>
              <span className="text-[12px] text-brand-body">{post.likeCount}</span>
            </div>
          )}
          {post.commentCount > 0 && (
            <button
              onClick={() => setShowComments((s) => !s)}
              className="ml-auto text-[12px] text-brand-body hover:text-brand-orange transition-colors"
            >
              {post.commentCount} hỏi đáp
            </button>
          )}
        </div>
      )}
      {/* Action bar */}
      <ActionBar
        post={post}
        liking={liking}
        showComments={showComments}
        onLike={handleLike}
        onToggleComments={() => setShowComments((s) => !s)}
        onShare={handleShare}
      />
      {/* Comments */}
      {showComments && (
        <div className="pt-3 border-t border-[#f0ebe7]">
          <CommentSection
            postId={post.id}
            onCountChange={(d) =>
              setPost((p) => ({ ...p, commentCount: Math.max(0, p.commentCount + d) }))
            }
          />
        </div>
      )}
      {editing && (
        <CreatePostModal
          editPost={post}
          onClose={() => setEditing(false)}
          onSuccess={(updated) => {
            if (updated) {
              setPost(updated);
              onUpdated(updated);
            }
            setEditing(false);
          }}
        />
      )}
    </article>
  );
}

// ── SocialPostCard ───────────────────────────────────────────
function SocialPostCard({
  post: initialPost,
  onUpdated,
  onDeleted,
}: {
  post: ApiPost;
  onUpdated: (p: ApiPost) => void;
  onDeleted: (id: string) => void;
}) {
  const { t } = useTranslation("matching");
  const navigate = useNavigate();
  const user = getCurrentUser();
  const [post, setPost] = useState(initialPost);
  const [showComments, setShowComments] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [liking, setLiking] = useState(false);
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  React.useEffect(() => setPost(initialPost), [initialPost]);

  const handleLike = async () => {
    if (!user) {
      toast.error(t("feed.likeLoginRequired"));
      return;
    }
    if (liking) return;
    setLiking(true);
    const fn = post.hasLiked ? unlikePost : likePost;
    const r = await fn(post.id);
    if (r.success && r.data) {
      setPost(r.data);
      onUpdated(r.data);
    } else toast.error(r.message);
    setLiking(false);
  };

  const handleDelete = async () => {
    setDeleting(true);
    const r = await deletePost(post.id);
    if (r.success) {
      toast.success(t("feed.deleted"));
      onDeleted(post.id);
    } else {
      toast.error(r.message);
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/feed/${post.id}`);
      toast.success(t("feed.shareCopied"));
    } catch {
      toast.error(t("feed.shareFailed"));
    }
  };

  const handleUserClick = () => {
    if (user?._id === post.author.id) return;
    navigate(
      `/messages?with=${post.author.id}&name=${encodeURIComponent(
        post.author.name
      )}&avatar=${encodeURIComponent(post.author.avatarUrl || "")}`
    );
  };

  const sportCls = SPORT_COLOR[post.sport] ?? "bg-[#f5f0ed] text-brand-body border-brand-border";

  return (
    <article className="flex flex-col bg-white rounded-2xl overflow-hidden border border-[#e8e0dc]">
      {/* ── Header ── */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-2">
        <button
          onClick={handleUserClick}
          className="outline-none cursor-pointer flex-shrink-0 hover:opacity-80 transition-opacity"
        >
          <Avatar name={post.author.name} src={post.author.avatarUrl} size={40} />
        </button>
        <div className="flex-1 min-w-0">
          <button
            onClick={handleUserClick}
            className="text-[13px] font-bold text-brand-dark font-heading hover:opacity-80 outline-none block"
          >
            {post.isOwner ? "Bạn" : post.author.name}
          </button>
          <div className="flex items-center gap-1.5 mt-0.5">
            {post.sport && (
              <span
                className={`px-1.5 py-px rounded-full text-[10px] font-bold border ${sportCls}`}
              >
                {post.sport}
              </span>
            )}
            <span className="text-[11px] text-brand-muted">
              {timeAgo(post.createdAt, t)}
              {post.updatedAt !== post.createdAt && " · đã sửa"}
            </span>
          </div>
        </div>
        {post.isOwner && (
          <div className="relative flex-shrink-0">
            <button
              onClick={() => {
                setMenuOpen((o) => !o);
                setConfirmDelete(false);
              }}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#f5f0ed] transition-colors text-brand-muted"
            >
              <MoreHorizontal size={15} />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-9 z-30 rounded-2xl overflow-hidden bg-white border border-[#e8e0dc] w-40 shadow-[0_8px_32px_rgba(36,25,20,0.14)]">
                  <button
                    onClick={() => {
                      setEditing(true);
                      setMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-[#f5f0ed] text-left text-[13px] text-brand-dark"
                  >
                    <Edit3 size={13} className="text-brand-orange" /> Chỉnh sửa
                  </button>
                  <button
                    onClick={() => {
                      setConfirmDelete(true);
                      setMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-[#fff5f5] text-left text-[13px] text-brand-red"
                  >
                    <Trash2 size={13} /> Xoá bài
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
      {/* ── Content ── */}
      <div className="px-4 pb-3">
        {(post.details || post.content) && (
          <p className="text-[13px] text-brand-dark leading-relaxed whitespace-pre-wrap">
            {post.details || post.content}
          </p>
        )}
      </div>
      {post.imageUrl && (
        <div className="px-4 pb-3">
          <img
            src={post.imageUrl}
            alt="Post"
            className="w-full max-h-[440px] rounded-2xl object-cover bg-[#f5f0ed] border border-[#e8e0dc]"
          />
        </div>
      )}
      {/* Delete confirm */}
      {confirmDelete && (
        <DeleteConfirmBanner
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(false)}
          loading={deleting}
        />
      )}
      {/* Stats */}
      {(post.likeCount > 0 || post.commentCount > 0) && (
        <div className="flex items-center justify-between px-4 py-2 border-t border-[#f0ebe7]">
          {post.likeCount > 0 && (
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded-full bg-[#c0392b] flex items-center justify-center">
                <Heart size={8} fill="white" color="white" />
              </div>
              <span className="text-[12px] text-brand-body">{post.likeCount} lượt thích</span>
            </div>
          )}
          {post.commentCount > 0 && (
            <button
              onClick={() => setShowComments((s) => !s)}
              className="ml-auto text-[12px] text-brand-body hover:text-brand-orange transition-colors"
            >
              {post.commentCount} bình luận
            </button>
          )}
        </div>
      )}
      {/* View detail */}
      <div className="px-4 py-1.5 border-t border-[#f0ebe7]">
        <Link
          to={`/feed/${post.id}`}
          className="inline-flex items-center gap-1 text-[12px] text-brand-orange hover:underline"
        >
          <ExternalLink size={11} /> Xem chi tiết
        </Link>
      </div>
      {/* Action bar */}
      <ActionBar
        post={post}
        liking={liking}
        showComments={showComments}
        onLike={handleLike}
        onToggleComments={() => setShowComments((s) => !s)}
        onShare={handleShare}
      />
      {/* Comments */}
      {showComments && (
        <div className="pt-3 border-t border-[#f0ebe7]">
          <CommentSection
            postId={post.id}
            onCountChange={(d) =>
              setPost((p) => ({ ...p, commentCount: Math.max(0, p.commentCount + d) }))
            }
          />
        </div>
      )}
      {editing && (
        <CreatePostModal
          editPost={post}
          onClose={() => setEditing(false)}
          onSuccess={(updated) => {
            if (updated) {
              setPost(updated);
              onUpdated(updated);
            }
            setEditing(false);
          }}
        />
      )}
    </article>
  );
}

// ── Export ───────────────────────────────────────────────────
export function PostCard({
  post,
  onUpdated,
  onDeleted,
}: {
  post: ApiPost;
  onUpdated: (updated: ApiPost) => void;
  onDeleted: (postId: string) => void;
}) {
  return post.intentType === "sell" ? (
    <SellCard post={post} onUpdated={onUpdated} onDeleted={onDeleted} />
  ) : (
    <SocialPostCard post={post} onUpdated={onUpdated} onDeleted={onDeleted} />
  );
}
