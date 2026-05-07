import { ChevronRight, Layers, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/utils/cn";
import { UnitCard } from "./UnitCard";
import type { Asset } from "../types/assetTypes";
import type { AssetFormValues } from "../utils/validateAsset";

export interface FloorRowProps {
  floorKey: string;
  floor: string;
  buildingId: string;
  assets: Asset[];
  expanded: boolean;
  onToggle: (key: string) => void;
  onUnitClick: (unitCode: string, assets: Asset[]) => void;
  onAddAsset?: (prefill: Partial<AssetFormValues>) => void;
}

export function FloorRow({
  floorKey,
  floor,
  buildingId,
  assets,
  expanded,
  onToggle,
  onUnitClick,
  onAddAsset,
}: FloorRowProps) {
  const { t } = useTranslation("assets");

  const unitGroups = assets.reduce<Record<string, Asset[]>>((acc, asset) => {
    const key = asset.unitId ?? "__common__";
    if (!acc[key]) acc[key] = [];
    acc[key].push(asset);
    return acc;
  }, {});

  const unitKeys = Object.keys(unitGroups);

  return (
    <div className="border-b border-border/60 last:border-b-0">
      <div className="flex items-center">
        {/* Clickable toggle area */}
        <button
          onClick={() => onToggle(floorKey)}
          className="flex-1 flex items-center gap-3 px-10 py-2.5 hover:bg-accent/60 transition-colors text-left"
        >
          <ChevronRight
            className={cn(
              "size-3.5 text-muted-foreground transition-transform duration-200 shrink-0",
              expanded && "rotate-90"
            )}
          />
          <Layers className="size-4 text-orange-500 shrink-0" />
          <span className="text-sm font-medium text-foreground">{t("tree.floor", { floor })}</span>
          <span className="text-xs text-muted-foreground ml-1">
            {unitKeys.length} {t("tree.unitLabel")}
          </span>
        </button>

        {/* Add asset to floor button */}
        {onAddAsset && (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0 mr-3 text-muted-foreground hover:text-primary hover:bg-primary/10 shrink-0"
            title={t("tree.addAssetToFloor", { floor })}
            onClick={(e) => {
              e.stopPropagation();
              onAddAsset({ buildingId });
            }}
          >
            <Plus className="size-3.5" />
          </Button>
        )}
      </div>

      {expanded && (
        <div className="px-10 pb-4 pt-1 grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {unitKeys.map((unitKey) => {
            const unitAssets = unitGroups[unitKey];
            const unitCode =
              unitKey === "__common__"
                ? t("tree.commonArea")
                : (unitAssets[0]?.unitCode ?? unitKey);
            return (
              <UnitCard
                key={unitKey}
                unitCode={unitCode}
                assets={unitAssets}
                isCommon={unitKey === "__common__"}
                onClick={() => onUnitClick(unitCode, unitAssets)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
