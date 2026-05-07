import { assetMaintenanceClient } from "@/shared/api/axiosClient";
import type {
  MaintenanceSchedule,
  CreateScheduleRequest,
  UpdateScheduleRequest,
} from "../types/maintenanceTypes";

const IS_MOCK_API = true;

const BASE = "/api/asset-maintenance/maintenance/schedules";

const MOCK_SCHEDULES: MaintenanceSchedule[] = [
  {
    id: "s1",
    assetId: "1",
    assetCode: "ELV-001",
    assetName: "Thang máy tầng 1-10",
    maintenanceType: "PREVENTIVE",
    name: "Bảo dưỡng thang máy định kỳ",
    description: "Kiểm tra cơ cấu kéo, dầu nhớt, cảm biến và cabin",
    intervalDays: 90,
    startDate: "2025-01-01",
    nextMaintenanceDate: "2025-07-01",
    assignedTo: "u1",
    assignedToName: "Nguyễn Văn Kỹ Thuật",
    isActive: true,
  },
  {
    id: "s2",
    assetId: "2",
    assetCode: "FIRE-001",
    assetName: "Hệ thống chữa cháy tầng 1",
    maintenanceType: "INSPECTION",
    name: "Kiểm tra PCCC định kỳ",
    description: "Kiểm tra bình chữa cháy, đầu phun, hệ thống báo cháy",
    intervalDays: 180,
    startDate: "2025-01-15",
    nextMaintenanceDate: "2025-07-15",
    assignedTo: "u2",
    assignedToName: "Trần Thị An Toàn",
    isActive: true,
  },
  {
    id: "s3",
    assetId: "3",
    assetCode: "HVAC-001",
    assetName: "Máy lạnh trung tâm khu B",
    maintenanceType: "CLEANING",
    name: "Vệ sinh máy lạnh trung tâm",
    description: "Vệ sinh lưới lọc, kiểm tra gas, châm thêm gas nếu cần",
    intervalDays: 60,
    startDate: "2025-02-01",
    nextMaintenanceDate: "2025-08-01",
    assignedTo: "u1",
    assignedToName: "Nguyễn Văn Kỹ Thuật",
    isActive: true,
  },
  {
    id: "s4",
    assetId: "5",
    assetCode: "PUMP-001",
    assetName: "Máy bơm nước sinh hoạt",
    maintenanceType: "PREVENTIVE",
    name: "Bảo dưỡng máy bơm nước",
    description: "Kiểm tra áp suất, vòng bi, dầu bơm và đường ống",
    intervalDays: 120,
    startDate: "2025-03-01",
    nextMaintenanceDate: "2025-09-01",
    assignedTo: "u3",
    assignedToName: "Lê Minh Cơ Điện",
    isActive: false,
  },
];

const mock = <T>(data: T): Promise<T> => Promise.resolve(data);

export const maintenanceScheduleApi = {
  getAll: () => {
    if (IS_MOCK_API) return mock(MOCK_SCHEDULES);
    return assetMaintenanceClient.get<MaintenanceSchedule[]>(BASE).then((r) => r.data);
  },

  getById: (id: string) => {
    if (IS_MOCK_API) return mock(MOCK_SCHEDULES.find((s) => s.id === id) ?? MOCK_SCHEDULES[0]);
    return assetMaintenanceClient.get<MaintenanceSchedule>(`${BASE}/${id}`).then((r) => r.data);
  },

  getByAsset: (assetId: string) => {
    if (IS_MOCK_API) return mock(MOCK_SCHEDULES.filter((s) => s.assetId === assetId));
    return assetMaintenanceClient
      .get<MaintenanceSchedule[]>(`${BASE}/by-asset/${assetId}`)
      .then((r) => r.data);
  },

  getUpcoming: (params?: { assignedTo?: string; days?: number }) => {
    if (IS_MOCK_API) {
      const filtered = params?.assignedTo
        ? MOCK_SCHEDULES.filter((s) => s.assignedTo === params.assignedTo)
        : MOCK_SCHEDULES;
      return mock(filtered);
    }
    return assetMaintenanceClient
      .get<MaintenanceSchedule[]>(`${BASE}/upcoming`, { params })
      .then((r) => r.data);
  },

  create: (data: CreateScheduleRequest) => {
    if (IS_MOCK_API) {
      const created: MaintenanceSchedule = {
        ...data,
        id: String(Date.now()),
        assetCode: "ASSET-NEW",
        assetName: "Tài sản mới",
        isActive: true,
      };
      return mock(created);
    }
    return assetMaintenanceClient.post<MaintenanceSchedule>(BASE, data).then((r) => r.data);
  },

  bulkCreate: (assetType: string, data: Omit<CreateScheduleRequest, "assetId">[]) => {
    if (IS_MOCK_API) return mock(MOCK_SCHEDULES.slice(0, data.length));
    return assetMaintenanceClient
      .post<MaintenanceSchedule[]>(`${BASE}/bulk`, data, { params: { assetType } })
      .then((r) => r.data);
  },

  update: (id: string, data: UpdateScheduleRequest) => {
    if (IS_MOCK_API) {
      const existing = MOCK_SCHEDULES.find((s) => s.id === id) ?? MOCK_SCHEDULES[0];
      return mock({ ...existing, ...data });
    }
    return assetMaintenanceClient
      .put<MaintenanceSchedule>(`${BASE}/${id}`, data)
      .then((r) => r.data);
  },

  toggle: (id: string) => {
    if (IS_MOCK_API) {
      const existing = MOCK_SCHEDULES.find((s) => s.id === id) ?? MOCK_SCHEDULES[0];
      return mock({ ...existing, isActive: !existing.isActive });
    }
    return assetMaintenanceClient
      .put<MaintenanceSchedule>(`${BASE}/${id}/toggle`)
      .then((r) => r.data);
  },

  delete: (id: string) => {
    if (IS_MOCK_API) return mock(null);
    return assetMaintenanceClient.delete(`${BASE}/${id}`).then((r) => r.data);
  },
};
