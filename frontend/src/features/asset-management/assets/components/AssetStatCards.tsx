import { useTranslation } from "react-i18next";
import type { Asset } from "../types/assetTypes";

interface StatCardProps {
  label: string;
  value: number;
  color: string;
}

function StatCard({ label, value, color }: StatCardProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

interface AssetStatCardsProps {
  assets: Asset[];
}

export function AssetStatCards({ assets }: AssetStatCardsProps) {
  const { t } = useTranslation("assets");

  const total = assets.length;
  const active = assets.filter((a) => a.active).length;
  const inactive = total - active;
  const expired = assets.filter(
    (a) => a.warrantyUntil && new Date(a.warrantyUntil) < new Date()
  ).length;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <StatCard label={t("stats.total")} value={total} color="text-foreground" />
      <StatCard label={t("stats.active")} value={active} color="text-teal-600 dark:text-teal-400" />
      <StatCard label={t("stats.inactive")} value={inactive} color="text-muted-foreground" />
      <StatCard label={t("stats.expiredWarranty")} value={expired} color="text-destructive" />
    </div>
  );
}
