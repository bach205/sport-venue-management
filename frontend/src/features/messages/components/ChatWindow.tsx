import React, { useState, useRef, useEffect } from "react";
import { Phone, Video, Info, Smile, Mic, Send, Plus, MapPin } from "lucide-react";
import type { Conversation, ChatMessage } from "../types/messages.types";
import { ImageWithFallback } from "@/shared/components/ImageWithFallback";
import { resolveAvatar } from "../../../shared/assets/avatarMap";

function formatMsgTime(iso: string) {
  return new Date(iso).toLocaleTimeString("vi-VN", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDaySeparator(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const diffDays = Math.floor((today.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return "Hôm nay";
  if (diffDays === 1) return "Hôm qua";
  return d.toLocaleDateString("vi-VN", { month: "long", day: "numeric" });
}

function SystemMessage({ msg }: { msg: ChatMessage }) {
  if (msg.type === "match_found") {
    return (
      <div className="flex justify-center my-3">
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-2xl max-w-sm"
          style={{
            background: "linear-gradient(135deg, #fff1eb, #e6f9f5)",
            border: "1px solid #dfc0b3",
          }}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
            style={{ background: "linear-gradient(90deg, #a04100, #ff7e36)" }}
          >
            <span style={{ fontSize: 14 }}>🎾</span>
          </div>
          <div>
            <p
              style={{
                fontFamily: "Lexend, sans-serif",
                fontSize: "13px",
                fontWeight: 700,
                color: "#a04100",
              }}
            >
              Đã tìm thấy đối thủ!
            </p>
            <p style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: "#584238" }}>
              {msg.content.replace("Match Found! ", "").replace("Đã tìm thấy đối thủ! ", "")}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (msg.type === "venue_booked") {
    return (
      <div className="flex justify-center my-3">
        <div
          className="flex items-center gap-2 px-4 py-2 rounded-full"
          style={{ background: "#e6f9f5", border: "1px solid #b2dfdb" }}
        >
          <MapPin size={13} style={{ color: "#006a65" }} />
          <p
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "12px",
              fontWeight: 600,
              color: "#006a65",
            }}
          >
            {msg.content}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center my-2">
      <p style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: "#8b7266" }}>
        {msg.content}
      </p>
    </div>
  );
}

interface Props {
  conversation: Conversation;
  onSendMessage: (content: string) => void;
  currentUserId: string;
}

export function ChatWindow({ conversation, onSendMessage, currentUserId }: Props) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const other =
    conversation.type === "1-1"
      ? conversation.participants.find((p) => p.id !== currentUserId)
      : null;

  const displayName =
    conversation.type === "group" ? (conversation.name ?? "Nhóm") : (other?.name ?? "");

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation.messages]);

  const handleSend = () => {
    const content = input.trim();
    if (!content) return;
    onSendMessage(content);
    setInput("");
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Group messages by day
  const messageGroups: { date: string; messages: ChatMessage[] }[] = [];
  let lastDate = "";
  conversation.messages.forEach((msg) => {
    const date = new Date(msg.timestamp).toDateString();
    if (date !== lastDate) {
      messageGroups.push({ date, messages: [] });
      lastDate = date;
    }
    messageGroups[messageGroups.length - 1].messages.push(msg);
  });

  return (
    <div className="flex flex-col h-full" style={{ background: "#fff8f6" }}>
      {/* Chat header */}
      <div
        className="flex items-center gap-3 px-6 py-4 border-b border-[#dfc0b3] shrink-0"
        style={{ background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}
      >
        {/* Avatar */}
        {resolveAvatar(other?.avatar) ? (
          <div className="relative shrink-0">
            <ImageWithFallback
              src={resolveAvatar(other?.avatar)}
              alt={other?.name ?? ""}
              className="w-11 h-11 rounded-full object-cover"
            />
            {other?.isOnline && (
              <span
                className="absolute bottom-0 right-0 rounded-full border-2 border-white"
                style={{ width: 12, height: 12, background: "#006a65" }}
              />
            )}
          </div>
        ) : (
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center text-white shrink-0"
            style={{
              background: "linear-gradient(135deg, #006a65, #4db6ac)",
              fontFamily: "Lexend, sans-serif",
              fontWeight: 700,
              fontSize: 16,
            }}
          >
            {displayName.charAt(0)}
          </div>
        )}

        {/* Name & status */}
        <div className="flex-1 min-w-0">
          <p
            style={{
              fontFamily: "Lexend, sans-serif",
              fontSize: "16px",
              fontWeight: 700,
              color: "#241914",
            }}
          >
            {displayName}
          </p>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: "#006a65" }}>
            {other?.isOnline
              ? `Đang hoạt động${other.distance ? ` · ${other.distance}` : ""}`
              : conversation.type === "group"
                ? `${conversation.participants.length} thành viên`
                : "Ngoại tuyến"}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {[
            { icon: <Phone size={18} />, title: "Cuộc gọi thoại" },
            { icon: <Video size={18} />, title: "Cuộc gọi video" },
            { icon: <Info size={18} />, title: "Thông tin" },
          ].map(({ icon, title }) => (
            <button
              key={title}
              title={title}
              className="p-2 rounded-full hover:bg-[#fff1eb] transition-colors"
              style={{ color: "#584238" }}
            >
              {icon}
            </button>
          ))}
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {conversation.messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mb-3"
              style={{ background: "#fff1eb" }}
            >
              <span style={{ fontSize: 28 }}>👋</span>
            </div>
            <p
              style={{
                fontFamily: "Lexend, sans-serif",
                fontSize: "16px",
                fontWeight: 600,
                color: "#241914",
              }}
            >
              Bắt đầu cuộc trò chuyện!
            </p>
            <p
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "13px",
                color: "#8b7266",
                marginTop: 6,
              }}
            >
              Gửi lời chào tới {displayName}
            </p>
          </div>
        ) : (
          messageGroups.map((group) => (
            <div key={group.date}>
              {/* Day separator */}
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px" style={{ background: "#dfc0b3" }} />
                <span
                  style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: "#8b7266" }}
                >
                  {formatDaySeparator(group.messages[0].timestamp)}
                </span>
                <div className="flex-1 h-px" style={{ background: "#dfc0b3" }} />
              </div>

              {group.messages.map((msg, idx) => {
                if (msg.type !== "text" && msg.type !== "image") {
                  return <SystemMessage key={msg.id} msg={msg} />;
                }

                const isMe = msg.senderId === currentUserId;
                const sender = conversation.participants.find((p) => p.id === msg.senderId);
                const showAvatar =
                  !isMe && (idx === 0 || group.messages[idx - 1]?.senderId !== msg.senderId);
                const isLastInGroup =
                  idx === group.messages.length - 1 ||
                  group.messages[idx + 1]?.senderId !== msg.senderId ||
                  group.messages[idx + 1]?.type !== "text";

                return (
                  <div
                    key={msg.id}
                    className={`flex items-end gap-2 mb-1 ${isMe ? "flex-row-reverse" : "flex-row"}`}
                  >
                    {/* Sender avatar (only for last message in a sequence) */}
                    {!isMe && (
                      <div style={{ width: 32, flexShrink: 0 }}>
                        {isLastInGroup && resolveAvatar(sender?.avatar) ? (
                          <ImageWithFallback
                            src={resolveAvatar(sender?.avatar)}
                            alt={sender?.name ?? ""}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : isLastInGroup ? (
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white"
                            style={{
                              background: "linear-gradient(135deg, #a04100, #ff7e36)",
                              fontFamily: "Lexend, sans-serif",
                              fontWeight: 700,
                              fontSize: 12,
                            }}
                          >
                            {sender?.name.charAt(0) ?? "?"}
                          </div>
                        ) : null}
                      </div>
                    )}

                    <div
                      className={`flex flex-col ${isMe ? "items-end" : "items-start"} max-w-[70%]`}
                    >
                      {/* Image message */}
                      {msg.imageUrl && (
                        <div className="mb-2 rounded-2xl overflow-hidden" style={{ maxWidth: 280 }}>
                          <ImageWithFallback
                            src={resolveAvatar(msg.imageUrl) || msg.imageUrl}
                            alt="Shared image"
                            className="w-full object-cover"
                          />
                        </div>
                      )}

                      {/* Text bubble */}
                      <div
                        className="px-4 py-2.5 rounded-2xl"
                        style={{
                          background: isMe ? "linear-gradient(135deg, #a04100, #ff7e36)" : "#fff",
                          color: isMe ? "#fff" : "#241914",
                          border: isMe ? "none" : "1px solid #dfc0b3",
                          fontFamily: "Inter, sans-serif",
                          fontSize: "14px",
                          lineHeight: 1.5,
                          borderBottomRightRadius: isMe ? 6 : undefined,
                          borderBottomLeftRadius: !isMe ? 6 : undefined,
                        }}
                      >
                        {msg.content}
                      </div>

                      {/* Timestamp */}
                      {isLastInGroup && (
                        <div
                          className={`flex items-center gap-1 mt-1 ${isMe ? "flex-row-reverse" : ""}`}
                        >
                          <span
                            style={{
                              fontFamily: "Inter, sans-serif",
                              fontSize: "11px",
                              color: "#8b7266",
                            }}
                          >
                            {formatMsgTime(msg.timestamp)}
                          </span>
                          {isMe && (
                            <span style={{ fontSize: 11, color: msg.read ? "#006a65" : "#8b7266" }}>
                              {msg.read ? "✓✓" : "✓"}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <div className="px-4 py-3 border-t border-[#dfc0b3] shrink-0" style={{ background: "#fff" }}>
        <div
          className="flex items-end gap-2 rounded-2xl border border-[#dfc0b3] px-3 py-2"
          style={{ background: "#fff8f6" }}
        >
          <button
            className="p-1.5 rounded-full hover:bg-[#fff1eb] transition-colors shrink-0"
            style={{ color: "#8b7266" }}
          >
            <Plus size={18} />
          </button>

          <textarea
            ref={inputRef}
            rows={1}
            placeholder="Nhập tin nhắn..."
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
            }}
            onKeyDown={handleKeyDown}
            className="flex-1 resize-none outline-none bg-transparent"
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "14px",
              color: "#241914",
              border: "none",
              maxHeight: 120,
              lineHeight: 1.5,
            }}
          />

          <div className="flex items-center gap-1 shrink-0">
            <button
              className="p-1.5 rounded-full hover:bg-[#fff1eb] transition-colors"
              style={{ color: "#8b7266" }}
            >
              <Smile size={18} />
            </button>
            <button
              className="p-1.5 rounded-full hover:bg-[#fff1eb] transition-colors"
              style={{ color: "#8b7266" }}
            >
              <Mic size={18} />
            </button>
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="w-9 h-9 rounded-full flex items-center justify-center transition-all"
              style={{
                background: input.trim() ? "linear-gradient(135deg, #a04100, #ff7e36)" : "#dfc0b3",
                border: "none",
                cursor: input.trim() ? "pointer" : "default",
              }}
            >
              <Send size={16} color="#fff" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
