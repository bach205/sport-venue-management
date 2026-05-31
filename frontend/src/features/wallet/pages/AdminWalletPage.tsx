import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import {
  AlertTriangle,
  Banknote,
  CheckCircle2,
  Clock3,
  Loader2,
  RefreshCw,
  Search,
  ShieldCheck,
  WalletCards,
  X,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { fetchAdminWithdrawRequests, reviewAdminWithdrawRequest } from "../api/walletApi";
import type { WithdrawRequest, WithdrawRequestStatus } from "../types/wallet.types";

type StatusFilter = "all" | WithdrawRequestStatus;
type ReviewAction = "approve" | "reject";

const STATUS_FILTERS: StatusFilter[] = ["all", "pending", "paid", "rejected"];

const STATUS_STYLE: Record<WithdrawRequestStatus, { bg: string; color: string; icon: ReactNode }> = {
  pending: { bg: "#fff3cd", color: "#856404", icon: <Clock3 size={13} /> },
  approved: { bg: "#e8f4ff", color: "#1a5fb4", icon: <ShieldCheck size={13} /> },
  paid: { bg: "#e7f8f7", color: "#006a65", icon: <CheckCircle2 size={13} /> },
  rejected: { bg: "#fdecea", color: "#ba1a1a", icon: <XCircle size={13} /> },
};

function formatMoney(value: number, locale: string) {
  return `${new Intl.NumberFormat(locale).format(value)} VND`;
}

function formatDate(value: string | null | undefined, locale: string, emptyLabel: string) {
  if (!value) return emptyLabel;
  return new Date(value).toLocaleString(locale);
}

function maskAccount(value: string) {
  if (value.length <= 4) return value;
  return `${"*".repeat(Math.max(value.length - 4, 0))}${value.slice(-4)}`;
}

function StatusPill({ status, label }: { status: WithdrawRequestStatus; label: string }) {
  const style = STATUS_STYLE[status] ?? STATUS_STYLE.pending;

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1"
      style={{ background: style.bg, color: style.color, fontFamily: "Inter, sans-serif", fontSize: "12px", fontWeight: 800 }}
    >
      {style.icon}
      {label}
    </span>
  );
}

export default function AdminWalletPage() {
  const { t, i18n } = useTranslation("matching");
  const locale = i18n.resolvedLanguage === "en" ? "en-US" : "vi-VN";
  const [requests, setRequests] = useState<WithdrawRequest[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [reviewTarget, setReviewTarget] = useState<WithdrawRequest | null>(null);
  const [reviewAction, setReviewAction] = useState<ReviewAction>("approve");
  const [reviewNote, setReviewNote] = useState("");

  const loadRequests = async (filter: StatusFilter = statusFilter) => {
    setLoading(true);
    try {
      const data = await fetchAdminWithdrawRequests({
        page: 1,
        limit: 100,
        status: filter === "all" ? undefined : filter,
      });
      setRequests(data.items);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || t("wallet.admin.errors.load"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests(statusFilter);
  }, [statusFilter]);

  const filteredRequests = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return requests;

    return requests.filter((request) => {
      const payout = request.payoutAccountSnapshot;
      return [
        request.id,
        request.userId,
        request.user?.name,
        request.user?.email,
        payout.bankCode,
        payout.bankName,
        payout.accountName,
        payout.accountNumber,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword));
    });
  }, [requests, search]);

  const summary = useMemo(() => {
    const pendingAmount = requests
      .filter((request) => request.status === "pending")
      .reduce((sum, request) => sum + request.amount, 0);

    return {
      total: requests.length,
      pending: requests.filter((request) => request.status === "pending").length,
      pendingAmount,
      processed: requests.filter((request) => request.status !== "pending").length,
    };
  }, [requests]);

  const openReview = (request: WithdrawRequest, action: ReviewAction) => {
    setReviewTarget(request);
    setReviewAction(action);
    setReviewNote("");
  };

  const closeReview = () => {
    if (processingId) return;
    setReviewTarget(null);
    setReviewNote("");
  };

  const handleReview = async () => {
    if (!reviewTarget) return;

    try {
      setProcessingId(reviewTarget.id);
      const data = await reviewAdminWithdrawRequest(reviewTarget.id, {
        action: reviewAction,
        note: reviewNote.trim() || undefined,
      });

      setRequests((current) =>
        current.map((item) =>
          item.id === reviewTarget.id
            ? { ...item, ...data.withdrawRequest, wallet: data.wallet }
            : item
        )
      );

      toast.success(
        reviewAction === "approve"
          ? t("wallet.admin.toasts.approved")
          : t("wallet.admin.toasts.rejected")
      );
      closeReview();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || t("wallet.admin.errors.review"));
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#fff8f6] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="overflow-hidden rounded-[30px] border bg-white" style={{ borderColor: "#dfc0b3", boxShadow: "0 18px 40px rgba(36,25,20,0.08)" }}>
          <div className="grid gap-0 lg:grid-cols-[1.25fr_0.75fr]">
            <div className="p-6 lg:p-8">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1" style={{ borderColor: "#dfc0b3", background: "#fff1eb" }}>
                <ShieldCheck size={14} className="text-[#a04100]" />
                <span className="uppercase tracking-[0.18em] text-[#a04100]" style={{ fontFamily: "Inter, sans-serif", fontSize: "11px", fontWeight: 800 }}>
                  {t("wallet.admin.badge")}
                </span>
              </div>
              <h1 className="text-[#241914]" style={{ fontFamily: "Lexend, sans-serif", fontSize: "34px", fontWeight: 800, lineHeight: 1.1 }}>
                {t("wallet.admin.title")}
              </h1>
              <p className="mt-3 max-w-2xl text-[#584238]" style={{ fontFamily: "Inter, sans-serif", fontSize: "14px", lineHeight: 1.7 }}>
                {t("wallet.admin.subtitle")}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 border-t p-6 lg:border-l lg:border-t-0 lg:p-8" style={{ borderColor: "#f4ded5", background: "linear-gradient(180deg, #fffaf7 0%, #fff 100%)" }}>
              {[
                { icon: <WalletCards size={18} />, label: t("wallet.admin.stats.total"), value: summary.total, color: "#241914", bg: "#fff" },
                { icon: <Clock3 size={18} />, label: t("wallet.admin.stats.pending"), value: summary.pending, color: "#856404", bg: "#fff3cd" },
                { icon: <Banknote size={18} />, label: t("wallet.admin.stats.pendingAmount"), value: formatMoney(summary.pendingAmount, locale), color: "#a04100", bg: "#fff1eb" },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border p-4" style={{ borderColor: `${item.color}22`, background: item.bg }}>
                  <div className="mb-2 flex items-center gap-2" style={{ color: item.color }}>
                    {item.icon}
                    <span style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                      {item.label}
                    </span>
                  </div>
                  <p style={{ fontFamily: "Lexend, sans-serif", fontSize: "22px", fontWeight: 800, color: "#241914" }}>
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border bg-white p-4 sm:p-5" style={{ borderColor: "#dfc0b3" }}>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {STATUS_FILTERS.map((status) => {
                const active = statusFilter === status;
                return (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setStatusFilter(status)}
                    className="rounded-full px-4 py-2 transition-colors"
                    style={{
                      background: active ? "#a04100" : "#fff",
                      border: `1.5px solid ${active ? "#a04100" : "#dfc0b3"}`,
                      color: active ? "#fff" : "#584238",
                      fontFamily: "Inter, sans-serif",
                      fontSize: "13px",
                      fontWeight: 800,
                    }}
                  >
                    {status === "all" ? t("wallet.admin.filters.all") : t(`wallet.withdrawStatuses.${status}`)}
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
                  placeholder={t("wallet.admin.searchPlaceholder")}
                  className="h-11 w-full rounded-xl border bg-white pl-9 pr-3 outline-none transition-colors focus:border-[#006a65]"
                  style={{ borderColor: "#dfc0b3", fontFamily: "Inter, sans-serif", fontSize: "13px", color: "#241914" }}
                />
              </div>
              <button
                type="button"
                onClick={() => loadRequests(statusFilter)}
                className="flex h-11 items-center gap-2 rounded-xl border px-4 text-[#584238] hover:bg-[#fff1eb]"
                style={{ borderColor: "#dfc0b3", fontFamily: "Inter, sans-serif", fontSize: "13px", fontWeight: 800 }}
              >
                <RefreshCw size={15} />
                {t("wallet.admin.refresh")}
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-[280px] items-center justify-center rounded-3xl border border-dashed" style={{ borderColor: "#dfc0b3" }}>
              <Loader2 className="mr-2 animate-spin text-[#a04100]" size={20} />
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: "14px", color: "#8b7266" }}>{t("wallet.loading")}</span>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="flex min-h-[280px] flex-col items-center justify-center rounded-3xl border border-dashed px-4 text-center" style={{ borderColor: "#dfc0b3" }}>
              <WalletCards size={42} className="mb-3 text-[#dfc0b3]" />
              <p style={{ fontFamily: "Lexend, sans-serif", fontSize: "17px", fontWeight: 800, color: "#241914" }}>{t("wallet.admin.empty")}</p>
              <p className="mt-1 text-[#8b7266]" style={{ fontFamily: "Inter, sans-serif", fontSize: "13px" }}>{t("wallet.admin.emptyHint")}</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredRequests.map((request) => {
                const payout = request.payoutAccountSnapshot;
                const isPending = request.status === "pending";
                const balanceAfterApprove = {
                  available: request.wallet?.availableBalance ?? 0,
                  pending: Math.max((request.wallet?.pendingWithdrawBalance ?? 0) - request.amount, 0),
                };
                const balanceAfterReject = {
                  available: (request.wallet?.availableBalance ?? 0) + request.amount,
                  pending: Math.max((request.wallet?.pendingWithdrawBalance ?? 0) - request.amount, 0),
                };

                return (
                  <article key={request.id} className="overflow-hidden rounded-[24px] border bg-[#fffaf7]" style={{ borderColor: "#dfc0b3" }}>
                    <div className="grid gap-4 p-5 lg:grid-cols-[1.15fr_0.85fr]">
                      <div className="min-w-0">
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                          <StatusPill status={request.status} label={t(`wallet.withdrawStatuses.${request.status}`)} />
                          <span className="rounded-full bg-white px-3 py-1 text-[#8b7266]" style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", fontWeight: 700 }}>
                            #{request.id.slice(-8).toUpperCase()}
                          </span>
                        </div>

                        <h2 style={{ fontFamily: "Lexend, sans-serif", fontSize: "22px", fontWeight: 800, color: "#241914" }}>
                          {formatMoney(request.amount, locale)}
                        </h2>
                        <p className="mt-1 text-[#584238]" style={{ fontFamily: "Inter, sans-serif", fontSize: "14px" }}>
                          {request.user?.name || request.userId} · {request.user?.email || t("wallet.na")}
                        </p>
                        <p className="mt-1 text-[#8b7266]" style={{ fontFamily: "Inter, sans-serif", fontSize: "12px" }}>
                          {t("wallet.admin.createdAt", { date: formatDate(request.createdAt, locale, t("wallet.na")) })}
                        </p>

                        {request.note ? (
                          <div className="mt-4 rounded-2xl border bg-white p-3" style={{ borderColor: "#f4ded5" }}>
                            <p className="mb-1 text-[#8b7266]" style={{ fontFamily: "Inter, sans-serif", fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                              {t("wallet.admin.userNote")}
                            </p>
                            <p style={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: "#241914", lineHeight: 1.6 }}>{request.note}</p>
                          </div>
                        ) : null}
                      </div>

                      <div className="grid gap-3">
                        <div className="rounded-2xl border bg-white p-4" style={{ borderColor: "#f4ded5" }}>
                          <p className="mb-3 text-[#8b7266]" style={{ fontFamily: "Inter, sans-serif", fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                            {t("wallet.admin.payoutAccount")}
                          </p>
                          <div className="grid gap-2 text-sm">
                            <div className="flex justify-between gap-3">
                              <span className="text-[#8b7266]">{t("wallet.payout.bankName")}</span>
                              <strong className="text-right text-[#241914]">{payout.bankName} ({payout.bankCode})</strong>
                            </div>
                            <div className="flex justify-between gap-3">
                              <span className="text-[#8b7266]">{t("wallet.payout.accountNumber")}</span>
                              <strong className="text-right text-[#241914]">{maskAccount(payout.accountNumber)}</strong>
                            </div>
                            <div className="flex justify-between gap-3">
                              <span className="text-[#8b7266]">{t("wallet.payout.accountName")}</span>
                              <strong className="text-right text-[#241914]">{payout.accountName}</strong>
                            </div>
                          </div>
                        </div>

                        <div className="rounded-2xl border bg-white p-4" style={{ borderColor: "#f4ded5" }}>
                          <p className="mb-3 text-[#8b7266]" style={{ fontFamily: "Inter, sans-serif", fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                            {t("wallet.admin.currentBalances")}
                          </p>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="rounded-xl bg-[#eefbf7] p-3">
                              <p className="text-[#006a65]" style={{ fontFamily: "Inter, sans-serif", fontSize: "11px", fontWeight: 800 }}>{t("wallet.cards.available")}</p>
                              <p className="mt-1 text-[#241914]" style={{ fontFamily: "Lexend, sans-serif", fontSize: "15px", fontWeight: 800 }}>{formatMoney(request.wallet?.availableBalance || 0, locale)}</p>
                            </div>
                            <div className="rounded-xl bg-[#fff3cd] p-3">
                              <p className="text-[#856404]" style={{ fontFamily: "Inter, sans-serif", fontSize: "11px", fontWeight: 800 }}>{t("wallet.cards.pending")}</p>
                              <p className="mt-1 text-[#241914]" style={{ fontFamily: "Lexend, sans-serif", fontSize: "15px", fontWeight: 800 }}>{formatMoney(request.wallet?.pendingWithdrawBalance || 0, locale)}</p>
                            </div>
                          </div>
                        </div>

                        {isPending ? (
                          <div className="grid gap-2 sm:grid-cols-2">
                            <button
                              type="button"
                              disabled={processingId === request.id}
                              onClick={() => openReview(request, "approve")}
                              className="rounded-2xl px-4 py-3 text-left text-white disabled:opacity-50"
                              style={{ background: "#006a65" }}
                            >
                              <span className="flex items-center gap-2" style={{ fontFamily: "Lexend, sans-serif", fontSize: "14px", fontWeight: 800 }}>
                                <CheckCircle2 size={16} />
                                {t("wallet.admin.approve")}
                              </span>
                              <span className="mt-1 block text-white/85" style={{ fontFamily: "Inter, sans-serif", fontSize: "11px" }}>
                                {t("wallet.admin.afterAction", {
                                  available: formatMoney(balanceAfterApprove.available, locale),
                                  pending: formatMoney(balanceAfterApprove.pending, locale),
                                })}
                              </span>
                            </button>
                            <button
                              type="button"
                              disabled={processingId === request.id}
                              onClick={() => openReview(request, "reject")}
                              className="rounded-2xl px-4 py-3 text-left text-white disabled:opacity-50"
                              style={{ background: "#ba1a1a" }}
                            >
                              <span className="flex items-center gap-2" style={{ fontFamily: "Lexend, sans-serif", fontSize: "14px", fontWeight: 800 }}>
                                <XCircle size={16} />
                                {t("wallet.admin.reject")}
                              </span>
                              <span className="mt-1 block text-white/85" style={{ fontFamily: "Inter, sans-serif", fontSize: "11px" }}>
                                {t("wallet.admin.afterAction", {
                                  available: formatMoney(balanceAfterReject.available, locale),
                                  pending: formatMoney(balanceAfterReject.pending, locale),
                                })}
                              </span>
                            </button>
                          </div>
                        ) : (
                          <div className="rounded-2xl border bg-white p-4" style={{ borderColor: "#f4ded5" }}>
                            <p style={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: "#584238" }}>
                              {request.status === "rejected"
                                ? t("wallet.admin.rejectedReason", { reason: request.rejectionReason || t("wallet.na") })
                                : t("wallet.admin.reviewedAt", { date: formatDate(request.reviewedAt, locale, t("wallet.na")) })}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {reviewTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(36,25,20,0.55)" }} onClick={closeReview}>
          <div className="w-full max-w-xl overflow-hidden rounded-[28px] bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-4 border-b px-6 py-5" style={{ borderColor: "#f4ded5", background: reviewAction === "approve" ? "#eefbf7" : "#fff0f0" }}>
              <div>
                <div className="mb-2 flex items-center gap-2" style={{ color: reviewAction === "approve" ? "#006a65" : "#ba1a1a" }}>
                  {reviewAction === "approve" ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                  <span style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    {reviewAction === "approve" ? t("wallet.admin.approve") : t("wallet.admin.reject")}
                  </span>
                </div>
                <h2 style={{ fontFamily: "Lexend, sans-serif", fontSize: "24px", fontWeight: 800, color: "#241914" }}>
                  {t("wallet.admin.reviewTitle", { amount: formatMoney(reviewTarget.amount, locale) })}
                </h2>
              </div>
              <button type="button" onClick={closeReview} className="rounded-full p-2 hover:bg-white/70">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 px-6 py-5">
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: "14px", color: "#584238", lineHeight: 1.7 }}>
                {reviewAction === "approve" ? t("wallet.admin.approveHelp") : t("wallet.admin.rejectHelp")}
              </p>
              <textarea
                value={reviewNote}
                onChange={(event) => setReviewNote(event.target.value)}
                maxLength={500}
                placeholder={t("wallet.admin.notePlaceholder")}
                className="min-h-[120px] w-full rounded-2xl border px-4 py-3 outline-none transition-colors focus:border-[#006a65]"
                style={{ borderColor: "#dfc0b3", fontFamily: "Inter, sans-serif", fontSize: "14px", color: "#241914" }}
              />
              <p className="text-right text-[#8b7266]" style={{ fontFamily: "Inter, sans-serif", fontSize: "12px" }}>
                {reviewNote.length}/500
              </p>
            </div>

            <div className="flex flex-wrap justify-end gap-3 border-t px-6 py-4" style={{ borderColor: "#f4ded5", background: "#fffaf7" }}>
              <button
                type="button"
                onClick={closeReview}
                disabled={Boolean(processingId)}
                className="h-11 rounded-xl border px-5 text-[#584238] hover:bg-white disabled:opacity-50"
                style={{ borderColor: "#dfc0b3", fontFamily: "Inter, sans-serif", fontWeight: 800 }}
              >
                {t("wallet.admin.cancel")}
              </button>
              <button
                type="button"
                onClick={handleReview}
                disabled={Boolean(processingId)}
                className="flex h-11 items-center gap-2 rounded-xl px-5 text-white disabled:opacity-50"
                style={{ background: reviewAction === "approve" ? "#006a65" : "#ba1a1a", fontFamily: "Lexend, sans-serif", fontWeight: 800 }}
              >
                {processingId ? <Loader2 size={16} className="animate-spin" /> : reviewAction === "approve" ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                {reviewAction === "approve" ? t("wallet.admin.confirmApprove") : t("wallet.admin.confirmReject")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
