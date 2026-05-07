import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { Badge } from "@/shared/components/ui/badge";
import type { MaintenanceWork, MaintenancePart } from "../../types/workTypes";

interface ReportSectionProps {
  work: MaintenanceWork;
  parts: MaintenancePart[];
}

export function ReportSection({ work, parts }: ReportSectionProps) {
  const { t } = useTranslation("maintenanceTasks");

  const totalMaterial = parts.reduce((sum, p) => sum + (p.totalPrice ?? 0), 0);
  const grandTotal = (work.laborCost ?? 0) + totalMaterial + (work.otherCost ?? 0);

  const fmt = (n?: number) =>
    n != null ? n.toLocaleString("vi-VN", { style: "currency", currency: "VND" }) : "—";

  const fmtDate = (d?: string) => {
    if (!d) return "—";
    try {
      return format(new Date(d), "dd/MM/yyyy HH:mm");
    } catch {
      return d;
    }
  };

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border p-4 text-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="font-semibold">{t("detail.report.title")}</p>
        {work.reportNumber && <Badge variant="outline">{work.reportNumber}</Badge>}
      </div>

      <ReportRow
        label={t("detail.report.asset")}
        value={`${work.assetCode ?? ""} – ${work.assetName ?? "—"}`}
      />
      <ReportRow
        label={t("detail.report.type")}
        value={t(`maintenanceType.${work.maintenanceType}`, { defaultValue: work.maintenanceType })}
      />
      <ReportRow label={t("detail.report.description")} value={work.description} />
      <ReportRow label="Công việc thực hiện" value={work.workPerformed ?? "â€”"} />
      <ReportRow label="Tình trạng sau bảo trì" value={work.postMaintenanceStatus ?? "â€”"} />
      {work.technicianNote && <ReportRow label="Ghi chú kỹ thuật" value={work.technicianNote} />}
      <ReportRow
        label={t("detail.report.assignedTo")}
        value={work.assignedToName ?? work.assignedTo ?? "—"}
      />
      <ReportRow label={t("detail.report.startedAt")} value={fmtDate(work.startedAt)} />
      <ReportRow label={t("detail.report.completedAt")} value={fmtDate(work.completedAt)} />

      {parts.length > 0 && (
        <div>
          <p className="font-medium mb-2">{t("detail.parts")}</p>
          <div className="flex flex-col gap-1">
            {parts.map((p) => (
              <div key={p.id} className="flex justify-between text-xs">
                <span className="text-muted-foreground">
                  {p.partName} ({p.quantity} {p.unit})
                </span>
                <span>{p.totalPrice?.toLocaleString()} ₫</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-1 border-t border-dashed border-border pt-2">
        <ReportRow label={t("cost.labor")} value={fmt(work.laborCost)} />
        <ReportRow label={t("cost.material")} value={fmt(totalMaterial)} />
        <ReportRow label={t("cost.other")} value={fmt(work.otherCost)} />
        <ReportRow label={t("cost.total")} value={fmt(grandTotal)} bold />
      </div>

      {work.acceptanceStatus && (
        <div className="border-t border-dashed border-border pt-2 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">{t("detail.report.acceptance")}:</span>
            <Badge variant={getAcceptanceVariant(work.acceptanceStatus)}>
              {t(`acceptanceStatus.${work.acceptanceStatus}`, {
                defaultValue: work.acceptanceStatus,
              })}
            </Badge>
          </div>
          {work.acceptedBy && (
            <ReportRow
              label={t("detail.report.acceptedBy")}
              value={`${work.acceptedBy} – ${fmtDate(work.acceptedAt)}`}
            />
          )}
          {work.managerNote && <ReportRow label="Ghi chú nghiệm thu" value={work.managerNote} />}
          {work.financeEntryId && <ReportRow label="Mã sổ quỹ" value={work.financeEntryId} />}
          {work.archivedAt && <ReportRow label="Lưu trữ lúc" value={fmtDate(work.archivedAt)} />}
        </div>
      )}
    </div>
  );
}

function ReportRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between gap-4 ${bold ? "font-semibold" : ""}`}>
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="text-right">{value}</span>
    </div>
  );
}

function getAcceptanceVariant(status: MaintenanceWork["acceptanceStatus"]) {
  if (status === "ACCEPTED") return "default";
  if (status === "REJECTED") return "destructive";
  return "secondary";
}
