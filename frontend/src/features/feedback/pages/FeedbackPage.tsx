import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, MessageSquare, Star, Send, Sparkles, UserRound } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { useAppSelector } from "@/app/hooks";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";

import { createFeedback, listMyFeedbacks } from "@/features/feedback/api/feedbackApi";
import { FEEDBACK_CATEGORIES, type FeedbackRecord } from "@/features/feedback/types/feedback.types";
import { createFeedbackSchema, type FeedbackFormValues } from "@/features/feedback/utils/validateFeedback";

function formatDateTime(value: string, locale: string) {
  return new Date(value).toLocaleString(locale);
}

function StatusChip({
  status,
  label,
}: {
  status: FeedbackRecord["status"];
  label: string;
}) {
  const palette: Record<FeedbackRecord["status"], { bg: string; color: string }> = {
    new: { bg: "#fff1eb", color: "#a04100" },
    reviewing: { bg: "#fff3cd", color: "#856404" },
    resolved: { bg: "#eefbf7", color: "#006a65" },
  };

  const tone = palette[status];

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1"
      style={{ background: tone.bg, color: tone.color, fontFamily: "Inter, sans-serif", fontSize: "12px", fontWeight: 800 }}
    >
      {label}
    </span>
  );
}

function SummaryCard({
  label,
  value,
  helper,
  icon,
}: {
  label: string;
  value: string;
  helper?: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-[24px] border border-[#dfc0b3] bg-white p-4 shadow-[0_10px_24px_rgba(36,25,20,0.05)]">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-[#fff1eb] text-[#a04100]">
        {icon}
      </div>
      <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#8b7266]" style={{ fontFamily: "Inter, sans-serif" }}>
        {label}
      </p>
      <p className="mt-2 text-[24px] font-extrabold text-[#241914]" style={{ fontFamily: "Lexend, sans-serif" }}>
        {value}
      </p>
      {helper ? (
        <p className="mt-1 text-[12px] text-[#8b7266]" style={{ fontFamily: "Inter, sans-serif" }}>
          {helper}
        </p>
      ) : null}
    </div>
  );
}

export default function FeedbackPage() {
  const { t, i18n } = useTranslation("feedback");
  const locale = i18n.resolvedLanguage === "en" ? "en-US" : "vi-VN";
  const currentUser = useAppSelector((state) => state.auth.user);
  const [feedbacks, setFeedbacks] = useState<FeedbackRecord[]>([]);
  const [summary, setSummary] = useState({
    total: 0,
    newCount: 0,
    reviewingCount: 0,
    resolvedCount: 0,
    averageRating: 0,
  });
  const [submitting, setSubmitting] = useState(false);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const feedbackSchema = useMemo(() => createFeedbackSchema(t), [t]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FeedbackFormValues>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      category: "feature_request",
      subject: "",
      message: "",
    },
  });

  const rating = watch("rating");
  const message = watch("message") || "";

  const loadFeedbacks = async () => {
    if (!currentUser) {
      return;
    }

    const response = await listMyFeedbacks();
    if (!response.success || !response.data) {
      toast.error(response.message);
      return;
    }

    setFeedbacks(response.data.items);
    setSummary(response.data.summary);
  };

  useEffect(() => {
    void loadFeedbacks();
  }, [currentUser?._id]);

  const myFeedbacks = useMemo(() => {
    if (!currentUser) {
      return [];
    }

    return feedbacks.filter((feedback) => feedback.user.id === currentUser._id);
  }, [currentUser, feedbacks]);

  const onSubmit = async (values: FeedbackFormValues) => {
    setSubmitting(true);
    try {
      const result = await createFeedback(values);
      if (!result.success || !result.data) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      setHighlightedId(result.data.id);
      reset({
        category: "feature_request",
        subject: "",
        message: "",
        rating: undefined,
      });
      await loadFeedbacks();
    } catch {
      toast.error(t("api.createError"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fff8f6] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="overflow-hidden rounded-[30px] border border-[#dfc0b3] bg-white shadow-[0_18px_40px_rgba(36,25,20,0.08)]">
          <div className="grid gap-0 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="p-6 lg:p-8">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#dfc0b3] bg-[#fff1eb] px-3 py-1">
                <Sparkles size={14} className="text-[#a04100]" />
                <span className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#a04100]" style={{ fontFamily: "Inter, sans-serif" }}>
                  {t("page.badge")}
                </span>
              </div>
              <h1 className="max-w-3xl text-[#241914]" style={{ fontFamily: "Lexend, sans-serif", fontSize: "34px", fontWeight: 800, lineHeight: 1.08 }}>
                {t("page.title")}
              </h1>
              <p className="mt-3 max-w-2xl text-[#584238]" style={{ fontFamily: "Inter, sans-serif", fontSize: "14px", lineHeight: 1.7 }}>
                {t("page.subtitle")}
              </p>
            </div>

            <div className="grid gap-3 border-t p-6 lg:border-l lg:border-t-0 lg:p-8" style={{ borderColor: "#f4ded5", background: "linear-gradient(180deg, #fffaf7 0%, #fff 100%)" }}>
              <SummaryCard
                label={t("page.stats.total")}
                value={String(summary.total)}
                helper={t("page.stats.latestHint")}
                icon={<MessageSquare size={18} />}
              />
              <SummaryCard
                label={t("page.stats.mine")}
                value={String(myFeedbacks.length)}
                helper={myFeedbacks.length ? t("page.history.title") : t("page.history.empty")}
                icon={<UserRound size={18} />}
              />
              <SummaryCard
                label={t("page.stats.averageRating")}
                value={summary.averageRating ? `${summary.averageRating.toFixed(1)}/5` : "0/5"}
                helper={t("page.helper")}
                icon={<Star size={18} />}
              />
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="overflow-hidden rounded-[28px] border border-[#dfc0b3] bg-white">
            <div className="border-b px-5 py-4" style={{ borderColor: "#f4ded5", background: "#fffaf7" }}>
              <h2 className="text-[#241914]" style={{ fontFamily: "Lexend, sans-serif", fontSize: "20px", fontWeight: 800 }}>
                {t("form.title")}
              </h2>
              <p className="mt-1 text-[#8b7266]" style={{ fontFamily: "Inter, sans-serif", fontSize: "13px", lineHeight: 1.6 }}>
                {t("form.subtitle")}
              </p>
            </div>

            <form className="space-y-5 p-5 sm:p-6" onSubmit={handleSubmit(onSubmit)}>
              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="category" className="text-[#241914]">
                    {t("fields.category")}
                  </Label>
                  <select
                    id="category"
                    {...register("category")}
                    className="h-11 w-full rounded-xl border border-[#dfc0b3] bg-white px-3 text-sm text-[#241914] outline-none transition-colors focus:border-[#006a65]"
                    style={{ fontFamily: "Inter, sans-serif" }}
                  >
                    {FEEDBACK_CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {t(`categories.${category}`)}
                      </option>
                    ))}
                  </select>
                  {errors.category ? (
                    <p className="text-sm text-[#ba1a1a]">{errors.category.message}</p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject" className="text-[#241914]">
                    {t("fields.subject")}
                  </Label>
                  <Input
                    id="subject"
                    placeholder={t("placeholders.subject")}
                    className="h-11 rounded-xl border-[#dfc0b3] bg-white px-3 focus-visible:border-[#006a65] focus-visible:ring-[#006a65]/20"
                    {...register("subject")}
                  />
                  {errors.subject ? (
                    <p className="text-sm text-[#ba1a1a]">{errors.subject.message}</p>
                  ) : null}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <Label className="text-[#241914]">{t("fields.rating")}</Label>
                  <span className="text-xs text-[#8b7266]" style={{ fontFamily: "Inter, sans-serif" }}>
                    {t("form.ratingHelp")}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 3, 4, 5].map((value) => {
                    const active = rating === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setValue("rating", active ? undefined : value, { shouldValidate: true })}
                        className="flex h-11 min-w-11 items-center justify-center rounded-xl border text-sm font-bold transition-colors"
                        style={{
                          borderColor: active ? "#a04100" : "#dfc0b3",
                          background: active ? "#fff1eb" : "#fff",
                          color: active ? "#a04100" : "#584238",
                          fontFamily: "Lexend, sans-serif",
                        }}
                      >
                        {value}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message" className="text-[#241914]">
                  {t("fields.message")}
                </Label>
                <Textarea
                  id="message"
                  placeholder={t("placeholders.message")}
                  className="min-h-[180px] rounded-2xl border-[#dfc0b3] bg-white px-4 py-3 text-[14px] text-[#241914] focus-visible:border-[#006a65] focus-visible:ring-[#006a65]/20"
                  {...register("message")}
                />
                <div className="flex items-center justify-between gap-4">
                  {errors.message ? (
                    <p className="text-sm text-[#ba1a1a]">{errors.message.message}</p>
                  ) : (
                    <span className="text-xs text-[#8b7266]" style={{ fontFamily: "Inter, sans-serif" }}>
                      {t("form.messageHint")}
                    </span>
                  )}
                  <span className="text-xs text-[#8b7266]" style={{ fontFamily: "Inter, sans-serif" }}>
                    {message.length}/1000
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#f4ded5] pt-4">
                <p className="max-w-xl text-sm text-[#8b7266]" style={{ fontFamily: "Inter, sans-serif", lineHeight: 1.6 }}>
                  {t("page.helper")}
                </p>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="h-11 rounded-xl bg-gradient-to-r from-[#a04100] to-[#ff7e36] px-5 text-sm font-bold text-white shadow-[0_10px_20px_rgba(160,65,0,0.18)] hover:opacity-95"
                >
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  {submitting ? t("form.submitting") : t("form.submit")}
                </Button>
              </div>
            </form>
          </div>

          <div className="space-y-6">
            <div className="rounded-[28px] border border-[#dfc0b3] bg-white p-5 sm:p-6">
              <h2 className="text-[#241914]" style={{ fontFamily: "Lexend, sans-serif", fontSize: "20px", fontWeight: 800 }}>
                {t("page.history.title")}
              </h2>
              <p className="mt-1 text-[#8b7266]" style={{ fontFamily: "Inter, sans-serif", fontSize: "13px", lineHeight: 1.6 }}>
                {t("page.history.hint")}
              </p>

              <div className="mt-4 space-y-3">
                {myFeedbacks.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-[#dfc0b3] p-6 text-center">
                    <p className="text-[#8b7266]" style={{ fontFamily: "Inter, sans-serif", fontSize: "14px" }}>
                      {t("page.history.empty")}
                    </p>
                  </div>
                ) : (
                  myFeedbacks.map((feedback) => (
                    <article
                      key={feedback.id}
                      className={`rounded-2xl border p-4 transition-all ${
                        highlightedId === feedback.id ? "border-[#a04100] bg-[#fffaf7]" : "border-[#f4ded5] bg-white"
                      }`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-[#241914]" style={{ fontFamily: "Lexend, sans-serif", fontSize: "16px", fontWeight: 800 }}>
                              {feedback.subject}
                            </p>
                            <StatusChip status={feedback.status} label={t(`statuses.${feedback.status}`)} />
                          </div>
                          <p className="mt-1 text-[#8b7266]" style={{ fontFamily: "Inter, sans-serif", fontSize: "12px" }}>
                            {t(`categories.${feedback.category}`)} · {formatDateTime(feedback.createdAt, locale)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[#241914]" style={{ fontFamily: "Lexend, sans-serif", fontSize: "14px", fontWeight: 800 }}>
                            {feedback.rating ? `${feedback.rating}/5` : t("page.history.noRating")}
                          </p>
                          <p className="text-[#8b7266]" style={{ fontFamily: "Inter, sans-serif", fontSize: "11px" }}>
                            {t("fields.rating")}
                          </p>
                        </div>
                      </div>
                      <p className="mt-3 whitespace-pre-line text-[#584238]" style={{ fontFamily: "Inter, sans-serif", fontSize: "13px", lineHeight: 1.7 }}>
                        {feedback.message}
                      </p>
                    </article>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-[28px] border border-[#dfc0b3] bg-white p-5 sm:p-6">
              <div className="flex items-center gap-2">
                <UserRound size={18} className="text-[#a04100]" />
                <h2 className="text-[#241914]" style={{ fontFamily: "Lexend, sans-serif", fontSize: "20px", fontWeight: 800 }}>
                  {t("page.profileTitle")}
                </h2>
              </div>
              <div className="mt-4 flex items-center gap-3 rounded-2xl bg-[#fffaf7] p-3">
                <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-[#fff1eb] text-[#a04100]">
                  {currentUser?.avatar ? (
                    <img src={currentUser.avatar} alt={currentUser.name} className="h-full w-full object-cover" />
                  ) : (
                    <UserRound size={18} />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-[#241914]" style={{ fontFamily: "Lexend, sans-serif" }}>
                    {currentUser?.name}
                  </p>
                  <p className="truncate text-xs text-[#8b7266]" style={{ fontFamily: "Inter, sans-serif" }}>
                    {currentUser?.email}
                  </p>
                </div>
              </div>
              <p className="mt-3 text-sm text-[#584238]" style={{ fontFamily: "Inter, sans-serif", lineHeight: 1.7 }}>
                {t("page.profileHint")}
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
