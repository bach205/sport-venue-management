export type MaintenanceType =
  | "PREVENTIVE"
  | "CORRECTIVE"
  | "INSPECTION"
  | "CALIBRATION"
  | "CLEANING"
  | "OTHER";

export type MaintenanceRecordStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

export const MAINTENANCE_TYPES: MaintenanceType[] = [
  "PREVENTIVE",
  "CORRECTIVE",
  "INSPECTION",
  "CALIBRATION",
  "CLEANING",
  "OTHER",
];

export interface MaintenanceSchedule {
  id: string;
  assetId: string;
  assetCode: string;
  assetName: string;
  maintenanceType: MaintenanceType;
  name: string;
  description?: string;
  intervalDays: number;
  startDate: string;
  nextMaintenanceDate?: string;
  assignedTo?: string;
  assignedToName?: string;
  isActive: boolean;
}

export interface ProgressLog {
  id: string;
  recordId: string;
  note: string;
  createdAt: string;
  createdBy?: string;
  createdByName?: string;
}

export interface MaintenanceRecord {
  id: string;
  assetId: string;
  assetCode: string;
  assetName: string;
  maintenanceType: MaintenanceType;
  maintenanceDate?: string;
  dueDate?: string;
  assignedTo?: string;
  assignedToName?: string;
  description?: string;
  status: MaintenanceRecordStatus;
  notes?: string;
  completedAt?: string;
  progressLogs?: ProgressLog[];
}

export interface CreateScheduleRequest {
  assetId: string;
  maintenanceType: MaintenanceType;
  name: string;
  description?: string;
  intervalDays: number;
  startDate: string;
  assignedTo?: string;
}

export type UpdateScheduleRequest = Partial<Omit<CreateScheduleRequest, "assetId">>;

export interface CreateRecordRequest {
  assetId: string;
  maintenanceType: MaintenanceType;
  dueDate?: string;
  assignedTo?: string;
  description?: string;
}

export interface ScheduleFilterState {
  maintenanceType: string;
  isActive: string;
}

export interface DashboardUpcoming {
  today: MaintenanceRecord[];
  upcoming: MaintenanceRecord[];
  overdue: MaintenanceRecord[];
}
