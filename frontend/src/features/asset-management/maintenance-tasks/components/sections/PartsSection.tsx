import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/shared/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/shared/components/ui/field";
import { Separator } from "@/shared/components/ui/separator";
import { toast } from "sonner";
import type {
  MaintenancePart,
  CreatePartRequest,
  MaintenanceWork,
  UpdateWorkCostRequest,
} from "../../types/workTypes";

interface PartsSectionProps {
  work: MaintenanceWork;
  parts: MaintenancePart[];
  canEdit: boolean;
  onAddPart: (data: CreatePartRequest) => Promise<void>;
  onDeletePart: (partId: string) => Promise<void>;
  onUpdateCost: (data: UpdateWorkCostRequest) => Promise<void>;
}

const EMPTY_PART: Omit<CreatePartRequest, never> = {
  partName: "",
  quantity: 1,
  unit: "",
  unitPrice: 0,
  note: "",
};

export function PartsSection({
  work,
  parts,
  canEdit,
  onAddPart,
  onDeletePart,
  onUpdateCost,
}: PartsSectionProps) {
  const { t } = useTranslation("maintenanceTasks");
  const [addOpen, setAddOpen] = useState(false);
  const [costOpen, setCostOpen] = useState(false);
  const [form, setForm] = useState<CreatePartRequest>({ ...EMPTY_PART });
  const [costForm, setCostForm] = useState<UpdateWorkCostRequest>({
    laborCost: work.laborCost ?? 0,
    otherCost: work.otherCost ?? 0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalMaterial = parts.reduce((sum, p) => sum + (p.totalPrice ?? 0), 0);
  const grandTotal = (work.laborCost ?? 0) + totalMaterial + (work.otherCost ?? 0);

  useEffect(() => {
    if (costOpen) {
      setCostForm({
        laborCost: work.laborCost ?? 0,
        otherCost: work.otherCost ?? 0,
      });
    }
  }, [costOpen, work.laborCost, work.otherCost]);

  async function handleAdd() {
    if (!form.partName || !form.unit) return;
    setIsSubmitting(true);
    try {
      await onAddPart({
        ...form,
        quantity: Number(form.quantity),
        unitPrice: Number(form.unitPrice),
      });
      toast.success(t("messages.partAdded"));
      setAddOpen(false);
      setForm({ ...EMPTY_PART });
    } catch {
      toast.error(t("messages.partError"));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(partId: string) {
    try {
      await onDeletePart(partId);
      toast.success(t("messages.partDeleted"));
    } catch {
      toast.error(t("messages.partError"));
    }
  }

  async function handleUpdateCost() {
    setIsSubmitting(true);
    try {
      await onUpdateCost({
        laborCost: Number(costForm.laborCost ?? 0),
        otherCost: Number(costForm.otherCost ?? 0),
      });
      toast.success(t("messages.updateSuccess"));
      setCostOpen(false);
    } catch {
      toast.error(t("messages.updateError"));
    } finally {
      setIsSubmitting(false);
    }
  }

  const fmt = (n?: number) =>
    n != null ? n.toLocaleString("vi-VN", { style: "currency", currency: "VND" }) : "—";

  return (
    <div className="flex flex-col gap-4">
      {/* Parts table */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {t("detail.parts")}
        </p>
        {canEdit && (
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCostOpen(true)}
              className="gap-1.5"
            >
              <Pencil className="size-3.5" />
              Cập nhật chi phí
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setAddOpen(true)}
              className="gap-1.5"
            >
              <Plus className="size-3.5" />
              {t("actions.addPart")}
            </Button>
          </div>
        )}
      </div>

      {parts.length > 0 ? (
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="text-left px-3 py-2 font-medium text-xs text-muted-foreground">
                  {t("parts.name")}
                </th>
                <th className="text-right px-3 py-2 font-medium text-xs text-muted-foreground">
                  {t("parts.qty")}
                </th>
                <th className="text-right px-3 py-2 font-medium text-xs text-muted-foreground">
                  {t("parts.unitPrice")}
                </th>
                <th className="text-right px-3 py-2 font-medium text-xs text-muted-foreground">
                  {t("parts.total")}
                </th>
                {canEdit && <th className="w-8" />}
              </tr>
            </thead>
            <tbody>
              {parts.map((part) => (
                <tr key={part.id} className="border-t border-border">
                  <td className="px-3 py-2">
                    <div>{part.partName}</div>
                    {part.note && <div className="text-xs text-muted-foreground">{part.note}</div>}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {part.quantity} {part.unit}
                  </td>
                  <td className="px-3 py-2 text-right">{fmt(part.unitPrice)}</td>
                  <td className="px-3 py-2 text-right font-medium">{fmt(part.totalPrice)}</td>
                  {canEdit && (
                    <td className="px-2 py-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-6 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDelete(part.id)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex items-center justify-center py-6 text-sm text-muted-foreground border border-dashed rounded-lg">
          {t("detail.partsEmpty")}
        </div>
      )}

      {/* Cost summary */}
      <div className="flex flex-col gap-1.5 rounded-lg bg-muted/30 px-4 py-3 text-sm">
        <CostRow label={t("cost.labor")} value={fmt(work.laborCost)} />
        <CostRow label={t("cost.material")} value={fmt(totalMaterial)} />
        <CostRow label={t("cost.other")} value={fmt(work.otherCost)} />
        <Separator className="my-1" />
        <CostRow label={t("cost.total")} value={fmt(grandTotal)} bold />
      </div>

      {/* Add part dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("actions.addPart")}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <Input
              placeholder={t("parts.name")}
              value={form.partName}
              onChange={(e) => setForm((f) => ({ ...f, partName: e.target.value }))}
            />
            <div className="flex gap-2">
              <Input
                type="number"
                min={1}
                placeholder={t("parts.qty")}
                value={form.quantity}
                onChange={(e) => setForm((f) => ({ ...f, quantity: Number(e.target.value) }))}
                className="flex-1"
              />
              <Input
                placeholder={t("parts.unit")}
                value={form.unit}
                onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
                className="flex-1"
              />
            </div>
            <Input
              type="number"
              min={0}
              placeholder={t("parts.unitPrice")}
              value={form.unitPrice}
              onChange={(e) => setForm((f) => ({ ...f, unitPrice: Number(e.target.value) }))}
            />
            <Input
              placeholder={t("parts.note")}
              value={form.note ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">{t("actions.cancel")}</Button>
            </DialogClose>
            <Button onClick={handleAdd} disabled={isSubmitting || !form.partName || !form.unit}>
              {t("actions.add")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={costOpen} onOpenChange={setCostOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cập nhật chi phí nhân công và phát sinh</DialogTitle>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <FieldLabel>{t("cost.labor")}</FieldLabel>
              <Input
                type="number"
                min={0}
                value={costForm.laborCost ?? 0}
                onChange={(event) =>
                  setCostForm((current) => ({
                    ...current,
                    laborCost: Number(event.target.value),
                  }))
                }
              />
            </Field>
            <Field>
              <FieldLabel>{t("cost.other")}</FieldLabel>
              <Input
                type="number"
                min={0}
                value={costForm.otherCost ?? 0}
                onChange={(event) =>
                  setCostForm((current) => ({
                    ...current,
                    otherCost: Number(event.target.value),
                  }))
                }
              />
            </Field>
          </FieldGroup>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">{t("actions.cancel")}</Button>
            </DialogClose>
            <Button onClick={handleUpdateCost} disabled={isSubmitting}>
              {t("actions.update")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CostRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? "font-semibold" : ""}`}>
      <span className="text-muted-foreground">{label}</span>
      <span>{value}</span>
    </div>
  );
}
