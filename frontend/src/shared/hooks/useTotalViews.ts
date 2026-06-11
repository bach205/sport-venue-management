import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router";
import { getTotalViews, trackView } from "@/shared/api/viewApi";

const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000;
const TOTAL_VIEW_POLL_INTERVAL_MS = 30000;

function sanitizeKeyPart(value: string) {
  return encodeURIComponent(value).replace(/[^a-zA-Z0-9]/g, "_");
}

function buildViewKey(targetType: string, targetId: string) {
  return `viewed_${sanitizeKeyPart(targetType)}_${sanitizeKeyPart(targetId)}`;
}

function hasCookie(key: string) {
  return document.cookie
    .split(";")
    .some((item) => item.trim().startsWith(`${key}=`));
}

function setCookie(key: string, ttlMs: number) {
  const maxAgeSeconds = Math.floor(ttlMs / 1000);
  document.cookie = `${key}=1; Max-Age=${maxAgeSeconds}; Path=/; SameSite=Lax`;
}

function hasFreshLocalStorageKey(key: string) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return false;

    const parsed = JSON.parse(raw) as { expiresAt?: number };
    if (!parsed.expiresAt || parsed.expiresAt <= Date.now()) {
      localStorage.removeItem(key);
      return false;
    }

    return true;
  } catch {
    localStorage.removeItem(key);
    return false;
  }
}

function setLocalStorageKey(key: string, ttlMs: number) {
  localStorage.setItem(
    key,
    JSON.stringify({
      viewedAt: Date.now(),
      expiresAt: Date.now() + ttlMs,
    })
  );
}

export function useTotalViews(ttlMs = DEFAULT_TTL_MS) {
  const { pathname, search } = useLocation();
  const [totalViews, setTotalViews] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const lastTrackedKey = useRef<string | null>(null);

  const targetId = useMemo(() => `${pathname}${search || ""}`, [pathname, search]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let cancelled = false;
    const targetType = "page";
    const viewKey = buildViewKey(targetType, targetId);

    async function syncViews() {
      setLoading(true);
      const alreadyViewed = hasFreshLocalStorageKey(viewKey) || hasCookie(viewKey);

      if (!alreadyViewed && lastTrackedKey.current !== viewKey) {
        lastTrackedKey.current = viewKey;
        const result = await trackView({ targetType, targetId });

        if (!cancelled && result.success && result.data) {
          setLocalStorageKey(viewKey, ttlMs);
          setCookie(viewKey, ttlMs);
          setTotalViews(result.data.total);
          setLoading(false);
          return;
        }
      }

      const totalResult = await getTotalViews();
      if (!cancelled && totalResult.success && totalResult.data) {
        setTotalViews(totalResult.data.total);
      }
      if (!cancelled) setLoading(false);
    }

    async function refreshTotalViews() {
      const totalResult = await getTotalViews();
      if (!cancelled && totalResult.success && totalResult.data) {
        setTotalViews(totalResult.data.total);
      }
    }

    syncViews();
    const intervalId = window.setInterval(refreshTotalViews, TOTAL_VIEW_POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [targetId, ttlMs]);

  return { totalViews, loading };
}
