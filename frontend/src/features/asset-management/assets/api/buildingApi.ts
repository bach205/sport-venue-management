import { apiRouteClient } from "@/shared/api/axiosClient";
import type { Building } from "../types/assetTypes";

const IS_MOCK_API = true;

const MOCK_BUILDINGS: Building[] = [
  {
    id: "b1",
    name: "Tòa nhà Thăng Long 1",
    code: "TT01",
    address: "12 Nguyễn Văn Cừ, Q.5, TP.HCM",
  },
  {
    id: "b2",
    name: "Tòa nhà Thăng Long 2",
    code: "TT02",
    address: "14 Nguyễn Văn Cừ, Q.5, TP.HCM",
  },
  { id: "b3", name: "Chung cư Sunrise", code: "SR01", address: "78 Lê Văn Việt, Q.9, TP.HCM" },
];

const mock = <T>(data: T): Promise<T> => Promise.resolve(data);

export const buildingApi = {
  getAll: () => {
    if (IS_MOCK_API) return mock({ data: MOCK_BUILDINGS });
    return apiRouteClient.get<Building[]>("/api/buildings");
  },
  getById: (id: string) => {
    if (IS_MOCK_API)
      return mock({ data: MOCK_BUILDINGS.find((b) => b.id === id) ?? MOCK_BUILDINGS[0] });
    return apiRouteClient.get<Building>(`/api/buildings/${id}`);
  },
};
