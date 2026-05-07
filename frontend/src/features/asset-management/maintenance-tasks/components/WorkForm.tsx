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
import { Textarea } from "@/shared/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/shared/components/ui/field";
import { MAINTENANCE_TYPES } from "@/features/asset-management/maintenance-schedules/types/maintenanceTypes";
import type { MaintenanceWork, CreateWorkRequest } from "../types/workTypes";
import type { Asset } from "@/features/asset-management/assets/types/assetTypes";

const workSchema = z.object({
  assetId: z.string().optional(),
  maintenanceType: z.string().min(1),
  description: z.string().min(1),
  dueDate: z.string().optional(),
  assignedTo: z.string().optional(),
});

type WorkFormValues = z.infer<typeof workSchema>;

interface TechnicianOption {
  id: string;
  name: string;
  role?: string;
}

interface WorkFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  work?: MaintenanceWork | null;
  assetId?: string;
  assetOptions?: Asset[];
  technicians?: TechnicianOption[];
  onSubmit: (values: CreateWorkRequest) => Promise<void>;
}

const UNASSIGNED_VALUE = "__unassigned__";

export function WorkForm({
  open,
  onOpenChange,
  work,
  assetId,
  assetOptions = [],
  technicians = [],
  onSubmit,
}: WorkFormProps) {
  const { t } = useTranslation("maintenanceTasks");
  const isEdit = !!work;
  const needsAssetSelection = !assetId;

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<WorkFormValues>({
    resolver: zodResolver(workSchema),
    defaultValues: {
      assetId: assetId ?? "",
      maintenanceType: "",
      description: "",
      dueDate: "",
      assignedTo: "",
    },
  });

  useEffect(() => {
    if (open) {
      reset(
        work
          ? {
              assetId: work.assetId,
              maintenanceType: work.maintenanceType,
              description: work.description,
              dueDate: work.dueDate?.slice(0, 10) ?? "",
              assignedTo: work.assignedTo ?? "",
            }
          : {
              assetId: assetId ?? "",
              maintenanceType: "",
              description: "",
              dueDate: "",
              assignedTo: "",
            }
      );
    }
  }, [assetId, open, reset, work]);

  async function onValid(values: WorkFormValues) {
    const selectedAssetId = assetId || values.assetId;

    if (!selectedAssetId) {
      setError("assetId", { message: t("form.required") });
      return;
    }

    if (values.dueDate) {
      const deadline = new Date(`${values.dueDate}T23:59:59`);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const diffDays = Math.ceil((deadline.getTime() - today.getTime()) / 86400000);
      if (diffDays < 0 || diffDays > 14) {
        setError("dueDate", {
          message: "Deadline phải nằm trong vòng tối đa 14 ngày.",
        });
        return;
      }
    }

    const selectedAsset = assetOptions.find((asset) => asset.id === selectedAssetId);
    const selectedTechnician = technicians.find(
      (technician) => technician.id === values.assignedTo
    );

    await onSubmit({
      assetId: selectedAssetId,
      assetCode: selectedAsset?.assetCode,
      assetName: selectedAsset?.name,
      maintenanceType: values.maintenanceType as CreateWorkRequest["maintenanceType"],
      description: values.description,
      dueDate: values.dueDate || undefined,
      assignedTo: values.assignedTo || undefined,
      assignedToName: selectedTechnician?.name,
    });
    onOpenChange(false);
  }

  const selectedAssetId = watch("assetId");
  const maintenanceType = watch("maintenanceType");
  const assignedTo = watch("assignedTo");

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
          <FieldGroup>
            {needsAssetSelection && (
              <Field data-invalid={!!errors.assetId}>
                <FieldLabel>Tài sản bảo trì *</FieldLabel>
                <Select
                  value={selectedAssetId ?? ""}
                  onValueChange={(value) => setValue("assetId", value, { shouldValidate: true })}
                >
                  <SelectTrigger className="w-full" aria-invalid={!!errors.assetId}>
                    <SelectValue placeholder="Chọn tài sản cần bảo trì" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {assetOptions.map((asset) => (
                        <SelectItem key={asset.id} value={asset.id}>
                          {asset.assetCode} - {asset.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                {assetOptions.length === 0 && (
                  <FieldDescription>Chưa tải được danh sách tài sản.</FieldDescription>
                )}
                {errors.assetId && <FieldError>{errors.assetId.message}</FieldError>}
              </Field>
            )}

            <Field data-invalid={!!errors.maintenanceType}>
              <FieldLabel>{t("form.maintenanceType")} *</FieldLabel>
              <Select
                value={maintenanceType}
                onValueChange={(value) =>
                  setValue("maintenanceType", value, { shouldValidate: true })
                }
              >
                <SelectTrigger className="w-full" aria-invalid={!!errors.maintenanceType}>
                  <SelectValue placeholder={t("form.selectType")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {MAINTENANCE_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {t(`maintenanceType.${type}`, { defaultValue: type })}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              {errors.maintenanceType && <FieldError>{t("form.required")}</FieldError>}
            </Field>

            <Field data-invalid={!!errors.description}>
              <FieldLabel>{t("form.description")} *</FieldLabel>
              <Textarea
                {...register("description")}
                rows={4}
                placeholder={t("form.descriptionPlaceholder")}
                aria-invalid={!!errors.description}
              />
              {errors.description && <FieldError>{t("form.required")}</FieldError>}
            </Field>

            <Field data-invalid={!!errors.dueDate}>
              <FieldLabel>{t("form.dueDate")}</FieldLabel>
              <Input type="date" {...register("dueDate")} aria-invalid={!!errors.dueDate} />
              <FieldDescription>
                Nhân viên kỹ thuật chỉ được xử lý trong vòng tối đa 14 ngày.
              </FieldDescription>
              {errors.dueDate && <FieldError>{errors.dueDate.message}</FieldError>}
            </Field>

            <Field>
              <FieldLabel>{t("form.assignedTo")}</FieldLabel>
              {technicians.length > 0 ? (
                <Select
                  value={assignedTo || UNASSIGNED_VALUE}
                  onValueChange={(value) =>
                    setValue("assignedTo", value === UNASSIGNED_VALUE ? "" : value)
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t("form.assignedToPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value={UNASSIGNED_VALUE}>Chưa phân công</SelectItem>
                      {technicians.map((technician) => (
                        <SelectItem key={technician.id} value={technician.id}>
                          {technician.id} - {technician.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              ) : (
                <Input {...register("assignedTo")} placeholder={t("form.assignedToPlaceholder")} />
              )}
            </Field>
          </FieldGroup>
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
