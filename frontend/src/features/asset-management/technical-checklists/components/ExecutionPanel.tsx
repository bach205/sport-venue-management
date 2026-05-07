import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/shared/components/ui/sheet";
import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { Separator } from "@/shared/components/ui/separator";
import { ChecklistStatusBadge } from "./AssignmentList";
import { ExecutionItemCard } from "./ExecutionItemCard";
import { useExecution } from "../hooks/useChecklists";
import { toast } from "sonner";
import type { UpdateItemRequest } from "../types/checklistTypes";

// TODO: thay bằng useAuth() hoặc context sau khi có auth
const CURRENT_USER_ID = "u1";

interface ExecutionPanelProps {
  assignmentId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isAdmin?: boolean;
}

export function ExecutionPanel({
  assignmentId,
  open,
  onOpenChange,
  isAdmin = false,
}: ExecutionPanelProps) {
  const { t } = useTranslation("technicalChecklists");
  const {
    assignment,
    execution,
    items,
    isLoading,
    complete,
    updateItem,
    uploadItemMedia,
    deleteMedia,
  } = useExecution(open ? assignmentId : null);

  // Kỹ thuật chỉ có thể chỉnh sửa checklist được phân công cho mình
  const isAssignedToMe = assignment?.assignedTo === CURRENT_USER_ID;
  const canEdit = isAdmin ? assignment?.status === "IN_PROGRESS" : isAssignedToMe;

  // Nút "Hoàn thành" hiện khi: là admin, checklist đang IN_PROGRESS hoặc PENDING_REVIEW, và TẤT CẢ item đã DONE
  const allItemsDone = items.length > 0 && items.every((i) => i.status === "DONE");
  const canComplete =
    isAdmin &&
    (assignment?.status === "PENDING_REVIEW" || assignment?.status === "IN_PROGRESS") &&
    allItemsDone;

  async function handleComplete() {
    try {
      await complete();
      toast.success(t("messages.completed"));
    } catch {
      toast.error(t("messages.completeError"));
    }
  }

  async function handleUpdate(itemId: string, data: UpdateItemRequest) {
    await updateItem(itemId, data);
  }

  async function handleUpload(itemId: string, file: File) {
    await uploadItemMedia(itemId, file);
  }

  async function handleDelete(mediaId: string) {
    await deleteMedia(mediaId);
  }

  const fmtDate = (d?: string) => {
    if (!d) return "—";
    try {
      return format(new Date(d), "dd/MM/yyyy");
    } catch {
      return d;
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl flex flex-col p-0 overflow-hidden">
        {isLoading || !assignment ? (
          <div className="p-6 flex flex-col gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : (
          <>
            <SheetHeader className="px-6 pt-6 pb-4 border-b border-border shrink-0">
              <div className="flex items-center gap-2 flex-wrap">
                <ChecklistStatusBadge status={assignment.status} t={t} />
                {assignment.dueDate && (
                  <span className="text-xs text-muted-foreground">
                    {t("list.dueOn")} {fmtDate(assignment.dueDate)}
                  </span>
                )}
              </div>
              <SheetTitle className="leading-snug">{assignment.templateName}</SheetTitle>
              {assignment.assetName && (
                <p className="text-sm text-muted-foreground">
                  {assignment.assetCode} — {assignment.assetName}
                </p>
              )}
            </SheetHeader>

            <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-6">
              {/* Info row */}
              <div className="flex gap-4 text-sm flex-wrap">
                <div>
                  <span className="text-muted-foreground">{t("detail.assignedTo")}: </span>
                  <span>{assignment.assignedToName ?? assignment.assignedTo}</span>
                </div>
                {assignment.startedAt && (
                  <div>
                    <span className="text-muted-foreground">{t("detail.startedAt")}: </span>
                    <span>{fmtDate(assignment.startedAt)}</span>
                  </div>
                )}
                {assignment.completedAt && (
                  <div>
                    <span className="text-muted-foreground">{t("detail.completedAt")}: </span>
                    <span>{fmtDate(assignment.completedAt)}</span>
                  </div>
                )}
              </div>

              {/* Nút hoàn thành — chỉ admin thấy, chỉ enable khi all DONE */}
              {isAdmin &&
                (assignment.status === "IN_PROGRESS" || assignment.status === "PENDING_REVIEW") && (
                  <div className="flex items-center gap-3">
                    <Button size="sm" onClick={handleComplete} disabled={!canComplete}>
                      {t("actions.complete")}
                    </Button>
                    {!allItemsDone && items.length > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {t("detail.completeHint", {
                          defaultValue: `Còn ${items.filter((i) => i.status !== "DONE").length} hạng mục chưa hoàn thành`,
                          remaining: items.filter((i) => i.status !== "DONE").length,
                        })}
                      </span>
                    )}
                  </div>
                )}

              {/* Kỹ thuật không có quyền — hiển thị thông báo */}
              {!isAdmin && assignment.status === "IN_PROGRESS" && !isAssignedToMe && (
                <div className="rounded-lg bg-muted px-4 py-3 text-sm text-muted-foreground">
                  {t("detail.notAssigned", {
                    defaultValue: "Bạn không được phân công checklist này.",
                  })}
                </div>
              )}

              <Separator />

              {/* Execution items */}
              {items.length === 0 ? (
                <div className="flex items-center justify-center py-8 text-sm text-muted-foreground border border-dashed rounded-lg">
                  {t("detail.noItems")}
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {[...items]
                    .sort((a, b) => a.orderIndex - b.orderIndex)
                    .map((item) => (
                      <ExecutionItemCard
                        key={item.id}
                        item={item}
                        executionId={execution?.id ?? ""}
                        canEdit={canEdit}
                        onUpdate={handleUpdate}
                        onUploadMedia={handleUpload}
                        onDeleteMedia={handleDelete}
                      />
                    ))}
                </div>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
