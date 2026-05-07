import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  AlertTriangle,
  CalendarClock,
  ClipboardCheck,
  Eye,
  FilterX,
  Hourglass,
  Plus,
  Search,
  UserRound,
  Wallet,
  Wrench,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { useAssets } from "@/features/asset-management/assets/hooks/useAssets";
import type { AssetFilterState } from "@/features/asset-management/assets/types/assetTypes";
import { MAINTENANCE_TYPES } from "@/features/asset-management/maintenance-schedules/types/maintenanceTypes";
import { WorkForm } from "../components/WorkForm";
import { WorkDetailPanel } from "../components/WorkDetailPanel";
import { useAllWork } from "../hooks/useMaintenanceWork";
import { workApi } from "../api/workApi";
import type { CreateWorkRequest, MaintenanceWork, MaintenanceWorkStatus } from "../types/workTypes";
import { getSlaStatus } from "../types/workTypes";
import {
  currentEmployeeId,
  getTechnicianName,
  isAdmin,
  maintenanceTechnicians,
} from "@/features/asset-management/shared/maintenanceWorkspace";
import { cn } from "@/shared/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/components/ui/tooltip";

const STATUS_OPTIONS: MaintenanceWorkStatus[] = [
  "PENDING",
  "ASSIGNED",
  "IN_PROGRESS",
  "PENDING_ACCEPTANCE",
  "ACCEPTED",
  "REJECTED",
  "COMPLETED",
  "CANCELLED",
];

const DONE_STATUSES: MaintenanceWorkStatus[] = ["ACCEPTED", "COMPLETED", "CANCELLED"];

const EMPTY_ASSET_FILTERS: AssetFilterState = {
  buildingId: "",
  assetType: "",
  status: "all",
  ownershipScope: "all",
  search: "",
};

export function MaintenanceWorkPage() {
  const { t } = useTranslation("maintenanceTasks");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [assigneeFilter, setAssigneeFilter] = useState(isAdmin ? "all" : currentEmployeeId);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [assetFilters] = useState<AssetFilterState>(EMPTY_ASSET_FILTERS);

  const { works, isLoading, refetch } = useAllWork();
  const { assets } = useAssets(assetFilters);

  const roleWorks = useMemo(
    () => (isAdmin ? works : works.filter((work) => work.assignedTo === currentEmployeeId)),
    [works]
  );

  const filteredWorks = useMemo(() => {
    return roleWorks.filter((work) => {
      if (statusFilter !== "all" && work.status !== statusFilter) return false;
      if (typeFilter !== "all" && work.maintenanceType !== typeFilter) return false;
      if (isAdmin && assigneeFilter !== "all" && work.assignedTo !== assigneeFilter) return false;

      if (!search.trim()) return true;
      const keyword = search.trim().toLowerCase();
      return (
        work.assetName?.toLowerCase().includes(keyword) ||
        work.assetCode?.toLowerCase().includes(keyword) ||
        work.assignedToName?.toLowerCase().includes(keyword) ||
        work.assignedTo?.toLowerCase().includes(keyword) ||
        work.description.toLowerCase().includes(keyword)
      );
    });
  }, [assigneeFilter, roleWorks, search, statusFilter, typeFilter]);

  const selectedWork = useMemo(
    () => works.find((work) => work.id === selectedId) ?? null,
    [selectedId, works]
  );

  const openWorks = roleWorks.filter((work) => !DONE_STATUSES.includes(work.status));
  const overdue = openWorks.filter((work) => getSlaStatus(work.dueDate) === "overdue").length;
  const pendingAcceptance = roleWorks.filter((work) => work.status === "PENDING_ACCEPTANCE").length;
  const totalCost = roleWorks.reduce((sum, work) => sum + getWorkTotal(work), 0);
  const technicianName = getTechnicianName(currentEmployeeId) ?? currentEmployeeId;

  function handleRowClick(work: MaintenanceWork) {
    setSelectedId(work.id);
    setDetailOpen(true);
  }

  async function handleCreate(values: CreateWorkRequest) {
    try {
      await workApi.create(values);
      toast.success("Đã tạo việc và gửi thông báo cho kỹ thuật viên.");
      refetch();
    } catch {
      toast.error(t("messages.createError"));
      throw new Error("create failed");
    }
  }

  function resetFilters() {
    setStatusFilter("all");
    setTypeFilter("all");
    setAssigneeFilter(isAdmin ? "all" : currentEmployeeId);
    setSearch("");
  }

  const canUpdateSelected =
    !!selectedWork && (isAdmin || selectedWork.assignedTo === currentEmployeeId);

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="flex max-w-3xl flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={isAdmin ? "default" : "secondary"}>
              {isAdmin ? "Admin" : "Kỹ thuật"}
            </Badge>
            {!isAdmin && <Badge variant="outline">{technicianName}</Badge>}
            <Badge variant="outline">tối đa 14 ngày</Badge>
          </div>
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold tracking-tight">{t("dashboard.title")}</h1>
            <p className="text-sm text-muted-foreground">
              Admin giao việc theo tài sản và kỹ thuật viên; kỹ thuật cập nhật tiến độ, vật tư, công
              lao động và biên bản để Admin nghiệm thu.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link to="/asset-management/assets">
              <ClipboardCheck data-icon="inline-start" />
              Cây tài sản
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/asset-management/maintenance-dashboard">
              <CalendarClock data-icon="inline-start" />
              Dashboard
            </Link>
          </Button>
          {isAdmin && (
            <Button onClick={() => setFormOpen(true)}>
              <Plus data-icon="inline-start" />
              Giao việc
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title={t("dashboard.totalOpen")}
          value={openWorks.length}
          description="Việc chưa đóng"
          icon={<Wrench className="text-muted-foreground" />}
        />
        <MetricCard
          title={t("dashboard.overdue")}
          value={overdue}
          description="Cần xử lý ngay"
          icon={<AlertTriangle className="text-muted-foreground" />}
        />
        <MetricCard
          title={t("dashboard.pendingAcceptance")}
          value={pendingAcceptance}
          description="Chờ quản lý xác nhận"
          icon={<Hourglass className="text-muted-foreground" />}
        />
        <MetricCard
          title={t("dashboard.totalCost")}
          value={formatCurrency(totalCost)}
          description="Ghi nhận cho sổ quỹ"
          icon={<Wallet className="text-muted-foreground" />}
        />
      </div>

      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-1 gap-2 lg:grid-cols-[minmax(260px,1fr)_180px_180px_200px_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t("filters.search")}
              className="pl-8"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t("filters.allStatuses")} />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">{t("filters.allStatuses")}</SelectItem>
                {STATUS_OPTIONS.map((status) => (
                  <SelectItem key={status} value={status}>
                    {statusLabel(status, t)}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t("filters.allTypes")} />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">{t("filters.allTypes")}</SelectItem>
                {MAINTENANCE_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {t(`maintenanceType.${type}`, { defaultValue: type })}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          <Select value={assigneeFilter} onValueChange={setAssigneeFilter} disabled={!isAdmin}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Kỹ thuật viên" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">Tất cả kỹ thuật</SelectItem>
                {maintenanceTechnicians.map((technician) => (
                  <SelectItem key={technician.id} value={technician.id}>
                    {technician.id} - {technician.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={resetFilters}>
            <FilterX data-icon="inline-start" />
            Xóa lọc
          </Button>
        </div>

        <Tabs defaultValue="list" className="gap-4">
          <TabsList>
            <TabsTrigger value="list">Danh sách</TabsTrigger>
            <TabsTrigger value="finance">Chi phí & nghiệm thu</TabsTrigger>
          </TabsList>

          <TabsContent value="list">
            {isLoading ? (
              <TableSkeleton />
            ) : filteredWorks.length === 0 ? (
              <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                Không có công việc nào.
              </div>
            ) : (
              <WorkTable works={filteredWorks} t={t} onRowClick={handleRowClick} />
            )}
          </TabsContent>

          <TabsContent value="finance">
            {isLoading ? (
              <Skeleton className="h-72 w-full rounded-lg" />
            ) : filteredWorks.length === 0 ? (
              <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                Không có dữ liệu chi phí.
              </div>
            ) : (
              <CostTable works={filteredWorks} t={t} onRowClick={handleRowClick} />
            )}
          </TabsContent>
        </Tabs>
      </div>

      <WorkForm
        open={formOpen}
        onOpenChange={setFormOpen}
        assetOptions={assets}
        technicians={maintenanceTechnicians}
        onSubmit={handleCreate}
      />

      <WorkDetailPanel
        workId={selectedId}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        canEdit={canUpdateSelected}
        canApprove={isAdmin}
        onWorkUpdated={() => refetch()}
      />
    </div>
  );
}

// ─── WorkTable (tab Danh sách) ────────────────────────────────────────────────

function WorkTable({
  works,
  t,
  onRowClick,
}: {
  works: MaintenanceWork[];
  t: ReturnType<typeof useTranslation>["t"];
  onRowClick: (work: MaintenanceWork) => void;
}) {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tài sản </TableHead>
            <TableHead>Mô tả</TableHead>
            <TableHead>Kỹ thuật viên</TableHead>
            <TableHead>Trạng thái</TableHead>
            <TableHead>Hạn xử lý</TableHead>
            <TableHead className="text-right">Tổng chi phí</TableHead>
            <TableHead>Hành động</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {works.map((work) => {
            const sla = getSlaStatus(work.dueDate);
            return (
              <TableRow key={work.id} className="cursor-pointer" onClick={() => onRowClick(work)}>
                <TableCell>
                  <div className="flex min-w-52 flex-col gap-0.5">
                    <span className="font-medium">
                      {work.assetCode} — {work.assetName}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="line-clamp-1 text-sm text-muted-foreground">
                    {work.description}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <UserRound className="size-3.5 shrink-0 text-muted-foreground" />
                    <span className="text-sm">
                      {work.assignedToName ?? work.assignedTo ?? "Chưa phân công"}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <WorkStatusBadge status={work.status} t={t} />
                </TableCell>

                <TableCell
                  className={cn(
                    "text-sm tabular-nums" +
                      (sla === "overdue"
                        ? " text-red-500 font-medium"
                        : sla === "soon"
                          ? " text-amber-500 font-medium"
                          : "")
                  )}
                >
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="inline-flex items-center gap-1 cursor-default cursor-pointer">
                        {sla === "overdue" && <AlertTriangle className="size-3 text-red-500" />}

                        {sla === "soon" && <Hourglass className="size-3 text-amber-500" />}

                        <span>{formatDate(work.dueDate)}</span>
                      </div>
                    </TooltipTrigger>

                    <TooltipContent>
                      <p>
                        {sla === "overdue"
                          ? "Công việc đã quá hạn!"
                          : sla === "soon"
                            ? "Công việc sắp đến hạn!"
                            : "Công việc đúng hạn"}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TableCell>
                <TableCell className="text-right font-medium tabular-nums">
                  {formatCurrency(getWorkTotal(work))}
                </TableCell>
                <TableCell>
                  <Button variant="outline" size="sm" onClick={() => onRowClick(work)}>
                    <Eye data-icon="inline-start" />
                    Xem
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

// ─── CostTable (tab Chi phí & nghiệm thu) ────────────────────────────────────

function CostTable({
  works,
  t,
  onRowClick,
}: {
  works: MaintenanceWork[];
  t: ReturnType<typeof useTranslation>["t"];
  onRowClick: (work: MaintenanceWork) => void;
}) {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Công việc</TableHead>
            <TableHead>Kỹ thuật</TableHead>
            <TableHead className="text-right">Nhân công</TableHead>
            <TableHead className="text-right">Vật tư</TableHead>
            <TableHead className="text-right">Phát sinh</TableHead>
            <TableHead className="text-right">Tổng</TableHead>
            <TableHead>Thanh toán</TableHead>
            <TableHead>Nghiệm thu</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {works.map((work) => (
            <TableRow key={work.id} className="cursor-pointer" onClick={() => onRowClick(work)}>
              <TableCell>
                <div className="flex min-w-64 flex-col gap-1">
                  <span className="font-medium">
                    {work.assetCode} — {work.assetName}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {statusLabel(work.status, t)}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <UserRound className="size-3.5 shrink-0 text-muted-foreground" />
                  {work.assignedToName ?? work.assignedTo ?? "—"}
                </div>
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatCurrency(work.laborCost ?? 0)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatCurrency(work.materialCost ?? 0)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatCurrency(work.otherCost ?? 0)}
              </TableCell>
              <TableCell className="text-right font-medium tabular-nums">
                {formatCurrency(getWorkTotal(work))}
              </TableCell>
              <TableCell>
                <PaymentBadge status={work.paymentStatus} />
              </TableCell>
              <TableCell>
                <AcceptanceBadge status={work.acceptanceStatus} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
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

// ─── Badge helpers ────────────────────────────────────────────────────────────

function WorkStatusBadge({
  status,
  t,
}: {
  status: MaintenanceWorkStatus;
  t: ReturnType<typeof useTranslation>["t"];
}) {
  if (status === "PENDING_ACCEPTANCE")
    return <Badge variant="secondary">{statusLabel(status, t)}</Badge>;
  if (status === "REJECTED") return <Badge variant="destructive">{statusLabel(status, t)}</Badge>;
  if (status === "IN_PROGRESS") return <Badge>{statusLabel(status, t)}</Badge>;
  return <Badge variant="outline">{statusLabel(status, t)}</Badge>;
}

function SlaBadge({ sla }: { sla: ReturnType<typeof getSlaStatus> }) {
  if (sla === "overdue") return <Badge variant="destructive">Quá hạn</Badge>;
  if (sla === "soon") return <Badge variant="secondary">Sắp đến hạn</Badge>;
  return <Badge variant="outline">Đúng hạn</Badge>;
}

function PaymentBadge({ status }: { status: MaintenanceWork["paymentStatus"] }) {
  if (!status) return <Badge variant="outline">—</Badge>;
  if (status === "PAID") return <Badge>Đã thanh toán</Badge>;
  if (status === "NOT_REQUIRED") return <Badge variant="outline">Không cần</Badge>;
  return <Badge variant="secondary">Chờ thanh toán</Badge>;
}

function AcceptanceBadge({ status }: { status: MaintenanceWork["acceptanceStatus"] }) {
  if (!status) return <Badge variant="outline">—</Badge>;
  if (status === "ACCEPTED") return <Badge>Đã nghiệm thu</Badge>;
  if (status === "REJECTED") return <Badge variant="destructive">Từ chối</Badge>;
  return <Badge variant="secondary">Chờ duyệt</Badge>;
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function TableSkeleton() {
  return (
    <div className="flex flex-col gap-2 rounded-lg border p-3">
      <Skeleton className="h-8 w-full" />
      {[1, 2, 3, 4, 5].map((row) => (
        <Skeleton key={row} className="h-12 w-full" />
      ))}
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function statusLabel(status: MaintenanceWorkStatus, t: ReturnType<typeof useTranslation>["t"]) {
  return t(`workStatus.${status}`, { defaultValue: status });
}

function getWorkTotal(work: MaintenanceWork) {
  return work.totalCost ?? (work.laborCost ?? 0) + (work.materialCost ?? 0) + (work.otherCost ?? 0);
}

function formatDate(date?: string) {
  if (!date) return "—";
  try {
    return new Intl.DateTimeFormat("vi-VN").format(new Date(date));
  } catch {
    return date;
  }
}

function formatCurrency(value: number) {
  return value.toLocaleString("vi-VN", { style: "currency", currency: "VND" });
}
