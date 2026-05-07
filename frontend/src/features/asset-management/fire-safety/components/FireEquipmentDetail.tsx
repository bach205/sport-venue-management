import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/shared/components/ui/sheet";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Separator } from "@/shared/components/ui/separator";
import { Skeleton } from "@/shared/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/shared/components/ui/dialog";
import { Field, FieldLabel } from "@/shared/components/ui/field";
import { FireStatusBadge } from "./FireEquipmentList";
import { useFireEquipmentDetail } from "../hooks/useFireSafety";
import { toast } from "sonner";
import { ExternalLink, Pencil, Trash2, ShieldCheck } from "lucide-react";
import type { FireEquipment, ConfirmInspectionRequest } from "../types/fireSafetyTypes";

const confirmSchema = z.object({
  inspectionDate: z.string().min(1),
  nextInspectionDate: z.string().optional(),
  note: z.string().optional(),
  certificateUrl: z.string().optional(),
});
type ConfirmFormValues = z.infer<typeof confirmSchema>;

interface FireEquipmentDetailProps {
  equipmentId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canEdit: boolean;
  onEdit: (eq: FireEquipment) => void;
  onDelete: (id: string) => void;
}

export function FireEquipmentDetail({
  equipmentId,
  open,
  onOpenChange,
  canEdit,
  onEdit,
  onDelete,
}: FireEquipmentDetailProps) {
  const { t } = useTranslation("fireSafety");
  const { equipment, histories, isLoading, confirmInspection } = useFireEquipmentDetail(
    open ? equipmentId : null
  );
  const [confirmOpen, setConfirmOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<ConfirmFormValues>({
    resolver: zodResolver(confirmSchema),
    defaultValues: { inspectionDate: "", nextInspectionDate: "", note: "", certificateUrl: "" },
  });

  function openConfirm() {
    reset({
      inspectionDate: format(new Date(), "yyyy-MM-dd"),
      nextInspectionDate: "",
      note: "",
      certificateUrl: "",
    });
    setConfirmOpen(true);
  }

  async function onConfirmSubmit(values: ConfirmFormValues) {
    const data: ConfirmInspectionRequest = {
      inspectionDate: values.inspectionDate,
      nextInspectionDate: values.nextInspectionDate || undefined,
      note: values.note || undefined,
      certificateUrl: values.certificateUrl || undefined,
    };
    try {
      await confirmInspection(data);
      toast.success(t("messages.confirmSuccess"));
      setConfirmOpen(false);
    } catch {
      toast.error(t("messages.confirmError"));
    }
  }

  const fmtDate = (d?: string) => {
    if (!d) return "—";
    try {
      return format(new Date(d), "dd/MM/yyyy");
    } catch {
      return d;
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-lg flex flex-col p-0 overflow-hidden">
          {isLoading || !equipment ? (
            <div className="p-6 flex flex-col gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <>
              <SheetHeader className="px-6 pt-6 pb-4 border-b border-border shrink-0">
                <div className="flex items-center gap-2">
                  <FireStatusBadge status={equipment.status} t={t} />
                  <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                    {equipment.equipmentType}
                  </span>
                </div>
                <SheetTitle>{equipment.name}</SheetTitle>
              </SheetHeader>

              <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-6">
                {/* Action buttons */}
                {canEdit && (
                  <div className="flex gap-2 flex-wrap">
                    <Button size="sm" onClick={openConfirm} className="gap-1.5">
                      <ShieldCheck className="size-3.5" />
                      {t("actions.confirmInspection")}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5"
                      onClick={() => onEdit(equipment)}
                    >
                      <Pencil className="size-3.5" />
                      {t("actions.edit")}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 text-destructive hover:text-destructive"
                      onClick={() => {
                        onDelete(equipment.id);
                        onOpenChange(false);
                      }}
                    >
                      <Trash2 className="size-3.5" />
                      {t("actions.delete")}
                    </Button>
                  </div>
                )}

                {/* Info */}
                <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                  <InfoLine
                    label={t("detail.latestInspection")}
                    value={fmtDate(equipment.latestInspectionDate)}
                  />
                  <InfoLine
                    label={t("detail.nextInspection")}
                    value={fmtDate(equipment.nextInspectionDate)}
                    highlight={equipment.status !== "VALID"}
                  />
                  {equipment.daysUntilDue != null && (
                    <InfoLine
                      label={t("detail.daysUntilDue")}
                      value={
                        equipment.daysUntilDue < 0
                          ? `${Math.abs(equipment.daysUntilDue)} ${t("detail.overdue")}`
                          : `${equipment.daysUntilDue} ${t("detail.remaining")}`
                      }
                      highlight={equipment.status !== "VALID"}
                    />
                  )}
                  {equipment.inspectionCycleValue && (
                    <InfoLine
                      label={t("detail.cycle")}
                      value={`${equipment.inspectionCycleValue} ${t(`cycleUnit.${equipment.inspectionCycleUnit}`, { defaultValue: equipment.inspectionCycleUnit ?? "" })}`}
                    />
                  )}
                </div>

                {/* Certificate */}
                {equipment.certificateUrl && (
                  <a
                    href={equipment.certificateUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:underline"
                  >
                    <ExternalLink className="size-3.5" />
                    {t("detail.viewCertificate")}
                  </a>
                )}

                <Separator />

                {/* Inspection history */}
                <div className="flex flex-col gap-3">
                  <p className="text-sm font-semibold">{t("section.history")}</p>
                  {histories.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{t("section.historyEmpty")}</p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {histories
                        .sort(
                          (a, b) =>
                            new Date(b.inspectionDate).getTime() -
                            new Date(a.inspectionDate).getTime()
                        )
                        .map((h) => (
                          <div
                            key={h.id}
                            className="rounded-lg border border-border bg-card px-4 py-3 flex flex-col gap-1"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-sm font-medium">
                                {fmtDate(h.inspectionDate)}
                              </span>
                              {h.nextInspectionDate && (
                                <span className="text-xs text-muted-foreground">
                                  {t("detail.nextInspection")}: {fmtDate(h.nextInspectionDate)}
                                </span>
                              )}
                            </div>
                            {h.confirmedBy && (
                              <span className="text-xs text-muted-foreground">
                                {t("detail.confirmedBy")}: {h.confirmedBy}
                              </span>
                            )}
                            {h.note && (
                              <p className="text-xs text-muted-foreground italic">{h.note}</p>
                            )}
                            {h.certificateUrl && (
                              <a
                                href={h.certificateUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                              >
                                <ExternalLink className="size-3" />
                                {t("detail.certificate")}
                              </a>
                            )}
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Confirm inspection dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("form.confirmTitle")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onConfirmSubmit)} className="flex flex-col gap-4 py-2">
            <Field>
              <FieldLabel>{t("form.inspectionDate")}</FieldLabel>
              <Input type="date" {...register("inspectionDate")} />
            </Field>
            <Field>
              <FieldLabel>{t("form.nextInspectionDate")}</FieldLabel>
              <Input type="date" {...register("nextInspectionDate")} />
            </Field>
            <Field>
              <FieldLabel>{t("form.certificateUrl")}</FieldLabel>
              <Input {...register("certificateUrl")} placeholder="https://..." />
            </Field>
            <Field>
              <FieldLabel>{t("form.note")}</FieldLabel>
              <textarea
                {...register("note")}
                rows={2}
                placeholder={t("form.notePlaceholder")}
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
              />
            </Field>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setConfirmOpen(false)}>
                {t("actions.cancel")}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {t("actions.confirm")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

function InfoLine({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <span className="text-xs text-muted-foreground">{label}</span>
      <p className={highlight ? "text-sm font-medium text-amber-600" : "text-sm font-medium"}>
        {value}
      </p>
    </div>
  );
}
