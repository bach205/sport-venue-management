import { useState, useEffect, useCallback } from "react";
import { checklistApi } from "../api/checklistApi";
import type {
  ChecklistTemplate,
  ChecklistAssignment,
  ChecklistExecution,
  ChecklistExecutionItem,
  CreateTemplateRequest,
  CreateAssignmentRequest,
  UpdateItemRequest,
} from "../types/checklistTypes";

export function useChecklistsByAsset(assetId: string | null) {
  const [assignments, setAssignments] = useState<ChecklistAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!assetId) {
      setAssignments([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const data = await checklistApi.getAssignments({ assetId });
      setAssignments(data);
    } catch {
      setError("Failed to load checklists");
    } finally {
      setIsLoading(false);
    }
  }, [assetId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { assignments, isLoading, error, refetch: fetch };
}

export function useAllAssignments(params?: { status?: string }) {
  const [assignments, setAssignments] = useState<ChecklistAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await checklistApi.getAssignments(params);
      setAssignments(data);
    } finally {
      setIsLoading(false);
    }
  }, [params?.status]); // eslint-disable-line

  useEffect(() => {
    fetch();
  }, [fetch]);

  const updateAssignment = useCallback(
    async (id: string, data: Partial<CreateAssignmentRequest>) => {
      const updated = await checklistApi.updateAssignment(id, data);
      setAssignments((prev) => prev.map((a) => (a.id === id ? updated : a)));
      return updated;
    },
    []
  );

  const deleteAssignment = useCallback(async (id: string) => {
    await checklistApi.deleteAssignment(id);
    setAssignments((prev) => prev.filter((a) => a.id !== id));
  }, []);

  return { assignments, isLoading, refetch: fetch, updateAssignment, deleteAssignment };
}

export function useMyAssignments() {
  const [assignments, setAssignments] = useState<ChecklistAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await checklistApi.getMyAssignments();
      setAssignments(data);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { assignments, isLoading, refetch: fetch };
}

export function useTemplates() {
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await checklistApi.getTemplates();
      setTemplates(data);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const createTemplate = useCallback(async (data: CreateTemplateRequest) => {
    const created = await checklistApi.createTemplate(data);
    setTemplates((prev) => [created, ...prev]);
    return created;
  }, []);

  const updateTemplate = useCallback(async (id: string, data: Partial<CreateTemplateRequest>) => {
    const updated = await checklistApi.updateTemplate(id, data);
    setTemplates((prev) => prev.map((t) => (t.id === id ? updated : t)));
    return updated;
  }, []);

  const deleteTemplate = useCallback(async (id: string) => {
    await checklistApi.deleteTemplate(id);
    setTemplates((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { templates, isLoading, refetch: fetch, createTemplate, updateTemplate, deleteTemplate };
}

export function useExecution(assignmentId: string | null) {
  const [assignment, setAssignment] = useState<ChecklistAssignment | null>(null);
  const [execution, setExecution] = useState<ChecklistExecution | null>(null);
  const [items, setItems] = useState<ChecklistExecutionItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetch = useCallback(async () => {
    if (!assignmentId) return;
    setIsLoading(true);
    try {
      const a = await checklistApi.getAssignment(assignmentId);
      setAssignment(a);
      if (a.executionId) {
        const [exec, execItems] = await Promise.all([
          checklistApi.getExecution(a.executionId),
          checklistApi.getExecutionItems(a.executionId),
        ]);
        setExecution(exec);
        setItems(execItems);
      }
    } finally {
      setIsLoading(false);
    }
  }, [assignmentId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const start = useCallback(async () => {
    if (!assignmentId) return;
    const exec = await checklistApi.startExecution(assignmentId);
    setExecution(exec);
    setItems(exec.items ?? []);
    setAssignment((prev) =>
      prev ? { ...prev, status: "IN_PROGRESS", executionId: exec.id } : prev
    );
    return exec;
  }, [assignmentId]);

  const complete = useCallback(async () => {
    if (!assignmentId) return;
    const updated = await checklistApi.completeExecution(assignmentId);
    setAssignment(updated);
    return updated;
  }, [assignmentId]);

  const updateItem = useCallback(
    async (itemId: string, data: UpdateItemRequest) => {
      if (!execution) return;
      const updated = await checklistApi.updateItem(execution.id, itemId, data);

      const newItems = items.map((it) => (it.id === itemId ? updated : it));
      setItems(newItems);

      // Nếu tất cả DONE → đổi assignment sang PENDING_REVIEW
      const allDone = newItems.every((it) => it.status === "DONE");
      if (allDone && assignment?.status === "IN_PROGRESS") {
        const updatedAssignment = await checklistApi.updateAssignment(assignment.id, {
          status: "PENDING_REVIEW",
        });
        setAssignment(updatedAssignment);
      }

      return updated;
    },
    [execution, items, assignment]
  );

  const uploadItemMedia = useCallback(
    async (itemId: string, file: File) => {
      if (!execution) return;
      const media = await checklistApi.uploadItemMedia(execution.id, itemId, file);
      setItems((prev) =>
        prev.map((it) => (it.id === itemId ? { ...it, media: [...(it.media ?? []), media] } : it))
      );
      return media;
    },
    [execution]
  );

  const deleteMedia = useCallback(async (mediaId: string) => {
    await checklistApi.deleteMedia(mediaId);
    setItems((prev) =>
      prev.map((it) => ({
        ...it,
        media: it.media?.filter((m) => m.id !== mediaId),
      }))
    );
  }, []);

  return {
    assignment,
    execution,
    items,
    isLoading,
    refetch: fetch,
    start,
    complete,
    updateItem,
    uploadItemMedia,
    deleteMedia,
  };
}

export function useAssignmentCreate() {
  const create = useCallback(async (data: CreateAssignmentRequest) => {
    return checklistApi.createAssignment(data);
  }, []);
  return { create };
}
