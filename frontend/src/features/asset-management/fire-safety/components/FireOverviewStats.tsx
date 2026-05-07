import { useTranslation } from "react-i18next";
import { ShieldCheck, AlertTriangle, Clock, Flame } from "lucide-react";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { cn } from "@/shared/utils/cn";
import type { FireSafetyOverview } from "../types/fireSafetyTypes";

interface FireOverviewStatsProps {
  overview: FireSafetyOverview;
  isLoading: boolean;
}

export function FireOverviewStats({ overview, isLoading }: FireOverviewStatsProps) {
  const { t } = useTranslation("fireSafety");

  const stats = [
    {
      label: t("overview.total"),
      value: overview.total,
      icon: <Flame className="size-4" />,
      color: "text-foreground",
      bg: "bg-muted/50",
    },
    {
      label: t("overview.valid"),
      value: overview.valid,
      icon: <ShieldCheck className="size-4" />,
      color: "text-teal-600",
      bg: "bg-teal-50 dark:bg-teal-900/20",
    },
    {
      label: t("overview.expiringSoon"),
      value: overview.expiringSoon,
      icon: <Clock className="size-4" />,
      color: "text-amber-600",
      bg: "bg-amber-50 dark:bg-amber-900/20",
    },
    {
      label: t("overview.expired"),
      value: overview.expired,
      icon: <AlertTriangle className="size-4" />,
      color: "text-red-600",
      bg: "bg-red-50 dark:bg-red-900/20",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-20 rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {stats.map((s) => (
        <div
          key={s.label}
          className={cn("rounded-lg border border-border px-4 py-3 flex flex-col gap-1.5", s.bg)}
        >
          <div className={cn("flex items-center gap-1.5", s.color)}>
            {s.icon}
            <span className="text-xs font-medium">{s.label}</span>
          </div>
          <span className={cn("text-2xl font-bold leading-none", s.color)}>{s.value}</span>
        </div>
      ))}
    </div>
  );
}
