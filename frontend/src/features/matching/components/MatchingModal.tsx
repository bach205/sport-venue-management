// @ts-nocheck
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { X, MapPin, Clock, Star, ShieldCheck, MessageSquare, Info } from "lucide-react";
import { submitMatchRequest, simulateMatchSearch } from "../api/matchingApi";
import type { MatchRequest, MatchResult } from "../types/matching.types";
import type { Sport, SkillLevel, PostType } from "../../discover/types/discover.types";
import { ImageWithFallback } from "@/shared/components/ImageWithFallback";
import { resolveAvatar } from "../../../shared/assets/avatarMap";
import {
  createOrOpenConversation,
  MOCK_USERS,
} from "../../messages/store/messagesStore";
import { isMockApi } from "@/shared/constants/api";
import { socket } from "@/shared/socket/socketClient";
import { useAppSelector } from "@/shared/hooks/useAppSelector";

import imgMatchGraphic from "../../../imports/Html→Body-2/c1c6d62b4135dfdd55aafefa06abfdf8321f96cf.png";
import imgOpponent from "../../../imports/Html→Body-2/781a656a29f4ab3f37bb8c8ba8f0a14ecb4a100e.png";

const SPORTS: { value: Sport; label: string; emoji: string }[] = [
  { value: "tennis", label: "Tennis", emoji: "🎾" },
  { value: "basketball", label: "Bóng rổ", emoji: "🏀" },
  { value: "badminton", label: "Cầu lông", emoji: "🏸" },
  { value: "football", label: "Bóng đá", emoji: "⚽" },
  { value: "pickleball", label: "Pickleball", emoji: "🏓" },
  { value: "volleyball", label: "Bóng chuyền", emoji: "🏐" },
];

const SPORT_ICONS: Record<Sport, string> = {
  tennis: "🎾",
  basketball: "🏀",
  badminton: "🏸",
  football: "⚽",
  pickleball: "🏓",
  volleyball: "🏐",
};

const SKILL_LABELS: Record<SkillLevel, string> = {
  casual: "Giải trí",
  intermediate: "Trung bình",
  competitive: "Cạnh tranh",
};

const TYPE_LABELS: Record<PostType, string> = {
  opponent: "Đối thủ",
  teammate: "Đồng đội",
};

const TIER_LABELS: Record<string, string> = {
  "Rookie": "Tập sự",
  "Amateur": "Phong trào",
  "Pro": "Bán chuyên / Chuyên nghiệp",
};

const SPORT_LABELS: Record<Sport, string> = {
  tennis: "Đơn Tennis",
  basketball: "Bóng rổ 3v3",
  badminton: "Đôi Cầu lông",
  football: "Bóng đá 5v5",
  pickleball: "Pickleball",
  volleyball: "Volleyball",
};

// ──────────────────────────────────────────────
// Step 1: Request Form
// ──────────────────────────────────────────────
function RequestForm({
  onSubmit,
  onClose,
}: {
  onSubmit: (r: MatchRequest) => void;
  onClose: () => void;
}) {
  const [sport, setSport] = useState<Sport>("tennis");
  const [location, setLocation] = useState("");
  const [time, setTime] = useState("18:00");
  const [skillLevel, setSkillLevel] = useState<SkillLevel>("intermediate");
  const [type, setType] = useState<PostType>("opponent");
  const [error, setError] = useState("");

  const today = new Date().toISOString().split("T")[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!location.trim()) {
      setError("Vui lòng nhập khu vực của bạn.");
      return;
    }
    setError("");
    onSubmit({ sport, location, date: today, time, skillLevel, type });
  };

  const inputStyle: React.CSSProperties = {
    fontFamily: "Inter, sans-serif",
    fontSize: "14px",
    color: "#241914",
    border: "1.5px solid #dfc0b3",
    borderRadius: "10px",
    padding: "10px 14px",
    width: "100%",
    background: "#fff",
    outline: "none",
    boxSizing: "border-box",
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-[#dfc0b3]">
        <div>
          <h2
            style={{
              fontFamily: "Lexend, sans-serif",
              fontSize: "20px",
              fontWeight: 700,
              color: "#241914",
            }}
          >
            Find a Match
          </h2>
          <p
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "13px",
              color: "#8b7266",
              marginTop: 2,
            }}
          >
            Hệ thống sẽ kết nối bạn với đối thủ/đồng đội phù hợp nhất
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-[#fff1eb] transition-colors"
          style={{ color: "#584238" }}
        >
          <X size={20} />
        </button>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5"
      >
        {/* Sport */}
        <div>
          <label
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "13px",
              fontWeight: 600,
              color: "#241914",
              display: "block",
              marginBottom: 8,
            }}
          >
            Sport
          </label>
          <div className="grid grid-cols-3 gap-2">
            {SPORTS.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => setSport(s.value)}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 transition-all"
                style={{
                  borderColor: sport === s.value ? "#a04100" : "#dfc0b3",
                  background: sport === s.value ? "#fff1eb" : "#fff",
                  fontFamily: "Inter, sans-serif",
                  fontSize: "13px",
                  fontWeight: sport === s.value ? 600 : 400,
                  color: sport === s.value ? "#a04100" : "#584238",
                }}
              >
                <span>{s.emoji}</span> {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Location */}
        <div>
          <label
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "13px",
              fontWeight: 600,
              color: "#241914",
              display: "block",
              marginBottom: 6,
            }}
          >
            <MapPin size={13} style={{ display: "inline", marginRight: 4 }} />
            Khu vực của bạn *
          </label>
          <input
            type="text"
            placeholder="Ví dụ: Quận 1, TP.HCM"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            style={inputStyle}
            onFocus={(e) => {
              e.target.style.borderColor = "#006a65";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "#dfc0b3";
            }}
          />
        </div>

        {/* Time */}
        <div>
          <label
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "13px",
              fontWeight: 600,
              color: "#241914",
              display: "block",
              marginBottom: 6,
            }}
          >
            <Clock size={13} style={{ display: "inline", marginRight: 4 }} />
            Thời gian mong muốn
          </label>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            style={inputStyle}
            onFocus={(e) => {
              e.target.style.borderColor = "#006a65";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "#dfc0b3";
            }}
          />
        </div>

        {/* Skill Level */}
        <div>
          <label
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "13px",
              fontWeight: 600,
              color: "#241914",
              display: "block",
              marginBottom: 8,
            }}
          >
            Skill Level
          </label>
          <div className="flex gap-2">
            {(["casual", "intermediate", "competitive"] as SkillLevel[]).map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setSkillLevel(level)}
                className="flex-1 py-2 rounded-xl border-2 transition-all capitalize"
                style={{
                  borderColor: skillLevel === level ? "#a04100" : "#dfc0b3",
                  background: skillLevel === level ? "#fff1eb" : "#fff",
                  fontFamily: "Inter, sans-serif",
                  fontSize: "13px",
                  fontWeight: skillLevel === level ? 600 : 400,
                  color: skillLevel === level ? "#a04100" : "#584238",
                }}
              >
                {SKILL_LABELS[level]}
              </button>
            ))}
          </div>
        </div>

        {/* Type */}
        <div>
          <label
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "13px",
              fontWeight: 600,
              color: "#241914",
              display: "block",
              marginBottom: 8,
            }}
          >
            Looking for
          </label>
          <div className="flex gap-2">
            {(["opponent", "teammate"] as PostType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className="flex-1 py-2 rounded-xl border-2 transition-all capitalize"
                style={{
                  borderColor: type === t ? "#a04100" : "#dfc0b3",
                  background: type === t ? "#fff1eb" : "#fff",
                  fontFamily: "Inter, sans-serif",
                  fontSize: "13px",
                  fontWeight: type === t ? 600 : 400,
                  color: type === t ? "#a04100" : "#584238",
                }}
              >
                {TYPE_LABELS[t]}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: "#ba1a1a" }}>
            {error}
          </p>
        )}
      </form>

      {/* Footer CTA */}
      <div className="px-6 pb-6 pt-3 border-t border-[#dfc0b3]">
        <button
          onClick={handleSubmit as any}
          className="w-full h-14 rounded-xl flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
          style={{
            background: "linear-gradient(90deg, #a04100 0%, #ff7e36 100%)",
            fontFamily: "Lexend, sans-serif",
            fontSize: "16px",
            fontWeight: 700,
            color: "#fff",
            border: "none",
            boxShadow: "0 4px 16px rgba(160,65,0,0.35)",
          }}
        >
          ⚡ Tìm ghép cặp ngay
        </button>
        <p
          className="text-center mt-3"
          style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: "#8b7266" }}
        >
          Ghép cặp dựa trên môn chơi · trình độ · khu vực · thời gian
        </p>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Step 2: Searching Animation
// ──────────────────────────────────────────────
function SearchingScreen({ request, onCancel }: { request: MatchRequest; onCancel: () => void }) {
  const [dotCount, setDotCount] = useState(0);
  const [pulseScale, setPulseScale] = useState(1);
  const [statusIndex, setStatusIndex] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const statusMessages = [
    "Scanning nearby courts",
    "Checking skill levels",
    "Matching time slots",
    "Expanding search radius",
  ];

  useEffect(() => {
    const t = setInterval(() => {
      setDotCount((d) => (d + 1) % 4);
      setPulseScale((s) => (s === 1 ? 1.08 : 1));
    }, 600);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const statusTimer = setInterval(() => {
      setStatusIndex((i) => (i + 1) % statusMessages.length);
    }, 2200);

    const elapsedTimer = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);

    return () => {
      clearInterval(statusTimer);
      clearInterval(elapsedTimer);
    };
  }, []);

  const sportEmoji = SPORT_ICONS[request.sport];
  const dots = ".".repeat(dotCount);
  const statusLine =
    elapsedSeconds >= 12
      ? "Chưa tìm thấy đối thủ. Vẫn đang chờ người chơi khác..."
      : statusMessages[statusIndex];

  return (
    <div className="flex flex-col items-center justify-between h-full px-8 py-8">
      <div className="flex flex-col items-center flex-1 justify-center gap-6">
        {/* Animated radar */}
        <div
          className="relative flex items-center justify-center"
          style={{ width: 160, height: 160 }}
        >
          {/* Pulse rings */}
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                width: 40 + i * 40,
                height: 40 + i * 40,
                border: `2px solid rgba(160,65,0,${0.25 - i * 0.07})`,
                animation: `ping ${1.2 + i * 0.4}s cubic-bezier(0,0,0.2,1) infinite`,
                animationDelay: `${i * 0.3}s`,
              }}
            />
          ))}
          {/* Center circle */}
          <div
            className="relative z-10 w-20 h-20 rounded-full flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, #a04100, #ff7e36)",
              boxShadow: "0 8px 24px rgba(160,65,0,0.4)",
              transform: `scale(${pulseScale})`,
              transition: "transform 0.6s ease",
            }}
          >
            <span style={{ fontSize: 32 }}>{sportEmoji}</span>
          </div>
        </div>

        <div className="text-center">
          <h2
            style={{
              fontFamily: "Lexend, sans-serif",
              fontSize: "24px",
              fontWeight: 700,
              color: "#241914",
            }}
          >
            Finding your match{dots}
          </h2>
          <p
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "14px",
              color: "#584238",
              marginTop: 8,
            }}
          >
            Đang tìm người chơi {SPORT_LABELS[request.sport] || request.sport} trình độ {SKILL_LABELS[request.skillLevel] || request.skillLevel} gần {request.location}
          </p>
          <p
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "12px",
              color: "#8b7266",
              marginTop: 6,
            }}
          >
            {statusLine}
          </p>
        </div>

        {/* Search criteria pills */}
        <div className="flex flex-wrap gap-2 justify-center">
          {[
            `${sportEmoji} ${SPORT_LABELS[request.sport] || request.sport}`,
            `📍 ${request.location}`,
            `🎯 ${SKILL_LABELS[request.skillLevel] || request.skillLevel}`,
            `⏰ ${request.time}`,
          ].map((tag) => (
            <span
              key={tag}
              className="px-3 py-1.5 rounded-full"
              style={{
                background: "#fff1eb",
                fontFamily: "Inter, sans-serif",
                fontSize: "12px",
                fontWeight: 500,
                color: "#a04100",
                border: "1px solid #dfc0b3",
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      <button
        onClick={onCancel}
        className="w-full h-11 rounded-xl border border-[#dfc0b3] hover:bg-[#fff1eb] transition-colors"
        style={{ fontFamily: "Inter, sans-serif", fontSize: "14px", color: "#584238" }}
      >
        Hủy tìm kiếm
      </button>

      <style>{`
        @keyframes ping {
          75%, 100% { transform: scale(2); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

// ──────────────────────────────────────────────
// Step 3: Match Found
// ──────────────────────────────────────────────
function MatchFoundScreen({
  result,
  onGoToChat,
  onViewDetails,
  onClose,
}: {
  result: MatchResult;
  onGoToChat: () => void;
  onViewDetails: () => void;
  onClose: () => void;
}) {
  const avatarSrc = resolveAvatar(result.opponent.avatar);

  return (
    <div
      className="flex flex-col items-center overflow-y-auto"
      style={{ background: "linear-gradient(180deg, #fff8f6 0%, #fff 60%)" }}
    >
      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-[#fff1eb] transition-colors z-10"
        style={{ color: "#584238" }}
      >
        <X size={20} />
      </button>

      {/* Hero graphic area */}
      <div className="relative flex flex-col items-center pt-12 pb-4 w-full">
        {/* Circle with court image */}
        <div
          className="relative w-[180px] h-[180px] rounded-full overflow-hidden flex items-center justify-center mb-6"
          style={{
            background: "#ff7e36",
            boxShadow: "0 10px 30px rgba(160,65,0,0.3)",
            border: "4px solid #fff8f6",
          }}
        >
          <img
            src={imgMatchGraphic}
            alt="Match Found"
            style={{
              position: "absolute",
              width: "155%",
              left: "-27%",
              top: 0,
              height: "100%",
              objectFit: "cover",
            }}
          />
          {/* Decoration blobs */}
          <div
            className="absolute top-[-6px] right-[-6px] w-8 h-8 rounded-full opacity-80"
            style={{ background: "#6ef4ea", mixBlendMode: "multiply" }}
          />
          <div
            className="absolute bottom-[-4px] left-[-8px] w-10 h-10 rounded-full opacity-60"
            style={{ background: "#f4ded5" }}
          />
        </div>

        <h1
          className="text-center"
          style={{
            fontFamily: "Lexend, sans-serif",
            fontSize: "40px",
            fontWeight: 800,
            color: "#a04100",
            letterSpacing: "-0.8px",
            lineHeight: 1.1,
          }}
        >
          Match Found!
        </h1>
        <p
          className="text-center mt-2"
          style={{ fontFamily: "Inter, sans-serif", fontSize: "16px", color: "#584238" }}
        >
          Get ready for some serious action.
          <br />
          You've been matched.
        </p>
      </div>

      {/* Match details card */}
      <div
        className="mx-6 mb-4 rounded-xl w-[calc(100%-48px)]"
        style={{
          background: "#fff",
          border: "1px solid rgba(223,192,179,0.3)",
          boxShadow: "0 4px 16px rgba(36,25,20,0.1)",
        }}
      >
        <div className="p-6 flex flex-col gap-4">
          {/* Sport + Time + Confirmed badge */}
          <div className="flex items-center justify-between pb-4 border-b border-[#f4ded5]">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ background: "#6ef4ea" }}
              >
                <span style={{ fontSize: 22 }}>{SPORT_ICONS[result.sport]}</span>
              </div>
              <div>
                <p
                  style={{
                    fontFamily: "Lexend, sans-serif",
                    fontSize: "18px",
                    fontWeight: 700,
                    color: "#241914",
                  }}
                >
                  {SPORT_LABELS[result.sport]}
                </p>
                <div className="flex items-center gap-1 mt-0.5">
                  <Clock size={12} style={{ color: "#006a65" }} />
                  <span
                    style={{
                      fontFamily: "Inter, sans-serif",
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "#006a65",
                    }}
                  >
                    {result.time}
                  </span>
                </div>
              </div>
            </div>
            <span
              className="px-3 py-1 rounded-full text-white uppercase tracking-wider"
              style={{
                background: "#a04100",
                fontFamily: "Inter, sans-serif",
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "0.06em",
              }}
            >
              ĐÃ XÁC NHẬN
            </span>
          </div>

          {/* Venue */}
          <div className="flex items-start gap-3">
            <MapPin size={16} style={{ color: "#8b7266", marginTop: 2, flexShrink: 0 }} />
            <div>
              <p
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "#241914",
                }}
              >
                {result.venue}
              </p>
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: "14px", color: "#584238" }}>
                {result.venueDetail}
              </p>
            </div>
          </div>

          {/* Opponent card */}
          <div
            className="rounded-lg p-4"
            style={{ background: "#fff1eb", border: "1px solid rgba(223,192,179,0.2)" }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Opponent avatar */}
                <div
                  className="w-14 h-14 rounded-full overflow-hidden flex items-center justify-center"
                  style={{
                    background: "#9ba3b3",
                    border: "2px solid #fff8f6",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                  }}
                >
                  {avatarSrc ? (
                    <ImageWithFallback
                      src={avatarSrc}
                      alt={result.opponent.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <img
                      src={imgOpponent}
                      alt={result.opponent.name}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  )}
                </div>
                <div>
                  <p
                    style={{
                      fontFamily: "Lexend, sans-serif",
                      fontSize: "18px",
                      fontWeight: 700,
                      color: "#241914",
                    }}
                  >
                    {result.opponent.name}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <Star size={12} fill="#a04100" color="#a04100" />
                    <span
                      style={{
                        fontFamily: "Inter, sans-serif",
                        fontSize: "13px",
                        fontWeight: 600,
                        color: "#241914",
                      }}
                    >
                      {result.opponent.rating}
                    </span>
                    <span
                      style={{
                        fontFamily: "Inter, sans-serif",
                        fontSize: "12px",
                        color: "#584238",
                      }}
                    >
                      ({result.opponent.matchCount} Trận đấu)
                    </span>
                  </div>
                </div>
              </div>
              <span
                className="px-2 py-1 rounded-full"
                style={{
                  background: "#dbe3f4",
                  fontFamily: "Inter, sans-serif",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#141c28",
                }}
              >
                {TIER_LABELS[result.opponent.tier] || result.opponent.tier}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col gap-3 px-6 w-full mb-4">
        <button
          onClick={onGoToChat}
          className="w-full h-14 rounded-xl flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
          style={{
            background: "linear-gradient(90deg, #a04100, #ff7e36)",
            fontFamily: "Lexend, sans-serif",
            fontSize: "16px",
            fontWeight: 700,
            color: "#fff",
            border: "none",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            boxShadow: "0 4px 14px rgba(160,65,0,0.4)",
          }}
        >
          <MessageSquare size={20} />
          ĐẾN PHÒNG CHAT
        </button>
        <button
          onClick={onViewDetails}
          className="w-full h-13 rounded-xl flex items-center justify-center gap-2 hover:bg-[#e6f9f5] transition-colors"
          style={{
            border: "2px solid #006a65",
            background: "transparent",
            fontFamily: "Lexend, sans-serif",
            fontSize: "15px",
            fontWeight: 700,
            color: "#006a65",
            padding: "14px 24px",
          }}
        >
          <Info size={18} />
          Xem chi tiết trận đấu
        </button>
      </div>

      {/* Safe match */}
      <div className="flex items-center gap-2 pb-6">
        <ShieldCheck size={14} style={{ color: "#584238" }} />
        <span style={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: "#584238" }}>
          Ghép cặp an toàn đã xác minh
        </span>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Main Modal Component
// ──────────────────────────────────────────────
interface Props {
  onClose: () => void;
}

export function MatchingModal({ onClose }: Props) {
  const navigate = useNavigate();
  const authUser = useAppSelector((state) => state.auth.user);
  const currentUserId = authUser?._id ?? null;
  const [step, setStep] = useState<"form" | "searching" | "matched">("form");
  const [request, setRequest] = useState<MatchRequest | null>(null);
  const [result, setResult] = useState<MatchResult | null>(null);

  const pendingMatchHandlerRef = useRef<((payload: any) => void) | null>(null);
  const pendingMatchRejectRef = useRef<((error: Error) => void) | null>(null);
  const activeRequestIdRef = useRef<string | null>(null);
  const searchTokenRef = useRef(0);

  useEffect(() => {
    if (!currentUserId) return undefined;

    const joinUser = () => socket.emit("user:join", currentUserId);

    if (socket.connected) {
      joinUser();
    } else {
      socket.once("connect", joinUser);
    }

    return () => {
      socket.off("connect", joinUser);
    };
  }, [currentUserId]);

  const clearPendingMatchListener = (reason?: string) => {
    if (pendingMatchHandlerRef.current) {
      socket.off("matching:request:matched", pendingMatchHandlerRef.current);
      pendingMatchHandlerRef.current = null;
    }

    if (pendingMatchRejectRef.current && reason) {
      pendingMatchRejectRef.current(new Error(reason));
    }

    pendingMatchRejectRef.current = null;
  };

  const emitMatchEcho = (incoming: any) => {
    if (!incoming || incoming.clientEcho) {
      return;
    }

    const targetUserId = incoming?.partner?.id ?? incoming?.match?.partner?.id ?? null;
    if (!targetUserId || targetUserId === currentUserId) {
      return;
    }

    socket.emit("matching:request:client-matched", {
      targetUserId,
      data: incoming,
    });
  };

  const isRelevantMatch = (incoming: any) => {
    const activeRequestId = activeRequestIdRef.current;
    if (!activeRequestId) {
      return true;
    }

    if (incoming?.request?.id === activeRequestId) {
      return true;
    }

    const requestIds = incoming?.match?.requestIds;
    if (!Array.isArray(requestIds)) {
      return false;
    }

    return requestIds.some((id) => String(id) === String(activeRequestId));
  };

  const formatMatchTime = (timeValue: string | undefined, requestForTime: MatchRequest) => {
    let date: Date | null = null;

    if (timeValue) {
      const parsed = new Date(timeValue);
      if (!Number.isNaN(parsed.getTime())) {
        date = parsed;
      }
    } else if (requestForTime?.date && requestForTime?.time) {
      const parsed = new Date(`${requestForTime.date}T${requestForTime.time}:00`);
      if (!Number.isNaN(parsed.getTime())) {
        date = parsed;
      }
    }

    if (!date) {
      return requestForTime?.time ? `Hôm nay, ${requestForTime.time}` : "Đã lên lịch";
    }

    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const hh = String(date.getHours()).padStart(2, "0");
    const mm = String(date.getMinutes()).padStart(2, "0");
    return isToday ? `Hôm nay, ${hh}:${mm}` : `${date.toLocaleDateString('vi-VN')} ${hh}:${mm}`;
  };

  const buildMatchResultFromPayload = (payload: any, requestForTime: MatchRequest): MatchResult => {
    const match = payload?.match ?? {};
    const partner = match?.partner ?? payload?.partner ?? {};
    const requestId =
      payload?.request?.id ??
      match?.requestIds?.[0] ??
      activeRequestIdRef.current ??
      `req-${Date.now()}`;
    const location = match?.location ?? requestForTime.location;

    return {
      requestId,
      sport: match?.sport ?? requestForTime.sport,
      skillLevel: requestForTime.skillLevel,
      venue: location,
      venueDetail: location,
      time: formatMatchTime(match?.time, requestForTime),
      opponent: {
        id: partner?.id ?? "unknown",
        name: partner?.name ?? "Opponent",
        avatar: partner?.avatar ?? "",
        rating: partner?.rating ?? 0,
        matchCount: partner?.matchCount ?? 0,
        tier: partner?.tier ?? "Rookie",
      },
      conversationId: payload?.conversation?.id ?? match?.conversationId ?? "",
    };
  };

  const finalizeMatch = (matchResult: MatchResult) => {
    setResult(matchResult);
    setStep("matched");

    if (!isMockApi) return;

    const knownUser = MOCK_USERS[matchResult.opponent.id];
    const user = knownUser ?? {
      id: matchResult.opponent.id,
      name: matchResult.opponent.name,
      avatar: matchResult.opponent.avatar,
      isOnline: true,
    };

    createOrOpenConversation(
      user,
      `Đã ghép cặp thành công! Bạn và ${user.name} đã được xác nhận chơi môn ${SPORT_LABELS[matchResult.sport] || matchResult.sport}. Thời gian: ${matchResult.time} · Địa điểm: ${matchResult.venue}`
    );
  };

  const handleSubmit = async (req: MatchRequest) => {
    const CANCELLED_ERROR = "match-search-cancelled";
    const searchToken = searchTokenRef.current + 1;
    searchTokenRef.current = searchToken;

    if (currentUserId) {
      const joinUser = () => socket.emit("user:join", currentUserId);
      if (socket.connected) {
        joinUser();
      } else {
        socket.once("connect", joinUser);
      }
    }

    clearPendingMatchListener();
    activeRequestIdRef.current = null;
    setRequest(req);
    setResult(null);
    setStep("searching");

    try {
      const response = await submitMatchRequest(req);
      if (searchToken !== searchTokenRef.current) return;
      const payload = response?.data ?? response;
      const requestId = payload?.request?.id ?? null;
      activeRequestIdRef.current = requestId;

      if (payload?.match) {
        if (searchToken !== searchTokenRef.current) return;
        finalizeMatch(buildMatchResultFromPayload(payload, req));
        activeRequestIdRef.current = null;
        return;
      }

      const matchedPayload = await new Promise((resolve, reject) => {
        const handleMatched = (incoming: any) => {
          if (!incoming?.request?.id && !Array.isArray(incoming?.match?.requestIds)) return;
          if (!isRelevantMatch(incoming)) return;
          emitMatchEcho(incoming);
          clearPendingMatchListener();
          resolve(incoming);
        };

        pendingMatchHandlerRef.current = handleMatched;
        pendingMatchRejectRef.current = reject;
        socket.on("matching:request:matched", handleMatched);
      });

      if (searchToken !== searchTokenRef.current) return;
      finalizeMatch(buildMatchResultFromPayload(matchedPayload, req));
      activeRequestIdRef.current = null;
    } catch (error: any) {
      if (error?.message === CANCELLED_ERROR) {
        return;
      }

      console.error(error);
      setStep("form");
      setRequest(null);
      setResult(null);
    }
  };

  const handleGoToChat = () => {
    if (!result) return;
    onClose();
    const knownUser = MOCK_USERS[result.opponent.id];
    const userId = result.opponent.id;
    const name = result.opponent.name;
    const avatar = result.opponent.avatar;
    navigate(
      `/messages?with=${userId}&name=${encodeURIComponent(name)}&avatar=${encodeURIComponent(avatar)}&sport=${result.sport}`
    );
  };

  const handleCancel = () => {
    searchTokenRef.current += 1;
    clearPendingMatchListener("match-search-cancelled");
    activeRequestIdRef.current = null;
    setStep("form");
    setRequest(null);
    setResult(null);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(36,25,20,0.45)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget && step !== "searching") onClose();
      }}
    >
      <div
        className="relative bg-white rounded-2xl w-full overflow-hidden"
        style={{
          maxWidth: 520,
          maxHeight: "92vh",
          boxShadow: "0 24px 64px rgba(36,25,20,0.3)",
        }}
      >
        {step === "form" && <RequestForm onSubmit={handleSubmit} onClose={onClose} />}

        {step === "searching" && request && (
          <div style={{ height: 480 }}>
            <SearchingScreen request={request} onCancel={handleCancel} />
          </div>
        )}

        {step === "matched" && result && (
          <div className="overflow-y-auto" style={{ maxHeight: "92vh" }}>
            <MatchFoundScreen
              result={result}
              onGoToChat={handleGoToChat}
              onViewDetails={() => {
                /* show details */
              }}
              onClose={onClose}
            />
          </div>
        )}
      </div>
    </div>
  );
}
