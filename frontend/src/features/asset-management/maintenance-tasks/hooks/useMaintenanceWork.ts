import { useState, useEffect, useCallback } from "react";
import { workApi } from "../api/workApi";
import type {
  MaintenanceWork,
  WorkProgressLog,
  MaintenancePart,
  EvidenceMedia,
  CreateWorkRequest,
  CreatePartRequest,
  UpdateWorkCostRequest,
} from "../types/workTypes";

export function useWorkByAsset(assetId: string | null) {
  const [works, setWorks] = useState<MaintenanceWork[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!assetId) {
      setWorks([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const data = await workApi.getByAsset(assetId);
      setWorks(data);
    } catch {
      setError("Failed to load maintenance work");
    } finally {
      setIsLoading(false);
    }
  }, [assetId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const createWork = useCallback(async (data: CreateWorkRequest) => {
    const created = await workApi.create(data);
    setWorks((prev) => [created, ...prev]);
    return created;
  }, []);

  const updateWork = useCallback(async (id: string, data: Parameters<typeof workApi.update>[1]) => {
    const updated = await workApi.update(id, data);
    setWorks((prev) => prev.map((w) => (w.id === id ? updated : w)));
    return updated;
  }, []);

  return { works, isLoading, error, refetch: fetch, createWork, updateWork };
}

export function useAllWork(params?: { status?: string; maintenanceType?: string }) {
  const [works, setWorks] = useState<MaintenanceWork[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await workApi.getAll(params);
      setWorks(data);
    } catch {
      setError("Failed to load work");
    } finally {
      setIsLoading(false);
    }
  }, [params?.status, params?.maintenanceType]); // eslint-disable-line

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { works, isLoading, error, refetch: fetch };
}

export function useWorkDetail(workId: string | null) {
  const [work, setWork] = useState<MaintenanceWork | null>(null);
  const [logs, setLogs] = useState<WorkProgressLog[]>([]);
  const [parts, setParts] = useState<MaintenancePart[]>([]);
  const [media, setMedia] = useState<EvidenceMedia[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetch = useCallback(async () => {
    if (!workId) return;
    setIsLoading(true);
    try {
      const [w, l, p, m] = await Promise.allSettled([
        workApi.getById(workId),
        workApi.getProgressLogs(workId),
        workApi.getParts(workId),
        workApi.getMedia(workId),
      ]);
      if (w.status === "fulfilled") setWork(w.value);
      if (l.status === "fulfilled") setLogs(l.value);
      if (p.status === "fulfilled") setParts(p.value);
      if (m.status === "fulfilled") setMedia(m.value);
    } finally {
      setIsLoading(false);
    }
  }, [workId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const addPart = useCallback(
    async (data: CreatePartRequest) => {
      if (!workId) return;
      const created = await workApi.addPart(workId, data);
      setParts((prev) => [...prev, created]);
      const updatedWork = await workApi.getById(workId);
      setWork(updatedWork);
      return created;
    },
    [workId]
  );

  const deletePart = useCallback(
    async (partId: string) => {
      await workApi.deletePart(partId);
      setParts((prev) => prev.filter((p) => p.id !== partId));
      if (workId) {
        const updatedWork = await workApi.getById(workId);
        setWork(updatedWork);
      }
    },
    [workId]
  );

  const updateCost = useCallback(
    async (data: UpdateWorkCostRequest) => {
      if (!workId) return;
      const updated = await workApi.update(workId, data);
      setWork(updated);
      return updated;
    },
    [workId]
  );

  const uploadMedia = useCallback(
    async (file: File) => {
      if (!workId) return;
      const created = await workApi.uploadMedia(workId, file);
      setMedia((prev) => [...prev, created]);
      return created;
    },
    [workId]
  );

  const deleteMedia = useCallback(async (mediaId: string) => {
    await workApi.deleteMedia(mediaId);
    setMedia((prev) => prev.filter((m) => m.id !== mediaId));
  }, []);

  const updateWorkStatus = useCallback(async (updatedWork: MaintenanceWork) => {
    setWork(updatedWork);
  }, []);

  return {
    work,
    logs,
    parts,
    media,
    isLoading,
    refetch: fetch,
    addPart,
    deletePart,
    updateCost,
    uploadMedia,
    deleteMedia,
    updateWorkStatus,
  };
}
