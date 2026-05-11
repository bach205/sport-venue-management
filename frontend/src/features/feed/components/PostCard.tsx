import React, { useState, useRef } from 'react';
import {
  Heart, MessageCircle, Share2, Bookmark,
  MapPin, MoreHorizontal, Trash2, Send, ThumbsUp
} from 'lucide-react';
import type { FeedPost } from '../types/feed.types';
import {
  toggleLike, toggleSave, addComment,
  toggleCommentLike, incrementShare, deletePost
} from '../store/feedStore';
import { getCurrentUser } from '../../auth/store/authStore';
import { toast } from 'sonner';

type Sport = FeedPost['sport'];

const SPORT_CONFIG: Record<string, { emoji: string; label: string; color: string; bg: string }> = {
  badminton:   { emoji: '🏸', label: 'Badminton',   color: '#006a65', bg: '#e7f8f7' },
  tennis:      { emoji: '🎾', label: 'Tennis',       color: '#a04100', bg: '#fff1eb' },
  pickleball:  { emoji: '🏓', label: 'Pickleball',  color: '#1a5fb4', bg: '#ddeeff' },
  football:    { emoji: '⚽', label: 'Football',     color: '#00785e', bg: '#d0f5ee' },
  basketball:  { emoji: '🏀', label: 'Basketball',  color: '#856404', bg: '#fff3cd' },
  table_tennis:{ emoji: '🏓', label: 'Table Tennis',color: '#c0392b', bg: '#ffd6d6' },
  swimming:    { emoji: '🏊', label: 'Swimming',    color: '#1a5fb4', bg: '#ddeeff' },
  volleyball:  { emoji: '🏐', label: 'Volleyball',  color: '#5c3317', bg: '#f4ded5' },
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (m < 1) return 'Vừa xong';
  if (m < 60) return `${m} phút trước`;
  if (h < 24) return `${h} giờ trước`;
  return `${d} ngày trước`;
}

// ─── Image grid ──────────────────────────────────────────────────────────────
function ImageGrid({ images }: { images: string[] }) {
  const [lightbox, setLightbox] = useState<string | null>(null);

  if (images.length === 0) return null;

  const Grid = () => {
    if (images.length === 1) {
      return (
        <div className="w-full overflow-hidden rounded-xl cursor-pointer" style={{ maxHeight: 420 }} onClick={() => setLightbox(images[0])}>
          <img src={images[0]} alt="" className="w-full h-full object-cover hover:opacity-95 transition-opacity" style={{ display: 'block' }} />
        </div>
      );
    }
    if (images.length === 2) {
      return (
        <div className="grid grid-cols-2 gap-1 rounded-xl overflow-hidden">
          {images.map((img, i) => (
            <img key={i} src={img} alt="" className="w-full object-cover cursor-pointer hover:opacity-95 transition-opacity" style={{ height: 240 }} onClick={() => setLightbox(img)} />
          ))}
        </div>
      );
    }
    if (images.length === 3) {
      return (
        <div className="grid gap-1 rounded-xl overflow-hidden" style={{ gridTemplateColumns: '2fr 1fr' }}>
          <img src={images[0]} alt="" className="w-full object-cover cursor-pointer hover:opacity-95 transition-opacity row-span-2" style={{ height: 300 }} onClick={() => setLightbox(images[0])} />
          {images.slice(1).map((img, i) => (
            <img key={i} src={img} alt="" className="w-full object-cover cursor-pointer hover:opacity-95 transition-opacity" style={{ height: 148 }} onClick={() => setLightbox(img)} />
          ))}
        </div>
      );
    }
    // 4 images
    return (
      <div className="grid grid-cols-2 gap-1 rounded-xl overflow-hidden">
        {images.slice(0, 4).map((img, i) => (
          <img key={i} src={img} alt="" className="w-full object-cover cursor-pointer hover:opacity-95 transition-opacity" style={{ height: 200 }} onClick={() => setLightbox(img)} />
        ))}
      </div>
    );
  };

  return (
    <>
      <Grid />
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          style={{ background: 'rgba(0,0,0,0.9)' }}
          onClick={() => setLightbox(null)}
        >
          <img src={lightbox} alt="" className="max-w-full max-h-full object-contain rounded-xl" style={{ boxShadow: '0 0 60px rgba(0,0,0,0.8)' }} />
        </div>
      )}
    </>
  );
}

// ─── Comment section ──────────────────────────────────────────────────────────
function CommentSection({ post }: { post: FeedPost }) {
  const user = getCurrentUser();
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSend = async () => {
    if (!text.trim() || !user) return;
    setSending(true);
    await new Promise(r => setTimeout(r, 300));
    addComment(post.id, {
      authorId: user.id,
      authorName: user.name,
      authorAvatar: user.avatar,
      content: text.trim(),
    });
    setText('');
    setSending(false);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const initials = user?.name?.split(' ').map(w => w[0]).slice(-2).join('') ?? 'U';

  return (
    <div className="px-4 pb-3 flex flex-col gap-3">
      {/* Existing comments */}
      {post.comments.map(c => {
        const liked = user ? c.likedBy.includes(user.id) : false;
        const cInitials = c.authorName.split(' ').map(w => w[0]).slice(-2).join('');
        return (
          <div key={c.id} className="flex gap-2.5">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
              style={{ background: 'linear-gradient(135deg,#006a65,#00a896)', color: '#fff', fontFamily: 'Lexend, sans-serif' }}
            >
              {cInitials}
            </div>
            <div className="flex-1">
              <div
                className="rounded-2xl px-3.5 py-2.5 inline-block"
                style={{ background: '#f4f0ee', maxWidth: '100%' }}
              >
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 700, color: '#241914', marginBottom: 2 }}>
                  {c.authorName}
                </p>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#241914', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                  {c.content}
                </p>
              </div>
              <div className="flex items-center gap-4 mt-1 pl-1">
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#8b7266' }}>
                  {timeAgo(c.createdAt)}
                </span>
                <button
                  onClick={() => user && toggleCommentLike(post.id, c.id, user.id)}
                  className="flex items-center gap-1 hover:text-[#a04100] transition-colors"
                  style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: liked ? 700 : 500, color: liked ? '#a04100' : '#8b7266' }}
                >
                  <ThumbsUp size={11} fill={liked ? '#a04100' : 'none'} />
                  {liked ? 'Đã thích' : 'Thích'}
                  {c.likedBy.length > 0 && <span>({c.likedBy.length})</span>}
                </button>
              </div>
            </div>
          </div>
        );
      })}

      {/* New comment input */}
      {user ? (
        <div className="flex gap-2.5">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
            style={{ background: 'linear-gradient(135deg,#a04100,#ff7e36)', color: '#fff', fontFamily: 'Lexend, sans-serif' }}
          >
            {initials}
          </div>
          <div
            className="flex-1 flex items-center gap-2 px-3 rounded-2xl"
            style={{ background: '#f4f0ee', minHeight: 38 }}
          >
            <input
              ref={inputRef}
              type="text"
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Viết bình luận..."
              className="flex-1 bg-transparent outline-none py-2"
              style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#241914', border: 'none' }}
            />
            <button
              onClick={handleSend}
              disabled={!text.trim() || sending}
              className="shrink-0 disabled:opacity-40 transition-opacity hover:opacity-80"
              style={{ color: '#006a65' }}
            >
              <Send size={15} />
            </button>
          </div>
        </div>
      ) : (
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#8b7266', textAlign: 'center', padding: '4px 0' }}>
          Đăng nhập để bình luận
        </p>
      )}
    </div>
  );
}

// ─── Main PostCard ────────────────────────────────────────────────────────────
export function PostCard({ post, onUpdate }: { post: FeedPost; onUpdate: () => void }) {
  const user = getCurrentUser();
  const userId = user?.id ?? '';
  const liked   = userId ? post.likedBy.includes(userId) : false;
  const saved   = userId ? post.savedBy.includes(userId) : false;
  const [showComments, setShowComments] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [likeAnim, setLikeAnim] = useState(false);

  const sport = post.sport ? SPORT_CONFIG[post.sport] : null;
  const isAuthor = userId === post.authorId;
  const initials = post.authorName.split(' ').map(w => w[0]).slice(-2).join('');

  const handleLike = () => {
    if (!userId) { toast.error('Đăng nhập để thích bài viết'); return; }
    if (!liked) { setLikeAnim(true); setTimeout(() => setLikeAnim(false), 600); }
    toggleLike(post.id, userId);
    onUpdate();
  };

  const handleSave = () => {
    if (!userId) { toast.error('Đăng nhập để lưu bài viết'); return; }
    toggleSave(post.id, userId);
    onUpdate();
    toast.success(saved ? 'Đã bỏ lưu bài viết' : 'Đã lưu bài viết! 🔖');
  };

  const handleShare = () => {
    incrementShare(post.id);
    onUpdate();
    navigator.clipboard?.writeText(window.location.href).catch(() => {});
    toast.success('Đã sao chép link bài viết! 🔗');
  };

  const handleDelete = () => {
    if (!isAuthor) return;
    deletePost(post.id, userId);
    onUpdate();
    toast.success('Đã xóa bài viết');
    setMenuOpen(false);
  };

  const ActionBtn = ({
    icon, label, active, activeColor, count, onClick,
  }: {
    icon: React.ReactNode; label: string; active?: boolean;
    activeColor?: string; count?: number; onClick: () => void;
  }) => (
    <button
      onClick={onClick}
      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl transition-all hover:bg-[#f4f0ee]"
      style={{
        fontFamily: 'Inter, sans-serif',
        fontSize: '13px',
        fontWeight: active ? 700 : 500,
        color: active ? activeColor : '#584238',
      }}
    >
      {icon}
      <span>{label}</span>
      {count !== undefined && count > 0 && (
        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#8b7266', fontWeight: 400 }}>
          ({count})
        </span>
      )}
    </button>
  );

  return (
    <div
      className="flex flex-col rounded-2xl overflow-hidden"
      style={{ background: '#fff', border: '1px solid #e8e0dc', boxShadow: '0 1px 4px rgba(36,25,20,0.06)' }}
    >
      {/* ─── Post Header ──────────────────────────────────────────────────── */}
      <div className="flex items-start gap-3 px-4 pt-4 pb-2">
        {/* Avatar */}
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-sm font-bold"
          style={{ background: 'linear-gradient(135deg,#006a65,#00a896)', color: '#fff', fontFamily: 'Lexend, sans-serif' }}
        >
          {initials}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p style={{ fontFamily: 'Lexend, sans-serif', fontSize: '14px', fontWeight: 700, color: '#241914' }}>
                {post.authorName}
              </p>
              <div className="flex items-center gap-2 flex-wrap mt-0.5">
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#8b7266' }}>
                  {timeAgo(post.createdAt)}
                </span>
                {post.location && (
                  <span className="flex items-center gap-0.5" style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#8b7266' }}>
                    <MapPin size={11} /> {post.location}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {sport && (
                <span
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full"
                  style={{ background: sport.bg, color: sport.color, fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 700 }}
                >
                  {sport.emoji} {sport.label}
                </span>
              )}
              {/* More menu */}
              <div className="relative">
                <button
                  onClick={() => setMenuOpen(o => !o)}
                  className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-[#f4f0ee] transition-colors"
                  style={{ color: '#8b7266' }}
                >
                  <MoreHorizontal size={16} />
                </button>
                {menuOpen && (
                  <>
                    <div className="fixed inset-0 z-20" onClick={() => setMenuOpen(false)} />
                    <div
                      className="absolute right-0 top-8 z-30 rounded-xl overflow-hidden"
                      style={{ background: '#fff', border: '1.5px solid #dfc0b3', width: 160, boxShadow: '0 8px 24px rgba(36,25,20,0.18)' }}
                    >
                      {isAuthor && (
                        <button
                          onClick={handleDelete}
                          className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-[#ffeeee] transition-colors text-left"
                          style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#c0392b' }}
                        >
                          <Trash2 size={14} /> Xóa bài viết
                        </button>
                      )}
                      <button
                        onClick={() => { toast.info('Tính năng báo cáo sẽ sớm ra mắt'); setMenuOpen(false); }}
                        className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-[#fff1eb] transition-colors text-left"
                        style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#584238' }}
                      >
                        Báo cáo
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Content ──────────────────────────────────────────────────────── */}
      <div className="px-4 pb-3">
        <p
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '14px',
            color: '#241914',
            lineHeight: 1.65,
            whiteSpace: 'pre-wrap',
          }}
        >
          {post.content}
        </p>
      </div>

      {/* ─── Images ──────────────────────────────────────────────────────── */}
      {post.images.length > 0 && (
        <div className="px-4 pb-3">
          <ImageGrid images={post.images} />
        </div>
      )}

      {/* ─── Stats row ───────────────────────────────────────────────────── */}
      {(post.likedBy.length > 0 || post.comments.length > 0 || post.shareCount > 0) && (
        <div className="flex items-center justify-between px-4 py-2 border-t border-b border-[#f4ede9]">
          {/* Likes */}
          <button
            onClick={() => setShowComments(s => !s)}
            className="flex items-center gap-1.5 hover:underline"
          >
            {post.likedBy.length > 0 && (
              <span
                className="w-5 h-5 rounded-full flex items-center justify-center text-xs"
                style={{ background: '#a04100', color: '#fff' }}
              >
                ❤
              </span>
            )}
            {post.likedBy.length > 0 && (
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#584238' }}>
                {post.likedBy.length} lượt thích
              </span>
            )}
          </button>

          <div className="flex items-center gap-4">
            {post.comments.length > 0 && (
              <button
                onClick={() => setShowComments(s => !s)}
                className="hover:underline"
                style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#584238' }}
              >
                {post.comments.length} bình luận
              </button>
            )}
            {post.shareCount > 0 && (
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#584238' }}>
                {post.shareCount} chia sẻ
              </span>
            )}
          </div>
        </div>
      )}

      {/* ─── Action buttons ────────────────────────────────────────────────── */}
      <div className="flex items-center px-2 py-1 border-b border-[#f4ede9]">
        <ActionBtn
          icon={
            <Heart
              size={17}
              fill={liked ? '#c0392b' : 'none'}
              color={liked ? '#c0392b' : '#584238'}
              className={likeAnim ? 'scale-125' : ''}
              style={{ transition: 'transform 0.2s' }}
            />
          }
          label="Thích"
          active={liked}
          activeColor="#c0392b"
          onClick={handleLike}
        />
        <ActionBtn
          icon={<MessageCircle size={17} color={showComments ? '#006a65' : '#584238'} />}
          label="Bình luận"
          active={showComments}
          activeColor="#006a65"
          count={post.comments.length}
          onClick={() => setShowComments(s => !s)}
        />
        <ActionBtn
          icon={<Share2 size={17} color="#584238" />}
          label="Chia sẻ"
          onClick={handleShare}
        />
        <ActionBtn
          icon={<Bookmark size={17} fill={saved ? '#a04100' : 'none'} color={saved ? '#a04100' : '#584238'} />}
          label="Lưu"
          active={saved}
          activeColor="#a04100"
          onClick={handleSave}
        />
      </div>

      {/* ─── Comment section ───────────────────────────────────────────────── */}
      {showComments && (
        <div className="pt-3">
          <CommentSection post={post} />
        </div>
      )}
    </div>
  );
}
