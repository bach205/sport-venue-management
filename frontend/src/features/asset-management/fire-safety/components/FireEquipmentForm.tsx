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
  FireEquipment,
  CreateFireEquipmentRequest,
  InspectionCycleUnit,
} from "../types/fireSafetyTypes";
import { useBuildings } from "../../assets/hooks/useBuildings";

const CYCLE_UNITS: InspectionCycleUnit[] = ["MONTH", "QUARTER", "YEAR"];

const schema = z.object({
  name: z.string().min(1),
  equipmentType: z.string().min(1),
  inspectionCycleValue: z.coerce.number().min(1).optional(),
  inspectionCycleUnit: z.string().optional(),
  nextInspectionDate: z.string().optional(),
  buildingId: z.string().min(1),
});

type FormValues = z.infer<typeof schema>;

interface FireEquipmentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  equipment?: FireEquipment | null;
  assetId?: string;
  onSubmit: (values: CreateFireEquipmentRequest) => Promise<void>;
  defaultBuildingId?: string;
}

export function FireEquipmentForm({
  open,
  onOpenChange,
  equipment,
  assetId,
  onSubmit,
  defaultBuildingId,
}: FireEquipmentFormProps) {
  const { t } = useTranslation("fireSafety");
  const isEdit = !!equipment;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      equipmentType: "",
      inspectionCycleValue: 1,
      inspectionCycleUnit: "",
      nextInspectionDate: "",
      buildingId: "",
    },
  });

  useEffect(() => {
    if (open) {
      reset(
        equipment
          ? {
              name: equipment.name,
              equipmentType: equipment.equipmentType,
              inspectionCycleValue: equipment.inspectionCycleValue ?? 1,
              inspectionCycleUnit: equipment.inspectionCycleUnit ?? "",
              nextInspectionDate: equipment.nextInspectionDate ?? "",
              buildingId: equipment.buildingId ?? "",
            }
          : {
              name: "",
              equipmentType: "",
              inspectionCycleValue: 1,
              inspectionCycleUnit: "",
              nextInspectionDate: "",
              buildingId: defaultBuildingId ?? "",
            }
      );
    }
  }, [open, equipment, defaultBuildingId, reset]);

  async function onValid(values: FormValues) {
    await onSubmit({
      name: values.name,
      equipmentType: values.equipmentType,
      inspectionCycleValue: values.inspectionCycleValue,
      inspectionCycleUnit: values.inspectionCycleUnit as InspectionCycleUnit | undefined,
      nextInspectionDate: values.nextInspectionDate || undefined,
      assetId,
    });
    onOpenChange(false);
  }

  const { buildings } = useBuildings();

  const cycleUnit = watch("inspectionCycleUnit");

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
          <Field>
            <FieldLabel>{t("form.building")}</FieldLabel>
            <Select
              value={watch("buildingId") ?? ""}
              onValueChange={(v) => setValue("buildingId", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("form.selectBuilding")} />
              </SelectTrigger>
              <SelectContent>
                {buildings.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.buildingId && <FieldError>{t("form.required")}</FieldError>}
          </Field>
          <Field>
            <FieldLabel>{t("form.name")}</FieldLabel>
            <Input {...register("name")} placeholder={t("form.namePlaceholder")} />
            {errors.name && <FieldError>{t("form.required")}</FieldError>}
          </Field>

          <Field>
            <FieldLabel>{t("form.equipmentType")}</FieldLabel>
            <Input
              {...register("equipmentType")}
              placeholder={t("form.equipmentTypePlaceholder")}
            />
            {errors.equipmentType && <FieldError>{t("form.required")}</FieldError>}
          </Field>

          <div className="flex gap-3">
            <Field className="flex-1">
              <FieldLabel>{t("form.cycleValue")}</FieldLabel>
              <Input type="number" min={1} {...register("inspectionCycleValue")} />
            </Field>
            <Field className="flex-1">
              <FieldLabel>{t("form.cycleUnit")}</FieldLabel>
              <Select
                value={cycleUnit ?? ""}
                onValueChange={(v) => setValue("inspectionCycleUnit", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("form.selectUnit")} />
                </SelectTrigger>
                <SelectContent>
                  {CYCLE_UNITS.map((u) => (
                    <SelectItem key={u} value={u}>
                      {t(`cycleUnit.${u}`, { defaultValue: u })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <Field>
            <FieldLabel>{t("form.nextInspectionDate")}</FieldLabel>
            <Input type="date" {...register("nextInspectionDate")} />
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
