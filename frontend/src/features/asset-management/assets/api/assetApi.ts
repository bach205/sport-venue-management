import { apiRouteClient } from "@/shared/api/axiosClient";
import type { Asset, CreateAssetRequest, UpdateAssetRequest } from "../types/assetTypes";

const IS_MOCK_API = true;

const MOCK_ASSETS: Asset[] = [
  {
    id: "1",
    buildingId: "b1",
    buildingCode: "TT01",
    assetCode: "ELV-001",
    name: "Thang máy tầng 1-10",
    assetType: "ELEVATOR",
    brand: "Mitsubishi",
    model: "NexWay 1000",
    serialNumber: "SN-ELV-20240101",
    active: true,
    ownershipScope: "COMMON",
    floor: "B1-10F",
    installedAt: "2022-03-15",
    warrantyUntil: "2025-03-15",
    location: "Thang máy chính khu A",
    createdAt: "2022-03-15T08:00:00Z",
    updatedAt: "2025-01-10T10:00:00Z",
  },
  {
    id: "2",
    buildingId: "b1",
    buildingCode: "TT01",
    assetCode: "FIRE-001",
    name: "Hệ thống chữa cháy tầng 1",
    assetType: "FIRE_SUPPRESSION",
    brand: "Hochiki",
    model: "ESP-120",
    serialNumber: "SN-FIRE-20230510",
    active: true,
    ownershipScope: "COMMON",
    floor: "1F",
    installedAt: "2023-05-10",
    warrantyUntil: "2026-05-10",
    location: "Hành lang khu A, tầng 1",
    createdAt: "2023-05-10T08:00:00Z",
    updatedAt: "2025-02-20T09:30:00Z",
  },
  {
    id: "3",
    buildingId: "b2",
    buildingCode: "TT02",
    assetCode: "HVAC-001",
    name: "Máy lạnh trung tâm khu B",
    assetType: "HVAC",
    brand: "Daikin",
    model: "RZAS400MY1",
    serialNumber: "SN-HVAC-20221215",
    active: true,
    ownershipScope: "COMMON",
    floor: "RF",
    installedAt: "2022-12-15",
    warrantyUntil: "2025-12-15",
    location: "Mái khu B",
    createdAt: "2022-12-15T08:00:00Z",
    updatedAt: "2025-03-01T14:00:00Z",
  },
  {
    id: "4",
    buildingId: "b1",
    buildingCode: "TT01",
    assetCode: "GEN-001",
    name: "Máy phát điện dự phòng",
    assetType: "GENERATOR",
    brand: "Cummins",
    model: "C500 D5",
    serialNumber: "SN-GEN-20210801",
    active: false,
    ownershipScope: "COMMON",
    floor: "B1",
    installedAt: "2021-08-01",
    warrantyUntil: "2024-08-01",
    location: "Tầng hầm B1",
    createdAt: "2021-08-01T08:00:00Z",
    updatedAt: "2025-04-05T11:00:00Z",
  },
  {
    id: "5",
    buildingId: "b2",
    buildingCode: "TT02",
    assetCode: "PUMP-001",
    name: "Máy bơm nước sinh hoạt",
    assetType: "PUMP",
    brand: "Grundfos",
    model: "CM5-5 A-R",
    serialNumber: "SN-PUMP-20230201",
    active: true,
    ownershipScope: "COMMON",
    floor: "B2",
    installedAt: "2023-02-01",
    warrantyUntil: "2026-02-01",
    location: "Phòng máy bơm tầng hầm B2",
    createdAt: "2023-02-01T08:00:00Z",
    updatedAt: "2025-05-01T08:00:00Z",
  },
  {
    id: "6",
    buildingId: "b1",
    buildingCode: "TT01",
    unitId: "u101",
    unitCode: "101",
    floor: "1",
    assetCode: "AC-101",
    name: "Máy điều hòa căn hộ 101",
    assetType: "HVAC",
    brand: "Panasonic",
    model: "CS-U12ZKH-8",
    serialNumber: "SN-AC-101",
    active: true,
    ownershipScope: "PRIVATE",
    installedAt: "2023-01-15",
    warrantyUntil: "2026-01-15",
    location: "Phòng ngủ chính",
    createdAt: "2023-01-15T08:00:00Z",
    updatedAt: "2024-12-01T10:00:00Z",
  },
  {
    id: "7",
    buildingId: "b1",
    buildingCode: "TT01",
    unitId: "u101",
    unitCode: "101",
    floor: "1",
    assetCode: "DOOR-101",
    name: "Cửa thông minh căn hộ 101",
    assetType: "DOOR",
    brand: "Hafele",
    model: "D6000",
    serialNumber: "SN-DOOR-101",
    active: true,
    ownershipScope: "PRIVATE",
    installedAt: "2023-01-15",
    warrantyUntil: "2025-01-15",
    location: "Cửa chính",
    createdAt: "2023-01-15T08:00:00Z",
    updatedAt: "2024-12-01T10:00:00Z",
  },
  {
    id: "8",
    buildingId: "b1",
    buildingCode: "TT01",
    unitId: "u102",
    unitCode: "102",
    floor: "1",
    assetCode: "AC-102",
    name: "Máy điều hòa căn hộ 102",
    assetType: "HVAC",
    brand: "Daikin",
    model: "FTKZ35VVMV",
    serialNumber: "SN-AC-102",
    active: true,
    ownershipScope: "PRIVATE",
    installedAt: "2023-02-01",
    warrantyUntil: "2027-02-01",
    location: "Phòng khách",
    createdAt: "2023-02-01T08:00:00Z",
    updatedAt: "2025-01-01T10:00:00Z",
  },
  {
    id: "9",
    buildingId: "b1",
    buildingCode: "TT01",
    unitId: "u201",
    unitCode: "201",
    floor: "2",
    assetCode: "AC-201",
    name: "Máy điều hòa căn hộ 201",
    assetType: "HVAC",
    brand: "Mitsubishi",
    model: "MSZ-AP25VGD",
    serialNumber: "SN-AC-201",
    active: false,
    ownershipScope: "PRIVATE",
    installedAt: "2022-05-01",
    warrantyUntil: "2024-05-01",
    location: "Phòng ngủ",
    createdAt: "2022-05-01T08:00:00Z",
    updatedAt: "2024-05-01T10:00:00Z",
  },
  {
    id: "10",
    buildingId: "b1",
    buildingCode: "TT01",
    unitId: "u202",
    unitCode: "202",
    floor: "2",
    assetCode: "DOOR-202",
    name: "Cửa thông minh căn hộ 202",
    assetType: "DOOR",
    brand: "Hafele",
    model: "D7000",
    serialNumber: "SN-DOOR-202",
    active: true,
    ownershipScope: "PRIVATE",
    installedAt: "2023-03-01",
    warrantyUntil: "2026-03-01",
    location: "Cửa chính",
    createdAt: "2023-03-01T08:00:00Z",
    updatedAt: "2025-01-15T10:00:00Z",
  },
  {
    id: "11",
    buildingId: "b2",
    buildingCode: "TT02",
    unitId: "u301",
    unitCode: "301",
    floor: "3",
    assetCode: "CAM-301",
    name: "Camera an ninh căn hộ 301",
    assetType: "SECURITY_CAMERA",
    brand: "Hikvision",
    model: "DS-2CD2143G2-I",
    serialNumber: "SN-CAM-301",
    active: true,
    ownershipScope: "PRIVATE",
    installedAt: "2023-07-01",
    warrantyUntil: "2026-07-01",
    location: "Phòng khách",
    createdAt: "2023-07-01T08:00:00Z",
    updatedAt: "2025-02-01T10:00:00Z",
  },
  {
    id: "12",
    buildingId: "b2",
    buildingCode: "TT02",
    unitId: "u301",
    unitCode: "301",
    floor: "3",
    assetCode: "AC-301",
    name: "Máy điều hòa căn hộ 301",
    assetType: "HVAC",
    brand: "LG",
    model: "V13ENH",
    serialNumber: "SN-AC-301",
    active: true,
    ownershipScope: "PRIVATE",
    installedAt: "2023-07-01",
    warrantyUntil: "2026-07-01",
    location: "Phòng ngủ",
    createdAt: "2023-07-01T08:00:00Z",
    updatedAt: "2025-02-01T10:00:00Z",
  },
];

const mock = <T>(data: T): Promise<T> => Promise.resolve(data);

export const assetApi = {
  getAll: () => {
    if (IS_MOCK_API) return mock({ data: MOCK_ASSETS });
    return apiRouteClient.get<Asset[]>("/api/assets");
  },

  getById: (id: string) => {
    if (IS_MOCK_API) return mock({ data: MOCK_ASSETS.find((a) => a.id === id) ?? MOCK_ASSETS[0] });
    return apiRouteClient.get<Asset>(`/api/assets/${id}`);
  },

  getByBuilding: (buildingId: string) => {
    if (IS_MOCK_API) return mock({ data: MOCK_ASSETS.filter((a) => a.buildingId === buildingId) });
    return apiRouteClient.get<Asset[]>(`/api/assets/building/${buildingId}`);
  },

  getByUnit: (unitId: string) => {
    if (IS_MOCK_API) return mock({ data: MOCK_ASSETS.filter((a) => a.unitId === unitId) });
    return apiRouteClient.get<Asset[]>(`/api/assets/unit/${unitId}`);
  },

  getByType: (assetType: string) => {
    if (IS_MOCK_API) return mock({ data: MOCK_ASSETS.filter((a) => a.assetType === assetType) });
    return apiRouteClient.get<Asset[]>(`/api/assets/type/${assetType}`);
  },

  create: (data: CreateAssetRequest) => {
    if (IS_MOCK_API) {
      const newAsset: Asset = { ...data, id: String(Date.now()), active: data.active };
      return mock({ data: newAsset });
    }
    return apiRouteClient.post<Asset>("/api/assets", data);
  },

  update: (id: string, data: UpdateAssetRequest) => {
    if (IS_MOCK_API) {
      const existing = MOCK_ASSETS.find((a) => a.id === id) ?? MOCK_ASSETS[0];
      return mock({ data: { ...existing, ...data } });
    }
    return apiRouteClient.put<Asset>(`/api/assets/${id}`, data);
  },

  delete: (id: string) => {
    if (IS_MOCK_API) return mock({ data: null });
    return apiRouteClient.delete(`/api/assets/${id}`);
  },

  deactivate: (id: string) => {
    if (IS_MOCK_API) {
      const existing = MOCK_ASSETS.find((a) => a.id === id) ?? MOCK_ASSETS[0];
      return mock({ data: { ...existing, active: false } });
    }
    return apiRouteClient.put(`/api/assets/${id}/deactivate`);
  },

  importAssets: (buildingId: string, file: File) => {
    if (IS_MOCK_API) return mock({ data: MOCK_ASSETS.slice(0, 2) });
    const formData = new FormData();
    formData.append("file", file);
    formData.append("buildingId", buildingId);
    return apiRouteClient.post("/api/assets/import", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  downloadTemplate: () => {
    if (IS_MOCK_API) return mock({ data: new Blob(["template"], { type: "text/csv" }) });
    return apiRouteClient.get("/api/assets/import/template", { responseType: "blob" });
  },

  exportAssets: (params?: Record<string, string>) => {
    if (IS_MOCK_API) return mock({ data: new Blob(["export"], { type: "text/csv" }) });
    return apiRouteClient.get("/api/assets/export", { params, responseType: "blob" });
  },
};
