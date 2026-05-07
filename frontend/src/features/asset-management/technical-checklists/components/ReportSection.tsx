import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { checklistApi } from "../api/checklistApi";
import type { ChecklistReportSummary } from "../types/checklistTypes";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/utils/cn";

interface ReportSectionProps {
  assetId?: string;
}

export function ReportSection({ assetId }: ReportSectionProps) {
  const { t } = useTranslation("technicalChecklists");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [summary, setSummary] = useState<ChecklistReportSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await checklistApi.getReportSummary({
        assetId,
        from: from || undefined,
        to: to || undefined,
      });
      setSummary(data);
    } finally {
      setIsLoading(false);
    }
  }, [assetId, from, to]);

  useEffect(() => {
    load();
  }, [load]);

  const stats = summary
    ? [
        { label: t("report.total"), value: summary.totalAssignments, color: "text-foreground" },
        { label: t("report.completed"), value: summary.completed, color: "text-teal-600" },
        { label: t("report.inProgress"), value: summary.inProgress, color: "text-blue-600" },
        { label: t("report.overdue"), value: summary.overdue, color: "text-red-600" },
        {
          label: t("report.completionRate"),
          value: `${summary.completionRate}%`,
          color: "text-indigo-600",
        },
      ]
    : [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 flex-wrap">
        <Input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="h-8 text-xs w-36"
          placeholder={t("report.from")}
        />
        <span className="text-xs text-muted-foreground">—</span>
        <Input
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="h-8 text-xs w-36"
          placeholder={t("report.to")}
        />
        <Button size="sm" variant="outline" className="h-8 text-xs" onClick={load}>
          {t("report.apply")}
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 rounded-lg" />
          ))}
        </div>
      ) : summary ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {stats.map((s) => (
            <div key={s.label} className="rounded-lg border border-border bg-card px-4 py-3">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className={cn("text-2xl font-semibold mt-0.5", s.color)}>{s.value}</p>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
