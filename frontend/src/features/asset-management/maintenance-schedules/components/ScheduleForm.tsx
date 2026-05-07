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
import { MAINTENANCE_TYPES, type MaintenanceSchedule } from "../types/maintenanceTypes";
import type { CreateScheduleRequest } from "../types/maintenanceTypes";

const scheduleSchema = z.object({
  name: z.string().min(1),
  maintenanceType: z.string().min(1),
  intervalDays: z.coerce.number().int().min(1),
  startDate: z.string().min(1),
  assignedTo: z.string().optional(),
  description: z.string().optional(),
});

type ScheduleFormValues = z.infer<typeof scheduleSchema>;

interface ScheduleFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schedule?: MaintenanceSchedule | null;
  assetId: string;
  onSubmit: (values: CreateScheduleRequest) => Promise<void>;
}

export function ScheduleForm({
  open,
  onOpenChange,
  schedule,
  assetId,
  onSubmit,
}: ScheduleFormProps) {
  const { t } = useTranslation("maintenanceSchedules");
  const isEdit = !!schedule;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ScheduleFormValues>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      name: "",
      maintenanceType: "",
      intervalDays: 30,
      startDate: "",
      assignedTo: "",
      description: "",
    },
  });

  useEffect(() => {
    if (open) {
      reset(
        schedule
          ? {
              name: schedule.name,
              maintenanceType: schedule.maintenanceType,
              intervalDays: schedule.intervalDays,
              startDate: schedule.startDate?.slice(0, 10) ?? "",
              assignedTo: schedule.assignedTo ?? "",
              description: schedule.description ?? "",
            }
          : {
              name: "",
              maintenanceType: "",
              intervalDays: 30,
              startDate: new Date().toISOString().slice(0, 10),
              assignedTo: "",
              description: "",
            }
      );
    }
  }, [open, schedule, reset]);

  async function onValid(values: ScheduleFormValues) {
    await onSubmit({
      assetId,
      name: values.name,
      maintenanceType: values.maintenanceType as CreateScheduleRequest["maintenanceType"],
      intervalDays: values.intervalDays,
      startDate: values.startDate,
      assignedTo: values.assignedTo || undefined,
      description: values.description || undefined,
    });
    onOpenChange(false);
  }

  const maintenanceType = watch("maintenanceType");

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-0 overflow-hidden">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border">
          <SheetTitle>{isEdit ? t("form.editTitle") : t("form.createTitle")}</SheetTitle>
        </SheetHeader>

        <form
          onSubmit={handleSubmit(onValid)}
          className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5"
        >
          {/* Name */}
          <Field>
            <FieldLabel>{t("form.name")}</FieldLabel>
            <Input {...register("name")} placeholder={t("form.namePlaceholder")} />
            {errors.name && <FieldError>{t("form.required")}</FieldError>}
          </Field>

          {/* Maintenance type */}
          <Field>
            <FieldLabel>{t("form.maintenanceType")}</FieldLabel>
            <Select value={maintenanceType} onValueChange={(v) => setValue("maintenanceType", v)}>
              <SelectTrigger>
                <SelectValue placeholder={t("form.selectType")} />
              </SelectTrigger>
              <SelectContent>
                {MAINTENANCE_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {t(`maintenanceType.${type}`, { defaultValue: type })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.maintenanceType && <FieldError>{t("form.required")}</FieldError>}
          </Field>

          {/* Interval */}
          <Field>
            <FieldLabel>{t("form.intervalDays")}</FieldLabel>
            <Input type="number" min={1} {...register("intervalDays")} placeholder="30" />
            {errors.intervalDays && <FieldError>{t("form.required")}</FieldError>}
          </Field>

          {/* Start date */}
          <Field>
            <FieldLabel>{t("form.startDate")}</FieldLabel>
            <Input type="date" {...register("startDate")} />
            {errors.startDate && <FieldError>{t("form.required")}</FieldError>}
          </Field>

          {/* Assigned to */}
          <Field>
            <FieldLabel>{t("form.assignedTo")}</FieldLabel>
            <Input {...register("assignedTo")} placeholder={t("form.assignedToPlaceholder")} />
          </Field>

          {/* Description */}
          <Field>
            <FieldLabel>{t("form.description")}</FieldLabel>
            <textarea
              {...register("description")}
              rows={3}
              placeholder={t("form.descriptionPlaceholder")}
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
            />
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
            {isEdit ? t("actions.update") : t("actions.create")}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
