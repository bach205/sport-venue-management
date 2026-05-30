import React, { useState } from "react";
import { ImagePlus, Loader2, Send, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { uploadImage } from "@/shared/api/uploadApi";
import { createPost } from "../api/socialApi";
import { getCurrentUser } from "../../auth/store/authStore";

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
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);

  const remaining = MAX_CHARS - content.length;
  const isOverLimit = remaining < 0;
  const canPost = Boolean(content.trim() || imageFile) && !isOverLimit && !posting;

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn file ảnh.");
      return;
    }
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview(null);
  };

  const handlePost = async () => {
    if (!canPost || !user) return;
    setPosting(true);

    let imageUrl: string | null = null;
    if (imageFile) {
      const uploadResult = await uploadImage(imageFile);
      if (!uploadResult.success || !uploadResult.data) {
        toast.error(uploadResult.message);
        setPosting(false);
        return;
      }
      imageUrl = uploadResult.data.imageUrl;
    }

    const result = await createPost(content.trim(), imageUrl);
    if (result.success) {
      toast.success("Đã đăng bài thành công!");
      onSuccess();
    } else {
      toast.error(result.message);
      setPosting(false);
    }
  };

  const initials = user?.name?.split(" ").map((w) => w[0]).slice(-2).join("") ?? "U";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-dark/55 backdrop-blur-sm">
      <div
        className="relative w-full max-w-lg flex flex-col rounded-2xl overflow-hidden bg-white"
        style={{ boxShadow: "0 32px 80px rgba(36,25,20,0.35)" }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-brand-border">
          <h2 className="font-heading text-lg font-bold text-brand-dark">Tạo bài đăng</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-brand-surface-warm transition-colors text-brand-body"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-5 pt-4 pb-3 flex gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 gradient-teal-diag text-white text-[15px] font-bold font-heading">
            {initials}
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-brand-dark font-heading">{user?.name ?? 'Bạn'}</p>
            <p className="text-xs text-brand-muted">Đăng lên bảng tin</p>
          </div>
        </div>

        <div className="px-5 pb-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Chia sẻ điều gì đó... tìm đội, kết quả trận, mẹo kỹ thuật..."
            className="w-full resize-none outline-none text-[15px] text-brand-dark bg-transparent leading-relaxed border-none min-h-[120px]"
            autoFocus
          />
          {content.length > MAX_CHARS * 0.7 && (
            <p
              className={`text-right text-[12px] mt-1 ${
                isOverLimit ? "text-brand-red font-semibold" : "text-brand-muted"
              }`}
            >
              {remaining} ký tự còn lại
            </p>
          )}
          {imagePreview && (
            <div className="relative mt-3 overflow-hidden rounded-xl border border-brand-border bg-brand-surface">
              <img src={imagePreview} alt="Preview" className="max-h-80 w-full object-cover" />
              <button
                type="button"
                onClick={removeImage}
                className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-brand-red shadow-sm hover:bg-white"
              >
                <Trash2 size={15} />
              </button>
            </div>
          )}
        </div>

        <div className="px-5 py-4 border-t border-brand-border flex items-center justify-between gap-3">
          <label className="flex cursor-pointer items-center gap-2 text-[13px] font-semibold text-brand-teal hover:opacity-80">
            <ImagePlus size={17} />
            Thêm ảnh
            <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
          </label>
          <button
            onClick={handlePost}
            disabled={!canPost}
            className={`flex items-center gap-2 h-11 px-6 rounded-xl font-heading text-[15px] font-bold text-white transition-opacity ${
              canPost ? "gradient-teal hover:opacity-90" : "bg-brand-teal/40 cursor-not-allowed"
            }`}
            style={canPost ? { boxShadow: "0 4px 16px rgba(0,106,101,0.4)" } : undefined}
          >
            {posting ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Đang đăng...
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
