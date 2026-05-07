import { useTranslation } from "react-i18next";
import { format, differenceInDays, isPast } from "date-fns";
import { CalendarClock } from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { cn } from "@/shared/utils/cn";
import type { MaintenanceSchedule } from "../types/maintenanceTypes";

interface UpcomingWidgetProps {
  schedules: MaintenanceSchedule[];
  isLoading: boolean;
}

type UrgencyLevel = "overdue" | "soon" | "normal";

function getUrgency(nextDate: string): UrgencyLevel {
  const date = new Date(nextDate);
  if (isPast(date)) return "overdue";
  if (differenceInDays(date, new Date()) <= 7) return "soon";
  return "normal";
}

export function UpcomingWidget({ schedules, isLoading }: UpcomingWidgetProps) {
  const { t } = useTranslation("maintenanceSchedules");

  const withDate = schedules
    .filter((s) => s.isActive && s.nextMaintenanceDate)
    .sort(
      (a, b) =>
        new Date(a.nextMaintenanceDate!).getTime() - new Date(b.nextMaintenanceDate!).getTime()
    )
    .slice(0, 8);

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-semibold">{t("section.upcoming")}</p>

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      ) : withDate.length === 0 ? (
        <div className="flex items-center justify-center py-8 text-sm text-muted-foreground border border-dashed rounded-lg">
          {t("section.upcomingEmpty")}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {withDate.map((schedule) => {
            const urgency = getUrgency(schedule.nextMaintenanceDate!);
            let formattedDate = schedule.nextMaintenanceDate!;
            try {
              formattedDate = format(new Date(schedule.nextMaintenanceDate!), "dd/MM/yyyy");
            } catch {
              // keep original
            }

            return (
              <div
                key={schedule.id}
                className="flex items-center gap-3 rounded-lg border border-border px-4 py-2.5 bg-card"
              >
                <CalendarClock
                  className={cn(
                    "size-4 shrink-0",
                    urgency === "overdue" && "text-red-500",
                    urgency === "soon" && "text-amber-500",
                    urgency === "normal" && "text-muted-foreground"
                  )}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{schedule.name}</p>
                  {schedule.assignedToName && (
                    <p className="text-xs text-muted-foreground truncate">
                      {schedule.assignedToName}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="text-xs text-muted-foreground">{formattedDate}</span>
                  <UrgencyBadge urgency={urgency} t={t} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function UrgencyBadge({
  urgency,
  t,
}: {
  urgency: UrgencyLevel;
  t: ReturnType<typeof useTranslation>["t"];
}) {
  if (urgency === "overdue") {
    return (
      <Badge className="rounded-full text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
        {t("urgency.overdue")}
      </Badge>
    );
  }
  if (urgency === "soon") {
    return (
      <Badge className="rounded-full text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
        {t("urgency.soon")}
      </Badge>
    );
  }
  return (
    <Badge className="rounded-full text-xs bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
      {t("urgency.normal")}
    </Badge>
  );
}
