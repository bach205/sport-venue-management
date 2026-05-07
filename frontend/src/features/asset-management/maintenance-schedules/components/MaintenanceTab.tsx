import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Separator } from "@/shared/components/ui/separator";
import { useMaintenanceSchedules } from "../hooks/useMaintenanceSchedules";
import { useMaintenanceRecords } from "../hooks/useMaintenanceRecords";
import { ScheduleList } from "./ScheduleList";
import { UpcomingWidget } from "./UpcomingWidget";
import { RecordHistory } from "./RecordHistory";

interface MaintenanceTabProps {
  assetId: string;
  canEdit: boolean;
}

export function MaintenanceTab({ assetId, canEdit }: MaintenanceTabProps) {
  const { t } = useTranslation("maintenanceSchedules");

  const {
    schedules,
    isLoading: schedulesLoading,
    createSchedule,
    updateSchedule,
    toggleSchedule,
    deleteSchedule,
  } = useMaintenanceSchedules(assetId);

  const { records, isLoading: recordsLoading } = useMaintenanceRecords(assetId);

  async function handleCreate(data: Parameters<typeof createSchedule>[0]) {
    try {
      await createSchedule(data);
      toast.success(t("messages.createSuccess"));
    } catch {
      toast.error(t("messages.createError"));
    }
  }

  async function handleUpdate(id: string, data: Parameters<typeof updateSchedule>[1]) {
    try {
      await updateSchedule(id, data);
      toast.success(t("messages.updateSuccess"));
    } catch {
      toast.error(t("messages.updateError"));
    }
  }

  async function handleToggle(id: string) {
    try {
      await toggleSchedule(id);
    } catch {
      toast.error(t("messages.toggleError"));
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteSchedule(id);
      toast.success(t("messages.deleteSuccess"));
    } catch {
      toast.error(t("messages.deleteError"));
    }
  }

  return (
    <div className="flex flex-col gap-6 px-6 py-5">
      {/* Section 1: Schedule list */}
      <ScheduleList
        assetId={assetId}
        schedules={schedules}
        isLoading={schedulesLoading}
        canEdit={canEdit}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
        onToggle={handleToggle}
        onDelete={handleDelete}
      />

      <Separator />

      {/* Section 2: Upcoming */}
      <UpcomingWidget schedules={schedules} isLoading={schedulesLoading} />

      <Separator />

      {/* Section 3: History */}
      <RecordHistory records={records} isLoading={recordsLoading} />
    </div>
  );
}
