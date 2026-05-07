import { assetMaintenanceClient } from "@/shared/api/axiosClient";
import type {
  FireEquipment,
  FireInspectionHistory,
  FireSafetyOverview,
  CreateFireEquipmentRequest,
  ConfirmInspectionRequest,
} from "../types/fireSafetyTypes";

const IS_MOCK_API = true;

const BASE = "/api/asset-maintenance/fire-safety";

const MOCK_EQUIPMENTS: FireEquipment[] = [
  {
    id: "fe1",
    assetId: "2",
    buildingId: "b1",
    name: "Bình chữa cháy CO2 5kg - Hành lang tầng 1",
    equipmentType: "EXTINGUISHER",
    latestInspectionDate: "2025-01-10",
    inspectionCycleValue: 6,
    inspectionCycleUnit: "MONTH",
    nextInspectionDate: "2025-07-10",
    status: "VALID",
    daysUntilDue: 50,
    createdAt: "2023-01-10T08:00:00Z",
    updatedAt: "2025-01-10T09:00:00Z",
  },
  {
    id: "fe2",
    assetId: "2",
    buildingId: "b1",
    name: "Hệ thống Sprinkler tầng 1-5",
    equipmentType: "SPRINKLER",
    latestInspectionDate: "2024-11-20",
    inspectionCycleValue: 1,
    inspectionCycleUnit: "YEAR",
    nextInspectionDate: "2025-11-20",
    status: "VALID",
    daysUntilDue: 183,
    certificateUrl: "/certificates/sprinkler-t1-5-2024.pdf",
    createdAt: "2022-06-01T08:00:00Z",
    updatedAt: "2024-11-20T10:00:00Z",
  },
  {
    id: "fe3",
    assetId: "2",
    buildingId: "b1",
    name: "Đầu báo khói tầng 6-10",
    equipmentType: "SMOKE_DETECTOR",
    latestInspectionDate: "2024-12-15",
    inspectionCycleValue: 6,
    inspectionCycleUnit: "MONTH",
    nextInspectionDate: "2025-06-15",
    status: "EXPIRING_SOON",
    daysUntilDue: 20,
    createdAt: "2022-06-01T08:00:00Z",
    updatedAt: "2024-12-15T10:00:00Z",
  },
  {
    id: "fe4",
    buildingId: "b1",
    name: "Cửa chống cháy tầng hầm B1",
    equipmentType: "FIRE_DOOR",
    latestInspectionDate: "2024-08-01",
    inspectionCycleValue: 1,
    inspectionCycleUnit: "YEAR",
    nextInspectionDate: "2025-08-01",
    status: "VALID",
    daysUntilDue: 75,
    createdAt: "2021-08-01T08:00:00Z",
    updatedAt: "2024-08-01T10:00:00Z",
  },
  {
    id: "fe5",
    buildingId: "b2",
    name: "Hộp họng cứu hỏa tầng 3",
    equipmentType: "FIRE_HYDRANT",
    latestInspectionDate: "2024-10-01",
    inspectionCycleValue: 6,
    inspectionCycleUnit: "MONTH",
    nextInspectionDate: "2025-04-01",
    status: "EXPIRED",
    daysUntilDue: -55,
    createdAt: "2022-10-01T08:00:00Z",
    updatedAt: "2024-10-01T10:00:00Z",
  },
  {
    id: "fe6",
    buildingId: "b2",
    name: "Bình chữa cháy bột ABC - Khu B tầng 5",
    equipmentType: "EXTINGUISHER",
    latestInspectionDate: "2024-09-15",
    inspectionCycleValue: 6,
    inspectionCycleUnit: "MONTH",
    nextInspectionDate: "2025-03-15",
    status: "EXPIRED",
    daysUntilDue: -72,
    createdAt: "2022-09-15T08:00:00Z",
    updatedAt: "2024-09-15T10:00:00Z",
  },
  {
    id: "fe7",
    buildingId: "b1",
    name: "Đầu báo nhiệt tầng 11-15",
    equipmentType: "HEAT_DETECTOR",
    latestInspectionDate: "2025-03-20",
    inspectionCycleValue: 6,
    inspectionCycleUnit: "MONTH",
    nextInspectionDate: "2025-09-20",
    status: "VALID",
    daysUntilDue: 117,
    createdAt: "2022-06-01T08:00:00Z",
    updatedAt: "2025-03-20T10:00:00Z",
  },
  {
    id: "fe8",
    buildingId: "b1",
    name: "Hệ thống báo cháy trung tâm",
    equipmentType: "FIRE_ALARM_PANEL",
    latestInspectionDate: "2025-02-01",
    inspectionCycleValue: 1,
    inspectionCycleUnit: "YEAR",
    nextInspectionDate: "2026-02-01",
    status: "VALID",
    daysUntilDue: 252,
    certificateUrl: "/certificates/alarm-panel-2025.pdf",
    createdAt: "2022-06-01T08:00:00Z",
    updatedAt: "2025-02-01T10:00:00Z",
  },
];

const MOCK_HISTORIES: FireInspectionHistory[] = [
  {
    id: "fh1",
    equipmentId: "fe1",
    inspectionDate: "2025-01-10",
    inspectionCycleValue: 6,
    inspectionCycleUnit: "MONTH",
    nextInspectionDate: "2025-07-10",
    confirmedBy: "u2",
    confirmedAt: "2025-01-10T10:00:00Z",
    note: "Kiểm tra đạt yêu cầu, áp suất bình đạt 16 bar",
    certificateUrl: "/certificates/fe1-2025-01.pdf",
  },
  {
    id: "fh2",
    equipmentId: "fe1",
    inspectionDate: "2024-07-12",
    inspectionCycleValue: 6,
    inspectionCycleUnit: "MONTH",
    nextInspectionDate: "2025-01-12",
    confirmedBy: "u2",
    confirmedAt: "2024-07-12T10:00:00Z",
    note: "Đạt, áp suất 15 bar",
  },
  {
    id: "fh3",
    equipmentId: "fe3",
    inspectionDate: "2024-12-15",
    inspectionCycleValue: 6,
    inspectionCycleUnit: "MONTH",
    nextInspectionDate: "2025-06-15",
    confirmedBy: "u2",
    confirmedAt: "2024-12-15T14:00:00Z",
    note: "Tất cả đầu báo hoạt động bình thường",
  },
  {
    id: "fh4",
    equipmentId: "fe5",
    inspectionDate: "2024-10-01",
    inspectionCycleValue: 6,
    inspectionCycleUnit: "MONTH",
    nextInspectionDate: "2025-04-01",
    confirmedBy: "u2",
    confirmedAt: "2024-10-01T10:00:00Z",
    note: "Đạt yêu cầu, cần theo dõi áp suất đường ống",
  },
];

const mock = <T>(data: T): Promise<T> => Promise.resolve(data);

export const fireSafetyApi = {
  getEquipments(params?: {
    assetId?: string;
    buildingId?: string;
    equipmentType?: string;
    status?: string;
  }): Promise<FireEquipment[]> {
    if (IS_MOCK_API) {
      let data = MOCK_EQUIPMENTS;
      if (params?.assetId) data = data.filter((e) => e.assetId === params.assetId);
      if (params?.buildingId) data = data.filter((e) => e.buildingId === params.buildingId);
      if (params?.equipmentType)
        data = data.filter((e) => e.equipmentType === params.equipmentType);
      if (params?.status) data = data.filter((e) => e.status === params.status);
      return mock(data);
    }
    return assetMaintenanceClient
      .get<FireEquipment[]>(`${BASE}/equipments`, { params })
      .then((r) => r.data);
  },

  getEquipment(id: string): Promise<FireEquipment> {
    if (IS_MOCK_API) return mock(MOCK_EQUIPMENTS.find((e) => e.id === id) ?? MOCK_EQUIPMENTS[0]);
    return assetMaintenanceClient
      .get<FireEquipment>(`${BASE}/equipments/${id}`)
      .then((r) => r.data);
  },

  createEquipment(data: CreateFireEquipmentRequest): Promise<FireEquipment> {
    if (IS_MOCK_API) {
      const created: FireEquipment = {
        ...data,
        id: String(Date.now()),
        status: "VALID",
        createdAt: new Date().toISOString(),
      };
      return mock(created);
    }
    return assetMaintenanceClient
      .post<FireEquipment>(`${BASE}/equipments`, data)
      .then((r) => r.data);
  },

  updateEquipment(id: string, data: Partial<CreateFireEquipmentRequest>): Promise<FireEquipment> {
    if (IS_MOCK_API) {
      const existing = MOCK_EQUIPMENTS.find((e) => e.id === id) ?? MOCK_EQUIPMENTS[0];
      return mock({ ...existing, ...data, updatedAt: new Date().toISOString() });
    }
    return assetMaintenanceClient
      .put<FireEquipment>(`${BASE}/equipments/${id}`, data)
      .then((r) => r.data);
  },

  deleteEquipment(id: string): Promise<void> {
    if (IS_MOCK_API) return mock(undefined);
    return assetMaintenanceClient.delete(`${BASE}/equipments/${id}`).then(() => undefined);
  },

  getHistories(equipmentId: string): Promise<FireInspectionHistory[]> {
    if (IS_MOCK_API) return mock(MOCK_HISTORIES.filter((h) => h.equipmentId === equipmentId));
    return assetMaintenanceClient
      .get<FireInspectionHistory[]>(`${BASE}/equipments/${equipmentId}/histories`)
      .then((r) => r.data);
  },

  confirmInspection(equipmentId: string, data: ConfirmInspectionRequest): Promise<FireEquipment> {
    if (IS_MOCK_API) {
      const existing = MOCK_EQUIPMENTS.find((e) => e.id === equipmentId) ?? MOCK_EQUIPMENTS[0];
      return mock({
        ...existing,
        latestInspectionDate: data.inspectionDate,
        nextInspectionDate: data.nextInspectionDate,
        certificateUrl: data.certificateUrl,
        status: "VALID" as const,
        updatedAt: new Date().toISOString(),
      });
    }
    return assetMaintenanceClient
      .post<FireEquipment>(`${BASE}/equipments/${equipmentId}/confirm-inspection`, data)
      .then((r) => r.data);
  },

  getOverview(params?: { assetId?: string; buildingId?: string }): Promise<FireSafetyOverview> {
    if (IS_MOCK_API) {
      let items = MOCK_EQUIPMENTS;
      if (params?.assetId) items = items.filter((e) => e.assetId === params.assetId);
      if (params?.buildingId) items = items.filter((e) => e.buildingId === params.buildingId);
      return mock({
        total: items.length,
        valid: items.filter((e) => e.status === "VALID").length,
        expiringSoon: items.filter((e) => e.status === "EXPIRING_SOON").length,
        expired: items.filter((e) => e.status === "EXPIRED").length,
      });
    }
    return assetMaintenanceClient
      .get<FireEquipment[]>(`${BASE}/equipments`, { params })
      .then((r) => {
        const items = r.data;
        return {
          total: items.length,
          valid: items.filter((e) => e.status === "VALID").length,
          expiringSoon: items.filter((e) => e.status === "EXPIRING_SOON").length,
          expired: items.filter((e) => e.status === "EXPIRED").length,
        };
      });
  },

  exportReport(params?: { buildingId?: string; status?: string }): Promise<Blob> {
    if (IS_MOCK_API) return mock(new Blob(["mock export"], { type: "application/vnd.ms-excel" }));
    return assetMaintenanceClient
      .get(`${BASE}/equipments/export`, { params, responseType: "blob" })
      .then((r) => r.data as Blob);
  },
};
