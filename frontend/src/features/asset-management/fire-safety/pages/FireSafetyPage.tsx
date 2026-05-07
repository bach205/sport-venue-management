import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Building2, Search, Download } from "lucide-react";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Separator } from "@/shared/components/ui/separator";
import { FireOverviewStats } from "../components/FireOverviewStats";
import { FireBuildingRow } from "../components/FireBuildingRow";
import { FireEquipmentForm } from "../components/FireEquipmentForm";
import { FireEquipmentDetail } from "../components/FireEquipmentDetail";
import { useFireEquipments } from "../hooks/useFireSafety";
import { useBuildings } from "../../assets/hooks/useBuildings";
import { fireSafetyApi } from "../api/fireSafetyApi";
import { toast } from "sonner";
import type {
  FireEquipment,
  FireSafetyStatus,
  CreateFireEquipmentRequest,
} from "../types/fireSafetyTypes";

const STATUSES: FireSafetyStatus[] = ["VALID", "EXPIRING_SOON", "EXPIRED"];

export function FireSafetyPage() {
  const { t } = useTranslation("fireSafety");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");

  const {
    equipments,
    overview,
    isLoading,
    refetch,
    createEquipment,
    updateEquipment,
    deleteEquipment,
  } = useFireEquipments(statusFilter !== "ALL" ? { status: statusFilter } : undefined);

  const { buildings } = useBuildings();

  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<FireEquipment | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [defaultBuildingId, setDefaultBuildingId] = useState<string>("");

  // Tree accordion state
  const [expandedBuildings, setExpandedBuildings] = useState<Set<string>>(new Set());

  const toggleBuilding = (id: string) => {
    setExpandedBuildings((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const equipmentTypes = [...new Set(equipments.map((e) => e.equipmentType).filter(Boolean))];

  const filtered = equipments.filter((e) => {
    const matchSearch =
      !search ||
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.equipmentType.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "ALL" || e.equipmentType === typeFilter;
    return matchSearch && matchType;
  });

  // Group filtered equipments by buildingId for tree rendering
  const equipmentsByBuilding = filtered.reduce<Record<string, FireEquipment[]>>((acc, eq) => {
    const key = eq.buildingId ?? "__unknown__";
    if (!acc[key]) acc[key] = [];
    acc[key].push(eq);
    return acc;
  }, {});

  function openAdd(buildingId: string) {
    setEditTarget(null);
    setDefaultBuildingId(buildingId); // thêm state này
    setFormOpen(true);
  }

  function openEdit(eq: FireEquipment) {
    setEditTarget(eq);
    setDetailOpen(false);
    setFormOpen(true);
  }
  function openDetail(eq: FireEquipment) {
    setDetailId(eq.id);
    setDetailOpen(true);
  }

  async function handleFormSubmit(values: CreateFireEquipmentRequest) {
    try {
      if (editTarget) {
        await updateEquipment(editTarget.id, values);
        toast.success(t("messages.updateSuccess"));
      } else {
        await createEquipment(values);
        toast.success(t("messages.createSuccess"));
      }
    } catch {
      toast.error(editTarget ? t("messages.updateError") : t("messages.createError"));
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteEquipment(id);
      toast.success(t("messages.deleteSuccess"));
      refetch();
    } catch {
      toast.error(t("messages.deleteError"));
    }
  }

  async function handleExport() {
    setIsExporting(true);
    try {
      const blob = await fireSafetyApi.exportReport({
        status: statusFilter !== "ALL" ? statusFilter : undefined,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "fire-safety-report.xlsx";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error(t("messages.exportError"));
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-xl font-semibold">{t("page.title")}</h1>
        <Button
          size="sm"
          variant="outline"
          onClick={handleExport}
          disabled={isExporting}
          className="gap-1.5"
        >
          <Download className="size-4" />
          {t("actions.export")}
        </Button>
      </div>

      {/* Overview stats */}
      <FireOverviewStats overview={overview} isLoading={isLoading} />

      <Separator />

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("filters.search")}
            className="pl-9"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder={t("filters.type")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{t("filters.allTypes")}</SelectItem>
            {equipmentTypes.map((tp) => (
              <SelectItem key={tp} value={tp}>
                {tp}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder={t("filters.status")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{t("filters.allStatuses")}</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {t(`status.${s}`, { defaultValue: s })}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Building Tree */}
      <div className="flex flex-col gap-2">
        {isLoading ? (
          <div className="flex flex-col gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 rounded-lg border border-border bg-card animate-pulse" />
            ))}
          </div>
        ) : buildings.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-12 text-center">
            <Building2 className="size-10 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">{t("tree.noBuildings")}</p>
          </div>
        ) : (
          buildings.map((building) => (
            <FireBuildingRow
              key={building.id}
              building={building}
              equipments={equipmentsByBuilding[building.id] ?? []}
              expanded={expandedBuildings.has(building.id)}
              onToggle={() => toggleBuilding(building.id)}
              onEquipmentClick={openDetail}
              canEdit
              onAddClick={openAdd}
            />
          ))
        )}
      </div>

      <FireEquipmentForm
        open={formOpen}
        onOpenChange={setFormOpen}
        equipment={editTarget}
        defaultBuildingId={defaultBuildingId}
        onSubmit={handleFormSubmit}
      />

      <FireEquipmentDetail
        equipmentId={detailId}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        canEdit
        onEdit={openEdit}
        onDelete={handleDelete}
      />
    </div>
  );
}
