export const FEEDBACK_CATEGORIES = [
  "bug",
  "feature_request",
  "billing",
  "support",
  "other",
] as const;

export type FeedbackCategory = (typeof FEEDBACK_CATEGORIES)[number];

export const FEEDBACK_STATUSES = [
  "new",
  "reviewing",
  "resolved",
] as const;

export type FeedbackStatus = (typeof FEEDBACK_STATUSES)[number];

export interface FeedbackUser {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: "user" | "owner" | "admin";
}

export interface FeedbackRecord {
  id: string;
  user: FeedbackUser;
  category: FeedbackCategory;
  subject: string;
  message: string;
  rating?: number;
  status: FeedbackStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFeedbackPayload {
  category: FeedbackCategory;
  subject: string;
  message: string;
  rating?: number;
}

export interface FeedbackSummary {
  total: number;
  newCount: number;
  reviewingCount: number;
  resolvedCount: number;
  averageRating: number;
}
