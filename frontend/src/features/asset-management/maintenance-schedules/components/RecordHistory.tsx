import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { CheckCircle2, Clock, XCircle, Loader2 } from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { cn } from "@/shared/utils/cn";
import type { MaintenanceRecord, MaintenanceRecordStatus } from "../types/maintenanceTypes";

interface RecordHistoryProps {
  records: MaintenanceRecord[];
  isLoading: boolean;
}

function StatusIcon({ status }: { status: MaintenanceRecordStatus }) {
  switch (status) {
    case "COMPLETED":
      return <CheckCircle2 className="size-4 text-teal-500 shrink-0 mt-0.5" />;
    case "IN_PROGRESS":
      return <Loader2 className="size-4 text-blue-500 shrink-0 mt-0.5 animate-spin" />;
    case "CANCELLED":
      return <XCircle className="size-4 text-slate-400 shrink-0 mt-0.5" />;
    default:
      return <Clock className="size-4 text-amber-500 shrink-0 mt-0.5" />;
  }
}

function StatusBadge({
  status,
  t,
}: {
  status: MaintenanceRecordStatus;
  t: ReturnType<typeof useTranslation>["t"];
}) {
  const classes: Record<MaintenanceRecordStatus, string> = {
    COMPLETED: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
    IN_PROGRESS: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    PENDING: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    CANCELLED: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
  };
  return (
    <Badge className={cn("rounded-full text-xs", classes[status])}>
      {t(`recordStatus.${status}`, { defaultValue: status })}
    </Badge>
  );
}

export function RecordHistory({ records, isLoading }: RecordHistoryProps) {
  const { t } = useTranslation("maintenanceSchedules");

  const sorted = [...records].sort((a, b) => {
    const dateA = a.maintenanceDate ?? a.dueDate ?? "";
    const dateB = b.maintenanceDate ?? b.dueDate ?? "";
    return dateB.localeCompare(dateA);
  });

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-semibold">{t("section.history")}</p>

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <div className="flex items-center justify-center py-8 text-sm text-muted-foreground border border-dashed rounded-lg">
          {t("section.historyEmpty")}
        </div>
      ) : (
        <div className="relative flex flex-col gap-0">
          {/* Timeline line */}
          <div className="absolute left-4.75 top-0 bottom-0 w-px bg-border" aria-hidden />
          {sorted.map((record, idx) => {
            const date = record.maintenanceDate ?? record.dueDate;
            let formattedDate = date ?? "";
            try {
              if (date) formattedDate = format(new Date(date), "dd/MM/yyyy");
            } catch {
              // keep original
            }

            return (
              <div
                key={record.id}
                className={cn("flex gap-3 pl-1 pb-4", idx === sorted.length - 1 && "pb-0")}
              >
                {/* Icon dot */}
                <div className="z-10 flex items-start pt-3">
                  <StatusIcon status={record.status} />
                </div>

                <div className="flex-1 min-w-0 rounded-lg border border-border bg-card px-4 py-3 flex flex-col gap-1.5">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <span className="text-sm font-medium">
                      {t(`maintenanceType.${record.maintenanceType}`, {
                        defaultValue: record.maintenanceType,
                      })}
                    </span>
                    <StatusBadge status={record.status} t={t} />
                  </div>

                  <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                    {formattedDate && <span>{formattedDate}</span>}
                    {record.assignedToName && (
                      <>
                        <span>·</span>
                        <span>{record.assignedToName}</span>
                      </>
                    )}
                  </div>

                  {record.notes && (
                    <p className="text-xs text-muted-foreground leading-relaxed">{record.notes}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
