import { useState, useEffect } from "react";
import { buildingApi } from "../api/buildingApi";
import type { Building } from "../types/assetTypes";

export function useBuildings() {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    buildingApi
      .getAll()
      .then((res: any) => setBuildings(res.data))
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Failed to load buildings")
      )
      .finally(() => setIsLoading(false));
  }, []);

  return { buildings, isLoading, error };
}
