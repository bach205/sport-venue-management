import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { Field, FieldGroup, FieldLabel, FieldError } from "@/shared/components/ui/field";
import { assetFormSchema, type AssetFormValues } from "../utils/validateAsset";
import { ASSET_TYPES } from "../types/assetTypes";
import type { Asset, Building } from "../types/assetTypes";

interface AssetFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  asset?: Asset | null;
  buildings: Building[];
  onSubmit: (values: AssetFormValues) => Promise<void>;
  prefill?: Partial<AssetFormValues>;
}

export function AssetForm({
  open,
  onOpenChange,
  asset,
  buildings,
  onSubmit,
  prefill,
}: AssetFormProps) {
  const { t } = useTranslation("assets");
  const isEdit = !!asset;

  const emptyDefaults: AssetFormValues = {
    buildingId: "",
    ownershipScope: "COMMON",
    unitId: "",
    assetCode: "",
    name: "",
    assetType: "",
    location: "",
    roomType: "",
    brand: "",
    model: "",
    serialNumber: "",
    description: "",
    active: true,
    installedAt: "",
    warrantyUntil: "",
  };

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AssetFormValues>({
    resolver: zodResolver(assetFormSchema),
    defaultValues: emptyDefaults,
  });

  // Reset form values whenever the sheet opens
  useEffect(() => {
    if (open) {
      if (asset) {
        reset({
          buildingId: asset.buildingId,
          ownershipScope: asset.ownershipScope ?? "COMMON",
          unitId: asset.unitId ?? "",
          assetCode: asset.assetCode,
          name: asset.name,
          assetType: asset.assetType,
          location: asset.location ?? "",
          roomType: asset.roomType ?? "",
          brand: asset.brand ?? "",
          model: asset.model ?? "",
          serialNumber: asset.serialNumber ?? "",
          description: asset.description ?? "",
          active: asset.active,
          installedAt: asset.installedAt?.slice(0, 10) ?? "",
          warrantyUntil: asset.warrantyUntil?.slice(0, 10) ?? "",
        });
      } else {
        reset({ ...emptyDefaults, ...prefill });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const ownershipScope = watch("ownershipScope");
  const active = watch("active");

  const handleOpenChange = (v: boolean) => {
    if (!v) reset();
    onOpenChange(v);
  };

  const onValid = async (values: AssetFormValues) => {
    await onSubmit(values);
    handleOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="w-full max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEdit ? t("form.editTitle") : t("form.createTitle")}</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit(onValid)} className="flex flex-col gap-5 py-4 px-1">
          <FieldGroup>
            {/* Building */}
            <Field data-invalid={!!errors.buildingId}>
              <FieldLabel>{t("form.building")} *</FieldLabel>
              <Select
                value={watch("buildingId")}
                onValueChange={(v) => setValue("buildingId", v, { shouldValidate: true })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("form.selectBuilding")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {buildings.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              {errors.buildingId && <FieldError>{t("validation.required")}</FieldError>}
            </Field>

            {/* Ownership Scope */}
            <Field>
              <FieldLabel>{t("form.ownershipScope")}</FieldLabel>
              <Select
                value={ownershipScope}
                onValueChange={(v) =>
                  setValue("ownershipScope", v as "COMMON" | "PRIVATE", { shouldValidate: true })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="COMMON">{t("ownershipScope.COMMON")}</SelectItem>
                    <SelectItem value="PRIVATE">{t("ownershipScope.PRIVATE")}</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>

            {/* Unit â€” only for PRIVATE */}
            {ownershipScope === "PRIVATE" && (
              <Field data-invalid={!!errors.unitId}>
                <FieldLabel>{t("form.unit")} *</FieldLabel>
                <Input {...register("unitId")} placeholder={t("form.unitPlaceholder")} />
                {errors.unitId && <FieldError>{t("validation.required")}</FieldError>}
              </Field>
            )}

            {/* Asset Code */}
            <Field data-invalid={!!errors.assetCode}>
              <FieldLabel>{t("form.assetCode")} *</FieldLabel>
              <Input {...register("assetCode")} placeholder="A-001" />
              {errors.assetCode && <FieldError>{t("validation.required")}</FieldError>}
            </Field>

            {/* Name */}
            <Field data-invalid={!!errors.name}>
              <FieldLabel>{t("form.name")} *</FieldLabel>
              <Input {...register("name")} placeholder={t("form.namePlaceholder")} />
              {errors.name && <FieldError>{t("validation.required")}</FieldError>}
            </Field>

            {/* Asset Type */}
            <Field data-invalid={!!errors.assetType}>
              <FieldLabel>{t("form.assetType")} *</FieldLabel>
              <Select
                value={watch("assetType")}
                onValueChange={(v) => setValue("assetType", v, { shouldValidate: true })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("form.selectAssetType")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {ASSET_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {t(`assetType.${type}`, { defaultValue: type })}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              {errors.assetType && <FieldError>{t("validation.required")}</FieldError>}
            </Field>

            {/* Location */}
            <Field>
              <FieldLabel>{t("form.location")}</FieldLabel>
              <Input {...register("location")} placeholder={t("form.locationPlaceholder")} />
            </Field>

            {/* Room Type */}
            <Field>
              <FieldLabel>{t("form.roomType")}</FieldLabel>
              <Input {...register("roomType")} />
            </Field>

            {/* Brand */}
            <Field>
              <FieldLabel>{t("form.brand")}</FieldLabel>
              <Input {...register("brand")} />
            </Field>

            {/* Model */}
            <Field>
              <FieldLabel>{t("form.model")}</FieldLabel>
              <Input {...register("model")} />
            </Field>

            {/* Serial Number */}
            <Field>
              <FieldLabel>{t("form.serialNumber")}</FieldLabel>
              <Input {...register("serialNumber")} />
            </Field>

            {/* Description */}
            <Field>
              <FieldLabel>{t("form.description")}</FieldLabel>
              <textarea
                {...register("description")}
                rows={3}
                className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                placeholder={t("form.descriptionPlaceholder")}
              />
            </Field>

            {/* Installed At */}
            <Field>
              <FieldLabel>{t("form.installedAt")}</FieldLabel>
              <Input type="date" {...register("installedAt")} />
            </Field>

            {/* Warranty Until */}
            <Field>
              <FieldLabel>{t("form.warrantyUntil")}</FieldLabel>
              <Input type="date" {...register("warrantyUntil")} />
            </Field>

            {/* Active */}
            <Field orientation="horizontal">
              <Checkbox
                id="active"
                checked={active}
                onCheckedChange={(checked) =>
                  setValue("active", checked === true, { shouldValidate: true })
                }
              />
              <FieldLabel htmlFor="active" className="cursor-pointer">
                {t("form.active")}
              </FieldLabel>
            </Field>
          </FieldGroup>

          <SheetFooter className="flex gap-2 pt-2">
            <SheetClose asChild>
              <Button type="button" variant="outline">
                {t("actions.cancel")}
              </Button>
            </SheetClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && (
                <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              )}
              {isEdit ? t("actions.update") : t("actions.create")}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
