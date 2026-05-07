import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Upload,
  Trash2,
  FileText,
  CheckCircle2,
  Minus,
  SkipForward,
  Video,
  Save,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Textarea } from "@/shared/components/ui/textarea";
import { cn } from "@/shared/utils/cn";
import { toast } from "sonner";
import type {
  ChecklistExecutionItem,
  ItemStatus,
  UpdateItemRequest,
  ExecutionMedia,
} from "../types/checklistTypes";

interface ExecutionItemCardProps {
  item: ChecklistExecutionItem;
  executionId: string;
  canEdit: boolean;
  onUpdate: (itemId: string, data: UpdateItemRequest) => Promise<void>;
  onUploadMedia: (itemId: string, file: File) => Promise<void>;
  onDeleteMedia: (mediaId: string) => Promise<void>;
}

// Kỹ thuật chỉ cần 3 trạng thái: TODO → DOING → DONE
const TECH_STATUSES: ItemStatus[] = ["TODO", "DOING", "DONE"];

export function ExecutionItemCard({
  item,
  canEdit,
  onUpdate,
  onUploadMedia,
  onDeleteMedia,
}: ExecutionItemCardProps) {
  const { t } = useTranslation("technicalChecklists");
  const [expanded, setExpanded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [noteValue, setNoteValue] = useState(item.note ?? "");
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleStatusClick(status: ItemStatus) {
    if (item.status === status || !canEdit) return;
    setIsSaving(true);
    try {
      await onUpdate(item.id, { status });
      toast.success(t("messages.itemUpdated"));
    } catch {
      toast.error(t("messages.itemError"));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSaveNote() {
    setIsSavingNote(true);
    try {
      await onUpdate(item.id, { note: noteValue });
      toast.success(t("messages.noteSaved", { defaultValue: "Đã lưu ghi chú" }));
    } catch {
      toast.error(t("messages.noteError", { defaultValue: "Lưu ghi chú thất bại" }));
    } finally {
      setIsSavingNote(false);
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await onUploadMedia(item.id, file);
      toast.success(t("messages.mediaUploaded"));
    } catch {
      toast.error(t("messages.mediaError"));
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  const statusBg: Record<ItemStatus, string> = {
    TODO: "bg-slate-100 text-slate-500",
    DOING: "bg-blue-100 text-blue-700",
    DONE: "bg-teal-100 text-teal-700",
    // 2 trạng thái dưới vẫn giữ trong type nhưng không dùng trong UI nữa
    APPROVE: "bg-green-100 text-green-700",
    NOT_APPROVE: "bg-red-100 text-red-700",
  };

  const statusIcon: Record<ItemStatus, React.ReactNode> = {
    TODO: <Minus className="size-3.5" />,
    DOING: <SkipForward className="size-3.5" />,
    DONE: <CheckCircle2 className="size-3.5" />,
    APPROVE: <CheckCircle2 className="size-3.5" />,
    NOT_APPROVE: <Minus className="size-3.5" />,
  };

  const noteChanged = noteValue !== (item.note ?? "");

  return (
    <div className="rounded-lg border bg-card border-border transition-colors">
      {/* Item header — click để expand */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-3 w-full px-4 py-3 text-left"
      >
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium shrink-0",
            statusBg[item.status]
          )}
        >
          {statusIcon[item.status]}
          {t(`itemStatus.${item.status}`, { defaultValue: item.status })}
        </span>
        <span className="flex-1 text-sm font-medium">
          <span className="text-muted-foreground mr-1.5">{item.orderIndex}.</span>
          {item.itemName}
        </span>
        {/* Hiển thị có ghi chú không */}
        {item.note && <span className="text-xs text-muted-foreground">📝</span>}
        {(item.media?.length ?? 0) > 0 && (
          <span className="text-xs text-muted-foreground">{item.media!.length} 📎</span>
        )}
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="px-4 pb-4 flex flex-col gap-3 border-t border-border pt-3">
          {/* Nút đổi trạng thái — kỹ thuật tự chọn TODO / DOING / DONE */}
          {canEdit && (
            <div className="flex gap-2 flex-wrap">
              {TECH_STATUSES.map((s) => (
                <button
                  key={s}
                  type="button"
                  disabled={isSaving}
                  onClick={() => handleStatusClick(s)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border transition-colors",
                    item.status === s
                      ? cn(statusBg[s], "ring-2 ring-offset-1 ring-current")
                      : "border-border text-muted-foreground hover:bg-muted/50"
                  )}
                >
                  {statusIcon[s]}
                  {t(`itemStatus.${s}`, { defaultValue: s })}
                </button>
              ))}
            </div>
          )}

          {/* Ghi chú */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-muted-foreground font-medium">
              {t("item.note", { defaultValue: "Ghi chú" })}
            </span>
            <Textarea
              value={noteValue}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNoteValue(e.target.value)}
              placeholder={t("item.notePlaceholder", {
                defaultValue: "Nhập ghi chú chi tiết về công việc này...",
              })}
              rows={3}
              disabled={!canEdit}
              className="resize-none text-sm"
            />
            {canEdit && noteChanged && (
              <Button
                size="sm"
                variant="outline"
                className="self-end h-7 text-xs gap-1"
                onClick={handleSaveNote}
                disabled={isSavingNote}
              >
                <Save className="size-3" />
                {isSavingNote
                  ? t("actions.saving", { defaultValue: "Đang lưu..." })
                  : t("actions.saveNote", { defaultValue: "Lưu ghi chú" })}
              </Button>
            )}
          </div>

          {/* Upload media */}
          {canEdit && (
            <div>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs gap-1"
                onClick={() => fileRef.current?.click()}
              >
                <Upload className="size-3" />
                {t("actions.uploadMedia")}
              </Button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*,video/*,.pdf"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          )}

          {/* Media thumbnails */}
          {(item.media?.length ?? 0) > 0 && (
            <div className="flex gap-2 flex-wrap">
              {item.media!.map((m) => (
                <MediaThumb key={m.id} media={m} canEdit={canEdit} onDelete={onDeleteMedia} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MediaThumb({
  media,
  canEdit,
  onDelete,
}: {
  media: ExecutionMedia;
  canEdit: boolean;
  onDelete: (id: string) => void;
}) {
  const isImage = media.mediaType === "IMAGE";
  const isVideo = media.mediaType === "VIDEO";

  return (
    <div className="group relative size-14 rounded-lg border border-border overflow-hidden bg-muted/30 flex items-center justify-center">
      {isImage ? (
        <a href={media.fileUrl} target="_blank" rel="noopener noreferrer" className="w-full h-full">
          <img src={media.fileUrl} alt="" className="w-full h-full object-cover" />
        </a>
      ) : isVideo ? (
        <a
          href={media.fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center w-full h-full text-muted-foreground hover:text-foreground"
        >
          <Video className="size-5" />
        </a>
      ) : (
        <a
          href={media.fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center w-full h-full text-muted-foreground hover:text-foreground"
        >
          <FileText className="size-5" />
        </a>
      )}
      {canEdit && (
        <button
          type="button"
          onClick={() => onDelete(media.id)}
          className="absolute top-0.5 right-0.5 size-5 rounded-full bg-background/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-destructive-foreground"
        >
          <Trash2 className="size-3" />
        </button>
      )}
    </div>
  );
}
