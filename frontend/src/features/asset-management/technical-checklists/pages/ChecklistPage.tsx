import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Search } from "lucide-react";
import { Input } from "@/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { AssignmentList } from "../components/AssignmentList";
import { AssignmentForm } from "../components/AssignmentForm";
import { ExecutionPanel } from "../components/ExecutionPanel";
import { ReportSection } from "../components/ReportSection";
import { TemplateList } from "../components/TemplateList";
import { TemplateForm } from "../components/TemplateForm";
import { useAllAssignments, useTemplates, useAssignmentCreate } from "../hooks/useChecklists";
import { Separator } from "@/shared/components/ui/separator";
import { toast } from "sonner";
import type {
  ChecklistAssignment,
  ChecklistStatus,
  ChecklistTemplate,
  CreateAssignmentRequest,
  CreateTemplateRequest,
} from "../types/checklistTypes";
import { DeleteTemplateDialog } from "../components/DeleteTemplateDialog";
import { DeleteAssignmentDialog } from "../components/DeleteAssignmentDialog";

// TODO: thay bằng useAuth() sau khi có auth
const CURRENT_USER_ID = "u1";
const IS_ADMIN = true; // false = kỹ thuật viên, true = admin

const STATUSES: ChecklistStatus[] = [
  "PENDING",
  "ASSIGNED",
  "IN_PROGRESS",
  "PENDING_REVIEW",
  "COMPLETED",
  "OVERDUE",
  "CANCELLED",
];

export function ChecklistPage() {
  const { t } = useTranslation("technicalChecklists");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const { assignments, isLoading, refetch, updateAssignment, deleteAssignment } = useAllAssignments(
    status !== "ALL" ? { status } : undefined
  );
  const {
    templates,
    isLoading: templatesLoading,
    createTemplate,
    updateTemplate,
    deleteTemplate,
  } = useTemplates();
  const { create } = useAssignmentCreate();

  // Assignment form state
  const [assignFormOpen, setAssignFormOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<ChecklistAssignment | null>(null);
  const [deletingAssignment, setDeletingAssignment] = useState<ChecklistAssignment | null>(null);

  // Template form state
  const [templateFormOpen, setTemplateFormOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ChecklistTemplate | null>(null);
  const [deletingTemplate, setDeletingTemplate] = useState<ChecklistTemplate | null>(null);

  // Execution panel
  const [executionId, setExecutionId] = useState<string | null>(null);
  const [executionOpen, setExecutionOpen] = useState(false);

  // Kỹ thuật chỉ thấy checklist được phân công cho mình
  const visibleAssignments = IS_ADMIN
    ? assignments
    : assignments.filter((a) => a.assignedTo === CURRENT_USER_ID);

  function openExecution(a: ChecklistAssignment) {
    // Kỹ thuật chỉ được mở checklist của mình
    if (!IS_ADMIN && a.assignedTo !== CURRENT_USER_ID) return;
    setExecutionId(a.id);
    setExecutionOpen(true);
  }

  function openAssignForm() {
    setEditingAssignment(null);
    setAssignFormOpen(true);
  }

  function openEditAssignment(a: ChecklistAssignment) {
    setEditingAssignment(a);
    setAssignFormOpen(true);
  }

  async function handleAssignSubmit(values: CreateAssignmentRequest) {
    try {
      if (editingAssignment) {
        await updateAssignment(editingAssignment.id, values);
        toast.success(t("messages.assignmentUpdated"));
      } else {
        await create(values);
        toast.success(t("messages.assignSuccess"));
        refetch();
      }
    } catch {
      toast.error(
        editingAssignment ? t("messages.assignmentUpdateError") : t("messages.assignError")
      );
    }
  }

  async function handleDeleteAssignment() {
    if (!deletingAssignment) return;
    try {
      await deleteAssignment(deletingAssignment.id);
      toast.success(t("messages.assignmentDeleted"));
    } catch {
      toast.error(t("messages.assignmentDeleteError"));
    } finally {
      setDeletingAssignment(null);
    }
  }

  function openCreateTemplate() {
    setEditingTemplate(null);
    setTemplateFormOpen(true);
  }

  function openEditTemplate(tpl: ChecklistTemplate) {
    setEditingTemplate(tpl);
    setTemplateFormOpen(true);
  }

  async function handleTemplateSubmit(values: CreateTemplateRequest) {
    try {
      if (editingTemplate) {
        await updateTemplate(editingTemplate.id, values);
        toast.success(t("messages.templateUpdated"));
      } else {
        await createTemplate(values);
        toast.success(t("messages.templateCreated"));
      }
    } catch {
      toast.error(
        editingTemplate ? t("messages.templateUpdateError") : t("messages.templateCreateError")
      );
    }
  }

  async function handleDeleteTemplate() {
    if (!deletingTemplate) return;
    try {
      await deleteTemplate(deletingTemplate.id);
      toast.success(t("messages.templateDeleted"));
    } catch {
      toast.error(t("messages.templateDeleteError"));
    } finally {
      setDeletingTemplate(null);
    }
  }

  const filtered = visibleAssignments.filter((a) =>
    search
      ? a.templateName.toLowerCase().includes(search.toLowerCase()) ||
        (a.assignedToName ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (a.assetName ?? "").toLowerCase().includes(search.toLowerCase())
      : true
  );

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-xl font-semibold">{t("page.title")}</h1>
        {/* Chỉ admin thấy badge role */}
        {IS_ADMIN && (
          <span className="text-xs bg-blue-100 text-blue-700 rounded-full px-2 py-0.5 font-medium">
            Admin
          </span>
        )}
      </div>

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
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder={t("filters.status")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{t("filters.allStatuses")}</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {t(`checklistStatus.${s}`, { defaultValue: s })}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Assignments */}
      <AssignmentList
        assignments={filtered}
        isLoading={isLoading}
        canAdmin={IS_ADMIN}
        onRowClick={openExecution}
        onAssignClick={IS_ADMIN ? openAssignForm : undefined}
        onEdit={IS_ADMIN ? openEditAssignment : undefined}
        onDelete={IS_ADMIN ? (a) => setDeletingAssignment(a) : undefined}
        emptyLabel={
          IS_ADMIN
            ? t("section.assignmentsEmpty")
            : t("section.myAssignmentsEmpty", {
                defaultValue: "Bạn chưa được phân công checklist nào.",
              })
        }
      />

      {/* Templates — chỉ admin quản lý template */}
      {IS_ADMIN && (
        <>
          <Separator />
          <TemplateList
            templates={templates}
            isLoading={templatesLoading}
            canAdmin
            onCreate={openCreateTemplate}
            onEdit={openEditTemplate}
            onDelete={(tpl) => setDeletingTemplate(tpl)}
          />
        </>
      )}

      {/* Report — chỉ admin xem báo cáo */}
      {IS_ADMIN && (
        <>
          <Separator />
          <div className="flex flex-col gap-3">
            <p className="text-sm font-semibold">{t("section.report")}</p>
            <ReportSection />
          </div>
        </>
      )}

      {/* Assignment Form — chỉ admin */}
      {IS_ADMIN && (
        <AssignmentForm
          open={assignFormOpen}
          onOpenChange={setAssignFormOpen}
          templates={templates}
          assignment={editingAssignment}
          onSubmit={handleAssignSubmit}
        />
      )}

      {/* Template Form — chỉ admin */}
      {IS_ADMIN && (
        <TemplateForm
          open={templateFormOpen}
          onOpenChange={setTemplateFormOpen}
          template={editingTemplate}
          onSubmit={handleTemplateSubmit}
        />
      )}

      {/* Execution Panel */}
      <ExecutionPanel
        assignmentId={executionId}
        open={executionOpen}
        onOpenChange={setExecutionOpen}
        isAdmin={IS_ADMIN}
      />

      {IS_ADMIN && (
        <>
          <DeleteAssignmentDialog
            open={!!deletingAssignment}
            onClose={() => setDeletingAssignment(null)}
            onConfirm={handleDeleteAssignment}
          />
          <DeleteTemplateDialog
            open={!!deletingTemplate}
            onClose={() => setDeletingTemplate(null)}
            onConfirm={handleDeleteTemplate}
          />
        </>
      )}
    </div>
  );
}
