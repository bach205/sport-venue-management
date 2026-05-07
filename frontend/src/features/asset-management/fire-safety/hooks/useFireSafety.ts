import { useState, useEffect, useCallback } from "react";
import { fireSafetyApi } from "../api/fireSafetyApi";
import type {
  FireEquipment,
  FireInspectionHistory,
  FireSafetyOverview,
  CreateFireEquipmentRequest,
  ConfirmInspectionRequest,
} from "../types/fireSafetyTypes";

interface EquipmentParams {
  assetId?: string;
  buildingId?: string;
  equipmentType?: string;
  status?: string;
}

export function useFireEquipments(params?: EquipmentParams) {
  const [equipments, setEquipments] = useState<FireEquipment[]>([]);
  const [overview, setOverview] = useState<FireSafetyOverview>({
    total: 0,
    valid: 0,
    expiringSoon: 0,
    expired: 0,
  });
  const [isLoading, setIsLoading] = useState(false);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fireSafetyApi.getEquipments(params);
      setEquipments(data);
      setOverview({
        total: data.length,
        valid: data.filter((e) => e.status === "VALID").length,
        expiringSoon: data.filter((e) => e.status === "EXPIRING_SOON").length,
        expired: data.filter((e) => e.status === "EXPIRED").length,
      });
    } finally {
      setIsLoading(false);
    }
  }, [params?.assetId, params?.buildingId, params?.equipmentType, params?.status]); // eslint-disable-line

  useEffect(() => {
    fetch();
  }, [fetch]);

  const createEquipment = useCallback(async (data: CreateFireEquipmentRequest) => {
    const created = await fireSafetyApi.createEquipment(data);
    setEquipments((prev) => [created, ...prev]);
    setOverview((ov) => ({
      ...ov,
      total: ov.total + 1,
      valid: created.status === "VALID" ? ov.valid + 1 : ov.valid,
      expiringSoon: created.status === "EXPIRING_SOON" ? ov.expiringSoon + 1 : ov.expiringSoon,
      expired: created.status === "EXPIRED" ? ov.expired + 1 : ov.expired,
    }));
    return created;
  }, []);

  const updateEquipment = useCallback(
    async (id: string, data: Partial<CreateFireEquipmentRequest>) => {
      const updated = await fireSafetyApi.updateEquipment(id, data);
      setEquipments((prev) => prev.map((e) => (e.id === id ? updated : e)));
      return updated;
    },
    []
  );

  const deleteEquipment = useCallback(async (id: string) => {
    await fireSafetyApi.deleteEquipment(id);
    setEquipments((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const confirmInspection = useCallback(async (id: string, data: ConfirmInspectionRequest) => {
    const updated = await fireSafetyApi.confirmInspection(id, data);
    setEquipments((prev) => prev.map((e) => (e.id === id ? updated : e)));
    return updated;
  }, []);

  return {
    equipments,
    overview,
    isLoading,
    refetch: fetch,
    createEquipment,
    updateEquipment,
    deleteEquipment,
    confirmInspection,
  };
}

export function useFireEquipmentDetail(equipmentId: string | null) {
  const [equipment, setEquipment] = useState<FireEquipment | null>(null);
  const [histories, setHistories] = useState<FireInspectionHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetch = useCallback(async () => {
    if (!equipmentId) return;
    setIsLoading(true);
    try {
      const [eq, hist] = await Promise.all([
        fireSafetyApi.getEquipment(equipmentId),
        fireSafetyApi.getHistories(equipmentId),
      ]);
      setEquipment(eq);
      setHistories(hist);
    } finally {
      setIsLoading(false);
    }
  }, [equipmentId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const confirmInspection = useCallback(
    async (data: ConfirmInspectionRequest) => {
      if (!equipmentId) return;
      const updated = await fireSafetyApi.confirmInspection(equipmentId, data);
      setEquipment(updated);
      await fetch();
      return updated;
    },
    [equipmentId, fetch]
  );

  return { equipment, histories, isLoading, refetch: fetch, confirmInspection };
}
