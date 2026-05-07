import type { MaintenanceType } from "@/features/asset-management/maintenance-schedules/types/maintenanceTypes";

export type { MaintenanceType };

export type MaintenanceWorkStatus =
  | "PENDING"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "PENDING_ACCEPTANCE"
  | "ACCEPTED"
  | "REJECTED"
  | "COMPLETED"
  | "CANCELLED";

export type PaymentStatus = "UNPAID" | "AWAITING_PAYMENT" | "PAID" | "NOT_REQUIRED";

export type AcceptanceStatus = "PENDING" | "ACCEPTED" | "REJECTED";

export interface MaintenanceWork {
  id: string;
  assetId: string;
  assetCode: string;
  assetName: string;
  description: string;
  workPerformed?: string;
  postMaintenanceStatus?: string;
  technicianNote?: string;
  managerNote?: string;
  maintenanceType: MaintenanceType;
  status: MaintenanceWorkStatus;
  assignedTo?: string;
  assignedToName?: string;
  requestedBy?: string;
  requestedByName?: string;
  notificationSentAt?: string;
  maintenanceDate?: string;
  dueDate?: string;
  startedAt?: string;
  completedAt?: string;
  laborCost?: number;
  materialCost?: number;
  otherCost?: number;
  totalCost?: number;
  paymentStatus?: PaymentStatus;
  invoiceId?: string;
  financeEntryId?: string;
  reportNumber?: string;
  acceptanceStatus?: AcceptanceStatus;
  acceptedBy?: string;
  acceptedByName?: string;
  acceptedAt?: string;
  archivedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface MaintenancePart {
  id: string;
  recordId: string;
  partName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  note?: string;
}

export interface WorkProgressLog {
  id: string;
  recordId: string;
  oldStatus?: MaintenanceWorkStatus;
  newStatus: MaintenanceWorkStatus;
  note?: string;
  loggedBy?: string;
  loggedByName?: string;
  loggedAt: string;
}

export interface EvidenceMedia {
  id: string;
  recordId: string;
  fileUrl: string;
  mediaType: "IMAGE" | "VIDEO" | "DOCUMENT";
  contentType: string;
  uploadedBy?: string;
  uploadedByName?: string;
  uploadedAt: string;
}

export interface CreateWorkRequest {
  assetId: string;
  assetCode?: string;
  assetName?: string;
  maintenanceType: MaintenanceType;
  description: string;
  dueDate?: string;
  assignedTo?: string;
  assignedToName?: string;
}

export interface UpdateWorkCostRequest {
  laborCost?: number;
  otherCost?: number;
}

export interface CompleteWorkRequest {
  workPerformed: string;
  postMaintenanceStatus: string;
  technicianNote?: string;
}

export interface CreatePartRequest {
  partName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  note?: string;
}

export interface WorkFilterState {
  status: string;
  maintenanceType: string;
  search: string;
}

export type SlaDays = "normal" | "soon" | "overdue";

export function getSlaStatus(dueDate?: string): SlaDays {
  if (!dueDate) return "normal";
  const diff = Math.floor((new Date(dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return "overdue";
  if (diff <= 3) return "soon";
  return "normal";
}
