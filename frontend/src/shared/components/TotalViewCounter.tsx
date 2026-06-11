import { Eye } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/shared/utils/cn";
import { useTotalViews } from "@/shared/hooks/useTotalViews";

interface TotalViewCounterProps {
  className?: string;
}

function formatViews(value: number | null) {
  if (value === null) return "...";
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toLocaleString();
}

export function TotalViewCounter({ className }: TotalViewCounterProps) {
  const { t } = useTranslation("matching");
  const { totalViews, loading } = useTotalViews();

  return (
    <div
      title={t("views.totalTitle")}
      className={cn(
        "inline-flex h-9 items-center gap-1.5 rounded-xl border border-brand-border bg-white/90 px-3 text-xs font-bold text-brand-body shadow-sm",
        className
      )}
    >
      <Eye size={15} className="text-brand-orange" />
      <span className={loading ? "animate-pulse" : undefined}>{formatViews(totalViews)}</span>
    </div>
  );
}
