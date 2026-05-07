import { assetMaintenanceClient } from "@/shared/api/axiosClient";
import type {
  MaintenanceRecord,
  CreateRecordRequest,
  DashboardUpcoming,
} from "../types/maintenanceTypes";

const IS_MOCK_API = true;

const BASE = "/api/asset-maintenance/maintenance/records";

const MOCK_RECORDS: MaintenanceRecord[] = [
  {
    id: "r1",
    assetId: "1",
    assetCode: "ELV-001",
    assetName: "Thang máy tầng 1-10",
    maintenanceType: "PREVENTIVE",
    maintenanceDate: "2025-04-01",
    dueDate: "2025-04-05",
    assignedTo: "u1",
    assignedToName: "Nguyễn Văn Kỹ Thuật",
    description: "Bảo dưỡng định kỳ quý 2",
    status: "COMPLETED",
    notes: "Đã thay dầu nhớt, kiểm tra cơ cấu ok",
    completedAt: "2025-04-04T15:00:00Z",
  },
  {
    id: "r2",
    assetId: "2",
    assetCode: "FIRE-001",
    assetName: "Hệ thống chữa cháy tầng 1",
    maintenanceType: "INSPECTION",
    dueDate: "2025-06-15",
    assignedTo: "u2",
    assignedToName: "Trần Thị An Toàn",
    description: "Kiểm tra PCCC 6 tháng đầu năm",
    status: "IN_PROGRESS",
  },
  {
    id: "r3",
    assetId: "3",
    assetCode: "HVAC-001",
    assetName: "Máy lạnh trung tâm khu B",
    maintenanceType: "CLEANING",
    dueDate: "2025-05-20",
    description: "Vệ sinh toàn bộ hệ thống điều hòa",
    status: "PENDING",
  },
  {
    id: "r4",
    assetId: "1",
    assetCode: "ELV-001",
    assetName: "Thang máy tầng 1-10",
    maintenanceType: "CORRECTIVE",
    maintenanceDate: "2025-03-10",
    dueDate: "2025-03-12",
    assignedTo: "u1",
    assignedToName: "Nguyễn Văn Kỹ Thuật",
    description: "Sửa chữa cảm biến tầng 5 bị lỗi",
    status: "COMPLETED",
    notes: "Đã thay thế cảm biến mới, thang máy hoạt động bình thường",
    completedAt: "2025-03-11T17:30:00Z",
  },
  {
    id: "r5",
    assetId: "5",
    assetCode: "PUMP-001",
    assetName: "Máy bơm nước sinh hoạt",
    maintenanceType: "PREVENTIVE",
    dueDate: "2025-04-30",
    description: "Bảo dưỡng máy bơm quý 2",
    status: "CANCELLED",
  },
];

const MOCK_UPCOMING: DashboardUpcoming = {
  // myPending: MOCK_RECORDS.filter((r) => r.status === "PENDING"),
  today: MOCK_RECORDS.filter((r) => r.status === "IN_PROGRESS"),  
  upcoming: MOCK_RECORDS.filter((r) => r.status === "PENDING"),
  overdue: MOCK_RECORDS.filter((r) => r.status === "CANCELLED"),
};

const mock = <T>(data: T): Promise<T> => Promise.resolve(data);

export const maintenanceRecordApi = {
  getAll: () => {
    if (IS_MOCK_API) return mock(MOCK_RECORDS);
    return assetMaintenanceClient.get<MaintenanceRecord[]>(BASE).then((r) => r.data);
  },

  getById: (id: string) => {
    if (IS_MOCK_API) return mock(MOCK_RECORDS.find((r) => r.id === id) ?? MOCK_RECORDS[0]);
    return assetMaintenanceClient.get<MaintenanceRecord>(`${BASE}/${id}`).then((r) => r.data);
  },

  getByAsset: (assetId: string) => {
    if (IS_MOCK_API) return mock(MOCK_RECORDS.filter((r) => r.assetId === assetId));
    return assetMaintenanceClient
      .get<MaintenanceRecord[]>(BASE, { params: { assetId } })
      .then((r) => r.data);
  },

  getMyTasks: () => {
    if (IS_MOCK_API) return mock(MOCK_RECORDS.filter((r) => r.assignedTo === "u1"));
    return assetMaintenanceClient.get<MaintenanceRecord[]>(`${BASE}/my-tasks`).then((r) => r.data);
  },

  create: (data: CreateRecordRequest) => {
    if (IS_MOCK_API) {
      const created: MaintenanceRecord = {
        ...data,
        id: String(Date.now()),
        assetCode: "ASSET-NEW",
        assetName: "Tài sản mới",
        status: "PENDING",
      };
      return mock(created);
    }
    return assetMaintenanceClient.post<MaintenanceRecord>(BASE, data).then((r) => r.data);
  },

  update: (id: string, data: Partial<CreateRecordRequest>) => {
    if (IS_MOCK_API) {
      const existing = MOCK_RECORDS.find((r) => r.id === id) ?? MOCK_RECORDS[0];
      return mock({ ...existing, ...data });
    }
    return assetMaintenanceClient.put<MaintenanceRecord>(`${BASE}/${id}`, data).then((r) => r.data);
  },

  assign: (id: string, assignedTo: string) => {
    if (IS_MOCK_API) {
      const existing = MOCK_RECORDS.find((r) => r.id === id) ?? MOCK_RECORDS[0];
      return mock({ ...existing, assignedTo, status: "IN_PROGRESS" as const });
    }
    return assetMaintenanceClient
      .post<MaintenanceRecord>(`${BASE}/${id}/assign`, { assignedTo })
      .then((r) => r.data);
  },

  start: (id: string) => {
    if (IS_MOCK_API) {
      const existing = MOCK_RECORDS.find((r) => r.id === id) ?? MOCK_RECORDS[0];
      return mock({ ...existing, status: "IN_PROGRESS" as const });
    }
    return assetMaintenanceClient
      .post<MaintenanceRecord>(`${BASE}/${id}/start`)
      .then((r) => r.data);
  },

  addProgress: (id: string, note: string) => {
    if (IS_MOCK_API) return mock({ id, note, createdAt: new Date().toISOString() });
    return assetMaintenanceClient.post(`${BASE}/${id}/progress`, { note }).then((r) => r.data);
  },

  complete: (id: string, notes?: string) => {
    if (IS_MOCK_API) {
      const existing = MOCK_RECORDS.find((r) => r.id === id) ?? MOCK_RECORDS[0];
      return mock({
        ...existing,
        status: "COMPLETED" as const,
        notes,
        completedAt: new Date().toISOString(),
      });
    }
    return assetMaintenanceClient
      .post<MaintenanceRecord>(`${BASE}/${id}/complete`, { notes })
      .then((r) => r.data);
  },

  getMyUpcoming: () => {
    if (IS_MOCK_API) return mock(MOCK_UPCOMING);
    return assetMaintenanceClient
      .get<DashboardUpcoming>("/api/asset-maintenance/maintenance/dashboard/my-upcoming")
      .then((r) => r.data);
  },

  getAdminSummary: () => {
    if (IS_MOCK_API)
      return mock({ total: 5, pending: 1, inProgress: 1, completed: 2, cancelled: 1 });
    return assetMaintenanceClient
      .get("/api/asset-maintenance/maintenance/dashboard/admin-summary")
      .then((r) => r.data);
  },
};
