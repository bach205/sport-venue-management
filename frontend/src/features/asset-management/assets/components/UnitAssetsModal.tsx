import { Home, Pencil, Plus, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";
import type { Asset } from "../types/assetTypes";
import type { AssetFormValues } from "../utils/validateAsset";

export interface UnitAssetsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unitCode: string;
  assets: Asset[];
  onAssetClick: (asset: Asset) => void;
  canEdit?: boolean;
  onEdit?: (asset: Asset) => void;
  onDelete?: (asset: Asset) => void;
  onAddAsset?: (prefill: Partial<AssetFormValues>) => void;
}

export function UnitAssetsModal({
  open,
  onOpenChange,
  unitCode,
  assets,
  onAssetClick,
  canEdit,
  onEdit,
  onDelete,
  onAddAsset,
}: UnitAssetsModalProps) {
  const { t } = useTranslation("assets");

  const handleAddAsset = () => {
    const first = assets[0];
    onAddAsset?.({
      buildingId: first?.buildingId ?? "",
      unitId: first?.unitId ?? "",
      ownershipScope: "PRIVATE",
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg!">
        <DialogHeader>
          <div className="flex items-center justify-between gap-3">
            <DialogTitle className="flex items-center gap-2 min-w-0">
              <Home className="size-4 text-primary shrink-0" />
              <span className="truncate">{t("tree.unitAssetsTitle", { unit: unitCode })}</span>
            </DialogTitle>
            {canEdit && onAddAsset && assets.length > 0 && (
              <Button size="sm" variant="outline" className="shrink-0" onClick={handleAddAsset}>
                <Plus data-icon="inline-start" />
                {t("actions.create")}
              </Button>
            )}
          </div>
        </DialogHeader>

        {assets.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm text-muted-foreground">{t("tree.noUnitAssets")}</p>
            {canEdit && onAddAsset && (
              <Button size="sm" variant="outline" className="mt-4" onClick={handleAddAsset}>
                <Plus data-icon="inline-start" />
                {t("actions.create")}
              </Button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto -mx-1 px-1">
            {assets.map((asset) => (
              <div
                key={asset.id}
                className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-accent/40 transition-colors"
              >
                {/* Clickable name → detail panel */}
                <button onClick={() => onAssetClick(asset)} className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-medium truncate text-foreground">{asset.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {asset.assetCode} ·{" "}
                    {t(`assetType.${asset.assetType}` as never, asset.assetType)}
                  </p>
                </button>

                <Badge
                  variant={asset.active ? "default" : "secondary"}
                  className="shrink-0 text-xs"
                >
                  {asset.active ? t("status.active") : t("status.inactive")}
                </Badge>

                {canEdit && (
                  <div className="flex gap-1 shrink-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        onEdit?.(asset);
                        onOpenChange(false);
                      }}
                    >
                      <Pencil data-icon="inline-start" />
                      Sửa
                    </Button>

                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        onDelete?.(asset);
                        onOpenChange(false);
                      }}
                    >
                      <Trash2 data-icon="inline-start" />
                      {t("actions.delete")}
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
