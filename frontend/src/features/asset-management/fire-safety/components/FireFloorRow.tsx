import { format } from "date-fns";
import {
  AlertTriangle,
  ChevronRight,
  Clock,
  ExternalLink,
  Layers,
  ShieldCheck,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/shared/components/ui/badge";
import { cn } from "@/shared/utils/cn";
import { FireStatusBadge } from "./FireEquipmentList";
import type { FireEquipment, FireSafetyStatus } from "../types/fireSafetyTypes";

export interface FireFloorRowProps {
  floorKey: string;
  floorNumber: string;
  equipments: FireEquipment[];
  expanded: boolean;
  onToggle: (key: string) => void;
  onEquipmentClick: (eq: FireEquipment) => void;
}

function fmtDate(d?: string) {
  if (!d) return "—";
  try {
    return format(new Date(d), "dd/MM/yyyy");
  } catch {
    return d;
  }
}

function StatusIcon({ status }: { status: FireSafetyStatus }) {
  if (status === "EXPIRED")
    return <AlertTriangle className="size-4 text-red-500 shrink-0 mt-0.5" />;
  if (status === "EXPIRING_SOON")
    return <Clock className="size-4 text-amber-500 shrink-0 mt-0.5" />;
  return <ShieldCheck className="size-4 text-teal-500 shrink-0 mt-0.5" />;
}

export function FireFloorRow({
  floorKey,
  floorNumber,
  equipments,
  expanded,
  onToggle,
  onEquipmentClick,
}: FireFloorRowProps) {
  const { t } = useTranslation("fireSafety");

  const floorLabel =
    floorNumber === "—" ? t("tree.unknownFloor") : `${t("detail.floor")} ${floorNumber}`;

  const expiredCount = equipments.filter((e) => e.status === "EXPIRED").length;
  const expiringSoonCount = equipments.filter((e) => e.status === "EXPIRING_SOON").length;

  return (
    <div className="border-b border-border/60 last:border-b-0">
      <button
        onClick={() => onToggle(floorKey)}
        className="w-full flex items-center gap-3 px-10 py-2.5 hover:bg-accent/60 transition-colors text-left"
      >
        <ChevronRight
          className={cn(
            "size-3.5 text-muted-foreground transition-transform duration-200 shrink-0",
            expanded && "rotate-90"
          )}
        />
        <Layers className="size-4 text-orange-500 shrink-0" />
        <span className="text-sm font-medium text-foreground">{floorLabel}</span>

        {expiredCount > 0 && (
          <Badge variant="destructive" className="text-xs">
            {expiredCount}
          </Badge>
        )}
        {expiringSoonCount > 0 && (
          <Badge className="text-xs bg-amber-100 text-amber-700 border-amber-300">
            {expiringSoonCount}
          </Badge>
        )}

        <span className="text-xs text-muted-foreground ml-auto">
          {equipments.length} {t("tree.equipmentLabel")}
        </span>
      </button>

      {expanded && (
        <div className="px-10 pb-3 pt-1 flex flex-col gap-1.5">
          {equipments.map((eq) => (
            <button
              key={eq.id}
              type="button"
              onClick={() => onEquipmentClick(eq)}
              className={cn(
                "flex items-center gap-3 rounded-lg border px-4 py-2.5 bg-card text-left hover:bg-muted/40 transition-colors w-full",
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
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5 flex-wrap">
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
          ))}
        </div>
      )}
    </div>
  );
}
