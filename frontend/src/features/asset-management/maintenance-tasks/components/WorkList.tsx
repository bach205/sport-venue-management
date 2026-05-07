import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { AlertTriangle, Clock, CheckCircle2, Wrench, ChevronRight } from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/utils/cn";
import { getSlaStatus, type MaintenanceWork, type MaintenanceWorkStatus } from "../types/workTypes";

interface WorkListProps {
  works: MaintenanceWork[];
  isLoading: boolean;
  onRowClick: (work: MaintenanceWork) => void;
  onCreateClick: () => void;
  canEdit: boolean;
}

export function WorkList({ works, isLoading, onRowClick, onCreateClick, canEdit }: WorkListProps) {
  const { t } = useTranslation("maintenanceTasks");

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">{t("section.works")}</p>
        {canEdit && (
          <Button size="sm" variant="outline" onClick={onCreateClick} className="gap-1.5">
            <Wrench className="size-3.5" />
            {t("actions.create")}
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : works.length === 0 ? (
        <div className="flex items-center justify-center py-8 text-sm text-muted-foreground border border-dashed rounded-lg">
          {t("section.worksEmpty")}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {works.map((work) => (
            <WorkCard key={work.id} work={work} onClick={() => onRowClick(work)} t={t} />
          ))}
        </div>
      )}
    </div>
  );
}

function WorkCard({
  work,
  onClick,
  t,
}: {
  work: MaintenanceWork;
  onClick: () => void;
  t: ReturnType<typeof useTranslation>["t"];
}) {
  const sla = getSlaStatus(work.dueDate);

  let formattedDue = "";
  try {
    if (work.dueDate) formattedDue = format(new Date(work.dueDate), "dd/MM/yyyy");
  } catch {
    /* keep empty */
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-start gap-3 rounded-lg border border-border px-4 py-3 bg-card text-left hover:bg-muted/40 transition-colors w-full"
    >
      <SlaIcon sla={sla} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium truncate">
            {t(`maintenanceType.${work.maintenanceType}`, { defaultValue: work.maintenanceType })}
          </span>
          <WorkStatusBadge status={work.status} t={t} />
        </div>

        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{work.description}</p>

        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 flex-wrap">
          {work.assignedToName && <span>{work.assignedToName}</span>}
          {formattedDue && (
            <span
              className={cn(
                sla === "overdue" && "text-red-500 font-medium",
                sla === "soon" && "text-amber-500 font-medium"
              )}
            >
              {t("work.dueOn")} {formattedDue}
              {sla !== "normal" && <SlaBadge sla={sla} t={t} inline />}
            </span>
          )}
        </div>
      </div>

      <ChevronRight className="size-4 text-muted-foreground shrink-0 mt-0.5" />
    </button>
  );
}

function SlaIcon({ sla }: { sla: ReturnType<typeof getSlaStatus> }) {
  if (sla === "overdue") return <AlertTriangle className="size-4 text-red-500 mt-0.5 shrink-0" />;
  if (sla === "soon") return <Clock className="size-4 text-amber-500 mt-0.5 shrink-0" />;
  return <CheckCircle2 className="size-4 text-muted-foreground mt-0.5 shrink-0" />;
}

export function WorkStatusBadge({
  status,
  t,
}: {
  status: MaintenanceWorkStatus;
  t: ReturnType<typeof useTranslation>["t"];
}) {
  const classes: Partial<Record<MaintenanceWorkStatus, string>> = {
    PENDING: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
    ASSIGNED: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    IN_PROGRESS: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
    PENDING_ACCEPTANCE: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    ACCEPTED: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
    REJECTED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    COMPLETED: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
    CANCELLED: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
  };
  return (
    <Badge className={cn("rounded-full text-xs shrink-0", classes[status] ?? "")}>
      {t(`workStatus.${status}`, { defaultValue: status })}
    </Badge>
  );
}

export function SlaBadge({
  sla,
  t,
  inline,
}: {
  sla: ReturnType<typeof getSlaStatus>;
  t: ReturnType<typeof useTranslation>["t"];
  inline?: boolean;
}) {
  if (sla === "normal") return null;
  return (
    <Badge
      className={cn(
        "rounded-full text-xs",
        inline && "ml-1.5",
        sla === "overdue" && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
        sla === "soon" && "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
      )}
    >
      {sla === "overdue" ? t("sla.overdue") : t("sla.soon")}
    </Badge>
  );
}
