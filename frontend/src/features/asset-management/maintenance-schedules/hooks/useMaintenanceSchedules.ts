import { useState, useEffect, useCallback } from "react";
import { maintenanceScheduleApi } from "../api/maintenanceScheduleApi";
import type {
  MaintenanceSchedule,
  CreateScheduleRequest,
  UpdateScheduleRequest,
} from "../types/maintenanceTypes";

export function useMaintenanceSchedules(assetId: string | null) {
  const [schedules, setSchedules] = useState<MaintenanceSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!assetId) {
      setSchedules([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const data = await maintenanceScheduleApi.getByAsset(assetId);
      setSchedules(data);
    } catch {
      setError("Failed to load maintenance schedules");
    } finally {
      setIsLoading(false);
    }
  }, [assetId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const createSchedule = useCallback(async (data: CreateScheduleRequest) => {
    const created = await maintenanceScheduleApi.create(data);
    setSchedules((prev) => [...prev, created]);
    return created;
  }, []);

  const updateSchedule = useCallback(async (id: string, data: UpdateScheduleRequest) => {
    const updated = await maintenanceScheduleApi.update(id, data);
    setSchedules((prev) => prev.map((s) => (s.id === id ? updated : s)));
    return updated;
  }, []);

  const toggleSchedule = useCallback(async (id: string) => {
    const updated = await maintenanceScheduleApi.toggle(id);
    setSchedules((prev) => prev.map((s) => (s.id === id ? updated : s)));
    return updated;
  }, []);

  const deleteSchedule = useCallback(async (id: string) => {
    await maintenanceScheduleApi.delete(id);
    setSchedules((prev) => prev.filter((s) => s.id !== id));
  }, []);

  return {
    schedules,
    isLoading,
    error,
    refetch: fetch,
    createSchedule,
    updateSchedule,
    toggleSchedule,
    deleteSchedule,
  };
}
