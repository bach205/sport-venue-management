import { Search, Users } from "lucide-react";
import type { Conversation } from "../types/messages.types";
import { ImageWithFallback } from "@/shared/components/ImageWithFallback";
import { resolveAvatar } from "../../../shared/assets/avatarMap";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";

function formatTimestamp(iso: string, locale: string, t: TFunction<"matching">) {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return t("timeAgo.now");
  if (diffMin < 60) return t("timeAgo.minutes", { count: diffMin });
  if (diffHour < 24) {
    return d.toLocaleTimeString(locale, { hour: "numeric", minute: "2-digit" });
  }
  if (diffDay === 1) return t("messages.yesterday");
  return d.toLocaleDateString(locale, { month: "short", day: "numeric" });
}

function AvatarBubble({
  user,
  size = 44,
}: {
  user: { name: string; avatar: string; isOnline?: boolean };
  size?: number;
}) {
  const src = resolveAvatar(user.avatar);
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      {src ? (
        <ImageWithFallback
          src={src}
          alt={user.name}
          className="rounded-full object-cover"
          style={{ width: size, height: size }}
        />
      ) : (
        <div
          className="rounded-full flex items-center justify-center text-white"
          style={{
            width: size,
            height: size,
            background: "linear-gradient(135deg, #a04100, #ff7e36)",
            fontFamily: "Lexend, sans-serif",
            fontWeight: 700,
            fontSize: size * 0.36,
          }}
        >
          {user.name.charAt(0)}
        </div>
      )}
      {user.isOnline && (
        <span
          className="absolute bottom-0 right-0 rounded-full border-2 border-white"
          style={{ width: 11, height: 11, background: "#006a65" }}
        />
      )}
    </div>
  );
}

interface Props {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (conv: Conversation) => void;
  search: string;
  onSearchChange: (v: string) => void;
  activeTab: "all" | "1-1" | "group";
  onTabChange: (t: "all" | "1-1" | "group") => void;
  currentUserId: string;
}

export function ConversationList({
  conversations,
  activeId,
  onSelect,
  search,
  onSearchChange,
  activeTab,
  onTabChange,
  currentUserId,
}: Props) {
  const { t, i18n } = useTranslation("matching");
  const locale = i18n.resolvedLanguage === "en" ? "en-US" : "vi-VN";
  const filtered = conversations.filter((conv) => {
    const matchesTab =
      activeTab === "all" ||
      (activeTab === "1-1" && conv.type === "1-1") ||
      (activeTab === "group" && conv.type === "group");

    if (!matchesTab) return false;

    if (search) {
      const q = search.toLowerCase();
      const name =
        conv.type === "group"
          ? (conv.name ?? "").toLowerCase()
          : (conv.participants.find((p) => p.id !== currentUserId)?.name.toLowerCase() ?? "");
      if (!name.includes(q)) return false;
    }
    return true;
  });

  const tabs: { value: "all" | "1-1" | "group"; label: string }[] = [
    { value: "all", label: t("messages.tabs.all") },
    { value: "1-1", label: "1-1" },
    { value: "group", label: t("messages.tabs.group") },
  ];

  return (
    <div
      className="flex flex-col h-full border-r border-[#dfc0b3]"
      style={{ background: "#fff8f6" }}
    >
      {/* Header */}
      <div className="px-5 pt-5 pb-3">
        <h2
          style={{
            fontFamily: "Lexend, sans-serif",
            fontSize: "22px",
            fontWeight: 700,
            color: "#241914",
          }}
        >
          {t("messages.title")}
        </h2>
      </div>

      {/* Search */}
      <div className="px-4 pb-3">
        <div className="relative">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: "#8b7266" }}
          />
          <input
            type="text"
            placeholder={t("messages.searchPlaceholder")}
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full h-10 rounded-full pl-9 pr-4"
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "14px",
              color: "#241914",
              border: "1.5px solid #dfc0b3",
              background: "#fff",
              outline: "none",
            }}
            onFocus={(e) => {
              e.target.style.borderColor = "#006a65";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "#dfc0b3";
            }}
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex px-4 pb-2 gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => onTabChange(tab.value)}
            className="flex-1 py-1.5 rounded-full transition-all"
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "13px",
              fontWeight: activeTab === tab.value ? 600 : 400,
              color: activeTab === tab.value ? "#a04100" : "#584238",
              background: activeTab === tab.value ? "#fff1eb" : "transparent",
              border: "none",
              cursor: "pointer",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <p style={{ fontFamily: "Inter, sans-serif", fontSize: "14px", color: "#8b7266" }}>
              {t("messages.empty")}
            </p>
          </div>
        ) : (
          filtered.map((conv) => {
            const isActive = conv.id === activeId;
            const other =
              conv.type === "1-1" ? conv.participants.find((p) => p.id !== currentUserId) : null;
            const displayName =
              conv.type === "group" ? (conv.name ?? t("messages.group")) : (other?.name ?? "");
            const lastMsg = conv.lastMessage;

            let lastMsgPreview = "";
            if (lastMsg) {
              if (lastMsg.type === "match_found") lastMsgPreview = `🎾 ${t("messages.system.matchFound")}`;
              else if (lastMsg.type === "venue_booked") lastMsgPreview = `📍 ${t("messages.system.venueBooked")}`;
              else if (lastMsg.type === "system") lastMsgPreview = lastMsg.content;
              else if (lastMsg.senderId === currentUserId)
                lastMsgPreview = t("messages.youMessage", { content: lastMsg.content });
              else if (conv.type === "group") {
                const sender = conv.participants.find((p) => p.id === lastMsg.senderId);
                lastMsgPreview = sender
                  ? `${sender.name.split(" ")[0]}: ${lastMsg.content}`
                  : lastMsg.content;
              } else {
                lastMsgPreview = lastMsg.content;
              }
            }

            return (
              <button
                key={conv.id}
                onClick={() => onSelect(conv)}
                className="w-full flex items-center gap-3 px-4 py-3.5 transition-colors text-left"
                style={{
                  background: isActive ? "#fff1eb" : "transparent",
                  borderLeft: isActive ? "3px solid #a04100" : "3px solid transparent",
                  cursor: "pointer",
                }}
              >
                {/* Avatar */}
                {conv.type === "group" ? (
                  <div
                    className="shrink-0 w-11 h-11 rounded-full flex items-center justify-center"
                    style={{ background: "#e6f9f5" }}
                  >
                    <Users size={20} style={{ color: "#006a65" }} />
                  </div>
                ) : other ? (
                  <AvatarBubble user={other} />
                ) : null}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span
                      className="truncate"
                      style={{
                        fontFamily: "Inter, sans-serif",
                        fontSize: "14px",
                        fontWeight: conv.unreadCount > 0 ? 700 : 500,
                        color: "#241914",
                      }}
                    >
                      {displayName}
                    </span>
                    <span
                      style={{
                        fontFamily: "Inter, sans-serif",
                        fontSize: "12px",
                        color: "#8b7266",
                        flexShrink: 0,
                      }}
                    >
                      {lastMsg ? formatTimestamp(lastMsg.timestamp, locale, t) : ""}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span
                      className="truncate"
                      style={{
                        fontFamily: "Inter, sans-serif",
                        fontSize: "13px",
                        color: conv.unreadCount > 0 ? "#584238" : "#8b7266",
                        fontWeight: conv.unreadCount > 0 ? 500 : 400,
                      }}
                    >
                      {lastMsgPreview}
                    </span>
                    {conv.unreadCount > 0 && (
                      <span
                        className="shrink-0 ml-2 flex items-center justify-center rounded-full text-white"
                        style={{
                          minWidth: 20,
                          height: 20,
                          background: "#a04100",
                          fontFamily: "Inter, sans-serif",
                          fontSize: "11px",
                          fontWeight: 700,
                          padding: "0 5px",
                        }}
                      >
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
