import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Separator } from "@/shared/components/ui/separator";
import { AssignmentList } from "./AssignmentList";
import { AssignmentForm } from "./AssignmentForm";
import { ExecutionPanel } from "./ExecutionPanel";
import { ReportSection } from "./ReportSection";
import {
  useChecklistsByAsset,
  useMyAssignments,
  useTemplates,
  useAssignmentCreate,
} from "../hooks/useChecklists";
import { toast } from "sonner";
import type { ChecklistAssignment, CreateAssignmentRequest } from "../types/checklistTypes";

interface ChecklistTabProps {
  assetId: string;
  canEdit: boolean;
}

export function ChecklistTab({ assetId, canEdit }: ChecklistTabProps) {
  const { t } = useTranslation("technicalChecklists");
  const {
    assignments: assetAssignments,
    isLoading: assetLoading,
    refetch: refetchAsset,
  } = useChecklistsByAsset(assetId);
  const { assignments: myAssignments, isLoading: myLoading } = useMyAssignments();
  const { templates } = useTemplates();
  const { create } = useAssignmentCreate();

  const [assignFormOpen, setAssignFormOpen] = useState(false);
  const [executionId, setExecutionId] = useState<string | null>(null);
  const [executionOpen, setExecutionOpen] = useState(false);

  function openExecution(a: ChecklistAssignment) {
    setExecutionId(a.id);
    setExecutionOpen(true);
  }

  async function handleAssign(values: CreateAssignmentRequest) {
    try {
      await create({ ...values, assetId });
      toast.success(t("messages.assignSuccess"));
      refetchAsset();
    } catch {
      toast.error(t("messages.assignError"));
    }
  }

  return (
    <div className="flex flex-col gap-6 py-1">
      {/* Asset checklists */}
      <AssignmentList
        assignments={assetAssignments}
        isLoading={assetLoading}
        canAdmin={canEdit}
        onRowClick={openExecution}
        onAssignClick={() => setAssignFormOpen(true)}
        emptyLabel={t("section.assetChecklistsEmpty")}
      />

      <Separator />

      {/* My checklists */}
      <div className="flex flex-col gap-3">
        <p className="text-sm font-semibold">{t("section.myChecklists")}</p>
        <AssignmentList
          assignments={myAssignments.filter((a) => a.assetId === assetId)}
          isLoading={myLoading}
          canAdmin={false}
          onRowClick={openExecution}
          onAssignClick={() => {}}
          emptyLabel={t("section.myChecklistsEmpty")}
        />
      </div>

      {/* Report */}
      {canEdit && (
        <>
          <Separator />
          <div className="flex flex-col gap-3">
            <p className="text-sm font-semibold">{t("section.report")}</p>
            <ReportSection assetId={assetId} />
          </div>
        </>
      )}

      <AssignmentForm
        open={assignFormOpen}
        onOpenChange={setAssignFormOpen}
        templates={templates}
        assetId={assetId}
        onSubmit={handleAssign}
      />

      <ExecutionPanel
        assignmentId={executionId}
        open={executionOpen}
        onOpenChange={setExecutionOpen}
        isAdmin={canEdit}
      />
    </div>
  );
}
