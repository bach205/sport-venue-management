import { ChevronRight, Home, Package } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { Asset } from "../types/assetTypes";

export interface UnitCardProps {
  unitCode: string;
  assets: Asset[];
  isCommon: boolean;
  onClick: () => void;
}

export function UnitCard({ unitCode, assets, isCommon, onClick }: UnitCardProps) {
  const { t } = useTranslation("assets");
  const activeCount = assets.filter((a) => a.active).length;

  return (
    <button
      onClick={onClick}
      className="rounded-lg border border-border bg-card p-3 text-left hover:border-primary hover:bg-accent transition-colors w-full group"
    >
      {/* Header row: icon + code + chevron */}
      <div className="flex items-center gap-1.5 mb-1.5">
        {isCommon ? (
          <Package className="size-3.5 text-orange-500 shrink-0" />
        ) : (
          <Home className="size-3.5 text-primary shrink-0" />
        )}
        <span className="text-sm font-semibold truncate text-foreground group-hover:text-primary transition-colors flex-1">
          {unitCode}
        </span>
        <ChevronRight className="size-3 text-muted-foreground/40 group-hover:text-primary transition-colors shrink-0" />
      </div>

      {/* Asset count row */}
      <div className="flex items-center justify-between gap-1 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Package className="size-3 shrink-0" />
          <span>
            {assets.length} {t("tree.assetLabel")}
          </span>
          {activeCount < assets.length && (
            <span className="text-destructive">· {assets.length - activeCount} off</span>
          )}
        </div>
        <span className="text-muted-foreground/50 group-hover:text-primary/70 transition-colors hidden sm:block whitespace-nowrap">
          {t("tree.viewAssets")} →
        </span>
      </div>
    </button>
  );
}
