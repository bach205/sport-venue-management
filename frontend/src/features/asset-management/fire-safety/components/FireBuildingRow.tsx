import { Building2, ChevronRight, Flame } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/utils/cn";
import type { FireEquipment } from "../types/fireSafetyTypes";
import type { Building } from "../../assets/types/assetTypes";
import { FireEquipmentList } from "./FireEquipmentList";

export interface FireBuildingRowProps {
  building: Building;
  equipments: FireEquipment[];
  expanded: boolean;
  onToggle: () => void;
  expandedFloors: Set<string>;
  onToggleFloor: (key: string) => void;
  onEquipmentClick: (eq: FireEquipment) => void;
  canEdit: boolean;
  onAddClick?: (buildingId: string) => void;
}

export function FireBuildingRow({
  building,
  equipments,
  expanded,
  onToggle,
  onEquipmentClick,
  canEdit,
  onAddClick,
}: Omit<FireBuildingRowProps, "expandedFloors" | "onToggleFloor">) {
  const { t } = useTranslation("fireSafety");

  const expiredCount = equipments.filter((e) => e.status === "EXPIRED").length;
  const expiringSoonCount = equipments.filter((e) => e.status === "EXPIRING_SOON").length;

  return (
    <div className="rounded-lg border border-border overflow-hidden shadow-sm">
      {/* Building header — giữ nguyên, chỉ bỏ `floors.length` */}
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
            {building.code}
          </span>

          {expiredCount > 0 && (
            <Badge variant="destructive" className="ml-1 text-xs shrink-0">
              {expiredCount} {t("status.EXPIRED")}
            </Badge>
          )}
          {expiringSoonCount > 0 && (
            <Badge className="ml-1 text-xs bg-amber-100 text-amber-700 border-amber-300 shrink-0">
              {expiringSoonCount} {t("status.EXPIRING_SOON")}
            </Badge>
          )}

          <Badge variant="secondary" className="ml-auto text-xs shrink-0">
            {equipments.length} {t("tree.equipmentLabel")}
          </Badge>
        </button>

        {canEdit && onAddClick && (
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 mr-3 text-muted-foreground hover:text-primary hover:bg-primary/10 shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              onAddClick(building.id);
            }}
          >
            <Flame className="size-4" />
          </Button>
        )}
      </div>

      {/* Expanded: thẳng list, không qua floor */}
      {expanded && (
        <div className="border-t border-border bg-muted/20 px-4 py-3">
          <FireEquipmentList
            equipments={equipments}
            isLoading={false}
            canEdit={canEdit}
            buildingId={building.id}
            onRowClick={onEquipmentClick}
            onAddClick={onAddClick ?? (() => {})}
          />
        </div>
      )}
    </div>
  );
}
