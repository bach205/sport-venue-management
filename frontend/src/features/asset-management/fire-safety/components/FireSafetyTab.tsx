import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Separator } from "@/shared/components/ui/separator";
import { FireOverviewStats } from "./FireOverviewStats";
import { FireEquipmentList } from "./FireEquipmentList";
import { FireEquipmentForm } from "./FireEquipmentForm";
import { FireEquipmentDetail } from "./FireEquipmentDetail";
import { useFireEquipments } from "../hooks/useFireSafety";
import { toast } from "sonner";
import type { FireEquipment, CreateFireEquipmentRequest } from "../types/fireSafetyTypes";

interface FireSafetyTabProps {
  assetId: string;
  canEdit: boolean;
}

export function FireSafetyTab({ assetId, canEdit }: FireSafetyTabProps) {
  const { t } = useTranslation("fireSafety");
  const {
    equipments,
    overview,
    isLoading,
    refetch,
    createEquipment,
    updateEquipment,
    deleteEquipment,
  } = useFireEquipments({ assetId });

  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<FireEquipment | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  function openAdd() {
    setEditTarget(null);
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

  const expiringSoon = equipments.filter((e) => e.status === "EXPIRING_SOON");
  const expired = equipments.filter((e) => e.status === "EXPIRED");

  return (
    <div className="flex flex-col gap-6 py-1">
      {/* Overview */}
      <div className="flex flex-col gap-3">
        <p className="text-sm font-semibold">{t("section.overview")}</p>
        <FireOverviewStats overview={overview} isLoading={isLoading} />
      </div>

      <Separator />

      {/* Full equipment list */}
      <FireEquipmentList
        equipments={equipments}
        isLoading={isLoading}
        canEdit={canEdit}
        onRowClick={openDetail}
        onAddClick={openAdd}
      />

      {/* Expiring soon */}
      {expiringSoon.length > 0 && (
        <>
          <Separator />
          <div className="flex flex-col gap-3">
            <p className="text-sm font-semibold text-amber-600">{t("section.expiringSoon")}</p>
            <FireEquipmentList
              equipments={expiringSoon}
              isLoading={false}
              canEdit={false}
              onRowClick={openDetail}
              onAddClick={() => {}}
            />
          </div>
        </>
      )}

      {/* Expired */}
      {expired.length > 0 && (
        <>
          <Separator />
          <div className="flex flex-col gap-3">
            <p className="text-sm font-semibold text-red-600">{t("section.expired")}</p>
            <FireEquipmentList
              equipments={expired}
              isLoading={false}
              canEdit={false}
              onRowClick={openDetail}
              onAddClick={() => {}}
            />
          </div>
        </>
      )}

      <FireEquipmentForm
        open={formOpen}
        onOpenChange={setFormOpen}
        equipment={editTarget}
        assetId={assetId}
        onSubmit={handleFormSubmit}
      />

      <FireEquipmentDetail
        equipmentId={detailId}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        canEdit={canEdit}
        onEdit={openEdit}
        onDelete={handleDelete}
      />
    </div>
  );
}
