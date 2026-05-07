import { assetMaintenanceClient } from "@/shared/api/axiosClient";
import type {
  MaintenanceWork,
  MaintenancePart,
  WorkProgressLog,
  EvidenceMedia,
  CreateWorkRequest,
  CreatePartRequest,
  CompleteWorkRequest,
  UpdateWorkCostRequest,
} from "../types/workTypes";
import {
  currentEmployeeId,
  getTechnicianName,
} from "@/features/asset-management/shared/maintenanceWorkspace";

const IS_MOCK_API = true;

const R = "/api/asset-maintenance/maintenance/records";
const P = "/api/asset-maintenance/maintenance/parts";
const M = "/api/asset-maintenance/maintenance";

const MOCK_WORKS: MaintenanceWork[] = [
  {
    id: "w1",
    assetId: "1",
    assetCode: "ELV-001",
    assetName: "Thang máy tầng 1-10",
    description: "Thay thế cáp kéo cabin tầng 1-10",
    maintenanceType: "CORRECTIVE",
    status: "ACCEPTED",
    assignedTo: "u1",
    assignedToName: "Nguyễn Văn Kỹ Thuật",
    maintenanceDate: "2025-04-10",
    dueDate: "2025-04-12",
    startedAt: "2025-04-10T08:00:00Z",
    completedAt: "2025-04-11T17:00:00Z",
    laborCost: 2500000,
    materialCost: 8000000,
    otherCost: 500000,
    totalCost: 11000000,
    paymentStatus: "PAID",
    acceptanceStatus: "ACCEPTED",
    acceptedBy: "admin",
    acceptedAt: "2025-04-12T09:00:00Z",
    createdAt: "2025-04-08T08:00:00Z",
    updatedAt: "2025-04-12T09:00:00Z",
  },
  {
    id: "w2",
    assetId: "2",
    assetCode: "FIRE-001",
    assetName: "Hệ thống chữa cháy tầng 1",
    description: "Nạp bình chữa cháy và kiểm tra đầu phun",
    maintenanceType: "PREVENTIVE",
    status: "IN_PROGRESS",
    assignedTo: "u2",
    assignedToName: "Trần Thị An Toàn",
    dueDate: "2025-05-31",
    startedAt: "2025-05-15T08:00:00Z",
    laborCost: 1500000,
    materialCost: 3000000,
    paymentStatus: "UNPAID",
    createdAt: "2025-05-10T08:00:00Z",
    updatedAt: "2025-05-15T08:00:00Z",
  },
  {
    id: "w3",
    assetId: "3",
    assetCode: "HVAC-001",
    assetName: "Máy lạnh trung tâm khu B",
    description: "Vệ sinh và nạp gas máy lạnh trung tâm",
    maintenanceType: "CLEANING",
    status: "PENDING",
    dueDate: "2025-06-10",
    paymentStatus: "NOT_REQUIRED",
    createdAt: "2025-05-20T08:00:00Z",
    updatedAt: "2025-05-20T08:00:00Z",
  },
  {
    id: "w4",
    assetId: "4",
    assetCode: "GEN-001",
    assetName: "Máy phát điện dự phòng",
    description: "Kiểm tra và bảo dưỡng máy phát điện",
    maintenanceType: "INSPECTION",
    status: "PENDING_ACCEPTANCE",
    assignedTo: "u3",
    assignedToName: "Lê Minh Cơ Điện",
    maintenanceDate: "2025-04-25",
    dueDate: "2025-04-28",
    startedAt: "2025-04-25T08:00:00Z",
    completedAt: "2025-04-26T16:00:00Z",
    laborCost: 2000000,
    materialCost: 1500000,
    totalCost: 3500000,
    paymentStatus: "AWAITING_PAYMENT",
    acceptanceStatus: "PENDING",
    createdAt: "2025-04-20T08:00:00Z",
    updatedAt: "2025-04-26T16:00:00Z",
  },
  {
    id: "w5",
    assetId: "5",
    assetCode: "PUMP-001",
    assetName: "Máy bơm nước sinh hoạt",
    description: "Sửa chữa máy bơm bị rò rỉ dầu",
    maintenanceType: "CORRECTIVE",
    status: "ASSIGNED",
    assignedTo: "u1",
    assignedToName: "Nguyễn Văn Kỹ Thuật",
    dueDate: "2025-06-05",
    paymentStatus: "UNPAID",
    createdAt: "2025-05-25T08:00:00Z",
    updatedAt: "2025-05-25T08:00:00Z",
  },
];

const MOCK_PARTS: MaintenancePart[] = [
  {
    id: "p1",
    recordId: "w1",
    partName: "Cáp kéo cabin",
    quantity: 1,
    unit: "cuộn",
    unitPrice: 6000000,
    totalPrice: 6000000,
  },
  {
    id: "p2",
    recordId: "w1",
    partName: "Dầu bôi trơn",
    quantity: 2,
    unit: "lít",
    unitPrice: 250000,
    totalPrice: 500000,
  },
  {
    id: "p3",
    recordId: "w2",
    partName: "Bình chữa cháy 8kg",
    quantity: 5,
    unit: "bình",
    unitPrice: 550000,
    totalPrice: 2750000,
  },
];

const MOCK_LOGS: WorkProgressLog[] = [
  {
    id: "l1",
    recordId: "w1",
    oldStatus: "ASSIGNED",
    newStatus: "IN_PROGRESS",
    note: "Bắt đầu thực hiện",
    loggedBy: "u1",
    loggedByName: "Nguyễn Văn Kỹ Thuật",
    loggedAt: "2025-04-10T08:00:00Z",
  },
  {
    id: "l2",
    recordId: "w1",
    oldStatus: "IN_PROGRESS",
    newStatus: "PENDING_ACCEPTANCE",
    note: "Đã hoàn thành thay cáp",
    loggedBy: "u1",
    loggedByName: "Nguyễn Văn Kỹ Thuật",
    loggedAt: "2025-04-11T17:00:00Z",
  },
];

const mock = <T>(data: T): Promise<T> => Promise.resolve(data);

function getMaterialCost(recordId: string) {
  return MOCK_PARTS.filter((part) => part.recordId === recordId).reduce(
    (sum, part) => sum + (part.totalPrice ?? 0),
    0
  );
}

function getTotalCost(work: MaintenanceWork) {
  return (work.laborCost ?? 0) + (work.materialCost ?? 0) + (work.otherCost ?? 0);
}

function refreshMockCosts(id: string) {
  const work = MOCK_WORKS.find((item) => item.id === id);
  if (!work) return undefined;
  work.materialCost = getMaterialCost(id);
  work.totalCost = getTotalCost(work);
  work.paymentStatus =
    work.totalCost > 0 ? (work.invoiceId ? "AWAITING_PAYMENT" : "UNPAID") : "NOT_REQUIRED";
  work.updatedAt = new Date().toISOString();
  return work;
}

function addMockLog(
  recordId: string,
  newStatus: MaintenanceWork["status"],
  oldStatus?: MaintenanceWork["status"],
  note?: string
) {
  MOCK_LOGS.unshift({
    id: `log-${Date.now()}`,
    recordId,
    oldStatus,
    newStatus,
    note,
    loggedBy: currentEmployeeId,
    loggedByName: getTechnicianName(currentEmployeeId) ?? currentEmployeeId,
    loggedAt: new Date().toISOString(),
  });
}

function updateMockWork(id: string, data: Partial<MaintenanceWork>) {
  const index = MOCK_WORKS.findIndex((work) => work.id === id);
  const existing = index >= 0 ? MOCK_WORKS[index] : MOCK_WORKS[0];
  const updated = { ...existing, ...data, updatedAt: new Date().toISOString() };
  updated.materialCost = getMaterialCost(id) || updated.materialCost || 0;
  updated.totalCost = getTotalCost(updated);
  if (index >= 0) MOCK_WORKS[index] = updated;
  return updated;
}

export const workApi = {
  // Records
  getAll: (params?: { assetId?: string; status?: string; maintenanceType?: string }) => {
    if (IS_MOCK_API) {
      let data = MOCK_WORKS;
      if (params?.assetId) data = data.filter((w) => w.assetId === params.assetId);
      if (params?.status) data = data.filter((w) => w.status === params.status);
      if (params?.maintenanceType)
        data = data.filter((w) => w.maintenanceType === params.maintenanceType);
      return mock(data);
    }
    return assetMaintenanceClient.get<MaintenanceWork[]>(R, { params }).then((r) => r.data);
  },

  getById: (id: string) => {
    if (IS_MOCK_API) return mock(MOCK_WORKS.find((w) => w.id === id) ?? MOCK_WORKS[0]);
    return assetMaintenanceClient.get<MaintenanceWork>(`${R}/${id}`).then((r) => r.data);
  },

  getByAsset: (assetId: string) => {
    if (IS_MOCK_API) return mock(MOCK_WORKS.filter((w) => w.assetId === assetId));
    return assetMaintenanceClient
      .get<MaintenanceWork[]>(R, { params: { assetId } })
      .then((r) => r.data);
  },

  getMyTasks: () => {
    if (IS_MOCK_API) return mock(MOCK_WORKS.filter((w) => w.assignedTo === "u1"));
    return assetMaintenanceClient.get<MaintenanceWork[]>(`${R}/my-tasks`).then((r) => r.data);
  },

  create: (data: CreateWorkRequest) => {
    if (IS_MOCK_API) {
      const created: MaintenanceWork = {
        ...data,
        id: String(Date.now()),
        assetCode: data.assetCode ?? "ASSET-NEW",
        assetName: data.assetName ?? "Tai san moi",
        status: data.assignedTo ? "ASSIGNED" : "PENDING",
        assignedToName: data.assignedToName ?? getTechnicianName(data.assignedTo),
        requestedBy: "admin",
        requestedByName: "Ban quản lý",
        notificationSentAt: data.assignedTo ? new Date().toISOString() : undefined,
        laborCost: 0,
        materialCost: 0,
        otherCost: 0,
        totalCost: 0,
        paymentStatus: "NOT_REQUIRED",
        acceptanceStatus: "PENDING",
        reportNumber: `BBBT-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      MOCK_WORKS.unshift(created);
      addMockLog(created.id, created.status, undefined, "Tạo và phân công công việc bảo trì");
      return mock(created);
    }
    return assetMaintenanceClient.post<MaintenanceWork>(R, data).then((r) => r.data);
  },

  update: (id: string, data: Partial<CreateWorkRequest & UpdateWorkCostRequest>) => {
    if (IS_MOCK_API) {
      return mock(updateMockWork(id, data));
    }
    return assetMaintenanceClient.put<MaintenanceWork>(`${R}/${id}`, data).then((r) => r.data);
  },

  assign: (id: string, assignedTo: string) => {
    if (IS_MOCK_API) {
      const existing = MOCK_WORKS.find((work) => work.id === id);
      const updated = updateMockWork(id, {
        assignedTo,
        assignedToName: getTechnicianName(assignedTo),
        status: "ASSIGNED",
        notificationSentAt: new Date().toISOString(),
      });
      addMockLog(id, "ASSIGNED", existing?.status, `Phân công cho ${assignedTo}`);
      return mock(updated);
    }
    return assetMaintenanceClient
      .post<MaintenanceWork>(`${R}/${id}/assign`, { assignedTo })
      .then((r) => r.data);
  },

  start: (id: string) => {
    if (IS_MOCK_API) {
      const existing = MOCK_WORKS.find((work) => work.id === id);
      const updated = updateMockWork(id, {
        status: "IN_PROGRESS" as const,
        startedAt: new Date().toISOString(),
        maintenanceDate: new Date().toISOString(),
      });
      addMockLog(id, "IN_PROGRESS", existing?.status, "Bắt đầu thực hiện");
      return mock(updated);
    }
    return assetMaintenanceClient.post<MaintenanceWork>(`${R}/${id}/start`).then((r) => r.data);
  },

  addProgress: (id: string, note: string) => {
    if (IS_MOCK_API) {
      const work = MOCK_WORKS.find((item) => item.id === id);
      addMockLog(id, work?.status ?? "IN_PROGRESS", work?.status, note);
      return mock({ id, note, createdAt: new Date().toISOString() });
    }
    return assetMaintenanceClient.post(`${R}/${id}/progress`, { note }).then((r) => r.data);
  },

  complete: (id: string, data?: CompleteWorkRequest | string) => {
    if (IS_MOCK_API) {
      const existing = MOCK_WORKS.find((work) => work.id === id);
      const payload = typeof data === "string" ? { technicianNote: data } : data;
      const updated = updateMockWork(id, {
        status: "PENDING_ACCEPTANCE" as const,
        completedAt: new Date().toISOString(),
        workPerformed: payload?.workPerformed,
        postMaintenanceStatus: payload?.postMaintenanceStatus,
        technicianNote: payload?.technicianNote,
        acceptanceStatus: "PENDING",
      });
      addMockLog(id, "PENDING_ACCEPTANCE", existing?.status, "Gửi biên bản chờ nghiệm thu");
      return mock(updated);
    }
    return assetMaintenanceClient
      .post<MaintenanceWork>(
        `${R}/${id}/complete`,
        typeof data === "string" ? { notes: data } : data
      )
      .then((r) => r.data);
  },

  accept: (id: string, note?: string) => {
    if (IS_MOCK_API) {
      const existing = MOCK_WORKS.find((work) => work.id === id);
      const updated = updateMockWork(id, {
        status: "ACCEPTED" as const,
        acceptanceStatus: "ACCEPTED" as const,
        acceptedBy: "admin",
        acceptedByName: "Ban quản lý",
        acceptedAt: new Date().toISOString(),
        archivedAt: new Date().toISOString(),
        managerNote: note,
        financeEntryId: existing?.totalCost ? `SQ-${id}` : existing?.financeEntryId,
      });
      addMockLog(id, "ACCEPTED", existing?.status, "Admin nghiệm thu và lưu trữ biên bản");
      return mock(updated);
    }
    return assetMaintenanceClient
      .post<MaintenanceWork>(`${R}/${id}/accept`, { note })
      .then((r) => r.data);
  },

  reject: (id: string, reason: string) => {
    if (IS_MOCK_API) {
      const existing = MOCK_WORKS.find((work) => work.id === id);
      const updated = updateMockWork(id, {
        status: "REJECTED" as const,
        acceptanceStatus: "REJECTED" as const,
        managerNote: reason,
      });
      addMockLog(id, "REJECTED", existing?.status, reason);
      return mock(updated);
    }
    return assetMaintenanceClient
      .post<MaintenanceWork>(`${R}/${id}/reject`, { reason })
      .then((r) => r.data);
  },

  generateInvoice: (id: string) => {
    if (IS_MOCK_API) {
      const invoiceId = `INV-${id}`;
      const updated = updateMockWork(id, {
        invoiceId,
        paymentStatus: "AWAITING_PAYMENT",
        financeEntryId: `SQ-${id}`,
      });
      return mock({
        invoiceId,
        financeEntryId: updated.financeEntryId,
        generatedAt: new Date().toISOString(),
      });
    }
    return assetMaintenanceClient.post(`${R}/${id}/generate-invoice`).then((r) => r.data);
  },

  getReport: (id: string) => {
    if (IS_MOCK_API) return mock({ id, reportUrl: `/reports/${id}.pdf` });
    return assetMaintenanceClient.get(`${R}/${id}/report`).then((r) => r.data);
  },

  getProgressLogs: (id: string) => {
    if (IS_MOCK_API) return mock(MOCK_LOGS.filter((l) => l.recordId === id));
    return assetMaintenanceClient
      .get<WorkProgressLog[]>(`${R}/${id}/progress-logs`)
      .then((r) => r.data);
  },

  // Parts
  getParts: (recordId: string) => {
    if (IS_MOCK_API) return mock(MOCK_PARTS.filter((p) => p.recordId === recordId));
    return assetMaintenanceClient
      .get<MaintenancePart[]>(`${R}/${recordId}/parts`)
      .then((r) => r.data);
  },

  addPart: (recordId: string, data: CreatePartRequest) => {
    if (IS_MOCK_API) {
      const part: MaintenancePart = {
        ...data,
        id: String(Date.now()),
        recordId,
        totalPrice: data.quantity * data.unitPrice,
      };
      MOCK_PARTS.push(part);
      refreshMockCosts(recordId);
      return mock(part);
    }
    return assetMaintenanceClient
      .post<MaintenancePart>(`${R}/${recordId}/parts`, data)
      .then((r) => r.data);
  },

  updatePart: (partId: string, data: Partial<CreatePartRequest>) => {
    if (IS_MOCK_API) {
      const index = MOCK_PARTS.findIndex((p) => p.id === partId);
      const existing = index >= 0 ? MOCK_PARTS[index] : MOCK_PARTS[0];
      const updated = {
        ...existing,
        ...data,
        totalPrice: (data.quantity ?? existing.quantity) * (data.unitPrice ?? existing.unitPrice),
      };
      if (index >= 0) MOCK_PARTS[index] = updated;
      refreshMockCosts(updated.recordId);
      return mock(updated);
    }
    return assetMaintenanceClient.put<MaintenancePart>(`${P}/${partId}`, data).then((r) => r.data);
  },

  deletePart: (partId: string) => {
    if (IS_MOCK_API) {
      const index = MOCK_PARTS.findIndex((part) => part.id === partId);
      const recordId = index >= 0 ? MOCK_PARTS[index].recordId : undefined;
      if (index >= 0) MOCK_PARTS.splice(index, 1);
      if (recordId) refreshMockCosts(recordId);
      return mock(null);
    }
    return assetMaintenanceClient.delete(`${P}/${partId}`).then((r) => r.data);
  },

  // Media
  getMedia: (recordId: string) => {
    if (IS_MOCK_API) return mock([] as EvidenceMedia[]);
    return assetMaintenanceClient
      .get<EvidenceMedia[]>(`${R}/${recordId}/media`)
      .then((r) => r.data);
  },

  uploadMedia: (recordId: string, file: File) => {
    if (IS_MOCK_API) {
      const media: EvidenceMedia = {
        id: String(Date.now()),
        recordId,
        fileUrl: URL.createObjectURL(file),
        mediaType: "IMAGE",
        contentType: file.type,
        uploadedAt: new Date().toISOString(),
      };
      return mock(media);
    }
    const form = new FormData();
    form.append("file", file);
    return assetMaintenanceClient
      .post<EvidenceMedia>(`${R}/${recordId}/media/upload`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data);
  },

  deleteMedia: (mediaId: string) => {
    if (IS_MOCK_API) return mock(null);
    return assetMaintenanceClient.delete(`${M}/media/${mediaId}`).then((r) => r.data);
  },

  // Dashboard
  getAdminSummary: () => {
    if (IS_MOCK_API)
      return mock({
        total: 5,
        pending: 1,
        assigned: 1,
        inProgress: 1,
        pendingAcceptance: 1,
        accepted: 1,
        completed: 0,
      });
    return assetMaintenanceClient.get(`${M}/dashboard/admin-summary`).then((r) => r.data);
  },

  getFinanceSummary: () => {
    if (IS_MOCK_API)
      return mock({ totalCost: 14500000, paid: 11000000, unpaid: 3500000, awaiting: 0 });
    return assetMaintenanceClient.get(`${M}/dashboard/finance-summary`).then((r) => r.data);
  },
};
