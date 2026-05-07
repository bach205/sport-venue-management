import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetClose,
} from "@/shared/components/ui/sheet";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Field, FieldLabel, FieldError } from "@/shared/components/ui/field";
import type {
  ChecklistAssignment,
  ChecklistTemplate,
  CreateAssignmentRequest,
} from "../types/checklistTypes";

const assignSchema = z.object({
  templateId: z.string().min(1),
  assignedTo: z.string().min(1),
  dueDate: z.string().optional(),
});

type FormValues = z.infer<typeof assignSchema>;

interface AssignmentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templates: ChecklistTemplate[];
  assetId?: string;
  assignment?: ChecklistAssignment | null;
  onSubmit: (values: CreateAssignmentRequest) => Promise<void>;
}

export function AssignmentForm({
  open,
  onOpenChange,
  templates,
  assetId,
  assignment,
  onSubmit,
}: AssignmentFormProps) {
  const isEdit = !!assignment;
  const { t } = useTranslation("technicalChecklists");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(assignSchema),
    defaultValues: { templateId: "", assignedTo: "", dueDate: "" },
  });

  useEffect(() => {
    if (open) {
      reset(
        assignment
          ? {
              templateId: assignment.templateId,
              assignedTo: assignment.assignedTo,
              dueDate: assignment.dueDate?.slice(0, 10) ?? "",
            }
          : { templateId: "", assignedTo: "", dueDate: "" }
      );
    }
  }, [open, assignment, reset]);

  async function onValid(values: FormValues) {
    await onSubmit({
      templateId: values.templateId,
      assignedTo: values.assignedTo,
      dueDate: values.dueDate || undefined,
      assetId: assetId,
    });
    onOpenChange(false);
  }

  const templateId = watch("templateId");

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-0 overflow-hidden">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border">
          <SheetTitle>{isEdit ? t("form.editAssignment") : t("form.assignChecklist")}</SheetTitle>
        </SheetHeader>

        <form
          onSubmit={handleSubmit(onValid)}
          className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5"
        >
          <Field>
            <FieldLabel>{t("form.template")}</FieldLabel>
            <Select value={templateId} onValueChange={(v) => setValue("templateId", v)}>
              <SelectTrigger>
                <SelectValue placeholder={t("form.selectTemplate")} />
              </SelectTrigger>
              <SelectContent>
                {templates.map((tpl) => (
                  <SelectItem key={tpl.id} value={tpl.id}>
                    {tpl.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.templateId && <FieldError>{t("form.required")}</FieldError>}
          </Field>

          <Field>
            <FieldLabel>{t("form.assignedTo")}</FieldLabel>
            <Input {...register("assignedTo")} placeholder={t("form.assignedToPlaceholder")} />
            {errors.assignedTo && <FieldError>{t("form.required")}</FieldError>}
          </Field>

          <Field>
            <FieldLabel>{t("form.dueDate")}</FieldLabel>
            <Input type="date" {...register("dueDate")} />
          </Field>
        </form>

        <SheetFooter className="px-6 py-4 border-t border-border flex gap-2 shrink-0">
          <SheetClose asChild>
            <Button type="button" variant="outline" className="flex-1">
              {t("actions.cancel")}
            </Button>
          </SheetClose>
          <Button
            type="submit"
            className="flex-1"
            disabled={isSubmitting}
            onClick={handleSubmit(onValid)}
          >
            {t("actions.assign")}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
