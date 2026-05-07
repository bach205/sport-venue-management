import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/shared/components/ui/sheet";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { Separator } from "@/shared/components/ui/separator";
import { WorkStatusBadge, SlaBadge } from "./WorkList";
import { ProgressSection } from "./sections/ProgressSection";
import { PartsSection } from "./sections/PartsSection";
import { MediaSection } from "./sections/MediaSection";
import { ReportSection } from "./sections/ReportSection";
import { PaymentSection } from "./sections/PaymentSection";
import { useWorkDetail } from "../hooks/useMaintenanceWork";
import { getSlaStatus } from "../types/workTypes";
import type { MaintenanceWork } from "../types/workTypes";

interface WorkDetailPanelProps {
  workId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canEdit: boolean;
  canApprove?: boolean;
  onWorkUpdated?: (work: MaintenanceWork) => void;
}

export function WorkDetailPanel({
  workId,
  open,
  onOpenChange,
  canEdit,
  canApprove = canEdit,
  onWorkUpdated,
}: WorkDetailPanelProps) {
  const { t } = useTranslation("maintenanceTasks");
  const {
    work,
    logs,
    parts,
    media,
    isLoading,
    addPart,
    deletePart,
    updateCost,
    uploadMedia,
    deleteMedia,
    updateWorkStatus,
  } = useWorkDetail(open ? workId : null);

  function handleStatusChange(updated: MaintenanceWork) {
    updateWorkStatus(updated);
    onWorkUpdated?.(updated);
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
        {isLoading || !work ? (
          <div className="p-6 flex flex-col gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : (
          <>
            <SheetHeader className="px-6 pt-6 pb-4 border-b border-border shrink-0">
              <div className="flex items-center gap-2 flex-wrap">
                <WorkStatusBadge status={work.status} t={t} />
                <SlaBadge sla={getSlaStatus(work.dueDate)} t={t} />
              </div>
              <SheetTitle className="leading-snug">
                {t(`maintenanceType.${work.maintenanceType}`, {
                  defaultValue: work.maintenanceType,
                })}
                {work.assetName && (
                  <span className="text-sm font-normal text-muted-foreground ml-2">
                    — {work.assetCode} {work.assetName}
                  </span>
                )}
              </SheetTitle>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-6">
              {/* Info */}
              <SectionBlock title={t("section.info")}>
                <InfoGrid
                  rows={[
                    { label: t("detail.info.description"), value: work.description },
                    {
                      label: t("detail.info.assignedTo"),
                      value: work.assignedToName ?? work.assignedTo ?? "—",
                    },
                    {
                      label: "Người giao việc",
                      value: work.requestedByName ?? work.requestedBy ?? "â€”",
                    },
                    { label: t("detail.info.dueDate"), value: fmtDate(work.dueDate) },
                    { label: "Thông báo lúc", value: fmtDate(work.notificationSentAt) },
                    { label: t("detail.info.createdAt"), value: fmtDate(work.createdAt) },
                  ]}
                />
              </SectionBlock>

              <Separator />

              {/* Progress */}
              <SectionBlock title={t("section.progress")}>
                <ProgressSection
                  work={work}
                  logs={logs}
                  canEdit={canEdit}
                  onStatusChange={handleStatusChange}
                />
              </SectionBlock>

              <Separator />

              {/* Parts & Costs */}
              <SectionBlock title={t("section.parts")}>
                <PartsSection
                  work={work}
                  parts={parts}
                  canEdit={canEdit}
                  onAddPart={async (data) => {
                    await addPart(data);
                    onWorkUpdated?.(work);
                  }}
                  onDeletePart={async (partId) => {
                    await deletePart(partId);
                    onWorkUpdated?.(work);
                  }}
                  onUpdateCost={async (data) => {
                    const updated = await updateCost(data);
                    if (updated) handleStatusChange(updated);
                  }}
                />
              </SectionBlock>

              <Separator />

              {/* Media */}
              <SectionBlock title={t("section.media")}>
                <MediaSection
                  media={media}
                  canEdit={canEdit}
                  onUpload={async (file) => {
                    await uploadMedia(file);
                  }}
                  onDelete={deleteMedia}
                />
              </SectionBlock>

              <Separator />

              {/* Report */}
              <SectionBlock title={t("section.report")}>
                <ReportSection work={work} parts={parts} />
              </SectionBlock>

              <Separator />

              {/* Payment */}
              <SectionBlock title={t("section.payment")}>
                <PaymentSection
                  work={work}
                  canEdit={canApprove}
                  onStatusChange={handleStatusChange}
                />
              </SectionBlock>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function SectionBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {title}
      </p>
      {children}
    </div>
  );
}

function InfoGrid({ rows }: { rows: { label: string; value: string }[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
      {rows.map((row) => (
        <div key={row.label} className="flex flex-col gap-0.5">
          <span className="text-xs text-muted-foreground">{row.label}</span>
          <span>{row.value}</span>
        </div>
      ))}
    </div>
  );
}
