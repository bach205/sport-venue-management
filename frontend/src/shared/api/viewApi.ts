import axios from "axios";
import { API_BASE_URL, isMockApi } from "@/shared/constants/api";

const MOCK_TOTAL_VIEWS_KEY = "mock_total_views";

export interface TrackViewPayload {
  targetType: string;
  targetId: string;
}

export interface ViewTotalData {
  total: number;
}

export interface TrackViewData {
  target: {
    type: string;
    id: string;
    count: number;
  };
  total: number;
}

interface ApiResult<T> {
  success: boolean;
  message: string;
  data?: T;
}

function readMockTotal() {
  if (typeof window === "undefined") return 12840;
  return Number(localStorage.getItem(MOCK_TOTAL_VIEWS_KEY) || "12840");
}

function writeMockTotal(total: number) {
  if (typeof window === "undefined") return;
  localStorage.setItem(MOCK_TOTAL_VIEWS_KEY, String(total));
}

export async function getTotalViews(): Promise<ApiResult<ViewTotalData>> {
  if (isMockApi) {
    return {
      success: true,
      message: "Total views fetched successfully.",
      data: { total: readMockTotal() },
    };
  }

  try {
    const res = await axios.get(`${API_BASE_URL}/views/total`);
    return { success: true, message: res.data.message, data: res.data.data };
  } catch (err: any) {
    return {
      success: false,
      message: err.response?.data?.message ?? "Failed to fetch total views.",
    };
  }
}

export async function trackView(payload: TrackViewPayload): Promise<ApiResult<TrackViewData>> {
  if (isMockApi) {
    const total = readMockTotal() + 1;
    writeMockTotal(total);
    return {
      success: true,
      message: "View tracked successfully.",
      data: {
        target: { type: payload.targetType, id: payload.targetId, count: 1 },
        total,
      },
    };
  }

  try {
    const res = await axios.post(`${API_BASE_URL}/views/track`, payload, {
      headers: { "Content-Type": "application/json" },
    });
    return { success: true, message: res.data.message, data: res.data.data };
  } catch (err: any) {
    return {
      success: false,
      message: err.response?.data?.message ?? err.response?.data?.errors?.[0] ?? "Failed to track view.",
    };
  }
}
