import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import {
  ClipboardList,
  ChevronRight,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Pencil,
  Trash2,
} from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/utils/cn";
import type { ChecklistAssignment, ChecklistStatus } from "../types/checklistTypes";

interface AssignmentListProps {
  assignments: ChecklistAssignment[];
  isLoading: boolean;
  canAdmin: boolean;
  onRowClick: (a: ChecklistAssignment) => void;
  onAssignClick?: () => void;
  onEdit?: (a: ChecklistAssignment) => void;
  onDelete?: (a: ChecklistAssignment) => void;
  emptyLabel?: string;
}

export function AssignmentList({
  assignments,
  isLoading,
  canAdmin,
  onRowClick,
  onAssignClick,
  onEdit,
  onDelete,
  emptyLabel,
}: AssignmentListProps) {
  const { t } = useTranslation("technicalChecklists");

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">{t("section.assignments")}</p>
        {canAdmin && onAssignClick && (
          <Button size="sm" variant="outline" onClick={onAssignClick} className="gap-1.5">
            <ClipboardList className="size-3.5" />
            {t("actions.assign")}
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : assignments.length === 0 ? (
        <div className="flex items-center justify-center py-8 text-sm text-muted-foreground border border-dashed rounded-lg">
          {emptyLabel ?? t("section.assignmentsEmpty")}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {assignments.map((a) => (
            <AssignmentCard
              key={a.id}
              assignment={a}
              onClick={() => onRowClick(a)}
              onEdit={canAdmin && onEdit ? () => onEdit(a) : undefined}
              onDelete={canAdmin && onDelete ? () => onDelete(a) : undefined}
              t={t}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function AssignmentCard({
  assignment,
  onClick,
  onEdit,
  onDelete,
  t,
}: {
  assignment: ChecklistAssignment;
  onClick: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  t: ReturnType<typeof useTranslation>["t"];
}) {
  let formattedDue = "";
  try {
    if (assignment.dueDate) formattedDue = format(new Date(assignment.dueDate), "dd/MM/yyyy");
  } catch {
    /* keep empty */
  }

  const isOverdue =
    assignment.status !== "COMPLETED" &&
    assignment.status !== "CANCELLED" &&
    assignment.dueDate &&
    new Date(assignment.dueDate) < new Date();

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-start gap-3 rounded-lg border border-border px-4 py-3 bg-card text-left hover:bg-muted/40 transition-colors w-full"
    >
      <StatusIcon status={assignment.status} isOverdue={!!isOverdue} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium truncate">{assignment.templateName}</span>
          <ChecklistStatusBadge status={assignment.status} t={t} />
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 flex-wrap">
          {assignment.assignedToName && <span>{assignment.assignedToName}</span>}
          {formattedDue && (
            <span className={cn(isOverdue && "text-red-500 font-medium")}>
              {t("list.dueOn")} {formattedDue}
            </span>
          )}
        </div>
      </div>
      <ChevronRight className="size-4 text-muted-foreground shrink-0 mt-0.5" />
      {(onEdit || onDelete) && (
        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
          {onEdit && (
            <Button
              size="icon"
              variant="ghost"
              className="size-7"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
            >
              <Pencil className="size-3.5" />
            </Button>
          )}
          {onDelete && (
            <Button
              size="icon"
              variant="ghost"
              className="size-7 text-destructive hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              <Trash2 className="size-3.5" />
            </Button>
          )}
        </div>
      )}
    </button>
  );
}

function StatusIcon({ status, isOverdue }: { status: ChecklistStatus; isOverdue: boolean }) {
  if (isOverdue) {
    return <AlertTriangle className="size-4 text-red-500 mt-0.5 shrink-0" />;
  }

  const commonClass = "size-4 mt-0.5 shrink-0";

  switch (status) {
    case "COMPLETED":
      return <CheckCircle2 className={`${commonClass} text-teal-500`} />;
    case "IN_PROGRESS":
      return <Clock className={`${commonClass} text-blue-500`} />;
    case "PENDING_REVIEW":
      return <Clock className={`${commonClass} text-orange-500`} />;
    default:
      return <ClipboardList className={`${commonClass} text-muted-foreground`} />;
  }
}

export function ChecklistStatusBadge({
  status,
  t,
}: {
  status: ChecklistStatus;
  t: ReturnType<typeof useTranslation>["t"];
}) {
  const classes: Partial<Record<ChecklistStatus, string>> = {
    PENDING: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
    ASSIGNED: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    IN_PROGRESS: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
    COMPLETED: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
    OVERDUE: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    CANCELLED: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
    PENDING_REVIEW: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  };
  return (
    <Badge className={cn("rounded-full text-xs shrink-0", classes[status] ?? "")}>
      {t(`checklistStatus.${status}`, { defaultValue: status })}
    </Badge>
  );
}
