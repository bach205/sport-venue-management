import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { Upload, Trash2, FileText, Video } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { toast } from "sonner";
import type { EvidenceMedia } from "../../types/workTypes";

interface MediaSectionProps {
  media: EvidenceMedia[];
  canEdit: boolean;
  onUpload: (file: File) => Promise<void>;
  onDelete: (mediaId: string) => Promise<void>;
}

export function MediaSection({ media, canEdit, onUpload, onDelete }: MediaSectionProps) {
  const { t } = useTranslation("maintenanceTasks");
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await onUpload(file);
      toast.success(t("messages.mediaUploaded"));
    } catch {
      toast.error(t("messages.mediaError"));
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleDelete(id: string) {
    try {
      await onDelete(id);
      toast.success(t("messages.mediaDeleted"));
    } catch {
      toast.error(t("messages.mediaError"));
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {t("detail.media")}
        </p>
        {canEdit && (
          <>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={() => inputRef.current?.click()}
            >
              <Upload className="size-3.5" />
              {t("actions.upload")}
            </Button>
            <input
              ref={inputRef}
              type="file"
              accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx"
              className="hidden"
              onChange={handleFileChange}
            />
          </>
        )}
      </div>

      {media.length === 0 ? (
        <div className="flex items-center justify-center py-6 text-sm text-muted-foreground border border-dashed rounded-lg">
          {t("detail.mediaEmpty")}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {media.map((item) => (
            <MediaCard key={item.id} item={item} canEdit={canEdit} onDelete={handleDelete} t={t} />
          ))}
        </div>
      )}
    </div>
  );
}

function MediaCard({
  item,
  canEdit,
  onDelete,
  t,
}: {
  item: EvidenceMedia;
  canEdit: boolean;
  onDelete: (id: string) => void;
  t: ReturnType<typeof useTranslation>["t"];
}) {
  const isImage = item.mediaType === "IMAGE";
  const isVideo = item.mediaType === "VIDEO";

  return (
    <div className="group relative rounded-lg border border-border overflow-hidden bg-muted/30 aspect-square flex items-center justify-center">
      {isImage ? (
        <a href={item.fileUrl} target="_blank" rel="noopener noreferrer" className="w-full h-full">
          <img
            src={item.fileUrl}
            alt={t("detail.mediaItem")}
            className="w-full h-full object-cover"
          />
        </a>
      ) : isVideo ? (
        <a
          href={item.fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground transition-colors p-2"
        >
          <Video className="size-6" />
          <span className="text-xs text-center truncate w-full">{item.contentType}</span>
        </a>
      ) : (
        <a
          href={item.fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground transition-colors p-2"
        >
          <FileText className="size-6" />
          <span className="text-xs text-center truncate w-full">{item.contentType}</span>
        </a>
      )}

      {canEdit && (
        <button
          type="button"
          onClick={() => onDelete(item.id)}
          className="absolute top-1 right-1 size-6 rounded-full bg-background/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-destructive-foreground"
        >
          <Trash2 className="size-3" />
        </button>
      )}
    </div>
  );
}
