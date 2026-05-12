import React, { useState } from "react";
import { X, Send, Loader2 } from "lucide-react";
import { createPost } from "../api/socialApi";
import { getCurrentUser } from "../../auth/store/authStore";
import { toast } from "sonner";

const MAX_CHARS = 2000;

export function CreatePostModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const user = getCurrentUser();
  const [content, setContent] = useState("");
  const [posting, setPosting] = useState(false);

  const remaining = MAX_CHARS - content.length;
  const isOverLimit = remaining < 0;

  const handlePost = async () => {
    if (!content.trim() || !user || isOverLimit) return;
    setPosting(true);
    const r = await createPost(content.trim());
    if (r.success) {
      toast.success("Đã đăng bài thành công!");
      onSuccess();
    } else {
      toast.error(r.message);
      setPosting(false);
    }
  };

  const initials =
    user?.name
      ?.split(" ")
      .map((w) => w[0])
      .slice(-2)
      .join("") ?? "U";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-dark/55 backdrop-blur-sm">
      <div
        className="relative w-full max-w-lg flex flex-col rounded-2xl overflow-hidden bg-white"
        style={{ boxShadow: "0 32px 80px rgba(36,25,20,0.35)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-brand-border">
          <h2 className="font-heading text-lg font-bold text-brand-dark">Tạo bài đăng</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-brand-surface-warm transition-colors text-brand-body"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 pt-4 pb-3 flex gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 gradient-orange-diag text-white text-[15px] font-bold font-heading">
            {initials}
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-brand-dark font-heading">{user?.name ?? "Bạn"}</p>
            <p className="text-xs text-brand-muted">Đăng lên cộng đồng</p>
          </div>
        </div>

        <div className="px-5 pb-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Chia sẻ điều gì đó... tìm đội, kết quả trận, tips kỹ thuật..."
            className="w-full resize-none outline-none text-[15px] text-brand-dark bg-transparent leading-relaxed border-none min-h-[120px]"
            autoFocus
          />
          {/* Char counter */}
          {content.length > MAX_CHARS * 0.7 && (
            <p
              className={`text-right text-[12px] mt-1 ${isOverLimit ? "text-brand-red font-semibold" : "text-brand-muted"}`}
            >
              {remaining} ký tự còn lại
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-brand-border flex items-center justify-between gap-3">
          <p className="text-[13px] text-brand-muted">Tối đa {MAX_CHARS} ký tự</p>
          <button
            onClick={handlePost}
            disabled={posting || !content.trim() || isOverLimit}
            className={`flex items-center gap-2 h-11 px-6 rounded-xl font-heading text-[15px] font-bold text-white transition-opacity
              ${content.trim() && !isOverLimit ? "gradient-orange hover:opacity-90" : "bg-brand-teal/40 cursor-not-allowed"}`}
            style={
              content.trim() && !isOverLimit
                ? { boxShadow: "0 4px 16px rgba(0,106,101,0.4)" }
                : undefined
            }
          >
            {posting ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Đang đăng…
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
