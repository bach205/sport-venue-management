import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  RefreshCw,
  Loader2,
  Search,
  X,
  ShoppingBag,
  Newspaper,
  Bell,
  MessageSquare,
  Tag,
  Pencil,
  Trophy,
} from "lucide-react";
import { getFeed, searchFeed } from "../api/socialApi";
import type { ApiPost, Pagination } from "../types/feed.types";
import { PostCard } from "../components/PostCard";
import { CreatePostModal } from "../components/CreatePostModal";
import { getCurrentUser } from "../../auth/store/authStore";
import { toast } from "sonner";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { useTranslation } from "react-i18next";

type FeedTab = "sell" | "post";

const SPORTS = ["Badminton", "Tennis", "Pickleball", "Football"];
const SPORT_EMOJI: Record<string, string> = {
  Badminton: "🏸",
  Tennis: "🎾",
  Pickleball: "🏓",
  Football: "⚽",
};

export default function FeedPage() {
  const { t } = useTranslation("matching");
  const user = getCurrentUser();
  const [activeTab, setActiveTab] = useState<FeedTab>("sell");
  const [posts, setPosts] = useState<ApiPost[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSport, setFilterSport] = useState("");
  const [sortOrder, setSortOrder] = useState<"newest" | "price_asc" | "price_desc">("newest");

  const loadFeed = useCallback(
    async (page = 1, append = false) => {
      if (page === 1) setLoading(true);
      else setLoadingMore(true);

      const result = searchQuery
        ? await searchFeed(searchQuery, page, 20)
        : await getFeed({
            intentType: activeTab,
            sport: filterSport || undefined,
            sort: sortOrder,
            page,
            limit: 20,
          } as any);

      if (result.success && result.data) {
        setPosts((prev) => (append ? [...prev, ...result.data!.items] : result.data!.items));
        setPagination(result.data.pagination);
      } else {
        toast.error(result.message);
      }

      if (page === 1) setLoading(false);
      else setLoadingMore(false);
    },
    [activeTab, searchQuery, filterSport, sortOrder]
  );

  useEffect(() => {
    loadFeed(1);
  }, [loadFeed]);

  const handleTabChange = (tab: FeedTab) => {
    if (tab === activeTab) return;
    setActiveTab(tab);
    setSearchText("");
    setSearchQuery("");
    setFilterSport("");
    setSortOrder("newest");
  };

  const handlePostCreated = () => {
    setShowCreateModal(false);
    loadFeed(1);
  };

  const handlePostUpdated = (updated: ApiPost) =>
    setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));

  const handlePostDeleted = (id: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== id));
    setPagination((prev) => (prev ? { ...prev, total: Math.max(0, prev.total - 1) } : prev));
  };

  const handleLoadMore = () => {
    if (pagination && pagination.page < pagination.pages) loadFeed(pagination.page + 1, true);
  };

  const handleSearch = () => setSearchQuery(searchText.trim());
  const handleClearSearch = () => {
    setSearchText("");
    setSearchQuery("");
  };

  const isSell = activeTab === "sell";
  const initials = user?.name?.split(" ").map((w) => w[0]).slice(-2).join("") ?? "U";

  return (
    <div className="min-h-screen bg-[#f5f0ed]">
      {/* ── Header ── */}
      <div className="bg-white border-b border-[#ede5e0]">
        <div className="max-w-2xl mx-auto">
     
          {/* Tabs */}
          <div className="flex">
            <button
              onClick={() => handleTabChange("sell")}
              className={`flex-1 h-10 flex items-center justify-center gap-2 text-[13px] font-heading font-bold border-b-[2.5px] transition-all ${
                isSell
                  ? "text-brand-orange border-brand-orange"
                  : "text-brand-muted border-transparent hover:text-brand-body"
              }`}
            >
              <ShoppingBag size={15} /> Chợ
            </button>
            <button
              onClick={() => handleTabChange("post")}
              className={`flex-1 h-10 flex items-center justify-center gap-2 text-[13px] font-heading font-bold border-b-[2.5px] transition-all ${
                !isSell
                  ? "text-brand-orange border-brand-orange"
                  : "text-brand-muted border-transparent hover:text-brand-body"
              }`}
            >
              <Newspaper size={15} /> Bài viết
            </button>
          </div>
        </div>
      </div>
      <div className="max-w-2xl mx-auto">
        {/* ── Search bar ── */}
        <div className="bg-white border-b border-[#ede5e0] px-4 py-3">
          <div className="flex items-center gap-2 bg-[#f5f0ed] border border-[#e8e0dc] rounded-2xl px-3.5 h-11">
            <Search size={15} className="text-brand-muted shrink-0" />
            <input
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder={isSell ? "Tìm vợt, bóng, giày thể thao…" : "Tìm bài viết, chủ đề…"}
              className="flex-1 bg-transparent outline-none text-[13px] text-brand-dark placeholder:text-[#b0a09a]"
            />
            {searchText && (
              <button onClick={handleClearSearch} className="text-brand-muted hover:text-brand-dark">
                <X size={13} />
              </button>
            )}
            <button
              onClick={handleSearch}
              className="h-7 px-3 rounded-xl bg-brand-orange text-[12px] font-bold text-white font-heading hover:opacity-90 flex-shrink-0"
            >
              Tìm
            </button>
          </div>
        </div>
        {/* ── Sport filter chips ── */}
        <div className="bg-white border-b border-[#ede5e0] rounded-b-2xl px-4 py-2.5 flex items-center gap-2 overflow-x-auto scrollbar-none">
          {[{ key: "", label: "Tất cả" }, ...SPORTS.map((s) => ({ key: s, label: `${SPORT_EMOJI[s]} ${s}` }))].map(
            ({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilterSport(key)}
                className={`h-7 px-3 rounded-full text-[12px] font-medium whitespace-nowrap flex-shrink-0 border transition-all ${
                  filterSport === key
                    ? "bg-brand-orange text-white border-brand-orange font-bold"
                    : "bg-white text-brand-body border-brand-border hover:border-brand-orange hover:text-brand-orange"
                }`}
              >
                {label}
              </button>
            )
          )}
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as any)}
            className="ml-auto h-7 pl-2 pr-6 rounded-full border border-brand-border text-[11px] bg-white text-brand-body outline-none focus:border-brand-orange flex-shrink-0 appearance-none cursor-pointer"
          >
            <option value="newest">Mới nhất</option>
            <option value="price_asc">Giá tăng</option>
            <option value="price_desc">Giá giảm</option>
          </select>
        </div>
        <div className="px-3 pt-3 pb-2 flex flex-col gap-3">
          {/* ── Create box ── */}
          <div
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-3 bg-white border border-[#e8e0dc] rounded-2xl px-4 py-3 cursor-pointer hover:border-brand-orange/40 transition-colors"
          >
            {user ? (
              <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-[11px] font-bold text-white bg-brand-orange font-heading">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-full h-full object-cover rounded-full" />
                ) : (
                  initials
                )}
              </div>
            ) : (
              <div className="w-9 h-9 rounded-full bg-[#f5f0ed] flex items-center justify-center text-brand-muted">
                <ShoppingBag size={16} />
              </div>
            )}
            <span className="flex-1 text-[13px] text-[#b0a09a]">
              {isSell ? "Bạn đang muốn bán gì?" : "Chia sẻ điều gì đó về thể thao…"}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowCreateModal(true);
              }}
              className={`flex items-center gap-1.5 h-8 px-3.5 rounded-xl text-[12px] font-bold text-white font-heading hover:opacity-90 transition-opacity flex-shrink-0 ${
                isSell ? "bg-brand-orange" : "bg-brand-orange"
              }`}
            >
              {isSell ? <Tag size={12} /> : <Pencil size={12} />}
              {isSell ? "Đăng bán" : "Đăng"}
            </button>
          </div>
          {searchQuery && (
            <p className="text-[12px] text-brand-muted px-1">
              Kết quả cho <span className="font-semibold text-brand-dark">"{searchQuery}"</span>
            </p>
          )}
          {/* ── Feed ── */}
          {loading ? (
            <div className="flex flex-col gap-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl overflow-hidden border border-[#e8e0dc]">
                  {isSell && <Skeleton className="h-48 w-full rounded-none" />}
                  <div className="p-4 space-y-3">
                    {!isSell && (
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-2 flex-1">
                          <Skeleton className="h-3.5 w-28" />
                          <Skeleton className="h-3 w-20" />
                        </div>
                      </div>
                    )}
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    {isSell && <Skeleton className="h-6 w-36" />}
                    <div className="flex gap-2 pt-1">
                      <Skeleton className="h-8 w-20 rounded-xl" />
                      <Skeleton className="h-8 w-20 rounded-xl" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border-2 border-dashed border-[#e8e0dc]">
              <span className="text-5xl mb-4">{isSell ? "🛍️" : "✍️"}</span>
              <p className="font-heading text-[15px] font-bold text-brand-dark mb-1">
                {isSell ? "Chưa có sản phẩm nào" : "Chưa có bài viết nào"}
              </p>
              <p className="text-[12px] text-brand-muted mb-5 text-center max-w-[220px]">
                {isSell
                  ? "Hãy là người đầu tiên đăng bán đồ thể thao!"
                  : "Chia sẻ trải nghiệm thể thao của bạn với cộng đồng!"}
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className={`flex items-center gap-2 h-9 px-5 rounded-xl text-[13px] font-bold text-white font-heading ${
                  isSell ? "bg-brand-orange" : "bg-brand-orange"
                }`}
              >
                <Plus size={14} />
                {isSell ? "Đăng bán ngay" : "Tạo bài viết"}
              </button>
            </div>
          ) : (
            <>
              {posts.map((post) => (
                <PostCard key={post.id} post={post} onUpdated={handlePostUpdated} onDeleted={handlePostDeleted} />
              ))}
              {pagination && pagination.page < pagination.pages && (
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="flex items-center justify-center gap-2 h-11 rounded-2xl border border-[#e8e0dc] bg-white hover:bg-[#f5f0ed] transition-colors text-[13px] text-brand-body disabled:opacity-60"
                >
                  {loadingMore && <Loader2 size={15} className="animate-spin" />}
                  {loadingMore ? "Đang tải…" : `Xem thêm ${pagination.total - posts.length} tin`}
                </button>
              )}
              {pagination && pagination.page >= pagination.pages && posts.length > 0 && (
                <p className="text-center py-3 text-[12px] text-brand-muted">
                  Đã hiển thị tất cả {pagination.total} tin
                </p>
              )}
            </>
          )}
        </div>
      </div>
      {showCreateModal && (
        <CreatePostModal onClose={() => setShowCreateModal(false)} onSuccess={handlePostCreated} />
      )}
    </div>
  );
}