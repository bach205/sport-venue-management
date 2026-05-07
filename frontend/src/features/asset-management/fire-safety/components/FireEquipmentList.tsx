import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { ShieldCheck, AlertTriangle, Clock, ChevronRight, Flame, ExternalLink } from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/utils/cn";
import type { FireEquipment, FireSafetyStatus } from "../types/fireSafetyTypes";

interface FireEquipmentListProps {
  equipments: FireEquipment[];
  isLoading: boolean;
  canEdit: boolean;
  onRowClick: (e: FireEquipment) => void;
  onAddClick: (buildingId: string) => void;
  hideHeader?: boolean;
  buildingId?: string;
}

export function FireEquipmentList({
  equipments,
  isLoading,
  canEdit,
  onRowClick,
  onAddClick,
  hideHeader,
  buildingId,
}: FireEquipmentListProps) {
  const { t } = useTranslation("fireSafety");

  return (
    <div className="flex flex-col gap-3">
      {!hideHeader && ( // wrap phần header
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">{t("section.equipmentList")}</p>
          {canEdit && (
            <Button size="sm" variant="outline" onClick={() => onAddClick(buildingId ?? "")} className="gap-1.5">
              <Flame className="size-3.5" />
              {t("actions.addEquipment")}
            </Button>
          )}
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : equipments.length === 0 ? (
        <div className="flex items-center justify-center py-8 text-sm text-muted-foreground border border-dashed rounded-lg">
          {t("section.equipmentEmpty")}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {equipments.map((eq) => (
            <EquipmentRow key={eq.id} equipment={eq} onClick={() => onRowClick(eq)} t={t} />
          ))}
        </div>
      )}
    </div>
  );
}

function EquipmentRow({
  equipment: eq,
  onClick,
  t,
}: {
  equipment: FireEquipment;
  onClick: () => void;
  t: ReturnType<typeof useTranslation>["t"];
}) {
  const fmtDate = (d?: string) => {
    if (!d) return "—";
    try {
      return format(new Date(d), "dd/MM/yyyy");
    } catch {
      return d;
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-lg border px-4 py-3 bg-card text-left hover:bg-muted/40 transition-colors w-full",
        eq.status === "EXPIRED"
          ? "border-red-300 dark:border-red-800"
          : eq.status === "EXPIRING_SOON"
            ? "border-amber-300 dark:border-amber-700"
            : "border-border"
      )}
    >
      <StatusIcon status={eq.status} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium truncate">{eq.name}</span>
          <FireStatusBadge status={eq.status} t={t} />
          {eq.equipmentType && (
            <span className="text-xs text-muted-foreground bg-muted rounded px-1.5 py-0.5">
              {eq.equipmentType}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 flex-wrap">
          {eq.nextInspectionDate && (
            <span
              className={cn(
                eq.status === "EXPIRED" && "text-red-500 font-medium",
                eq.status === "EXPIRING_SOON" && "text-amber-600 font-medium"
              )}
            >
              {t("detail.nextInspection")}: {fmtDate(eq.nextInspectionDate)}
              {eq.daysUntilDue != null && eq.status !== "VALID" && (
                <span className="ml-1">
                  (
                  {eq.daysUntilDue < 0
                    ? `${Math.abs(eq.daysUntilDue)}d ${t("detail.overdue")}`
                    : `${eq.daysUntilDue}d ${t("detail.remaining")}`}
                  )
                </span>
              )}
            </span>
          )}
        </div>
      </div>
      {eq.certificateUrl && (
        <a
          href={eq.certificateUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-muted-foreground hover:text-foreground shrink-0"
          title={t("detail.certificate")}
        >
          <ExternalLink className="size-3.5" />
        </a>
      )}
      <ChevronRight className="size-4 text-muted-foreground shrink-0" />
    </button>
  );
}

function StatusIcon({ status }: { status: FireSafetyStatus }) {
  if (status === "EXPIRED")
    return <AlertTriangle className="size-4 text-red-500 shrink-0 mt-0.5" />;
  if (status === "EXPIRING_SOON")
    return <Clock className="size-4 text-amber-500 shrink-0 mt-0.5" />;
  return <ShieldCheck className="size-4 text-teal-500 shrink-0 mt-0.5" />;
}

export function FireStatusBadge({
  status,
  t,
}: {
  status: FireSafetyStatus;
  t: ReturnType<typeof useTranslation>["t"];
}) {
  const classes: Record<FireSafetyStatus, string> = {
    VALID: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
    EXPIRING_SOON: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    EXPIRED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  };
  return (
    <Badge className={cn("rounded-full text-xs shrink-0", classes[status])}>
      {t(`status.${status}`, { defaultValue: status })}
    </Badge>
  );
}
