export type ChecklistStatus =
  | "PENDING"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "PENDING_REVIEW"
  | "COMPLETED"
  | "OVERDUE"
  | "CANCELLED";

export type ItemStatus = "TODO" | "DOING" | "DONE" | "APPROVE" | "NOT_APPROVE";

export type FrequencyUnit = "DAILY" | "WEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY";

export interface ChecklistTemplateItem {
  id: string;
  templateId: string;
  itemName: string;
  orderIndex: number;
}

export interface ChecklistTemplate {
  id: string;
  name: string;
  description?: string;
  checklistType: string;
  assetId?: string;
  assetType?: string;
  frequencyValue?: number;
  frequencyUnit?: FrequencyUnit;
  isActive: boolean;
  items: ChecklistTemplateItem[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ChecklistAssignment {
  id: string;
  templateId: string;
  templateName: string;
  assetId?: string;
  assetCode?: string;
  assetName?: string;
  assignedTo: string;
  assignedToName?: string;
  assignedBy?: string;
  assignedByName?: string;
  assignedAt?: string;
  dueDate?: string;
  status: ChecklistStatus;
  executionId?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt?: string;
}

export interface ChecklistExecutionItem {
  id: string;
  executionId: string;
  templateItemId: string;
  itemName: string;
  orderIndex: number;
  status: ItemStatus;
  note?: string; // ghi chú của kỹ thuật viên
  updatedAt?: string;
  media?: ExecutionMedia[];
}

export interface ExecutionMedia {
  id: string;
  executionId: string;
  itemId?: string;
  fileUrl: string;
  mediaType: "IMAGE" | "VIDEO" | "DOCUMENT";
  contentType?: string;
  uploadedBy?: string;
  uploadedAt?: string;
}

export interface ChecklistExecution {
  id: string;
  assignmentId: string;
  templateId: string;
  templateName?: string;
  assetId?: string;
  assetName?: string;
  executedBy?: string;
  executedByName?: string;
  startedAt?: string;
  completedAt?: string;
  status: ChecklistStatus;
  items: ChecklistExecutionItem[];
}

export interface CreateTemplateItemRequest {
  id?: string;
  itemName: string;
  orderIndex?: number;
}

export interface CreateTemplateRequest {
  name: string;
  description?: string;
  checklistType: string;
  assetId?: string;
  assetType?: string;
  frequencyValue?: number;
  frequencyUnit?: FrequencyUnit;
  items?: CreateTemplateItemRequest[];
}

export interface CreateAssignmentRequest {
  templateId: string;
  assetId?: string;
  assignedTo: string;
  dueDate?: string;
  status?: ChecklistStatus;
}

export interface UpdateItemRequest {
  status?: ItemStatus;
  note?: string; // ghi chú của kỹ thuật viên
}

export interface ChecklistReportSummary {
  totalAssignments: number;
  completed: number;
  inProgress: number;
  overdue: number;
  completionRate: number;
}
