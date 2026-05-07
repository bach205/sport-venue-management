import { useTranslation } from "react-i18next";
import { LayoutList, Pencil, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";
import type { ChecklistTemplate } from "../types/checklistTypes";

interface TemplateListProps {
  templates: ChecklistTemplate[];
  isLoading: boolean;
  canAdmin: boolean;
  onCreate: () => void;
  onEdit: (template: ChecklistTemplate) => void;
  onDelete: (template: ChecklistTemplate) => void;
}

export function TemplateList({
  templates,
  isLoading,
  canAdmin,
  onCreate,
  onEdit,
  onDelete,
}: TemplateListProps) {
  const { t } = useTranslation("technicalChecklists");

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">{t("section.templates")}</p>
        {canAdmin && (
          <Button size="sm" variant="outline" onClick={onCreate} className="gap-1.5">
            <Plus className="size-3.5" />
            {t("actions.createTemplate")}
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      ) : templates.length === 0 ? (
        <div className="flex items-center justify-center py-8 text-sm text-muted-foreground border border-dashed rounded-lg">
          {t("section.templatesEmpty")}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {templates.map((tpl) => (
            <TemplateCard
              key={tpl.id}
              template={tpl}
              canAdmin={canAdmin}
              onEdit={() => onEdit(tpl)}
              onDelete={() => onDelete(tpl)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function TemplateCard({
  template,
  canAdmin,
  onEdit,
  onDelete,
}: {
  template: ChecklistTemplate;
  canAdmin: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation("technicalChecklists");

  return (
    <div className="flex items-start gap-3 rounded-lg border border-border px-4 py-3 bg-card">
      <LayoutList className="size-4 text-muted-foreground mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium truncate">{template.name}</span>
          <Badge variant={template.isActive ? "default" : "secondary"} className="text-xs">
            {template.isActive ? t("template.active") : t("template.inactive")}
          </Badge>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 flex-wrap">
          <span>{template.checklistType}</span>
          {template.frequencyValue && template.frequencyUnit && (
            <span>
              {template.frequencyValue}{" "}
              {t(`frequencyUnit.${template.frequencyUnit}`, {
                defaultValue: template.frequencyUnit,
              })}
            </span>
          )}
          <span>
            {template.items.length} {t("template.items")}
          </span>
        </div>
      </div>
      {canAdmin && (
        <div className="flex items-center gap-1 shrink-0">
          <Button size="icon" variant="ghost" className="size-7" onClick={onEdit}>
            <Pencil className="size-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="size-7 text-destructive hover:text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}
