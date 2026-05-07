import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { differenceInDays, format, isPast } from "date-fns";
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Hourglass,
  UserRound,
  Wallet,
  Wrench,
} from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Separator } from "@/shared/components/ui/separator";
import { Skeleton } from "@/shared/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { maintenanceScheduleApi } from "../api/maintenanceScheduleApi";
import { workApi } from "@/features/asset-management/maintenance-tasks/api/workApi";
import {
  getSlaStatus,
  type MaintenanceWork,
} from "@/features/asset-management/maintenance-tasks/types/workTypes";
import type { MaintenanceSchedule } from "../types/maintenanceTypes";
import {
  currentEmployeeId,
  getTechnicianName,
  isAdmin,
} from "@/features/asset-management/shared/maintenanceWorkspace";

type Urgency = "overdue" | "soon" | "normal";

const DONE_WORK_STATUSES = ["ACCEPTED", "COMPLETED", "CANCELLED"];

export function MaintenanceDashboardPage() {
  const { t } = useTranslation("maintenanceSchedules");
  const [schedules, setSchedules] = useState<MaintenanceSchedule[]>([]);
  const [works, setWorks] = useState<MaintenanceWork[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    setIsLoading(true);

    Promise.all([
      maintenanceScheduleApi.getUpcoming({
        days: 30,
        assignedTo: isAdmin ? undefined : currentEmployeeId,
      }),
      workApi.getAll(),
    ])
      .then(([scheduleData, workData]) => {
        if (!mounted) return;
        setSchedules(scheduleData);
        setWorks(workData);
      })
      .catch(() => {
        if (!mounted) return;
        setSchedules([]);
        setWorks([]);
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const visibleWorks = useMemo(
    () => (isAdmin ? works : works.filter((work) => work.assignedTo === currentEmployeeId)),
    [works]
  );

  const upcomingSchedules = useMemo(
    () =>
      schedules
        .filter((s) => s.isActive && s.nextMaintenanceDate)
        .sort(
          (a, b) =>
            new Date(a.nextMaintenanceDate!).getTime() - new Date(b.nextMaintenanceDate!).getTime()
        ),
    [schedules]
  );

  const overdueSchedules = upcomingSchedules.filter((s) => getScheduleUrgency(s) === "overdue");
  const soonSchedules = upcomingSchedules.filter((s) => getScheduleUrgency(s) === "soon");
  const activeWorks = visibleWorks.filter((w) => !DONE_WORK_STATUSES.includes(w.status));
  const pendingAcceptance = visibleWorks.filter((w) => w.status === "PENDING_ACCEPTANCE");
  const overdueWorks = activeWorks.filter((w) => getSlaStatus(w.dueDate) === "overdue");
  const totalCost = visibleWorks.reduce((sum, w) => sum + (w.totalCost ?? 0), 0);

  const technicianName = getTechnicianName(currentEmployeeId) ?? currentEmployeeId;

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="flex max-w-3xl flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={isAdmin ? "default" : "secondary"}>
              {isAdmin ? "Admin" : "Kỹ thuật"}
            </Badge>
            {!isAdmin && <Badge variant="outline">{technicianName}</Badge>}
          </div>
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold tracking-tight">{t("dashboard.title")}</h1>
            <p className="text-sm text-muted-foreground">
              Theo dõi lịch bảo trì định kỳ, việc phát sinh, tiến độ nghiệm thu và chi phí trước khi
              đưa sang sổ quỹ.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link to="/asset-management/assets">
              <ClipboardList data-icon="inline-start" />
              Cây tài sản
            </Link>
          </Button>
          <Button asChild>
            <Link to="/asset-management/maintenance-work">
              <Wrench data-icon="inline-start" />
              Công tác bảo trì
            </Link>
          </Button>
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title={t("dashboard.overdue")}
          value={overdueSchedules.length + overdueWorks.length}
          description={`${overdueSchedules.length} lịch, ${overdueWorks.length} việc`}
          icon={<AlertTriangle className="text-muted-foreground" />}
        />
        <MetricCard
          title={t("dashboard.soonIn7")}
          value={soonSchedules.length}
          description="Lịch định kỳ cần chuẩn bị"
          icon={<CalendarClock className="text-muted-foreground" />}
        />
        <MetricCard
          title="Đang xử lý"
          value={activeWorks.length}
          description={`${pendingAcceptance.length} chờ nghiệm thu`}
          icon={<Hourglass className="text-muted-foreground" />}
        />
        <MetricCard
          title="Chi phí ghi nhận"
          value={formatCurrency(totalCost)}
          description="Tự động cộng theo từng đợt"
          icon={<Wallet className="text-muted-foreground" />}
        />
      </div>

      {/* Main content */}
      <div className="flex flex-col gap-6 ">
        {/* Schedule table */}
        <section className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-base font-semibold">Lịch bảo trì 30 ngày</h2>
            <p className="text-sm text-muted-foreground">
              Ưu tiên lịch quá hạn, sau đó đến lịch trong 7 ngày tới.
            </p>
          </div>

          {isLoading ? (
            <TableSkeleton cols={5} rows={4} />
          ) : upcomingSchedules.length === 0 ? (
            <EmptyState text={t("dashboard.noTasks")} />
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lịch / Tài sản</TableHead>
                    <TableHead>Loại</TableHead>
                    <TableHead>Kỹ thuật viên</TableHead>
                    <TableHead>Ưu tiên</TableHead>
                    <TableHead>Ngày tới</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {upcomingSchedules.map((schedule) => {
                    const urgency = getScheduleUrgency(schedule);
                    return (
                      <TableRow key={schedule.id}>
                        <TableCell>
                          <div className="flex min-w-44 flex-col gap-0.5">
                            <span className="font-medium">{schedule.name}</span>
                            <span className="text-sm text-muted-foreground">
                              {schedule.assetCode} — {schedule.assetName}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {t(`maintenanceType.${schedule.maintenanceType}`, {
                            defaultValue: schedule.maintenanceType,
                          })}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <UserRound className="size-3.5 shrink-0 text-muted-foreground" />
                            <span className="text-sm">{schedule.assignedToName ?? "—"}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <UrgencyBadge urgency={urgency} />
                        </TableCell>
                        <TableCell className="text-sm tabular-nums">
                          {formatDate(schedule.nextMaintenanceDate)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </section>

        {/* Work table + summary card */}
        <aside className="grid grid-cols-3 gap-6 items-end">
          {/* chiếm 2 phần */}
          <div className="col-span-2">
            <div className="flex flex-col gap-1">
              <h2 className="text-base font-semibold">
                {isAdmin ? "Theo dõi công việc" : "Việc của tôi"}
              </h2>
              <p className="text-sm text-muted-foreground">
                Trạng thái tiến độ, SLA và biên bản chờ quản lý xác nhận.
              </p>
            </div>

            {isLoading ? (
              <TableSkeleton cols={3} rows={4} />
            ) : activeWorks.length === 0 ? (
              <EmptyState text="Không có công việc đang xử lý." />
            ) : (
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tài sản / Mô tả</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead>SLA</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeWorks.slice(0, 8).map((work) => {
                      const sla = getSlaStatus(work.dueDate);
                      return (
                        <TableRow key={work.id}>
                          <TableCell>
                            <div className="flex min-w-36 flex-col gap-0.5">
                              <span className="line-clamp-1 text-sm font-medium">
                                {work.description}
                              </span>
                              <span className="truncate text-sm text-muted-foreground">
                                {work.assetCode} — {work.assetName}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <WorkStatusBadge status={work.status} />
                          </TableCell>
                          <TableCell>
                            <SlaBadge sla={sla} />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          <div className="">
            <Card className="col-span-1" size="sm">
              <CardHeader>
                <CardTitle>Luồng nghiệm thu và tài chính</CardTitle>
                <CardDescription>
                  Công việc hoàn tất sẽ chờ Admin nghiệm thu, sau đó tạo hóa đơn/sổ quỹ.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <SummaryRow label="Chờ nghiệm thu" value={pendingAcceptance.length} />
                <SummaryRow label="Tổng chi phí" value={formatCurrency(totalCost)} />
                <Button variant="outline" asChild>
                  <Link to="/asset-management/maintenance-work">
                    Mở danh sách chi tiết
                    <ArrowRight data-icon="inline-end" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </aside>
      </div>
    </div>
  );
}

// ─── Metric card ──────────────────────────────────────────────────────────────

function MetricCard({
  title,
  value,
  description,
  icon,
}: {
  title: string;
  value: number | string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <Card size="sm">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-1">
            <CardTitle className="text-sm">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <div className="shrink-0">{icon}</div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold tabular-nums">{value}</p>
      </CardContent>
    </Card>
  );
}

function SummaryRow({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium tabular-nums">{value}</span>
    </div>
  );
}

// ─── Badge helpers ────────────────────────────────────────────────────────────

function UrgencyBadge({ urgency }: { urgency: Urgency }) {
  if (urgency === "overdue") return <Badge variant="destructive">Quá hạn</Badge>;
  if (urgency === "soon") return <Badge variant="secondary">Sắp tới</Badge>;
  return <Badge variant="outline">Bình thường</Badge>;
}

function WorkStatusBadge({ status }: { status: string }) {
  if (status === "PENDING_ACCEPTANCE") return <Badge variant="secondary">Chờ nghiệm thu</Badge>;
  if (status === "IN_PROGRESS") return <Badge>Đang thực hiện</Badge>;
  if (status === "ASSIGNED") return <Badge variant="outline">Đã phân công</Badge>;
  return <Badge variant="outline">{status}</Badge>;
}

function SlaBadge({ sla }: { sla: ReturnType<typeof getSlaStatus> }) {
  if (sla === "overdue") return <Badge variant="destructive">Quá hạn</Badge>;
  if (sla === "soon") return <Badge variant="secondary">Sắp đến hạn</Badge>;
  return <Badge variant="outline">Đúng hạn</Badge>;
}

// ─── Skeleton & empty ─────────────────────────────────────────────────────────

function TableSkeleton({ cols, rows }: { cols: number; rows: number }) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border p-3">
      <Skeleton className="h-8 w-full" />
      {Array.from({ length: rows }).map((_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: skeleton
        <Skeleton key={i} className={`w-full ${cols >= 5 ? "h-12" : "h-10"}`} />
      ))}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex items-center justify-center rounded-lg border border-dashed p-8 text-sm text-muted-foreground">
      <CheckCircle2 className="mr-2 text-muted-foreground" />
      {text}
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getScheduleUrgency(schedule: MaintenanceSchedule): Urgency {
  if (!schedule.nextMaintenanceDate) return "normal";
  const date = new Date(schedule.nextMaintenanceDate);
  if (isPast(date)) return "overdue";
  if (differenceInDays(date, new Date()) <= 7) return "soon";
  return "normal";
}

function formatDate(date?: string) {
  if (!date) return "—";
  try {
    return format(new Date(date), "dd/MM/yyyy");
  } catch {
    return date;
  }
}

function formatCurrency(value: number) {
  return value.toLocaleString("vi-VN", { style: "currency", currency: "VND" });
}
