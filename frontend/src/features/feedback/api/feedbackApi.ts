import { apiRouteClient } from "@/shared/api/axiosClient";
import type { ApiResponse } from "@/shared/types/commonTypes";

import type {
  CreateFeedbackPayload,
  FeedbackRecord,
  FeedbackSummary,
} from "@/features/feedback/types/feedback.types";

interface FeedbackCollectionData {
  items: FeedbackRecord[];
  summary: FeedbackSummary;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

interface BackendResponse<T> {
  data: T;
  message: string;
}

const DEFAULT_LIMIT = 100;

async function handleFeedbackRequest<T>(promise: Promise<{ data: BackendResponse<T> }>, fallbackMessage: string): Promise<ApiResponse<T>> {
  try {
    const response = await promise;

    return {
      success: true,
      message: response.data.message || fallbackMessage,
      data: response.data.data,
    };
  } catch (error: any) {
    const validationErrors = Array.isArray(error?.response?.data?.errors)
      ? error.response.data.errors.join(" ")
      : "";

    return {
      success: false,
      message: error?.response?.data?.message || validationErrors || fallbackMessage,
      data: null as unknown as T,
    };
  }
}

export async function createFeedback(payload: CreateFeedbackPayload): Promise<ApiResponse<FeedbackRecord>> {
  return handleFeedbackRequest(
    apiRouteClient.post<BackendResponse<FeedbackRecord>>("/feedbacks", payload),
    "Could not send feedback."
  );
}

export async function listMyFeedbacks(): Promise<ApiResponse<FeedbackCollectionData>> {
  return handleFeedbackRequest(
    apiRouteClient.get<BackendResponse<FeedbackCollectionData>>("/feedbacks/me", {
      params: { page: 1, limit: DEFAULT_LIMIT },
    }),
    "Could not load feedback."
  );
}

export async function listAdminFeedbacks(): Promise<ApiResponse<FeedbackCollectionData>> {
  return handleFeedbackRequest(
    apiRouteClient.get<BackendResponse<FeedbackCollectionData>>("/admin/feedbacks", {
      params: { page: 1, limit: DEFAULT_LIMIT },
    }),
    "Could not load feedback."
  );
}
