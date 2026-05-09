import React from "react";
import { MapPin, Clock, Users, Star, MessageCircle } from "lucide-react";
import type { DiscoverPost, Sport, SkillLevel, PostType } from "../types/discover.types";
import { ImageWithFallback } from "@/shared/components/ImageWithFallback";
import { resolveAvatar } from "../../../shared/assets/avatarMap";

const SPORT_EMOJI: Record<Sport, string> = {
  tennis: "🎾",
  basketball: "🏀",
  badminton: "🏸",
  football: "⚽",
  pickleball: "🏓",
  volleyball: "🏐",
};

const SPORT_LABEL: Record<Sport, string> = {
  tennis: "Tennis",
  basketball: "Basketball",
  badminton: "Badminton",
  football: "Football",
  pickleball: "Pickleball",
  volleyball: "Volleyball",
};

const SKILL_CONFIG: Record<SkillLevel, { label: string; bg: string; color: string }> = {
  casual: { label: "Casual", bg: "#e6f9f5", color: "#006a65" },
  intermediate: { label: "Intermediate", bg: "#fff1eb", color: "#a04100" },
  competitive: { label: "Competitive", bg: "#ffdad6", color: "#ba1a1a" },
};

const TYPE_CONFIG: Record<PostType, { label: string; bg: string; color: string }> = {
  teammate: { label: "Teammate", bg: "#e3f2fd", color: "#1565c0" },
  opponent: { label: "Opponent", bg: "#f3e5f5", color: "#6a1b9a" },
};

function formatTime(iso: string) {
  const d = new Date(iso);
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dayName = days[d.getDay()];
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  return `${dayName}, ${time}`;
}

function timeAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

interface PostCardProps {
  post: DiscoverPost;
  onContactNow: (post: DiscoverPost) => void;
}

export function PostCard({ post, onContactNow }: PostCardProps) {
  const skill = SKILL_CONFIG[post.skillLevel];
  const type = TYPE_CONFIG[post.type];
  const spotsLeft = post.playersNeeded - (post.currentPlayers - 1);

  return (
    <div
      className="bg-white rounded-2xl border border-[#dfc0b3] flex flex-col overflow-hidden transition-shadow hover:shadow-lg"
      style={{ boxShadow: "0 2px 12px rgba(36,25,20,0.07)" }}
    >
      {/* Card header: sport color band */}
      <div
        className="h-1.5 w-full"
        style={{ background: "linear-gradient(90deg, #a04100 0%, #ff7e36 100%)" }}
      />

      <div className="p-5 flex flex-col gap-4 flex-1">
        {/* Author row */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              {resolveAvatar(post.author.avatar) ? (
                <ImageWithFallback
                  src={resolveAvatar(post.author.avatar)}
                  alt={post.author.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white"
                  style={{
                    background: "linear-gradient(135deg, #a04100, #ff7e36)",
                    fontFamily: "Lexend, sans-serif",
                    fontWeight: 700,
                  }}
                >
                  {post.author.name.charAt(0)}
                </div>
              )}
            </div>
            <div>
              <p
                style={{
                  fontFamily: "Lexend, sans-serif",
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "#241914",
                }}
              >
                {post.author.name}
              </p>
              <div className="flex items-center gap-1">
                <Star size={11} fill="#f5a623" color="#f5a623" />
                <span
                  style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: "#8b7266" }}
                >
                  {post.author.rating} · {post.author.postsCount} posts
                </span>
              </div>
            </div>
          </div>
          <span style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: "#8b7266" }}>
            {timeAgo(post.createdAt)}
          </span>
        </div>

        {/* Sport + Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="flex items-center gap-1.5 px-3 py-1 rounded-full"
            style={{
              background: "#fff1eb",
              fontFamily: "Lexend, sans-serif",
              fontSize: "13px",
              fontWeight: 600,
              color: "#a04100",
            }}
          >
            <span>{SPORT_EMOJI[post.sport]}</span>
            {SPORT_LABEL[post.sport]}
          </span>
          <span
            className="px-2.5 py-1 rounded-full"
            style={{
              background: skill.bg,
              color: skill.color,
              fontFamily: "Inter, sans-serif",
              fontSize: "12px",
              fontWeight: 600,
            }}
          >
            {skill.label}
          </span>
          <span
            className="px-2.5 py-1 rounded-full"
            style={{
              background: type.bg,
              color: type.color,
              fontFamily: "Inter, sans-serif",
              fontSize: "12px",
              fontWeight: 600,
            }}
          >
            {type.label}
          </span>
        </div>

        {/* Description */}
        <p
          className="line-clamp-3"
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: "14px",
            color: "#584238",
            lineHeight: 1.6,
          }}
        >
          {post.description}
        </p>

        {/* Info rows */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <MapPin size={14} color="#8b7266" />
            <span style={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: "#584238" }}>
              {post.location}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Clock size={14} color="#8b7266" />
            <span style={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: "#584238" }}>
              {formatTime(post.time)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Users size={14} color="#8b7266" />
            <span style={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: "#584238" }}>
              {post.currentPlayers}/{post.currentPlayers + post.playersNeeded - 1 + spotsLeft}{" "}
              players ·{" "}
              <span style={{ color: spotsLeft <= 1 ? "#ba1a1a" : "#006a65", fontWeight: 600 }}>
                {spotsLeft} {spotsLeft === 1 ? "spot" : "spots"} left
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Action button */}
      <div className="px-5 pb-5">
        <button
          onClick={() => onContactNow(post)}
          className="w-full h-11 rounded-xl flex items-center justify-center gap-2 transition-opacity hover:opacity-90 active:opacity-80"
          style={{
            background: "linear-gradient(90deg, #a04100 0%, #ff7e36 100%)",
            fontFamily: "Lexend, sans-serif",
            fontSize: "14px",
            fontWeight: 700,
            color: "#fff",
            border: "none",
          }}
        >
          <MessageCircle size={16} />
          Contact Now
        </button>
      </div>
    </div>
  );
}
