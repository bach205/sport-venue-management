import { useState } from "react";
import { useTranslation } from "react-i18next";
import { WorkList } from "./WorkList";
import { WorkForm } from "./WorkForm";
import { WorkDetailPanel } from "./WorkDetailPanel";
import { useWorkByAsset } from "../hooks/useMaintenanceWork";
import { toast } from "sonner";
import type { MaintenanceWork, CreateWorkRequest } from "../types/workTypes";
import {
  currentEmployeeId,
  maintenanceTechnicians,
} from "@/features/asset-management/shared/maintenanceWorkspace";

interface WorkTabProps {
  assetId: string;
  canEdit: boolean;
  canApprove?: boolean;
}

export function WorkTab({ assetId, canEdit, canApprove = canEdit }: WorkTabProps) {
  const { t } = useTranslation("maintenanceTasks");
  const { works, isLoading, createWork } = useWorkByAsset(assetId);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const selectedWork = works.find((work) => work.id === selectedId);
  const canUpdateSelected =
    canEdit && (canApprove || selectedWork?.assignedTo === currentEmployeeId);

  function handleRowClick(work: MaintenanceWork) {
    setSelectedId(work.id);
    setDetailOpen(true);
  }

  async function handleCreate(values: CreateWorkRequest) {
    try {
      await createWork(values);
      toast.success(t("messages.createSuccess"));
    } catch {
      toast.error(t("messages.createError"));
      throw new Error("create failed");
    }
  }

  return (
    <>
      <WorkList
        works={works}
        isLoading={isLoading}
        onRowClick={handleRowClick}
        onCreateClick={() => setFormOpen(true)}
        canEdit={canApprove}
      />

      <WorkForm
        open={formOpen}
        onOpenChange={setFormOpen}
        assetId={assetId}
        technicians={maintenanceTechnicians}
        onSubmit={handleCreate}
      />

      <WorkDetailPanel
        workId={selectedId}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        canEdit={canUpdateSelected}
        canApprove={canApprove}
      />
    </>
  );
}
