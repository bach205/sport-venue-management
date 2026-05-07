import { useState, useEffect, useCallback } from "react";
import { assetApi } from "../api/assetApi";
import type {
  Asset,
  AssetFilterState,
  CreateAssetRequest,
  UpdateAssetRequest,
} from "../types/assetTypes";

export function useAssets(filters: AssetFilterState) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAssets = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = filters.buildingId
        ? await assetApi.getByBuilding(filters.buildingId)
        : await assetApi.getAll();
      setAssets(res.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load assets");
    } finally {
      setIsLoading(false);
    }
  }, [filters.buildingId]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  const filteredAssets = assets?.filter((asset) => {
    if (filters.status && filters.status !== "all") {
      if (asset.active !== (filters.status === "active")) return false;
    }
    if (filters.assetType && filters.assetType !== "all") {
      if (asset.assetType !== filters.assetType) return false;
    }
    if (filters.ownershipScope && filters.ownershipScope !== "all") {
      if (asset.ownershipScope !== filters.ownershipScope) return false;
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const matchName = asset.name.toLowerCase().includes(q);
      const matchCode = asset.assetCode.toLowerCase().includes(q);
      if (!matchName && !matchCode) return false;
    }
    return true;
  });

  const createAsset = async (data: CreateAssetRequest) => {
    await assetApi.create(data);
    await fetchAssets();
  };

  const updateAsset = async (id: string, data: UpdateAssetRequest) => {
    await assetApi.update(id, data);
    await fetchAssets();
  };

  const deleteAsset = async (id: string) => {
    await assetApi.delete(id);
    await fetchAssets();
  };

  return {
    assets: filteredAssets,
    allAssets: assets,
    isLoading,
    error,
    refetch: fetchAssets,
    createAsset,
    updateAsset,
    deleteAsset,
  };
}
