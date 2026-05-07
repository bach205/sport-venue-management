import { Building2, ChevronRight, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/utils/cn";
import { FloorRow } from "./FloorRow";
import type { Asset, Building } from "../types/assetTypes";
import type { AssetFormValues } from "../utils/validateAsset";

export interface BuildingRowProps {
  building: Building;
  assets: Asset[];
  expanded: boolean;
  onToggle: () => void;
  expandedFloors: Set<string>;
  onToggleFloor: (key: string) => void;
  onUnitClick: (unitCode: string, assets: Asset[]) => void;
  onAddAsset?: (prefill: Partial<AssetFormValues>) => void;
}

export function BuildingRow({
  building,
  assets,
  expanded,
  onToggle,
  expandedFloors,
  onToggleFloor,
  onUnitClick,
  onAddAsset,
}: BuildingRowProps) {
  const { t } = useTranslation("assets");

  const floorGroups = assets.reduce<Record<string, Asset[]>>((acc, asset) => {
    const key = asset.floor ?? "—";
    if (!acc[key]) acc[key] = [];
    acc[key].push(asset);
    return acc;
  }, {});

  const floors = Object.keys(floorGroups).sort();
  const unitCount = new Set(assets.filter((a) => a.unitId).map((a) => a.unitId)).size;

  return (
    <div className="rounded-lg border border-border overflow-hidden shadow-sm">
      {/* Building header row */}
      <div className="flex items-center bg-card">
        <button
          onClick={onToggle}
          className="flex-1 flex items-center gap-3 px-4 py-3 hover:bg-accent transition-colors text-left"
        >
          <ChevronRight
            className={cn(
              "size-4 text-muted-foreground transition-transform duration-200 shrink-0",
              expanded && "rotate-90"
            )}
          />
          <Building2 className="size-5 text-blue-500 shrink-0" />
          <span className="font-semibold text-sm text-foreground">{building.name}</span>
          <span className="text-xs text-muted-foreground ml-1 hidden sm:inline">
            {`${t("table.assetCode")}: ${building.code} • ${floors.length} ${t("tree.floorLabel")} • ${unitCount} ${t("tree.unitLabel")}`}
          </span>
          <Badge variant="secondary" className="ml-auto text-xs shrink-0">
            {assets.length} {t("tree.assetLabel")}
          </Badge>
        </button>

        {/* Add asset to building button */}
        {onAddAsset && (
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 mr-3 text-muted-foreground hover:text-primary hover:bg-primary/10 shrink-0"
            title={t("tree.addAssetToBuilding")}
            onClick={(e) => {
              e.stopPropagation();
              onAddAsset({ buildingId: building.id });
            }}
          >
            <Plus className="size-4" />
          </Button>
        )}
      </div>

      {/* Floor list */}
      {expanded && (
        <div className="border-t border-border bg-muted/20">
          {floors.length === 0 ? (
            <p className="text-xs text-muted-foreground px-10 py-4">{t("tree.noFloors")}</p>
          ) : (
            floors.map((floor) => (
              <FloorRow
                key={`${building.id}-${floor}`}
                floorKey={`${building.id}-${floor}`}
                floor={floor}
                buildingId={building.id}
                assets={floorGroups[floor]}
                expanded={expandedFloors.has(`${building.id}-${floor}`)}
                onToggle={onToggleFloor}
                onUnitClick={onUnitClick}
                onAddAsset={onAddAsset}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}
