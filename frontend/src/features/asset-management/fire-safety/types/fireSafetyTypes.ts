export type FireSafetyStatus = "VALID" | "EXPIRING_SOON" | "EXPIRED";
export type InspectionCycleUnit = "MONTH" | "QUARTER" | "YEAR";

export interface FireEquipment {
  id: string;
  assetId?: string;
  baseAssetId?: string;
  buildingId?: string;
  name: string;
  equipmentType: string;
  latestInspectionDate?: string;
  inspectionCycleValue?: number;
  inspectionCycleUnit?: InspectionCycleUnit;
  nextInspectionDate?: string;
  status: FireSafetyStatus;
  daysUntilDue?: number;
  certificateUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface FireInspectionHistory {
  id: string;
  equipmentId: string;
  inspectionDate: string;
  inspectionCycleValue?: number;
  inspectionCycleUnit?: InspectionCycleUnit;
  nextInspectionDate?: string;
  confirmedBy?: string;
  confirmedAt?: string;
  note?: string;
  certificateUrl?: string;
}

export interface FireSafetyOverview {
  total: number;
  valid: number;
  expiringSoon: number;
  expired: number;
}

export interface CreateFireEquipmentRequest {
  name: string;
  equipmentType: string;
  buildingId?: string;
  floorNumber?: number;
  areaName?: string;
  inspectionCycleValue?: number;
  inspectionCycleUnit?: InspectionCycleUnit;
  nextInspectionDate?: string;
  assetId?: string;
}

export interface ConfirmInspectionRequest {
  inspectionDate: string;
  nextInspectionDate?: string;
  note?: string;
  certificateUrl?: string;
}

export interface FireEquipmentFilterState {
  search: string;
  buildingId: string;
  equipmentType: string;
  status: string;
}
