import { useState } from "react";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { Plus } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Textarea } from "@/shared/components/ui/textarea";
import { Field, FieldGroup, FieldLabel } from "@/shared/components/ui/field";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/shared/components/ui/dialog";
import { WorkStatusBadge, SlaBadge } from "../WorkList";
import { getSlaStatus } from "../../types/workTypes";
import type { CompleteWorkRequest, MaintenanceWork, WorkProgressLog } from "../../types/workTypes";
import { workApi } from "../../api/workApi";
import { toast } from "sonner";

interface ProgressSectionProps {
  work: MaintenanceWork;
  logs: WorkProgressLog[];
  canEdit: boolean;
  onStatusChange: (updated: MaintenanceWork) => void;
}

export function ProgressSection({ work, logs, canEdit, onStatusChange }: ProgressSectionProps) {
  const { t } = useTranslation("maintenanceTasks");
  const [progressOpen, setProgressOpen] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [progressNote, setProgressNote] = useState("");
  const [completeForm, setCompleteForm] = useState<CompleteWorkRequest>({
    workPerformed: "",
    postMaintenanceStatus: "",
    technicianNote: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const sla = getSlaStatus(work.dueDate);

  const sortedLogs = [...logs].sort(
    (a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime()
  );

  async function handleStart() {
    setIsSubmitting(true);
    try {
      const updated = await workApi.start(work.id);
      onStatusChange(updated);
      toast.success(t("messages.updateSuccess"));
    } catch {
      toast.error(t("messages.updateError"));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleComplete() {
    if (!completeForm.workPerformed.trim() || !completeForm.postMaintenanceStatus.trim()) return;
    setIsSubmitting(true);
    try {
      const updated = await workApi.complete(work.id, completeForm);
      onStatusChange(updated);
      toast.success(t("messages.updateSuccess"));
      setCompleteOpen(false);
      setCompleteForm({ workPerformed: "", postMaintenanceStatus: "", technicianNote: "" });
    } catch {
      toast.error(t("messages.updateError"));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleProgress() {
    if (!progressNote.trim()) return;
    setIsSubmitting(true);
    try {
      await workApi.addProgress(work.id, progressNote);
      toast.success(t("messages.progressAdded"));
      setProgressNote("");
      setProgressOpen(false);
    } catch {
      toast.error(t("messages.updateError"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Current status */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{t("detail.currentStatus")}:</span>
          <WorkStatusBadge status={work.status} t={t} />
        </div>
        <SlaBadge sla={sla} t={t} />
      </div>

      {/* Action buttons */}
      {canEdit && (
        <div className="flex gap-2 flex-wrap">
          {work.status === "ASSIGNED" && (
            <Button size="sm" variant="outline" onClick={handleStart} disabled={isSubmitting}>
              {t("actions.start")}
            </Button>
          )}
          {work.status === "IN_PROGRESS" && (
            <>
              <Button size="sm" variant="outline" onClick={() => setProgressOpen(true)}>
                <Plus className="size-3.5 mr-1" />
                {t("actions.addProgress")}
              </Button>
              <Button size="sm" onClick={() => setCompleteOpen(true)} disabled={isSubmitting}>
                {t("actions.complete")}
              </Button>
            </>
          )}
        </div>
      )}

      {/* Timeline */}
      {sortedLogs.length > 0 && (
        <div className="flex flex-col gap-0">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
            {t("detail.progressLog")}
          </p>
          <div className="relative flex flex-col">
            <div className="absolute left-4.75 top-0 bottom-0 w-px bg-border" />
            {sortedLogs.map((log) => {
              let formattedDate = log.loggedAt;
              try {
                formattedDate = format(new Date(log.loggedAt), "dd/MM HH:mm");
              } catch {
                /* keep */
              }
              return (
                <div key={log.id} className="flex gap-3 pl-1 pb-3">
                  <div className="z-10 mt-3">
                    <div className="size-2.5 rounded-full bg-border ring-2 ring-background" />
                  </div>
                  <div className="flex-1 rounded-lg border border-border bg-card px-3 py-2">
                    <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                      <span>{log.loggedByName ?? log.loggedBy}</span>
                      <span>{formattedDate}</span>
                    </div>
                    {log.newStatus && (
                      <div className="flex items-center gap-1.5 mt-1">
                        {log.oldStatus && (
                          <>
                            <WorkStatusBadge status={log.oldStatus} t={t} />
                            <span className="text-xs text-muted-foreground">→</span>
                          </>
                        )}
                        <WorkStatusBadge status={log.newStatus} t={t} />
                      </div>
                    )}
                    {log.note && <p className="text-sm mt-1 leading-relaxed">{log.note}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add progress dialog */}
      <Dialog open={progressOpen} onOpenChange={setProgressOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("actions.addProgress")}</DialogTitle>
          </DialogHeader>
          <Textarea
            value={progressNote}
            onChange={(e) => setProgressNote(e.target.value)}
            rows={4}
            placeholder={t("form.progressPlaceholder")}
          />
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">{t("actions.cancel")}</Button>
            </DialogClose>
            <Button onClick={handleProgress} disabled={isSubmitting || !progressNote.trim()}>
              {t("actions.submit")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={completeOpen} onOpenChange={setCompleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hoàn thành và gửi biên bản</DialogTitle>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <FieldLabel>Công việc thực hiện *</FieldLabel>
              <Textarea
                rows={4}
                value={completeForm.workPerformed}
                onChange={(event) =>
                  setCompleteForm((current) => ({
                    ...current,
                    workPerformed: event.target.value,
                  }))
                }
                placeholder="Mô tả chi tiết hạng mục đã thực hiện"
              />
            </Field>
            <Field>
              <FieldLabel>Tình trạng sau bảo trì *</FieldLabel>
              <Textarea
                rows={3}
                value={completeForm.postMaintenanceStatus}
                onChange={(event) =>
                  setCompleteForm((current) => ({
                    ...current,
                    postMaintenanceStatus: event.target.value,
                  }))
                }
                placeholder="Ví dụ: thiết bị vận hành ổn định, cần theo dõi thêm..."
              />
            </Field>
            <Field>
              <FieldLabel>Ghi chú kỹ thuật</FieldLabel>
              <Textarea
                rows={2}
                value={completeForm.technicianNote ?? ""}
                onChange={(event) =>
                  setCompleteForm((current) => ({
                    ...current,
                    technicianNote: event.target.value,
                  }))
                }
                placeholder="Khuyến nghị vật tư, lần kiểm tra tiếp theo..."
              />
            </Field>
          </FieldGroup>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">{t("actions.cancel")}</Button>
            </DialogClose>
            <Button
              onClick={handleComplete}
              disabled={
                isSubmitting ||
                !completeForm.workPerformed.trim() ||
                !completeForm.postMaintenanceStatus.trim()
              }
            >
              Gửi nghiệm thu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
