import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Filter, Loader2, MessageSquare, RefreshCw, Search, Star, UserRound } from "lucide-react";
import { useTranslation } from "react-i18next";

import { listAdminFeedbacks } from "@/features/feedback/api/feedbackApi";
import {
  FEEDBACK_STATUSES,
  type FeedbackRecord,
  type FeedbackStatus,
} from "@/features/feedback/types/feedback.types";

type StatusFilter = "all" | FeedbackStatus;

function formatDateTime(value: string, locale: string) {
  return new Date(value).toLocaleString(locale);
}

function StatCard({
  label,
  value,
  helper,
  icon,
  bg,
  color,
}: {
  label: string;
  value: string;
  helper?: string;
  icon: ReactNode;
  bg: string;
  color: string;
}) {
  return (
    <div className="rounded-[24px] border p-4 shadow-[0_10px_24px_rgba(36,25,20,0.05)]" style={{ borderColor: `${color}24`, background: bg }}>
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl" style={{ background: `${color}18`, color }}>
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

function FeedbackCard({
  record,
  locale,
  t,
}: {
  record: FeedbackRecord;
  locale: string;
  t: ReturnType<typeof useTranslation<"feedback">>["t"];
}) {
  return (
    <article className="overflow-hidden rounded-[24px] border border-[#dfc0b3] bg-white shadow-[0_10px_24px_rgba(36,25,20,0.05)]">
      <div className="border-b px-5 py-4" style={{ borderColor: "#f4ded5", background: "#fffaf7" }}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate text-[#241914]" style={{ fontFamily: "Lexend, sans-serif", fontSize: "18px", fontWeight: 800 }}>
                {record.subject}
              </p>
              <StatusChip status={record.status} label={t(`statuses.${record.status}`)} />
            </div>
            <p className="mt-1 text-[#8b7266]" style={{ fontFamily: "Inter, sans-serif", fontSize: "12px" }}>
              {t(`categories.${record.category}`)} · {t("admin.card.feedbackId")}: {record.id.slice(-8).toUpperCase()}
            </p>
          </div>

          <div className="text-right">
            <p className="text-[#241914]" style={{ fontFamily: "Lexend, sans-serif", fontSize: "14px", fontWeight: 800 }}>
              {record.rating ? `${record.rating}/5` : t("admin.card.noRating")}
            </p>
            <p className="text-[#8b7266]" style={{ fontFamily: "Inter, sans-serif", fontSize: "11px" }}>
              {t("admin.card.rating")}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 p-5 lg:grid-cols-[1fr_0.85fr]">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 overflow-hidden rounded-2xl bg-[#fff1eb]">
              <img src={record.user.avatar} alt={record.user.name} className="h-full w-full object-cover" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-[#241914]" style={{ fontFamily: "Lexend, sans-serif" }}>
                {record.user.name}
              </p>
              <p className="truncate text-xs text-[#8b7266]" style={{ fontFamily: "Inter, sans-serif" }}>
                {record.user.email}
              </p>
            </div>
          </div>

          <p className="mt-4 whitespace-pre-line text-[#584238]" style={{ fontFamily: "Inter, sans-serif", fontSize: "14px", lineHeight: 1.7 }}>
            {record.message}
          </p>
        </div>

        <div className="grid gap-3">
          <div className="rounded-2xl border border-[#f4ded5] bg-[#fffaf7] p-4">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.08em] text-[#8b7266]" style={{ fontFamily: "Inter, sans-serif" }}>
              {t("admin.card.submittedAt")}
            </p>
            <p className="mt-2 text-[#241914]" style={{ fontFamily: "Lexend, sans-serif", fontSize: "14px", fontWeight: 800 }}>
              {formatDateTime(record.createdAt, locale)}
            </p>
          </div>
          <div className="rounded-2xl border border-[#f4ded5] bg-[#fffaf7] p-4">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.08em] text-[#8b7266]" style={{ fontFamily: "Inter, sans-serif" }}>
              {t("admin.card.contact")}
            </p>
            <p className="mt-2 text-[#241914]" style={{ fontFamily: "Lexend, sans-serif", fontSize: "14px", fontWeight: 800 }}>
              {record.user.role} · {record.user.email}
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function AdminFeedbackPage() {
  const { t, i18n } = useTranslation("feedback");
  const locale = i18n.resolvedLanguage === "en" ? "en-US" : "vi-VN";
  const [records, setRecords] = useState<FeedbackRecord[]>([]);
  const [summary, setSummary] = useState({
    total: 0,
    newCount: 0,
    reviewingCount: 0,
    resolvedCount: 0,
    averageRating: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const loadFeedbacks = async () => {
    setLoading(true);
    try {
      const response = await listAdminFeedbacks();
      if (!response.success) {
        setRecords([]);
        setSummary({
          total: 0,
          newCount: 0,
          reviewingCount: 0,
          resolvedCount: 0,
          averageRating: 0,
        });
        return;
      }

      setRecords(response.data.items);
      setSummary(response.data.summary);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadFeedbacks();
  }, []);

  const filteredRecords = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return records.filter((record) => {
      const statusMatch = statusFilter === "all" || record.status === statusFilter;
      const searchMatch =
        !keyword ||
        [
          record.id,
          record.subject,
          record.message,
          record.user.name,
          record.user.email,
          record.category,
        ].some((value) => String(value).toLowerCase().includes(keyword));

      return statusMatch && searchMatch;
    });
  }, [records, search, statusFilter]);

  return (
    <div className="min-h-screen bg-[#fff8f6] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="overflow-hidden rounded-[30px] border border-[#dfc0b3] bg-white shadow-[0_18px_40px_rgba(36,25,20,0.08)]">
          <div className="grid gap-0 lg:grid-cols-[1.25fr_0.75fr]">
            <div className="p-6 lg:p-8">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#dfc0b3] bg-[#fff1eb] px-3 py-1">
                <MessageSquare size={14} className="text-[#a04100]" />
                <span className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#a04100]" style={{ fontFamily: "Inter, sans-serif" }}>
                  {t("admin.badge")}
                </span>
              </div>
              <h1 className="text-[#241914]" style={{ fontFamily: "Lexend, sans-serif", fontSize: "34px", fontWeight: 800, lineHeight: 1.1 }}>
                {t("admin.title")}
              </h1>
              <p className="mt-3 max-w-2xl text-[#584238]" style={{ fontFamily: "Inter, sans-serif", fontSize: "14px", lineHeight: 1.7 }}>
                {t("admin.subtitle")}
              </p>
            </div>

            <div className="grid gap-3 border-t p-6 lg:border-l lg:border-t-0 lg:p-8" style={{ borderColor: "#f4ded5", background: "linear-gradient(180deg, #fffaf7 0%, #fff 100%)" }}>
              <StatCard
                label={t("admin.stats.total")}
                value={String(summary.total)}
                helper={t("admin.stats.new", { count: summary.newCount })}
                icon={<MessageSquare size={18} />}
                bg="#fff1eb"
                color="#a04100"
              />
              <StatCard
                label={t("admin.stats.resolved")}
                value={String(summary.resolvedCount)}
                helper={t("admin.stats.averageRating", { rating: summary.averageRating ? summary.averageRating.toFixed(1) : "0.0" })}
                icon={<Filter size={18} />}
                bg="#eefbf7"
                color="#006a65"
              />
              <StatCard
                label={t("admin.card.rating")}
                value={summary.averageRating ? `${summary.averageRating.toFixed(1)}/5` : "0/5"}
                helper={t("admin.card.user")}
                icon={<Star size={18} />}
                bg="#fff3cd"
                color="#856404"
              />
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-[#dfc0b3] bg-white p-4 sm:p-5">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setStatusFilter("all")}
                className="rounded-full px-4 py-2 text-sm font-bold transition-colors"
                style={{
                  background: statusFilter === "all" ? "#a04100" : "#fff",
                  border: `1.5px solid ${statusFilter === "all" ? "#a04100" : "#dfc0b3"}`,
                  color: statusFilter === "all" ? "#fff" : "#584238",
                  fontFamily: "Inter, sans-serif",
                }}
              >
                {t("admin.filters.all")}
              </button>
              {FEEDBACK_STATUSES.map((status) => {
                const active = statusFilter === status;
                return (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setStatusFilter(status)}
                    className="rounded-full px-4 py-2 text-sm font-bold transition-colors"
                    style={{
                      background: active ? "#a04100" : "#fff",
                      border: `1.5px solid ${active ? "#a04100" : "#dfc0b3"}`,
                      color: active ? "#fff" : "#584238",
                      fontFamily: "Inter, sans-serif",
                    }}
                  >
                    {t(`admin.filters.${status}`)}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-1 flex-wrap items-center justify-end gap-2">
              <div className="relative min-w-[240px] flex-1 sm:max-w-sm">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8b7266]" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={t("admin.searchPlaceholder")}
                  className="h-11 w-full rounded-xl border border-[#dfc0b3] bg-white pl-9 pr-3 text-sm text-[#241914] outline-none transition-colors focus:border-[#006a65]"
                  style={{ fontFamily: "Inter, sans-serif" }}
                />
              </div>
              <button
                type="button"
                onClick={loadFeedbacks}
                className="flex h-11 items-center gap-2 rounded-xl border border-[#dfc0b3] px-4 text-[#584238] hover:bg-[#fff1eb]"
                style={{ fontFamily: "Inter, sans-serif", fontSize: "13px", fontWeight: 800 }}
              >
                <RefreshCw size={15} />
                {t("admin.refresh")}
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-[280px] items-center justify-center rounded-3xl border border-dashed border-[#dfc0b3]">
              <Loader2 className="mr-2 animate-spin text-[#a04100]" size={20} />
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: "14px", color: "#8b7266" }}>
                {t("page.loading")}
              </span>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="flex min-h-[280px] flex-col items-center justify-center rounded-3xl border border-dashed border-[#dfc0b3] px-4 text-center">
              <MessageSquare size={42} className="mb-3 text-[#dfc0b3]" />
              <p style={{ fontFamily: "Lexend, sans-serif", fontSize: "17px", fontWeight: 800, color: "#241914" }}>
                {t("admin.empty")}
              </p>
              <p className="mt-1 text-[#8b7266]" style={{ fontFamily: "Inter, sans-serif", fontSize: "13px" }}>
                {t("admin.emptyHint")}
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredRecords.map((record) => (
                <FeedbackCard key={record.id} record={record} locale={locale} t={t} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
