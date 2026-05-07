import { useState, useEffect, useCallback } from "react";
import { maintenanceRecordApi } from "../api/maintenanceRecordApi";
import type { MaintenanceRecord, DashboardUpcoming } from "../types/maintenanceTypes";

export function useMaintenanceRecords(assetId: string | null) {
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!assetId) {
      setRecords([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const data = await maintenanceRecordApi.getByAsset(assetId);
      setRecords(data);
    } catch {
      setError("Failed to load maintenance records");
    } finally {
      setIsLoading(false);
    }
  }, [assetId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { records, isLoading, error, refetch: fetch };
}

export function useMyUpcoming() {
  const [data, setData] = useState<DashboardUpcoming | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await maintenanceRecordApi.getMyUpcoming();
      setData(result);
    } catch {
      setError("Failed to load upcoming tasks");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, isLoading, error, refetch: fetch };
}

export function useMyTasks() {
  const [tasks, setTasks] = useState<MaintenanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await maintenanceRecordApi.getMyTasks();
      setTasks(data);
    } catch {
      setError("Failed to load tasks");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { tasks, isLoading, error, refetch: fetch };
}
