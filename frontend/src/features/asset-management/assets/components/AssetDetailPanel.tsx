import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { Building2, CalendarDays, Hash, MapPin, Tag } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/shared/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { Badge } from "@/shared/components/ui/badge";
import { Separator } from "@/shared/components/ui/separator";
import { cn } from "@/shared/utils/cn";
import { MaintenanceTab } from "@/features/asset-management/maintenance-schedules/components/MaintenanceTab";
import { WorkTab } from "@/features/asset-management/maintenance-tasks/components/WorkTab";
import { ChecklistTab } from "@/features/asset-management/technical-checklists/components/ChecklistTab";
import { FireSafetyTab } from "@/features/asset-management/fire-safety/components/FireSafetyTab";
import type { Asset } from "../types/assetTypes";

interface AssetDetailPanelProps {
  asset: Asset | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canEdit?: boolean;
}

interface InfoRowProps {
  icon: React.ReactNode;
  label: string;
  value?: string | null;
}

function InfoRow({ icon, label, value }: InfoRowProps) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 text-muted-foreground shrink-0">{icon}</span>
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
        <span className="text-sm font-medium truncate">{value}</span>
      </div>
    </div>
  );
}

export function AssetDetailPanel({
  asset,
  open,
  onOpenChange,
  canEdit = false,
}: AssetDetailPanelProps) {
  const { t } = useTranslation("assets");

  if (!asset) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl flex flex-col p-0 overflow-hidden">
        {/* Header */}
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border gap-2">
          <div className="flex items-start justify-between gap-3 pr-8">
            <div className="flex flex-col gap-1 min-w-0">
              <SheetTitle className="text-base font-semibold truncate">{asset.name}</SheetTitle>
              <span className="font-mono text-xs text-muted-foreground">{asset.assetCode}</span>
            </div>
            <Badge
              className={cn(
                "rounded-full text-xs shrink-0",
                asset.active
                  ? "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400"
                  : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
              )}
            >
              {asset.active ? t("status.active") : t("status.inactive")}
            </Badge>
          </div>
        </SheetHeader>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="flex flex-col flex-1 overflow-hidden">
          <TabsList className="mx-6 mt-4 mb-0 shrink-0 w-auto justify-start bg-muted/40 rounded-lg p-1">
            <TabsTrigger value="overview">{t("detail.tabs.overview")}</TabsTrigger>
            <TabsTrigger value="maintenance">{t("detail.tabs.maintenance")}</TabsTrigger>
            <TabsTrigger value="checklist">{t("detail.tabs.checklist")}</TabsTrigger>
            <TabsTrigger value="fire">{t("detail.tabs.fire")}</TabsTrigger>
            <TabsTrigger value="work">{t("detail.tabs.work")}</TabsTrigger>
          </TabsList>

          {/* Overview tab */}
          <TabsContent value="overview" className="flex-1 overflow-y-auto px-6 py-4 mt-0">
            <div className="flex flex-col gap-6">
              {/* Location section */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                  {t("detail.location")}
                </p>
                <div className="flex flex-col gap-3">
                  <InfoRow
                    icon={<Building2 className="size-4" />}
                    label={t("table.building")}
                    value={asset.buildingCode ?? asset.buildingId}
                  />
                  <InfoRow
                    icon={<MapPin className="size-4" />}
                    label={t("form.unit")}
                    value={asset.unitCode}
                  />
                  <InfoRow
                    icon={<MapPin className="size-4" />}
                    label={t("table.floor")}
                    value={asset.floor}
                  />
                  <InfoRow
                    icon={<MapPin className="size-4" />}
                    label={t("form.location")}
                    value={asset.location}
                  />
                </div>
              </div>

              <Separator />

              {/* Classification */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                  {t("detail.classification")}
                </p>
                <div className="flex flex-col gap-3">
                  <InfoRow
                    icon={<Tag className="size-4" />}
                    label={t("table.assetType")}
                    value={t(`assetType.${asset.assetType}`, { defaultValue: asset.assetType })}
                  />
                  <InfoRow
                    icon={<Tag className="size-4" />}
                    label={t("table.ownershipScope")}
                    value={
                      asset.ownershipScope
                        ? t(`ownershipScope.${asset.ownershipScope}`, {
                            defaultValue: asset.ownershipScope,
                          })
                        : undefined
                    }
                  />
                  <InfoRow
                    icon={<Tag className="size-4" />}
                    label={t("form.roomType")}
                    value={asset.roomType}
                  />
                </div>
              </div>

              <Separator />

              {/* Device info */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                  {t("detail.deviceInfo")}
                </p>
                <div className="flex flex-col gap-3">
                  <InfoRow
                    icon={<Hash className="size-4" />}
                    label={t("form.brand")}
                    value={asset.brand}
                  />
                  <InfoRow
                    icon={<Hash className="size-4" />}
                    label={t("form.model")}
                    value={asset.model}
                  />
                  <InfoRow
                    icon={<Hash className="size-4" />}
                    label={t("form.serialNumber")}
                    value={asset.serialNumber}
                  />
                </div>
              </div>

              <Separator />

              {/* Dates */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                  {t("detail.dates")}
                </p>
                <div className="flex flex-col gap-3">
                  <InfoRow
                    icon={<CalendarDays className="size-4" />}
                    label={t("table.installedAt")}
                    value={
                      asset.installedAt
                        ? format(new Date(asset.installedAt), "dd/MM/yyyy")
                        : undefined
                    }
                  />
                  <InfoRow
                    icon={<CalendarDays className="size-4" />}
                    label={t("table.warrantyUntil")}
                    value={
                      asset.warrantyUntil
                        ? format(new Date(asset.warrantyUntil), "dd/MM/yyyy")
                        : undefined
                    }
                  />
                  <InfoRow
                    icon={<CalendarDays className="size-4" />}
                    label={t("table.createdAt")}
                    value={
                      asset.createdAt
                        ? format(new Date(asset.createdAt), "dd/MM/yyyy HH:mm")
                        : undefined
                    }
                  />
                </div>
              </div>

              {asset.description && (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                      {t("form.description")}
                    </p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {asset.description}
                    </p>
                  </div>
                </>
              )}
            </div>
          </TabsContent>

          {/* Maintenance tab */}
          <TabsContent value="maintenance" className="flex-1 overflow-y-auto mt-0">
            <MaintenanceTab assetId={asset.id} canEdit={canEdit} />
          </TabsContent>

          {/* Checklist */}
          <TabsContent value="checklist" className="flex-1 overflow-y-auto mt-0 px-6 py-4">
            <ChecklistTab assetId={asset.id} canEdit={!!canEdit} />
          </TabsContent>

          {/* Fire safety */}
          <TabsContent value="fire" className="flex-1 overflow-y-auto mt-0 px-6 py-4">
            <FireSafetyTab assetId={asset.id} canEdit={!!canEdit} />
          </TabsContent>

          {/* Work tab */}
          <TabsContent value="work" className="flex-1 overflow-y-auto mt-0 px-6 py-4">
            <WorkTab assetId={asset.id} canEdit canApprove={canEdit} />
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
