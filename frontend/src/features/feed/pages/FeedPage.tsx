import React, { useState, useEffect, useCallback } from "react";
import { Plus, Rss, TrendingUp, Flame } from "lucide-react";
import { getPosts, subscribeFeed } from "../store/feedStore";
import type { FeedPost, Sport } from "../types/feed.types";
import { PostCard } from "../components/PostCard";
import { CreatePostModal } from "../components/CreatePostModal";
import { getCurrentUser } from "../../auth/store/authStore";

// ─── Sport filter tabs ────────────────────────────────────────────────────────
const SPORT_TABS: { value: Sport | null; label: string; emoji: string }[] = [
  { value: null, label: "Tất cả", emoji: "☀️" },
  { value: "badminton", label: "Badminton", emoji: "🏸" },
  { value: "tennis", label: "Tennis", emoji: "🎾" },
  { value: "pickleball", label: "Pickleball", emoji: "🏓" },
  { value: "football", label: "Football", emoji: "⚽" },
  { value: "basketball", label: "Basketball", emoji: "🏀" },
  { value: "swimming", label: "Swimming", emoji: "🏊" },
  { value: "volleyball", label: "Volleyball", emoji: "🏐" },
];

export default function FeedPage() {
  const user = getCurrentUser();
  const [posts, setPosts] = useState<FeedPost[]>(() => getPosts());
  const [activeSport, setActiveSport] = useState<Sport | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [tick, setTick] = useState(0);

  const refresh = useCallback(() => {
    setPosts(getPosts(activeSport));
    setTick((n) => n + 1);
  }, [activeSport]);

  useEffect(() => {
    refresh();
    return subscribeFeed(refresh);
  }, [refresh]);

  const initials =
    user?.name
      ?.split(" ")
      .map((w) => w[0])
      .slice(-2)
      .join("") ?? "U";

  return (
    <div className="min-h-screen bg-[#f2ede9]">
      <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-4">
        {/* ─── Page header ───────────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br from-[#006a65] to-[#00a896]">
                <Rss size={18} className="text-white" />
              </div>
              <h1 className="font-['Lexend'] text-[22px] font-extrabold text-[#241914]">
                Cộng đồng <span className="text-[#006a65]">thể thao</span>
              </h1>
            </div>
            <p className="font-['Inter'] text-[13px] text-[#8b7266] mt-1 pl-px">
              {posts.length} bài đăng mới nhất
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 px-2.5 h-9 rounded-xl border-[1.5px] border-[#dfc0b3] bg-white text-[#a04100] font-['Inter'] text-[13px] transition-colors hover:bg-[#fff1eb]">
              <TrendingUp size={14} /> Nổi bật
            </button>
          </div>
        </div>

        {/* ─── Create post box ───────────────────────────────────────────── */}
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-2xl cursor-pointer bg-white border border-[#e8e0dc] hover:shadow-md transition-shadow"
          onClick={() => setShowCreateModal(true)}
        >
          {user ? (
            <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-sm font-bold font-['Lexend'] text-white bg-gradient-to-br from-[#006a65] to-[#00a896]">
              {initials}
            </div>
          ) : (
            <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-[#f4ded5] text-[#8b7266]">
              <Rss size={18} />
            </div>
          )}

          <span className="flex-1 font-['Inter'] text-[14px] text-[#8b7266]">
            Bạn muốn chia sẻ gì hôm nay?
          </span>

          <button
            className="flex items-center gap-1.5 h-9 px-4 rounded-xl shrink-0 bg-gradient-to-r from-[#006a65] to-[#00a896] font-['Lexend'] text-[13px] font-bold text-white border-none shadow-[0_2px_8px_rgba(0,106,101,0.35)] hover:opacity-90 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              setShowCreateModal(true);
            }}
          >
            <Plus size={15} /> Đăng
          </button>
        </div>

        {/* ─── Sport filter tabs ─────────────────────────────────────────── */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 [scrollbar-width:none]">
          {SPORT_TABS.map((tab) => {
            const active = activeSport === tab.value;
            return (
              <button
                key={String(tab.value)}
                onClick={() => setActiveSport(tab.value)}
                className={[
                  "flex items-center gap-1.5 px-4 h-9 rounded-full whitespace-nowrap transition-all shrink-0 font-['Inter'] text-[13px] border-[1.5px]",
                  active
                    ? "bg-[#006a65] border-[#006a65] font-bold text-white shadow-[0_2px_8px_rgba(0,106,101,0.3)]"
                    : "bg-white border-[#dfc0b3] font-medium text-[#584238]",
                ].join(" ")}
              >
                <span className="text-[14px]">{tab.emoji}</span>
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ─── Posts ─────────────────────────────────────────────────────── */}
        {posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 rounded-2xl bg-white border-[1.5px] border-dashed border-[#dfc0b3]">
            <Flame size={40} className="text-[#dfc0b3] mb-3" />
            <p className="font-['Lexend'] text-[16px] text-[#241914] mb-1.5">
              Chưa có bài đăng nào
            </p>
            <p className="font-['Inter'] text-[13px] text-[#8b7266] mb-4">
              Hãy là người đầu tiên chia sẻ về {activeSport ?? "thể thao"}!
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 h-10 px-5 rounded-xl bg-gradient-to-r from-[#006a65] to-[#00a896] font-['Lexend'] text-[14px] font-bold text-white border-none"
            >
              <Plus size={15} /> Tạo bài đăng
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {posts.map((post) => (
              <PostCard key={`${post.id}-${tick}`} post={post} onUpdate={refresh} />
            ))}
          </div>
        )}

        {/* Load more hint */}
        {posts.length > 0 && (
          <div className="text-center py-4">
            <p className="font-['Inter'] text-[13px] text-[#8b7266]">
              Bạn đã xem hết {posts.length} bài đăng 🎉
            </p>
          </div>
        )}
      </div>

      {/* ─── Create Post Modal ─────────────────────────────────────────────── */}
      {showCreateModal && (
        <CreatePostModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            refresh();
            setActiveSport(null);
          }}
        />
      )}
    </div>
  );
}
