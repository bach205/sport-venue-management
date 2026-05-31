import React, { useState } from "react";
import { ImagePlus, Loader2, Send, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { uploadImage } from "@/shared/api/uploadApi";
import { createPost, updatePost } from "../api/socialApi";
import { getCurrentUser } from "../../auth/store/authStore";
import type { ApiPost } from "../types/feed.types";
import { useTranslation } from "react-i18next";

const MAX_CHARS = 2000;

export function CreatePostModal({
  onClose,
  onSuccess,
  editPost,
}: {
  onClose: () => void;
  onSuccess: (post?: ApiPost) => void;
  editPost?: ApiPost;
}) {
  const { t } = useTranslation("matching");
  const user = getCurrentUser();

  const [intentType, setIntentType] = useState<"buy" | "sell">(editPost?.intentType || "sell");
  const [sport, setSport] = useState(editPost?.sport || "Pickleball");
  const [category, setCategory] = useState(editPost?.category || "Equipment");
  const [title, setTitle] = useState(editPost?.title || "");
  const [details, setDetails] = useState(editPost?.details || editPost?.content || "");
  const [quantity, setQuantity] = useState<number>(editPost?.quantity || 1);
  const [priceType, setPriceType] = useState<"fixed" | "range" | "negotiable" | "quote_requested">(
    editPost?.priceType || "fixed"
  );
  const [priceMin, setPriceMin] = useState<number | "">(editPost?.priceMin ?? "");
  const [priceMax, setPriceMax] = useState<number | "">(editPost?.priceMax ?? "");
  const [condition, setCondition] = useState<"new" | "like_new" | "used">(
    editPost?.condition || "new"
  );
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(editPost?.imageUrl || null);
  const [posting, setPosting] = useState(false);

  const remaining = MAX_CHARS - details.length;
  const isOverLimit = remaining < 0;

  const isFormValid = () => {
    if (isOverLimit) return false;

    if (!title.trim()) return false;
    if (title.trim().length > 120) return false;
    if (quantity <= 0) return false;
    if (priceType === "fixed" && (priceMin === "" || priceMin < 0)) return false;
    if (priceType === "range" && (priceMin === "" || priceMax === "" || priceMax < priceMin))
      return false;
    return true;
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error(t("feed.create.imageRequired", "Vui lòng chọn ảnh hợp lệ"));
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
    if (!isFormValid() || !user) {
      toast.error("Vui lòng kiểm tra lại các trường bắt buộc.");
      return;
    }
    setPosting(true);

    let imageUrl: string | null = editPost?.imageUrl || null;
    if (imageFile) {
      const uploadResult = await uploadImage(imageFile);
      if (!uploadResult.success || !uploadResult.data) {
        toast.error(uploadResult.message);
        setPosting(false);
        return;
      }
      imageUrl = uploadResult.data.imageUrl;
    } else if (!imagePreview) {
      imageUrl = null;
    }

    const payload: Partial<ApiPost> = {
      intentType,
      sport,
      category,
      title: title.trim(),
      details: details.trim(),
      content: details.trim(), // fallback
      quantity,
      priceType,
      priceMin: priceMin !== "" ? priceMin : undefined,
      priceMax: priceMax !== "" ? priceMax : undefined,
      currency: "VND",
      condition,
      status: "open",
      imageUrl,
    };

    let result;
    if (editPost) {
      result = await updatePost(editPost.id, payload);
    } else {
      result = await createPost(payload);
    }

    if (result.success) {
      toast.success(
        editPost
          ? "Cập nhật bài đăng thành công!"
          : t("feed.create.success", "Đăng bài thành công!")
      );
      onSuccess(result.data);
    } else {
      toast.error(result.message);
      setPosting(false);
    }
  };

  const initials =
    user?.name
      ?.split(" ")
      .map((w) => w[0])
      .slice(-2)
      .join("") ?? "U";
  const canPost = isFormValid() && !posting;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-dark/55 backdrop-blur-sm">
      <div
        className="relative w-full max-w-2xl flex flex-col max-h-[90vh] rounded-2xl overflow-hidden bg-white"
        style={{ boxShadow: "0 32px 80px rgba(36,25,20,0.35)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-brand-border">
          <h2 className="font-heading text-lg font-bold text-brand-dark">
            {editPost ? "Cập nhật bài đăng" : "Tạo bài đăng mới"}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-brand-surface-warm transition-colors text-brand-body"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Form Content */}
        <div className="px-5 pt-4 pb-3 flex flex-col gap-3 overflow-y-scroll">
          {/* User Profile Info */}
          <div className="flex items-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 gradient-teal-diag text-white text-[15px] font-bold font-heading">
              {initials}
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-brand-dark font-heading">
                {user?.name ?? t("feed.create.you", "Bạn")}
              </p>
              <p className="text-xs text-brand-muted">
                {t("feed.create.destination", "Chia sẻ với cộng đồng")}
              </p>
            </div>
          </div>

          {/* Form Fields Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-bold text-brand-dark mb-1">
                Loại tin đăng *
              </label>
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  type="button"
                  onClick={() => setIntentType("sell")}
                  className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    intentType === "sell"
                      ? "bg-white shadow-sm text-brand-dark"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Cần bán
                </button>
                <button
                  type="button"
                  onClick={() => setIntentType("buy")}
                  className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    intentType === "buy"
                      ? "bg-white shadow-sm text-brand-dark"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Cần mua
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-brand-dark mb-1">
                Môn thể thao *
              </label>
              <select
                value={sport}
                onChange={(e) => setSport(e.target.value)}
                className="w-full h-11 px-3 border border-brand-border rounded-lg text-[14px] bg-white outline-none focus:border-brand-teal"
              >
                <option value="Pickleball">Pickleball</option>
                <option value="Tennis">Tennis</option>
                <option value="Badminton">Cầu lông</option>
                <option value="Football">Bóng đá</option>
                <option value="Other">Khác</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-brand-dark mb-1">Danh mục *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-11 px-3 border border-brand-border rounded-lg text-[14px] bg-white outline-none focus:border-brand-teal"
              >
                <option value="Equipment">Thiết bị</option>
                <option value="Apparel">Trang phục</option>
                <option value="Accessories">Phụ kiện</option>
                <option value="Tickets">Vé</option>
                <option value="Other">Khác</option>
              </select>
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-bold text-brand-dark mb-1">
                Tiêu đề tin đăng *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Tiêu đề ngắn gọn, rõ ràng (tối đa 120 ký tự)"
                className="w-full h-11 px-3 border border-brand-border rounded-lg text-[14px] bg-white outline-none focus:border-brand-teal"
                maxLength={120}
              />
              <p className="text-right text-[11px] text-brand-muted mt-1">{title.length}/120</p>
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-bold text-brand-dark mb-1">Kiểu giá *</label>
              <select
                value={priceType}
                onChange={(e) => setPriceType(e.target.value as any)}
                className="w-full h-11 px-3 border border-brand-border rounded-lg text-[14px] bg-white outline-none focus:border-brand-teal"
              >
                <option value="fixed">Giá cố định</option>
                <option value="negotiable">Thỏa thuận</option>
                <option value="range">Khoảng giá</option>
                <option value="quote_requested">Yêu cầu báo giá</option>
              </select>
            </div>

            {(priceType === "fixed" || priceType === "range") && (
              <div className={priceType === "range" ? "col-span-1" : "col-span-2"}>
                <label className="block text-xs font-bold text-brand-dark mb-1">
                  {priceType === "range" ? "Giá tối thiểu (VND) *" : "Mức giá (VND) *"}
                </label>
                <input
                  type="number"
                  value={priceMin}
                  onChange={(e) => setPriceMin(e.target.value ? Number(e.target.value) : "")}
                  placeholder="0"
                  className="w-full h-11 px-3 border border-brand-border rounded-lg text-[14px] bg-white outline-none focus:border-brand-teal"
                  min="0"
                />
              </div>
            )}

            {priceType === "range" && (
              <div className="col-span-1">
                <label className="block text-xs font-bold text-brand-dark mb-1">
                  Giá tối đa (VND) *
                </label>
                <input
                  type="number"
                  value={priceMax}
                  onChange={(e) => setPriceMax(e.target.value ? Number(e.target.value) : "")}
                  placeholder="0"
                  className="w-full h-11 px-3 border border-brand-border rounded-lg text-[14px] bg-white outline-none focus:border-brand-teal"
                  min="0"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-brand-dark mb-1">Số lượng *</label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full h-11 px-3 border border-brand-border rounded-lg text-[14px] bg-white outline-none focus:border-brand-teal"
                min="1"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-brand-dark mb-1">
                Tình trạng *
              </label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value as any)}
                className="w-full h-11 px-3 border border-brand-border rounded-lg text-[14px] bg-white outline-none focus:border-brand-teal"
              >
                <option value="new">Mới (New)</option>
                <option value="like_new">Như mới (Like New)</option>
                <option value="used">Đã qua sử dụng (Used)</option>
              </select>
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-bold text-brand-dark mb-1">Nội dung</label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Nhập thông tin chi tiết về sản phẩm..."
                className="w-full p-3 border border-brand-border rounded-lg text-[14px] text-brand-dark bg-white outline-none focus:border-brand-teal min-h-[100px] resize-y"
              />
              <p
                className={`text-right text-[11px] mt-1 ${
                  isOverLimit ? "text-brand-red font-semibold" : "text-brand-muted"
                }`}
              >
                {details.length}/{MAX_CHARS}
              </p>
            </div>

            <div className="col-span-2">
              <label className="flex w-fit cursor-pointer items-center gap-2 px-4 py-2 rounded-lg bg-brand-surface border border-brand-border text-[13px] font-semibold text-brand-dark hover:bg-brand-surface-warm transition-colors">
                <ImagePlus size={17} className="text-brand-teal" />
                Thêm ảnh
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
              </label>
            </div>

            {imagePreview && (
              <div className="col-span-2 relative mt-2 overflow-hidden rounded-xl border border-brand-border bg-brand-surface">
                <img src={imagePreview} alt="Preview" className="max-h-60 w-full object-cover" />
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
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-4 border-t border-brand-border bg-white flex items-center justify-end gap-3 shrink-0">
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
                <Loader2 size={16} className="animate-spin" />{" "}
                {editPost ? "Đang cập nhật..." : "Đang đăng..."}
              </>
            ) : (
              <>
                <Send size={16} /> {editPost ? "Cập nhật" : "Đăng bài"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
