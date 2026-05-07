import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Building2,
  CalendarClock,
  Download,
  FileUp,
  FilterX,
  Layers,
  Plus,
  ShieldCheck,
  Wrench,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Separator } from "@/shared/components/ui/separator";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { useBuildings } from "../hooks/useBuildings";
import { useAssets } from "../hooks/useAssets";
import { BuildingRow } from "../components/BuildingRow";
import { UnitAssetsModal } from "../components/UnitAssetsModal";
import { AssetDetailPanel } from "../components/AssetDetailPanel";
import { AssetForm } from "../components/AssetForm";
import { AssetImportDialog } from "../components/AssetImportDialog";
import { AssetDeleteConfirm } from "../components/AssetDeleteConfirm";
import { assetApi } from "../api/assetApi";
import { ASSET_TYPES, type Asset, type AssetFilterState } from "../types/assetTypes";
import type { AssetFormValues } from "../utils/validateAsset";
import { isAdmin } from "@/features/asset-management/shared/maintenanceWorkspace";

const EMPTY_FILTERS: AssetFilterState = {
  buildingId: "",
  assetType: "all",
  status: "all",
  ownershipScope: "all",
  search: "",
};

export function AssetManagementPage() {
  const { t } = useTranslation("assets");

  const { buildings, isLoading: buildingsLoading } = useBuildings();
  const [filters, setFilters] = useState<AssetFilterState>(EMPTY_FILTERS);
  const { assets, isLoading, createAsset, updateAsset, deleteAsset, refetch } = useAssets(filters);

  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [formPrefill, setFormPrefill] = useState<Partial<AssetFormValues> | undefined>();
  const [importOpen, setImportOpen] = useState(false);
  const [deletingAsset, setDeletingAsset] = useState<Asset | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const [expandedBuildings, setExpandedBuildings] = useState<Set<string>>(new Set());
  const [expandedFloors, setExpandedFloors] = useState<Set<string>>(new Set());

  const [unitModalOpen, setUnitModalOpen] = useState(false);
  const [selectedUnitCode, setSelectedUnitCode] = useState("");
  const [selectedUnitAssets, setSelectedUnitAssets] = useState<Asset[]>([]);

  const assetsByBuilding = useMemo(
    () =>
      assets.reduce<Record<string, Asset[]>>((acc, asset) => {
        if (!acc[asset.buildingId]) acc[asset.buildingId] = [];
        acc[asset.buildingId].push(asset);
        return acc;
      }, {}),
    [assets]
  );

  const visibleBuildings = useMemo(
    () =>
      filters.buildingId
        ? buildings.filter((building) => building.id === filters.buildingId)
        : buildings,
    [buildings, filters.buildingId]
  );

  const stats = useMemo(() => {
    const total = assets.length;
    const active = assets.filter((asset) => asset.active).length;
    const common = assets.filter((asset) => asset.ownershipScope !== "PRIVATE").length;
    const expiredWarranty = assets.filter(
      (asset) => asset.warrantyUntil && new Date(asset.warrantyUntil) < new Date()
    ).length;

    return {
      total,
      active,
      common,
      inactive: total - active,
      private: total - common,
      expiredWarranty,
    };
  }, [assets]);

  const updateFilter = <K extends keyof AssetFilterState>(key: K, value: AssetFilterState[K]) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const resetFilters = () => setFilters(EMPTY_FILTERS);

  const toggleBuilding = (id: string) => {
    setExpandedBuildings((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleFloor = (key: string) => {
    setExpandedFloors((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const expandTree = () => {
    const buildingIds = visibleBuildings.map((building) => building.id);
    const floorKeys = visibleBuildings.flatMap((building) => {
      const buildingAssets = assetsByBuilding[building.id] ?? [];
      return Array.from(new Set(buildingAssets.map((asset) => asset.floor ?? "â€”"))).map(
        (floor) => `${building.id}-${floor}`
      );
    });

    setExpandedBuildings(new Set(buildingIds));
    setExpandedFloors(new Set(floorKeys));
  };

  const collapseTree = () => {
    setExpandedBuildings(new Set());
    setExpandedFloors(new Set());
  };

  const handleUnitClick = (unitCode: string, unitAssets: Asset[]) => {
    setSelectedUnitCode(unitCode);
    setSelectedUnitAssets(unitAssets);
    setUnitModalOpen(true);
  };

  const handleAssetDetailClick = (asset: Asset) => {
    setSelectedAsset(asset);
    setDetailOpen(true);
    setUnitModalOpen(false);
  };

  const handleAddAsset = (prefill?: Partial<AssetFormValues>) => {
    setEditingAsset(null);
    setFormPrefill(prefill);
    setFormOpen(true);
  };

  const handleEdit = (asset: Asset) => {
    setEditingAsset(asset);
    setFormPrefill(undefined);
    setFormOpen(true);
  };

  const handleDeleteClick = (asset: Asset) => {
    setDeletingAsset(asset);
    setDeleteOpen(true);
  };

  const handleFormSubmit = async (values: AssetFormValues) => {
    try {
      if (editingAsset) {
        await updateAsset(editingAsset.id, values);
        toast.success(t("messages.updateSuccess"));
      } else {
        await createAsset(values);
        toast.success(t("messages.createSuccess"));
      }
    } catch {
      toast.error(editingAsset ? t("messages.updateError") : t("messages.createError"));
      throw new Error("submit failed");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingAsset) return;
    try {
      await deleteAsset(deletingAsset.id);
      toast.success(t("messages.deleteSuccess"));
      if (selectedAsset?.id === deletingAsset.id) setDetailOpen(false);
    } catch {
      toast.error(t("messages.deleteError"));
      throw new Error("delete failed");
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const exportParams: Record<string, string> = {};
      if (filters.buildingId) exportParams.buildingId = filters.buildingId;
      if (filters.assetType !== "all") exportParams.assetType = filters.assetType;
      if (filters.status !== "all") exportParams.status = filters.status;
      if (filters.ownershipScope !== "all") exportParams.ownershipScope = filters.ownershipScope;

      const res = await assetApi.exportAssets(exportParams);
      const url = URL.createObjectURL(new Blob([res.data as BlobPart]));
      const a = document.createElement("a");
      a.href = url;
      a.download = "assets-export.xlsx";
      a.click();
      URL.revokeObjectURL(url);
      toast.success(t("messages.exportSuccess"));
    } catch {
      toast.error(t("messages.exportError"));
    } finally {
      setIsExporting(false);
    }
  };

  const loadingTree = isLoading || buildingsLoading;

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="flex max-w-3xl flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={isAdmin ? "default" : "secondary"}>
              {isAdmin ? "Admin" : "Kỹ thuật"}
            </Badge>
            <Badge variant="outline">Tree tài sản</Badge>
          </div>
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
            <p className="text-sm text-muted-foreground">
              {t("description")}. Từ cây tài sản có thể mở lịch bảo trì, checklist, PCCC và công tác
              bảo trì của từng thiết bị.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link to="/asset-management/maintenance-dashboard">
              <CalendarClock data-icon="inline-start" />
              Dashboard bảo trì
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/asset-management/maintenance-work">
              <Wrench data-icon="inline-start" />
              Công tác bảo trì
            </Link>
          </Button>
          {isAdmin && (
            <>
              <Button variant="outline" onClick={() => setImportOpen(true)}>
                <FileUp data-icon="inline-start" />
                {t("actions.import")}
              </Button>
              <Button variant="outline" onClick={handleExport} disabled={isExporting}>
                <Download data-icon="inline-start" />
                {t("actions.export")}
              </Button>
              <Button onClick={() => handleAddAsset()}>
                <Plus data-icon="inline-start" />
                {t("actions.create")}
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title={t("stats.total")}
          value={stats.total}
          description={`${stats.active} ${t("status.active").toLowerCase()}`}
          icon={<Building2 className="text-muted-foreground" />}
        />
        <MetricCard
          title={t("ownershipScope.COMMON")}
          value={stats.common}
          description={`${stats.private} ${t("ownershipScope.PRIVATE").toLowerCase()}`}
          icon={<Layers className="text-muted-foreground" />}
        />
        <MetricCard
          title={t("stats.expiredWarranty")}
          value={stats.expiredWarranty}
          description="Cần rà soát trước khi giao việc"
          icon={<ShieldCheck className="text-muted-foreground" />}
        />
        <MetricCard
          title="Ngừng hoạt động"
          value={stats.inactive}
          description="Ưu tiên kiểm tra tình trạng"
          icon={<Wrench className="text-muted-foreground" />}
        />
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-5">
            <Input
              value={filters.search}
              onChange={(event) => updateFilter("search", event.target.value)}
              placeholder={t("filter.searchPlaceholder")}
              className="xl:col-span-2"
            />
            <Select
              value={filters.buildingId || "all"}
              onValueChange={(value) => updateFilter("buildingId", value === "all" ? "" : value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t("filter.allBuildings")} />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all">{t("filter.allBuildings")}</SelectItem>
                  {buildings.map((building) => (
                    <SelectItem key={building.id} value={building.id}>
                      {building.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <Select
              value={filters.assetType}
              onValueChange={(value) => updateFilter("assetType", value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t("filter.allTypes")} />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all">{t("filter.allTypes")}</SelectItem>
                  {ASSET_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {t(`assetType.${type}`, { defaultValue: type })}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <Select value={filters.status} onValueChange={(value) => updateFilter("status", value)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t("filter.allStatuses")} />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all">{t("filter.allStatuses")}</SelectItem>
                  <SelectItem value="active">{t("status.active")}</SelectItem>
                  <SelectItem value="inactive">{t("status.inactive")}</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={resetFilters}>
              <FilterX data-icon="inline-start" />
              Xóa lọc
            </Button>
            <Button variant="outline" onClick={expandTree}>
              Mở cây
            </Button>
            <Button variant="outline" onClick={collapseTree}>
              Thu cây
            </Button>
          </div>
        </div>

        <Separator />

        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium">Cây tài sản theo tòa nhà</p>
            <p className="text-sm text-muted-foreground">
              Admin quản lý dữ liệu gốc, kỹ thuật mở chi tiết để cập nhật bảo trì và lịch sử thiết
              bị.
            </p>
          </div>
          <Badge variant="secondary">{assets.length} tài sản</Badge>
        </div>

        <div className="flex flex-col gap-2">
          {loadingTree ? (
            [1, 2, 3].map((item) => <Skeleton key={item} className="h-14 w-full rounded-lg" />)
          ) : visibleBuildings.length === 0 ? (
            <div className="rounded-lg border border-dashed p-10 text-center">
              <Building2 className="mx-auto size-10 text-muted-foreground" />
              <p className="mt-3 text-sm text-muted-foreground">{t("tree.noBuildings")}</p>
            </div>
          ) : (
            visibleBuildings.map((building) => (
              <BuildingRow
                key={building.id}
                building={building}
                assets={assetsByBuilding[building.id] ?? []}
                expanded={expandedBuildings.has(building.id)}
                onToggle={() => toggleBuilding(building.id)}
                expandedFloors={expandedFloors}
                onToggleFloor={toggleFloor}
                onUnitClick={handleUnitClick}
                onAddAsset={isAdmin ? handleAddAsset : undefined}
              />
            ))
          )}
        </div>
      </div>

      <UnitAssetsModal
        open={unitModalOpen}
        onOpenChange={setUnitModalOpen}
        unitCode={selectedUnitCode}
        assets={selectedUnitAssets}
        onAssetClick={handleAssetDetailClick}
        canEdit={isAdmin}
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
        onAddAsset={isAdmin ? handleAddAsset : undefined}
      />

      <AssetDetailPanel
        asset={selectedAsset}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        canEdit={isAdmin}
      />

      <AssetForm
        open={formOpen}
        onOpenChange={setFormOpen}
        asset={editingAsset}
        buildings={buildings}
        onSubmit={handleFormSubmit}
        prefill={formPrefill}
      />

      <AssetImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        buildings={buildings}
        onSuccess={refetch}
      />

      <AssetDeleteConfirm
        asset={deletingAsset}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}

function MetricCard({
  title,
  value,
  description,
  icon,
}: {
  title: string;
  value: number;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <Card size="sm">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-1">
            <CardTitle className="text-sm">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <div className="shrink-0">{icon}</div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold tabular-nums">{value}</p>
      </CardContent>
    </Card>
  );
}
