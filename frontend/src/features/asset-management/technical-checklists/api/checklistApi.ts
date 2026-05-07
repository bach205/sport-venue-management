import { assetMaintenanceClient } from "@/shared/api/axiosClient";
import type {
  ChecklistTemplate,
  ChecklistAssignment,
  ChecklistExecution,
  ChecklistExecutionItem,
  ExecutionMedia,
  CreateTemplateRequest,
  CreateAssignmentRequest,
  UpdateItemRequest,
  ChecklistReportSummary,
} from "../types/checklistTypes";

const IS_MOCK_API = true;

const BASE = "/api/asset-maintenance/checklists";

const MOCK_TEMPLATES: ChecklistTemplate[] = [
  {
    id: "t1",
    name: "Kiểm tra thang máy định kỳ",
    description: "Checklist kiểm tra toàn diện thang máy hàng quý",
    checklistType: "ELEVATOR_INSPECTION",
    assetType: "ELEVATOR",
    frequencyValue: 3,
    frequencyUnit: "MONTHLY",
    isActive: true,
    items: [
      { id: "ti1", templateId: "t1", itemName: "Kiểm tra cabin và cửa", orderIndex: 1 },
      { id: "ti2", templateId: "t1", itemName: "Kiểm tra cáp kéo", orderIndex: 2 },
      { id: "ti3", templateId: "t1", itemName: "Kiểm tra mô-tơ", orderIndex: 3 },
      { id: "ti4", templateId: "t1", itemName: "Kiểm tra hệ thống dừng khẩn cấp", orderIndex: 4 },
      { id: "ti5", templateId: "t1", itemName: "Đo điện áp nguồn", orderIndex: 5 },
    ],
    createdAt: "2024-01-10T08:00:00Z",
    updatedAt: "2025-01-10T08:00:00Z",
  },
  {
    id: "t2",
    name: "Kiểm tra PCCC hàng tháng",
    description: "Checklist kiểm tra thiết bị phòng cháy chữa cháy định kỳ",
    checklistType: "FIRE_SAFETY_CHECK",
    assetType: "FIRE_SUPPRESSION",
    frequencyValue: 1,
    frequencyUnit: "MONTHLY",
    isActive: true,
    items: [
      { id: "ti6", templateId: "t2", itemName: "Kiểm tra áp suất bình chữa cháy", orderIndex: 1 },
      { id: "ti7", templateId: "t2", itemName: "Kiểm tra còi báo cháy", orderIndex: 2 },
      { id: "ti8", templateId: "t2", itemName: "Kiểm tra đầu phun Sprinkler", orderIndex: 3 },
      { id: "ti9", templateId: "t2", itemName: "Kiểm tra lối thoát hiểm", orderIndex: 4 },
    ],
    createdAt: "2024-02-01T08:00:00Z",
    updatedAt: "2025-02-01T08:00:00Z",
  },
  {
    id: "t3",
    name: "Bảo dưỡng máy lạnh trung tâm",
    checklistType: "HVAC_MAINTENANCE",
    assetType: "HVAC",
    frequencyValue: 2,
    frequencyUnit: "MONTHLY",
    isActive: true,
    items: [
      { id: "ti10", templateId: "t3", itemName: "Vệ sinh lưới lọc gió", orderIndex: 1 },
      { id: "ti11", templateId: "t3", itemName: "Kiểm tra gas lạnh", orderIndex: 2 },
      { id: "ti12", templateId: "t3", itemName: "Kiểm tra dây curoa", orderIndex: 3 },
    ],
    createdAt: "2024-03-01T08:00:00Z",
    updatedAt: "2025-03-01T08:00:00Z",
  },
];

const MOCK_ASSIGNMENTS: ChecklistAssignment[] = [
  {
    id: "a1",
    templateId: "t1",
    templateName: "Kiểm tra thang máy định kỳ",
    assetId: "1",
    assetCode: "ELV-001",
    assetName: "Thang máy tầng 1-10",
    assignedTo: "u1",
    assignedToName: "Nguyễn Văn Kỹ Thuật",
    assignedBy: "admin",
    assignedByName: "Quản trị viên",
    assignedAt: "2025-04-01T08:00:00Z",
    dueDate: "2025-04-30",
    status: "PENDING_REVIEW",
    executionId: "e1",
    startedAt: "2025-04-15T08:00:00Z",
    completedAt: "2025-04-15T11:30:00Z",
    createdAt: "2025-04-01T08:00:00Z",
  },
  {
    id: "a2",
    templateId: "t2",
    templateName: "Kiểm tra PCCC hàng tháng",
    assetId: "2",
    assetCode: "FIRE-001",
    assetName: "Hệ thống chữa cháy tầng 1",
    assignedTo: "u2",
    assignedToName: "Trần Thị An Toàn",
    assignedBy: "admin",
    assignedByName: "Quản trị viên",
    assignedAt: "2025-05-01T08:00:00Z",
    dueDate: "2025-05-31",
    status: "IN_PROGRESS",
    executionId: "e2",
    startedAt: "2025-05-10T09:00:00Z",
    createdAt: "2025-05-01T08:00:00Z",
  },
  {
    id: "a3",
    templateId: "t3",
    templateName: "Bảo dưỡng máy lạnh trung tâm",
    assetId: "3",
    assetCode: "HVAC-001",
    assetName: "Máy lạnh trung tâm khu B",
    assignedTo: "u1",
    assignedToName: "Nguyễn Văn Kỹ Thuật",
    assignedBy: "admin",
    assignedByName: "Quản trị viên",
    assignedAt: "2025-05-15T08:00:00Z",
    dueDate: "2025-06-15",
    status: "IN_PROGRESS",
    executionId: "e3",
    startedAt: "2025-05-15T09:00:00Z",
    createdAt: "2025-05-15T08:00:00Z",
  },
  {
    id: "a4",
    templateId: "t2",
    templateName: "Kiểm tra PCCC hàng tháng",
    assetId: "2",
    assetCode: "FIRE-001",
    assetName: "Hệ thống chữa cháy tầng 1",
    assignedTo: "u2",
    assignedToName: "Trần Thị An Toàn",
    assignedAt: "2025-03-01T08:00:00Z",
    dueDate: "2025-03-31",
    status: "OVERDUE",
    createdAt: "2025-03-01T08:00:00Z",
  },
];

const MOCK_EXECUTION_ITEMS: ChecklistExecutionItem[] = [
  {
    id: "ei1",
    executionId: "e1",
    templateItemId: "ti1",
    itemName: "Kiểm tra cabin và cửa",
    orderIndex: 1,
    status: "DONE",
  },
  {
    id: "ei2",
    executionId: "e1",
    templateItemId: "ti2",
    itemName: "Kiểm tra cáp kéo",
    orderIndex: 2,
    status: "DONE",
  },
  {
    id: "ei3",
    executionId: "e1",
    templateItemId: "ti3",
    itemName: "Kiểm tra mô-tơ",
    orderIndex: 3,
    status: "DONE",
  },
  {
    id: "ei4",
    executionId: "e1",
    templateItemId: "ti4",
    itemName: "Kiểm tra hệ thống dừng khẩn cấp",
    orderIndex: 4,
    status: "DONE",
  },
  {
    id: "ei5",
    executionId: "e1",
    templateItemId: "ti5",
    itemName: "Đo điện áp nguồn",
    orderIndex: 5,
    status: "DONE",
  },
  {
    id: "ei6",
    executionId: "e2",
    templateItemId: "ti6",
    itemName: "Kiểm tra áp suất bình chữa cháy",
    orderIndex: 1,
    status: "DONE",
  },
  {
    id: "ei7",
    executionId: "e2",
    templateItemId: "ti7",
    itemName: "Kiểm tra còi báo cháy",
    orderIndex: 2,
    status: "DOING",
  },
  {
    id: "ei8",
    executionId: "e2",
    templateItemId: "ti8",
    itemName: "Kiểm tra đầu phun Sprinkler",
    orderIndex: 3,
    status: "TODO",
  },
  {
    id: "ei9",
    executionId: "e2",
    templateItemId: "ti9",
    itemName: "Kiểm tra lối thoát hiểm",
    orderIndex: 4,
    status: "TODO",
  },
  {
    id: "ei10",
    executionId: "e3",
    templateItemId: "ti10",
    itemName: "Vệ sinh lưới lọc gió",
    orderIndex: 1,
    status: "DONE",
  },
  {
    id: "ei11",
    executionId: "e3",
    templateItemId: "ti11",
    itemName: "Kiểm tra gas lạnh",
    orderIndex: 2,
    status: "DOING",
  },
  {
    id: "ei12",
    executionId: "e3",
    templateItemId: "ti12",
    itemName: "Kiểm tra dây curoa",
    orderIndex: 3,
    status: "TODO",
  },
];

const MOCK_EXECUTIONS: ChecklistExecution[] = [
  {
    id: "e1",
    assignmentId: "a1",
    templateId: "t1",
    templateName: "Kiểm tra thang máy định kỳ",
    assetId: "1",
    assetName: "Thang máy tầng 1-10",
    executedBy: "u1",
    executedByName: "Nguyễn Văn Kỹ Thuật",
    startedAt: "2025-04-15T08:00:00Z",
    completedAt: "2025-04-15T11:30:00Z",
    status: "COMPLETED",
    items: MOCK_EXECUTION_ITEMS.filter((i) => i.executionId === "e1"),
  },
  {
    id: "e2",
    assignmentId: "a2",
    templateId: "t2",
    templateName: "Kiểm tra PCCC hàng tháng",
    assetId: "2",
    assetName: "Hệ thống chữa cháy tầng 1",
    executedBy: "u2",
    executedByName: "Trần Thị An Toàn",
    startedAt: "2025-05-10T09:00:00Z",
    status: "IN_PROGRESS",
    items: MOCK_EXECUTION_ITEMS.filter((i) => i.executionId === "e2"),
  },
  {
    id: "e3",
    assignmentId: "a3",
    templateId: "t3",
    templateName: "Bảo dưỡng máy lạnh trung tâm",
    assetId: "3",
    assetName: "Máy lạnh trung tâm khu B",
    executedBy: "u1",
    executedByName: "Nguyễn Văn Kỹ Thuật",
    startedAt: "2025-05-15T09:00:00Z",
    status: "IN_PROGRESS",
    items: MOCK_EXECUTION_ITEMS.filter((i) => i.executionId === "e3"),
  },
];

const MOCK_REPORT: ChecklistReportSummary = {
  totalAssignments: 4,
  completed: 1,
  inProgress: 1,
  overdue: 1,
  completionRate: 25,
};

const mock = <T>(data: T): Promise<T> => Promise.resolve(data);

export const checklistApi = {
  // Templates
  getTemplates: (params?: { assetId?: string; checklistType?: string }) => {
    if (IS_MOCK_API) {
      let data = MOCK_TEMPLATES;
      if (params?.checklistType)
        data = data.filter((t) => t.checklistType === params.checklistType);
      return mock(data);
    }
    return assetMaintenanceClient
      .get<ChecklistTemplate[]>(`${BASE}/templates`, { params })
      .then((r) => r.data);
  },

  getTemplate: (id: string) => {
    if (IS_MOCK_API) return mock(MOCK_TEMPLATES.find((t) => t.id === id) ?? MOCK_TEMPLATES[0]);
    return assetMaintenanceClient
      .get<ChecklistTemplate>(`${BASE}/templates/${id}`)
      .then((r) => r.data);
  },

  createTemplate: (data: CreateTemplateRequest) => {
    if (IS_MOCK_API) {
      const newId = String(Date.now());
      const created: ChecklistTemplate = {
        ...data,
        id: newId,
        isActive: true,
        items: (data.items ?? []).map((item, idx) => ({
          id: item.id ?? `new-${Date.now()}-${idx}`,
          templateId: newId,
          itemName: item.itemName,
          orderIndex: item.orderIndex ?? idx + 1,
        })),
        createdAt: new Date().toISOString(),
      };
      return mock(created);
    }
    return assetMaintenanceClient
      .post<ChecklistTemplate>(`${BASE}/templates`, data)
      .then((r) => r.data);
  },

  updateTemplate: (id: string, data: Partial<CreateTemplateRequest>) => {
    if (IS_MOCK_API) {
      const existing = MOCK_TEMPLATES.find((t) => t.id === id) ?? MOCK_TEMPLATES[0];
      return mock({
        ...existing,
        ...data,
        items: data.items
          ? data.items.map((item, idx) => ({
              id: item.id ?? `new-${Date.now()}-${idx}`,
              templateId: id,
              itemName: item.itemName,

              orderIndex: item.orderIndex ?? idx + 1,
            }))
          : existing.items,
      });
    }
    return assetMaintenanceClient
      .put<ChecklistTemplate>(`${BASE}/templates/${id}`, data)
      .then((r) => r.data);
  },

  deleteTemplate: (id: string) => {
    if (IS_MOCK_API) return mock(null);
    return assetMaintenanceClient.delete(`${BASE}/templates/${id}`).then((r) => r.data);
  },

  // Assignments
  getAssignments: (params?: { assetId?: string; status?: string }) => {
    if (IS_MOCK_API) {
      let data = MOCK_ASSIGNMENTS;
      if (params?.assetId) data = data.filter((a) => a.assetId === params.assetId);
      if (params?.status) data = data.filter((a) => a.status === params.status);
      return mock(data);
    }
    return assetMaintenanceClient
      .get<ChecklistAssignment[]>(`${BASE}/assignments`, { params })
      .then((r) => r.data);
  },

  getAssignment: (id: string) => {
    if (IS_MOCK_API) return mock(MOCK_ASSIGNMENTS.find((a) => a.id === id) ?? MOCK_ASSIGNMENTS[0]);
    return assetMaintenanceClient
      .get<ChecklistAssignment>(`${BASE}/assignments/${id}`)
      .then((r) => r.data);
  },

  createAssignment: (data: CreateAssignmentRequest) => {
    if (IS_MOCK_API) {
      const template = MOCK_TEMPLATES.find((t) => t.id === data.templateId) ?? MOCK_TEMPLATES[0];
      const execId = `exec-${Date.now()}`;
      const created: ChecklistAssignment = {
        ...data,
        id: String(Date.now()),
        templateName: template.name,
        status: "IN_PROGRESS",
        executionId: execId,
        assignedAt: new Date().toISOString(),
        startedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };
      return mock(created);
    }
    return assetMaintenanceClient
      .post<ChecklistAssignment>(`${BASE}/assignments`, data)
      .then((r) => r.data);
  },

  updateAssignment: (id: string, data: Partial<CreateAssignmentRequest>) => {
    if (IS_MOCK_API) {
      const existing = MOCK_ASSIGNMENTS.find((a) => a.id === id) ?? MOCK_ASSIGNMENTS[0];
      return mock({ ...existing, ...data });
    }
    return assetMaintenanceClient
      .put<ChecklistAssignment>(`${BASE}/assignments/${id}`, data)
      .then((r) => r.data);
  },

  deleteAssignment: (id: string) => {
    if (IS_MOCK_API) return mock(null);
    return assetMaintenanceClient.delete(`${BASE}/assignments/${id}`).then((r) => r.data);
  },

  getMyAssignments: () => {
    if (IS_MOCK_API) return mock(MOCK_ASSIGNMENTS.filter((a) => a.assignedTo === "u1"));
    return assetMaintenanceClient
      .get<ChecklistAssignment[]>(`${BASE}/my-assignments`)
      .then((r) => r.data);
  },

  // Execution
  startExecution: (assignmentId: string) => {
    if (IS_MOCK_API) {
      const assignment = MOCK_ASSIGNMENTS.find((a) => a.id === assignmentId) ?? MOCK_ASSIGNMENTS[0];
      const execution: ChecklistExecution = {
        id: String(Date.now()),
        assignmentId,
        templateId: assignment.templateId,
        templateName: assignment.templateName,
        assetId: assignment.assetId,
        assetName: assignment.assetName,
        executedBy: "u1",
        executedByName: "Nguyễn Văn Kỹ Thuật",
        startedAt: new Date().toISOString(),
        status: "IN_PROGRESS",
        items: [],
      };
      return mock(execution);
    }
    return assetMaintenanceClient
      .post<ChecklistExecution>(`${BASE}/assignments/${assignmentId}/start`)
      .then((r) => r.data);
  },

  completeExecution: (assignmentId: string) => {
    if (IS_MOCK_API) {
      const existing = MOCK_ASSIGNMENTS.find((a) => a.id === assignmentId) ?? MOCK_ASSIGNMENTS[0];
      return mock({
        ...existing,
        status: "COMPLETED" as const,
        completedAt: new Date().toISOString(),
      });
    }
    return assetMaintenanceClient
      .post<ChecklistAssignment>(`${BASE}/assignments/${assignmentId}/complete`)
      .then((r) => r.data);
  },

  getExecution: (executionId: string) => {
    if (IS_MOCK_API)
      return mock(MOCK_EXECUTIONS.find((e) => e.id === executionId) ?? MOCK_EXECUTIONS[0]);
    return assetMaintenanceClient
      .get<ChecklistExecution>(`${BASE}/executions/${executionId}`)
      .then((r) => r.data);
  },

  getExecutionItems: (executionId: string) => {
    if (IS_MOCK_API) return mock(MOCK_EXECUTION_ITEMS.filter((i) => i.executionId === executionId));
    return assetMaintenanceClient
      .get<ChecklistExecutionItem[]>(`${BASE}/executions/${executionId}/items`)
      .then((r) => r.data);
  },

  updateItem: (executionId: string, itemId: string, data: UpdateItemRequest) => {
    if (IS_MOCK_API) {
      const existing = MOCK_EXECUTION_ITEMS.find((i) => i.id === itemId) ?? MOCK_EXECUTION_ITEMS[0];
      return mock({ ...existing, ...data });
    }
    return assetMaintenanceClient
      .post<ChecklistExecutionItem>(`${BASE}/executions/${executionId}/items/${itemId}`, data)
      .then((r) => r.data);
  },

  // Media
  uploadItemMedia: (executionId: string, itemId: string, file: File) => {
    if (IS_MOCK_API) {
      const media: ExecutionMedia = {
        id: String(Date.now()),
        executionId,
        itemId,
        fileUrl: URL.createObjectURL(file),
        mediaType: "IMAGE",
        uploadedAt: new Date().toISOString(),
      };
      return mock(media);
    }
    const form = new FormData();
    form.append("file", file);
    return assetMaintenanceClient
      .post<ExecutionMedia>(
        `${BASE}/executions/${executionId}/items/${itemId}/media/upload`,
        form,
        { headers: { "Content-Type": "multipart/form-data" } }
      )
      .then((r) => r.data);
  },

  getExecutionMedia: (executionId: string) => {
    if (IS_MOCK_API) return mock([] as ExecutionMedia[]);
    return assetMaintenanceClient
      .get<ExecutionMedia[]>(`${BASE}/executions/${executionId}/media`)
      .then((r) => r.data);
  },

  deleteMedia: (mediaId: string) => {
    if (IS_MOCK_API) return mock(null);
    return assetMaintenanceClient.delete(`${BASE}/media/${mediaId}`).then((r) => r.data);
  },

  // Reports
  getReportSummary: (params?: { assetId?: string; from?: string; to?: string }) => {
    if (IS_MOCK_API) return mock(MOCK_REPORT);
    return assetMaintenanceClient
      .get<ChecklistReportSummary>(`${BASE}/reports/summary`, { params })
      .then((r) => r.data);
  },

  getReportByExecutor: (params?: { from?: string; to?: string }) => {
    if (IS_MOCK_API)
      return mock([
        { executor: "Nguyễn Văn Kỹ Thuật", completed: 1, inProgress: 1, total: 2 },
        { executor: "Trần Thị An Toàn", completed: 0, inProgress: 1, total: 2 },
      ]);
    return assetMaintenanceClient
      .get(`${BASE}/reports/by-executor`, { params })
      .then((r) => r.data);
  },

  getReportByCategory: (params?: { from?: string; to?: string }) => {
    if (IS_MOCK_API)
      return mock([
        { category: "Thang máy", total: 1, completed: 1 },
        { category: "PCCC", total: 2, completed: 0 },
        { category: "HVAC", total: 1, completed: 0 },
      ]);
    return assetMaintenanceClient
      .get(`${BASE}/reports/by-category`, { params })
      .then((r) => r.data);
  },

  getReportByTimeRange: (params?: { from?: string; to?: string }) => {
    if (IS_MOCK_API)
      return mock([
        { month: "2025-03", completed: 0, total: 1 },
        { month: "2025-04", completed: 1, total: 1 },
        { month: "2025-05", completed: 0, total: 2 },
      ]);
    return assetMaintenanceClient
      .get(`${BASE}/reports/by-time-range`, { params })
      .then((r) => r.data);
  },
};
