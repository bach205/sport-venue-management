import { useState } from "react";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { Plus, MoreHorizontal, Pencil, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Skeleton } from "@/shared/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { cn } from "@/shared/utils/cn";
import { ScheduleForm } from "./ScheduleForm";
import type {
  MaintenanceSchedule,
  CreateScheduleRequest,
  UpdateScheduleRequest,
} from "../types/maintenanceTypes";

interface ScheduleListProps {
  assetId: string;
  schedules: MaintenanceSchedule[];
  isLoading: boolean;
  canEdit: boolean;
  onCreate: (data: CreateScheduleRequest) => Promise<void>;
  onUpdate: (id: string, data: UpdateScheduleRequest) => Promise<void>;
  onToggle: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function ScheduleList({
  assetId,
  schedules,
  isLoading,
  canEdit,
  onCreate,
  onUpdate,
  onToggle,
  onDelete,
}: ScheduleListProps) {
  const { t } = useTranslation("maintenanceSchedules");
  const [formOpen, setFormOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<MaintenanceSchedule | null>(null);

  function handleEdit(schedule: MaintenanceSchedule) {
    setEditingSchedule(schedule);
    setFormOpen(true);
  }

  function handleCreate() {
    setEditingSchedule(null);
    setFormOpen(true);
  }

  async function handleSubmit(values: CreateScheduleRequest) {
    if (editingSchedule) {
      const { assetId: _, ...rest } = values;
      await onUpdate(editingSchedule.id, rest);
    } else {
      await onCreate(values);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">{t("section.schedules")}</p>
        {canEdit && (
          <Button size="sm" variant="outline" onClick={handleCreate} className="gap-1.5">
            <Plus className="size-3.5" />
            {t("actions.create")}
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : schedules.length === 0 ? (
        <div className="flex items-center justify-center py-8 text-sm text-muted-foreground border border-dashed rounded-lg">
          {t("section.schedulesEmpty")}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {schedules.map((schedule) => (
            <ScheduleCard
              key={schedule.id}
              schedule={schedule}
              canEdit={canEdit}
              onEdit={() => handleEdit(schedule)}
              onToggle={() => onToggle(schedule.id)}
              onDelete={() => onDelete(schedule.id)}
              t={t}
            />
          ))}
        </div>
      )}

      <ScheduleForm
        open={formOpen}
        onOpenChange={setFormOpen}
        schedule={editingSchedule}
        assetId={assetId}
        onSubmit={handleSubmit}
      />
    </div>
  );
}

interface ScheduleCardProps {
  schedule: MaintenanceSchedule;
  canEdit: boolean;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
  t: ReturnType<typeof useTranslation>["t"];
}

function ScheduleCard({ schedule, canEdit, onEdit, onToggle, onDelete, t }: ScheduleCardProps) {
  const nextDate = schedule.nextMaintenanceDate
    ? (() => {
        try {
          return format(new Date(schedule.nextMaintenanceDate), "dd/MM/yyyy");
        } catch {
          return schedule.nextMaintenanceDate;
        }
      })()
    : null;

  const isOverdue =
    schedule.nextMaintenanceDate && new Date(schedule.nextMaintenanceDate) < new Date();

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg border border-border px-4 py-3 bg-card",
        !schedule.isActive && "opacity-60"
      )}
    >
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium truncate">{schedule.name}</span>
          <Badge
            className={cn(
              "rounded-full text-xs shrink-0",
              schedule.isActive
                ? "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400"
                : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
            )}
          >
            {schedule.isActive ? t("status.active") : t("status.inactive")}
          </Badge>
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
          <span>
            {t(`maintenanceType.${schedule.maintenanceType}`, {
              defaultValue: schedule.maintenanceType,
            })}
          </span>
          <span>·</span>
          <span>{t("schedule.every", { count: schedule.intervalDays })}</span>
          {nextDate && (
            <>
              <span>·</span>
              <span className={cn(isOverdue && "text-red-500 font-medium")}>
                {t("schedule.nextOn")} {nextDate}
              </span>
            </>
          )}
        </div>

        {schedule.assignedToName && (
          <p className="text-xs text-muted-foreground">
            {t("schedule.assignedTo")}: {schedule.assignedToName}
          </p>
        )}
      </div>

      {canEdit && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-7 shrink-0">
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>
              <Pencil className="size-3.5 mr-2" />
              {t("actions.edit")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onToggle}>
              {schedule.isActive ? (
                <ToggleLeft className="size-3.5 mr-2" />
              ) : (
                <ToggleRight className="size-3.5 mr-2" />
              )}
              {schedule.isActive ? t("actions.deactivate") : t("actions.activate")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={onDelete}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="size-3.5 mr-2" />
              {t("actions.delete")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
