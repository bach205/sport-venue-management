import React, { useState, useEffect, useCallback } from "react";
import { Plus, Rss, RefreshCw, Loader2, Search, X } from "lucide-react";
import { getFeed, searchFeed } from "../api/socialApi";
import type { ApiPost, Pagination } from "../types/feed.types";
import { PostCard } from "../components/PostCard";
import { CreatePostModal } from "../components/CreatePostModal";
import { getCurrentUser } from "../../auth/store/authStore";
import { toast } from "sonner";
import { Skeleton } from "@/shared/components/ui/skeleton";

export default function FeedPage() {
  const user = getCurrentUser();
  const [posts, setPosts] = useState<ApiPost[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const loadFeed = useCallback(async (page = 1, append = false) => {
    if (page === 1) setLoading(true);
    else setLoadingMore(true);
    const result = searchQuery ? await searchFeed(searchQuery, page, 20) : await getFeed(page, 20);
    if (result.success && result.data) {
      setPosts((prev) => (append ? [...prev, ...result.data!.items] : result.data!.items));
      setPagination(result.data.pagination);
    } else {
      toast.error(result.message);
    }
    if (page === 1) setLoading(false);
    else setLoadingMore(false);
  }, [searchQuery]);

  useEffect(() => {
    loadFeed(1);
  }, [loadFeed]);

  const handlePostCreated = () => {
    setShowCreateModal(false);
    loadFeed(1); // refresh from top
  };

  const handlePostUpdated = (updated: ApiPost) => {
    setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  const handlePostDeleted = (postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    setPagination((prev) => (prev ? { ...prev, total: Math.max(0, prev.total - 1) } : prev));
  };

  const handleLoadMore = () => {
    if (pagination && pagination.page < pagination.pages) {
      loadFeed(pagination.page + 1, true);
    }
  };

  const handleSearch = () => {
    setSearchQuery(searchText.trim());
  };

  const handleClearSearch = () => {
    setSearchText("");
    setSearchQuery("");
  };

  const initials =
    user?.name
      ?.split(" ")
      .map((w) => w[0])
      .slice(-2)
      .join("") ?? "U";

  return (
    <div className="min-h-screen bg-brand-surface">
      <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="font-heading text-[22px] font-extrabold text-brand-dark leading-tight">
                Cộng đồng <span className="text-brand-teal">thể thao</span>
              </h1>
            </div>
          </div>
          <button
            onClick={() => loadFeed(1)}
            disabled={loading}
            className="p-2 rounded-xl border border-brand-border bg-white hover:bg-brand-surface-orange transition-colors text-brand-muted disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        {/* Create post box */}
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white border border-brand-border cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setShowCreateModal(true)}
        >
          {user ? (
            <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-sm font-bold text-white gradient-orange-diag font-heading">
              {user.avatar ? <img src={user.avatar} alt={user.name} className="w-full h-full object-cover rounded-full" /> : initials}
            </div>
          ) : (
            <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-brand-surface-warm text-brand-muted">
              <Rss size={18} />
            </div>
          )}
          <span className="flex-1 text-sm text-brand-muted">Bạn muốn chia sẻ gì hôm nay?</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowCreateModal(true);
            }}
            className="flex items-center gap-1.5 h-9 px-4 rounded-xl gradient-orange text-sm font-bold text-white font-heading hover:opacity-90 transition-opacity shrink-0"
            style={{ boxShadow: "0 2px 8px rgba(0,106,101,0.35)" }}
          >
            <Plus size={15} /> Đăng
          </button>
        </div>

        <div className="rounded-2xl bg-white border border-brand-border p-3">
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2 px-3 h-10 rounded-xl bg-brand-surface border border-brand-border">
              <Search size={15} className="text-brand-muted shrink-0" />
              <input
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSearch();
                }}
                placeholder="Tìm kiếm bài viết trong feed..."
                className="w-full bg-transparent outline-none text-sm text-brand-dark"
              />
              {searchText && (
                <button onClick={handleClearSearch} className="text-brand-muted hover:text-brand-dark">
                  <X size={14} />
                </button>
              )}
            </div>
            <button
              onClick={handleSearch}
              className="h-10 px-4 rounded-xl gradient-orange text-sm font-bold text-white font-heading hover:opacity-90"
            >
              Tìm
            </button>
          </div>
          {searchQuery && (
            <p className="text-xs text-brand-muted mt-2">
              Kết quả cho: <span className="font-semibold">{searchQuery}</span>
            </p>
          )}
        </div>

        {/* Feed */}
        {loading ? (
          <div className="flex flex-col gap-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="rounded-2xl border border-brand-border bg-white p-5 space-y-4"
              >
                {/* Header */}
                <div className="flex items-center gap-3">
                  <Skeleton className="h-12 w-12 rounded-full" />

                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>

                {/* Content */}
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-[90%]" />
                  <Skeleton className="h-4 w-[75%]" />
                </div>

                {/* Image placeholder */}
                <Skeleton className="h-52 w-full rounded-xl" />

                {/* Footer actions */}
                <div className="flex gap-4 pt-2">
                  <Skeleton className="h-9 w-20 rounded-lg" />
                  <Skeleton className="h-9 w-20 rounded-lg" />
                  <Skeleton className="h-9 w-20 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 rounded-2xl bg-white border-2 border-dashed border-brand-border">
            <span className="text-4xl mb-3">🔥</span>
            <p className="font-heading text-base text-brand-dark mb-1.5">Chưa có bài đăng nào</p>
            <p className="text-[13px] text-brand-muted mb-4">Hãy là người đầu tiên chia sẻ!</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 h-10 px-5 rounded-xl gradient-orange text-sm font-bold text-white font-heading"
            >
              <Plus size={15} /> Tạo bài đăng
            </button>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-3">
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onUpdated={handlePostUpdated}
                  onDeleted={handlePostDeleted}
                />
              ))}
            </div>

            {pagination && pagination.page < pagination.pages && (
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="flex items-center justify-center gap-2 h-11 rounded-xl border border-brand-border bg-white hover:bg-brand-surface-orange transition-colors text-sm text-brand-body disabled:opacity-60"
              >
                {loadingMore ? <Loader2 size={16} className="animate-spin" /> : null}
                {loadingMore
                  ? "Đang tải..."
                  : `Tải thêm (còn ${pagination.total - posts.length} bài)`}
              </button>
            )}

            {pagination && pagination.page >= pagination.pages && posts.length > 0 && (
              <p className="text-center py-4 text-[13px] text-brand-muted">
                Bạn đã xem hết {pagination.total} bài đăng.
              </p>
            )}
          </>
        )}
      </div>

      {showCreateModal && (
        <CreatePostModal onClose={() => setShowCreateModal(false)} onSuccess={handlePostCreated} />
      )}
    </div>
  );
}
