import React, { useState, useRef } from "react";
import { X, MapPin, Image, Send, CheckCircle2, Loader2 } from "lucide-react";
import type { Sport } from "../types/feed.types";
import { createPost } from "../store/feedStore";
import { getCurrentUser } from "../../auth/store/authStore";

const SPORTS: { value: Sport; label: string; emoji: string; color: string; bg: string }[] = [
  { value: "badminton", label: "Badminton", emoji: "🏸", color: "#006a65", bg: "#e7f8f7" },
  { value: "tennis", label: "Tennis", emoji: "🎾", color: "#a04100", bg: "#fff1eb" },
  { value: "pickleball", label: "Pickleball", emoji: "🏓", color: "#1a5fb4", bg: "#ddeeff" },
  { value: "football", label: "Football", emoji: "⚽", color: "#00785e", bg: "#d0f5ee" },
  { value: "basketball", label: "Basketball", emoji: "🏀", color: "#856404", bg: "#fff3cd" },
  { value: "table_tennis", label: "Table Tennis", emoji: "🏓", color: "#c0392b", bg: "#ffd6d6" },
  { value: "swimming", label: "Swimming", emoji: "🏊", color: "#1a5fb4", bg: "#ddeeff" },
  { value: "volleyball", label: "Volleyball", emoji: "🏐", color: "#5c3317", bg: "#f4ded5" },
];

const PRESET_PHOTOS = [
  {
    label: "Cầu lông",
    url: "https://images.unsplash.com/photo-1771854400123-2a23cb720c04?w=400&q=80",
  },
  {
    label: "Tennis",
    url: "https://images.unsplash.com/photo-1756477558468-b3e485757470?w=400&q=80",
  },
  {
    label: "Bóng đá",
    url: "https://images.unsplash.com/photo-1772388196724-71af87cee7df?w=400&q=80",
  },
  {
    label: "Thể thao",
    url: "https://images.unsplash.com/photo-1613918431703-aa50889e3be9?w=400&q=80",
  },
  {
    label: "Bơi lội",
    url: "https://images.unsplash.com/photo-1661370476755-6d8435ef9a4e?w=400&q=80",
  },
  {
    label: "Pickleball",
    url: "https://images.unsplash.com/photo-1761644707612-adf8354c7576?w=400&q=80",
  },
];

export function CreatePostModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess?: () => void;
}) {
  const user = getCurrentUser();
  const [content, setContent] = useState("");
  const [selectedSport, setSelectedSport] = useState<Sport | null>(null);
  const [location, setLocation] = useState("");
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const [posting, setPosting] = useState(false);
  const [locationFocused, setLocationFocused] = useState(false);
  const textRef = useRef<HTMLTextAreaElement>(null);

  const togglePhoto = (url: string) => {
    setSelectedPhotos((prev) =>
      prev.includes(url) ? prev.filter((u) => u !== url) : prev.length < 4 ? [...prev, url] : prev
    );
  };

  const handlePost = async () => {
    if (!content.trim() || !user) return;
    setPosting(true);
    await new Promise((r) => setTimeout(r, 700));
    createPost({
      authorId: user.id,
      authorName: user.name,
      authorAvatar: user.avatar,
      content: content.trim(),
      sport: selectedSport,
      location: location.trim(),
      images: selectedPhotos,
    });
    setPosting(false);
    onSuccess?.();
    onClose();
  };

  const initials =
    user?.name
      ?.split(" ")
      .map((w) => w[0])
      .slice(-2)
      .join("") ?? "U";
  const canPost = !!content.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[rgba(36,25,20,0.55)] backdrop-blur-[6px]">
      <div className="relative w-full max-w-lg flex flex-col rounded-2xl overflow-hidden bg-white shadow-[0_32px_80px_rgba(36,25,20,0.35)] max-h-[90vh]">
        {/* ─── Header ────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#f0ebe8]">
          <h2 className="font-['Lexend'] text-[18px] font-bold text-[#241914]">Tạo bài đăng</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#584238] hover:bg-[#f4ded5] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* ─── Scrollable body ─────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto">
          {/* Author row */}
          <div className="flex items-center gap-3 px-5 pt-4 pb-2">
            <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-gradient-to-br from-[#006a65] to-[#00a896] text-white font-['Lexend'] text-[15px] font-bold">
              {initials}
            </div>
            <div>
              <p className="font-['Lexend'] text-[14px] font-bold text-[#241914]">
                {user?.name ?? "Bạn"}
              </p>
              <p className="font-['Inter'] text-[12px] text-[#8b7266]">Đăng lên cộng đồng</p>
            </div>
          </div>

          {/* Text area */}
          <div className="px-5 pb-3">
            <textarea
              ref={textRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Chia sẻ điều gì đó về thể thao... tìm đội, kết quả trận đấu, tips kỹ thuật..."
              className="w-full resize-none outline-none border-none bg-transparent font-['Inter'] text-[15px] text-[#241914] leading-relaxed placeholder:text-[#8b7266]"
              rows={4}
              autoFocus
            />
          </div>

          {/* Sport tags */}
          <div className="px-5 pb-4 border-t border-[#f0ebe8] pt-4">
            <p className="font-['Inter'] text-[12px] font-semibold text-[#8b7266] mb-2.5 uppercase tracking-[0.06em]">
              Tag môn thể thao (tùy chọn)
            </p>
            <div className="flex flex-wrap gap-2">
              {SPORTS.map((s) => {
                const active = selectedSport === s.value;
                return (
                  <button
                    key={s.value}
                    onClick={() => setSelectedSport(active ? null : s.value)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all font-['Inter'] text-[13px] border-[1.5px]"
                    style={{
                      background: active ? s.color : s.bg,
                      borderColor: active ? s.color : "transparent",
                      fontWeight: active ? 700 : 500,
                      color: active ? "#fff" : s.color,
                    }}
                  >
                    {s.emoji} {s.label}
                    {active && <CheckCircle2 size={12} />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Location */}
          <div className="px-5 pb-4">
            <div
              className={[
                "flex items-center gap-2 px-4 h-11 rounded-xl bg-[#fffaf8] border-[1.5px] transition-colors",
                locationFocused ? "border-[#006a65]" : "border-[#dfc0b3]",
              ].join(" ")}
            >
              <MapPin size={15} className="text-[#8b7266] shrink-0" />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Thêm địa điểm (tùy chọn)"
                className="flex-1 outline-none border-none bg-transparent font-['Inter'] text-[14px] text-[#241914] placeholder:text-[#8b7266]"
                onFocus={() => setLocationFocused(true)}
                onBlur={() => setLocationFocused(false)}
              />
            </div>
          </div>

          {/* Photo picker */}
          <div className="px-5 pb-5">
            <div className="flex items-center gap-2 mb-3">
              <Image size={14} className="text-[#8b7266]" />
              <p className="font-['Inter'] text-[12px] font-semibold text-[#8b7266] uppercase tracking-[0.06em]">
                Chọn ảnh (tối đa 4)
              </p>
              {selectedPhotos.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-[#006a65] text-white font-['Inter'] text-[11px] font-bold">
                  {selectedPhotos.length}/4
                </span>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {PRESET_PHOTOS.map((photo) => {
                const selected = selectedPhotos.includes(photo.url);
                const disabled = !selected && selectedPhotos.length >= 4;
                return (
                  <button
                    key={photo.url}
                    onClick={() => !disabled && togglePhoto(photo.url)}
                    disabled={disabled}
                    className={[
                      "relative rounded-xl overflow-hidden transition-all aspect-[4/3]",
                      disabled ? "opacity-40" : "opacity-100",
                    ].join(" ")}
                  >
                    <img src={photo.url} alt={photo.label} className="w-full h-full object-cover" />
                    {/* overlay */}
                    <div
                      className="absolute inset-0 flex flex-col items-center justify-end pb-2 transition-opacity"
                      style={{
                        background: selected
                          ? "rgba(0,106,101,0.6)"
                          : "linear-gradient(to top,rgba(0,0,0,0.55),transparent)",
                      }}
                    >
                      {selected && (
                        <div className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center bg-[#006a65] border-2 border-white">
                          <CheckCircle2 size={13} color="#fff" />
                        </div>
                      )}
                      <span className="font-['Inter'] text-[12px] font-bold text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.5)]">
                        {photo.label}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ─── Footer / Submit ─────────────────────────────────────────────── */}
        <div className="px-5 py-4 border-t border-[#f0ebe8]">
          <button
            onClick={handlePost}
            disabled={posting || !canPost}
            className={[
              "w-full h-12 rounded-xl flex items-center justify-center gap-2 font-['Lexend'] text-[15px] font-bold text-white border-none transition-opacity",
              canPost
                ? "bg-gradient-to-r from-[#006a65] to-[#00a896] shadow-[0_4px_16px_rgba(0,106,101,0.4)] cursor-pointer"
                : "bg-[#c8e8e6] cursor-not-allowed",
            ].join(" ")}
          >
            {posting ? (
              <>
                <Loader2 size={18} className="animate-spin" /> Đang đăng…
              </>
            ) : (
              <>
                <Send size={16} /> Đăng bài
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
