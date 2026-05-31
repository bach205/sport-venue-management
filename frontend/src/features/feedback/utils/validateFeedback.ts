import type { TFunction } from "i18next";
import { z } from "zod";

import { FEEDBACK_CATEGORIES } from "@/features/feedback/types/feedback.types";

export function createFeedbackSchema(t: TFunction<"feedback">) {
  return z.object({
    category: z.enum(FEEDBACK_CATEGORIES),
    subject: z
      .string()
      .trim()
      .min(3, t("validation.subjectRequired"))
      .max(120, t("validation.subjectTooLong")),
    message: z
      .string()
      .trim()
      .min(1, t("validation.messageTooShort"))
      .max(1000, t("validation.messageTooLong")),
    rating: z.number().int().min(1).max(5).optional(),
  });
}

export type FeedbackFormValues = z.infer<ReturnType<typeof createFeedbackSchema>>;
