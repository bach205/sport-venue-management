import { useState } from "react";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { workApi } from "../../api/workApi";
import { toast } from "sonner";
import type { MaintenanceWork } from "../../types/workTypes";

interface PaymentSectionProps {
  work: MaintenanceWork;
  canEdit: boolean;
  onStatusChange: (updated: MaintenanceWork) => void;
}

export function PaymentSection({ work, canEdit, onStatusChange }: PaymentSectionProps) {
  const { t } = useTranslation("maintenanceTasks");
  const [acceptOpen, setAcceptOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fmtDate = (d?: string) => {
    if (!d) return "—";
    try {
      return format(new Date(d), "dd/MM/yyyy HH:mm");
    } catch {
      return d;
    }
  };

  async function handleGenerate() {
    setIsSubmitting(true);
    try {
      const result = await workApi.generateInvoice(work.id);
      onStatusChange({
        ...work,
        invoiceId: result.invoiceId,
        financeEntryId: result.financeEntryId,
        paymentStatus: "AWAITING_PAYMENT",
      });
      toast.success(t("messages.invoiceGenerated"));
    } catch {
      toast.error(t("messages.invoiceError"));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleAccept() {
    setIsSubmitting(true);
    try {
      const updated = await workApi.accept(work.id, note || undefined);
      onStatusChange(updated);
      toast.success(t("messages.acceptSuccess"));
      setAcceptOpen(false);
      setNote("");
    } catch {
      toast.error(t("messages.updateError"));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleReject() {
    if (!note.trim()) return;
    setIsSubmitting(true);
    try {
      const updated = await workApi.reject(work.id, note);
      onStatusChange(updated);
      toast.success(t("messages.rejectSuccess"));
      setRejectOpen(false);
      setNote("");
    } catch {
      toast.error(t("messages.updateError"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Payment status */}
      {work.paymentStatus && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{t("detail.paymentStatus")}:</span>
          <Badge variant={getPaymentVariant(work.paymentStatus)}>
            {t(`paymentStatus.${work.paymentStatus}`, { defaultValue: work.paymentStatus })}
          </Badge>
        </div>
      )}

      {/* Invoice */}
      {work.invoiceId && (
        <div className="flex flex-col gap-1 text-sm">
          <div>
            <span className="text-muted-foreground">{t("detail.invoiceId")}: </span>
            <span className="font-mono">{work.invoiceId}</span>
          </div>
          {work.financeEntryId && (
            <div>
              <span className="text-muted-foreground">Mã sổ quỹ: </span>
              <span className="font-mono">{work.financeEntryId}</span>
            </div>
          )}
        </div>
      )}

      {/* Acceptance status */}
      {work.acceptedBy && (
        <div className="text-sm flex flex-col gap-1">
          <div>
            <span className="text-muted-foreground">{t("detail.acceptedBy")}: </span>
            <span>{work.acceptedByName ?? work.acceptedBy}</span>
          </div>
          <div>
            <span className="text-muted-foreground">{t("detail.acceptedAt")}: </span>
            <span>{fmtDate(work.acceptedAt)}</span>
          </div>
        </div>
      )}

      {/* Actions */}
      {canEdit && (
        <div className="flex gap-2 flex-wrap">
          {work.status === "PENDING_ACCEPTANCE" && (
            <>
              <Button size="sm" variant="outline" onClick={() => setAcceptOpen(true)}>
                {t("actions.accept")}
              </Button>
              <Button size="sm" variant="destructive" onClick={() => setRejectOpen(true)}>
                {t("actions.reject")}
              </Button>
            </>
          )}
          {!work.invoiceId && work.status === "ACCEPTED" && (
            <Button size="sm" variant="outline" onClick={handleGenerate} disabled={isSubmitting}>
              {t("actions.generateInvoice")}
            </Button>
          )}
        </div>
      )}

      {/* Accept dialog */}
      <Dialog
        open={acceptOpen}
        onOpenChange={(v) => {
          setAcceptOpen(v);
          if (!v) setNote("");
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("actions.accept")}</DialogTitle>
          </DialogHeader>
          <Input
            placeholder={t("form.acceptNote")}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">{t("actions.cancel")}</Button>
            </DialogClose>
            <Button onClick={handleAccept} disabled={isSubmitting}>
              {t("actions.accept")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject dialog */}
      <Dialog
        open={rejectOpen}
        onOpenChange={(v) => {
          setRejectOpen(v);
          if (!v) setNote("");
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("actions.reject")}</DialogTitle>
          </DialogHeader>
          <Input
            placeholder={t("form.rejectReason")}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">{t("actions.cancel")}</Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={isSubmitting || !note.trim()}
            >
              {t("actions.reject")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function getPaymentVariant(status: MaintenanceWork["paymentStatus"]) {
  if (status === "PAID") return "default";
  if (status === "UNPAID" || status === "AWAITING_PAYMENT") return "secondary";
  return "outline";
}
