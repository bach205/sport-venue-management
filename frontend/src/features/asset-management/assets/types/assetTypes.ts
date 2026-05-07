export type OwnershipScope = "COMMON" | "PRIVATE";

export type AssetStatus = "active" | "inactive" | "all";

export interface Asset {
  id: string;
  unitId?: string;
  buildingId: string;
  buildingCode?: string;
  unitCode?: string;
  floor?: string;
  assetType: string;
  roomType?: string;
  assetCode: string;
  name: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  description?: string;
  active: boolean;
  installedAt?: string;
  removedAt?: string;
  warrantyUntil?: string;
  ownershipScope?: OwnershipScope;
  location?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Building {
  id: string;
  name: string;
  code: string;
  address?: string;
}

export interface AssetFilterState {
  buildingId: string;
  assetType: string;
  status: string;
  ownershipScope: string;
  search: string;
}

export interface CreateAssetRequest {
  buildingId: string;
  unitId?: string;
  assetCode: string;
  name: string;
  assetType: string;
  ownershipScope?: OwnershipScope;
  location?: string;
  roomType?: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  description?: string;
  active: boolean;
  installedAt?: string;
  warrantyUntil?: string;
}

export type UpdateAssetRequest = Partial<CreateAssetRequest>;

export const ASSET_TYPES = [
  "ELEVATOR",
  "FIRE_SUPPRESSION",
  "HVAC",
  "ELECTRICAL",
  "PLUMBING",
  "SECURITY_CAMERA",
  "GENERATOR",
  "PUMP",
  "LIGHTING",
  "DOOR",
  "GATE",
  "OTHER",
] as const;

export type AssetType = (typeof ASSET_TYPES)[number];
