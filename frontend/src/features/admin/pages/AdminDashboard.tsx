import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import {
  Banknote,
  Building2,
  CircleDollarSign,
  Clock3,
  Loader2,
  ReceiptText,
  RefreshCw,
  TrendingUp,
  WalletCards,
} from "lucide-react";
import { toast } from "sonner";

import { fetchAdminSettlementDashboard } from "@/features/wallet/api/walletApi";
import type { AdminSettlementDashboard, OwnerSettlement } from "@/features/wallet/types/wallet.types";

function formatMoney(value: number, locale: string) {
  return `${new Intl.NumberFormat(locale).format(value)} VND`;
}

function formatDate(value: string | null | undefined, locale: string, emptyLabel: string) {
  if (!value) return emptyLabel;
  return new Date(value).toLocaleString(locale);
}

function StatCard({
  icon,
  label,
  value,
  helper,
  color,
  bg,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  helper?: string;
  color: string;
  bg: string;
}) {
  return (
    <div className="rounded-[24px] border p-5" style={{ background: bg, borderColor: `${color}25` }}>
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl" style={{ background: `${color}18`, color }}>
        {icon}
      </div>
      <p className="text-[#8b7266]" style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase" }}>
        {label}
      </p>
      <h3 className="mt-2 text-[#241914]" style={{ fontFamily: "Lexend, sans-serif", fontSize: "24px", fontWeight: 800 }}>
        {value}
      </h3>
      {helper ? (
        <p className="mt-2" style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color }}>
          {helper}
        </p>
      ) : null}
    </div>
  );
}

function SettlementRow({
  settlement,
  locale,
  t,
}: {
  settlement: OwnerSettlement;
  locale: string;
  t: ReturnType<typeof useTranslation<"matching">>["t"];
}) {
  return (
    <tr className="border-b border-[#f4ded5] last:border-0">
      <td className="px-4 py-4">
        <div>
          <p className="text-[#241914]" style={{ fontFamily: "Lexend, sans-serif", fontSize: "14px", fontWeight: 800 }}>
            {settlement.owner?.name || settlement.ownerId}
          </p>
          <p className="mt-1 text-[#8b7266]" style={{ fontFamily: "Inter, sans-serif", fontSize: "12px" }}>
            {settlement.owner?.email || t("wallet.na")}
          </p>
        </div>
      </td>
      <td className="px-4 py-4">
        <p className="text-[#241914]" style={{ fontFamily: "Inter, sans-serif", fontSize: "13px", fontWeight: 700 }}>
          {settlement.venue?.name || settlement.venueId}
        </p>
        <p className="mt-1 text-[#8b7266]" style={{ fontFamily: "Inter, sans-serif", fontSize: "12px" }}>
          {settlement.venue?.location || t("wallet.na")}
        </p>
      </td>
      <td className="px-4 py-4 text-right text-[#241914]" style={{ fontFamily: "Lexend, sans-serif", fontSize: "13px", fontWeight: 800 }}>
        {formatMoney(settlement.grossAmount, locale)}
      </td>
      <td className="px-4 py-4 text-right text-[#a04100]" style={{ fontFamily: "Lexend, sans-serif", fontSize: "13px", fontWeight: 800 }}>
        {formatMoney(settlement.commissionAmount, locale)}
        <span className="ml-1 text-[#8b7266]" style={{ fontFamily: "Inter, sans-serif", fontSize: "11px", fontWeight: 600 }}>
          ({Math.round(settlement.commissionRate * 100)}%)
        </span>
      </td>
      <td className="px-4 py-4 text-right text-[#006a65]" style={{ fontFamily: "Lexend, sans-serif", fontSize: "13px", fontWeight: 800 }}>
        {formatMoney(settlement.netAmount, locale)}
      </td>
      <td className="px-4 py-4 text-right text-[#8b7266]" style={{ fontFamily: "Inter, sans-serif", fontSize: "12px" }}>
        {formatDate(settlement.settledAt, locale, t("wallet.na"))}
      </td>
    </tr>
  );
}

export default function AdminDashboard() {
  const { t, i18n } = useTranslation("matching");
  const locale = i18n.resolvedLanguage === "en" ? "en-US" : "vi-VN";
  const [data, setData] = useState<AdminSettlementDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      setData(await fetchAdminSettlementDashboard());
    } catch (error: any) {
      toast.error(error?.response?.data?.message || t("admin.finance.errors.load"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const summary = data?.summary;
  const largestOwnerHold = useMemo(() => {
    if (!data?.ownerHolds.length) return null;
    return data.ownerHolds[0];
  }, [data]);

  return (
    <div className="min-h-screen bg-[#fff8f6] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="overflow-hidden rounded-[30px] border bg-white" style={{ borderColor: "#dfc0b3", boxShadow: "0 18px 40px rgba(36,25,20,0.08)" }}>
          <div className="grid gap-0 lg:grid-cols-[1.25fr_0.75fr]">
            <div className="p-6 lg:p-8">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1" style={{ borderColor: "#dfc0b3", background: "#fff1eb" }}>
                <CircleDollarSign size={14} className="text-[#a04100]" />
                <span className="uppercase tracking-[0.18em] text-[#a04100]" style={{ fontFamily: "Inter, sans-serif", fontSize: "11px", fontWeight: 800 }}>
                  {t("admin.finance.badge")}
                </span>
              </div>
              <h1 className="text-[#241914]" style={{ fontFamily: "Lexend, sans-serif", fontSize: "34px", fontWeight: 800, lineHeight: 1.1 }}>
                {t("admin.finance.title")}
              </h1>
              <p className="mt-3 max-w-2xl text-[#584238]" style={{ fontFamily: "Inter, sans-serif", fontSize: "14px", lineHeight: 1.7 }}>
                {t("admin.finance.subtitle")}
              </p>
            </div>
            <div className="border-t p-6 lg:border-l lg:border-t-0 lg:p-8" style={{ borderColor: "#f4ded5", background: "linear-gradient(180deg, #fffaf7 0%, #fff 100%)" }}>
              <button
                type="button"
                onClick={loadDashboard}
                disabled={loading}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border text-[#584238] hover:bg-white disabled:opacity-50"
                style={{ borderColor: "#dfc0b3", fontFamily: "Inter, sans-serif", fontWeight: 800 }}
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                {t("admin.finance.refresh")}
              </button>
              <p className="mt-4 text-[#8b7266]" style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", lineHeight: 1.7 }}>
                {t("admin.finance.holdRule")}
              </p>
            </div>
          </div>
        </section>

        {loading && !data ? (
          <div className="flex min-h-[360px] items-center justify-center rounded-[28px] border bg-white" style={{ borderColor: "#dfc0b3" }}>
            <Loader2 className="mr-2 animate-spin text-[#a04100]" size={22} />
            <span className="text-[#8b7266]" style={{ fontFamily: "Inter, sans-serif", fontSize: "14px" }}>{t("wallet.loading")}</span>
          </div>
        ) : (
          <>
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <StatCard
                icon={<WalletCards size={21} />}
                label={t("admin.finance.stats.platformHold")}
                value={formatMoney(summary?.platformHoldGrossAmount || 0, locale)}
                helper={t("admin.finance.stats.pendingBookings", { count: summary?.pendingBookingCount || 0 })}
                color="#856404"
                bg="#fff3cd"
              />
              <StatCard
                icon={<Banknote size={21} />}
                label={t("admin.finance.stats.ownerPending")}
                value={formatMoney(summary?.ownerPendingNetAmount || 0, locale)}
                helper={largestOwnerHold ? t("admin.finance.stats.largestOwnerHold", { owner: largestOwnerHold.owner.name }) : undefined}
                color="#1a5fb4"
                bg="#f3f7ff"
              />
              <StatCard
                icon={<TrendingUp size={21} />}
                label={t("admin.finance.stats.commissionEarned")}
                value={formatMoney(summary?.platformCommissionEarnedAmount || 0, locale)}
                helper={t("admin.finance.stats.pendingCommission", { amount: formatMoney(summary?.pendingCommissionAmount || 0, locale) })}
                color="#a04100"
                bg="#fff1eb"
              />
              <StatCard
                icon={<Building2 size={21} />}
                label={t("admin.finance.stats.paidOwners")}
                value={formatMoney(summary?.paidToOwnersAmount || 0, locale)}
                helper={t("admin.finance.stats.settledCount", { count: summary?.settledCount || 0 })}
                color="#006a65"
                bg="#eefbf7"
              />
            </section>

            <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
              <div className="rounded-[28px] border bg-white p-5" style={{ borderColor: "#dfc0b3" }}>
                <div className="mb-4 flex items-center gap-2">
                  <Clock3 size={18} className="text-[#856404]" />
                  <h2 className="text-[#241914]" style={{ fontFamily: "Lexend, sans-serif", fontSize: "20px", fontWeight: 800 }}>
                    {t("admin.finance.ownerHoldTitle")}
                  </h2>
                </div>

                {!data?.ownerHolds.length ? (
                  <div className="rounded-2xl border border-dashed p-8 text-center" style={{ borderColor: "#dfc0b3" }}>
                    <p className="text-[#8b7266]" style={{ fontFamily: "Inter, sans-serif", fontSize: "14px" }}>{t("admin.finance.emptyOwnerHold")}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {data.ownerHolds.map((hold) => (
                      <article key={hold.owner.id} className="rounded-2xl border bg-[#fffaf7] p-4" style={{ borderColor: "#f4ded5" }}>
                        <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <h3 className="text-[#241914]" style={{ fontFamily: "Lexend, sans-serif", fontSize: "17px", fontWeight: 800 }}>
                              {hold.owner.name}
                            </h3>
                            <p className="mt-1 text-[#8b7266]" style={{ fontFamily: "Inter, sans-serif", fontSize: "12px" }}>
                              {hold.owner.email || t("wallet.na")}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-[#006a65]" style={{ fontFamily: "Lexend, sans-serif", fontSize: "17px", fontWeight: 800 }}>
                              {formatMoney(hold.netAmount, locale)}
                            </p>
                            <p className="text-[#8b7266]" style={{ fontFamily: "Inter, sans-serif", fontSize: "11px" }}>
                              {t("admin.finance.netForOwner")}
                            </p>
                          </div>
                        </div>
                        <div className="grid gap-2 sm:grid-cols-3">
                          <div className="rounded-xl bg-white p-3">
                            <p className="text-[#8b7266]" style={{ fontFamily: "Inter, sans-serif", fontSize: "11px" }}>{t("admin.finance.gross")}</p>
                            <p className="mt-1 text-[#241914]" style={{ fontFamily: "Lexend, sans-serif", fontSize: "13px", fontWeight: 800 }}>{formatMoney(hold.grossAmount, locale)}</p>
                          </div>
                          <div className="rounded-xl bg-white p-3">
                            <p className="text-[#8b7266]" style={{ fontFamily: "Inter, sans-serif", fontSize: "11px" }}>{t("admin.finance.commission")}</p>
                            <p className="mt-1 text-[#a04100]" style={{ fontFamily: "Lexend, sans-serif", fontSize: "13px", fontWeight: 800 }}>{formatMoney(hold.commissionAmount, locale)}</p>
                          </div>
                          <div className="rounded-xl bg-white p-3">
                            <p className="text-[#8b7266]" style={{ fontFamily: "Inter, sans-serif", fontSize: "11px" }}>{t("admin.finance.bookings")}</p>
                            <p className="mt-1 text-[#241914]" style={{ fontFamily: "Lexend, sans-serif", fontSize: "13px", fontWeight: 800 }}>{hold.bookingCount}</p>
                          </div>
                        </div>
                        <div className="mt-3 space-y-2">
                          {hold.venues.map((venueHold) => (
                            <div key={venueHold.venue.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white px-3 py-2">
                              <div>
                                <p className="text-[#241914]" style={{ fontFamily: "Inter, sans-serif", fontSize: "13px", fontWeight: 800 }}>{venueHold.venue.name}</p>
                                <p className="text-[#8b7266]" style={{ fontFamily: "Inter, sans-serif", fontSize: "11px" }}>{venueHold.venue.location}</p>
                              </div>
                              <p className="text-[#006a65]" style={{ fontFamily: "Lexend, sans-serif", fontSize: "13px", fontWeight: 800 }}>
                                {formatMoney(venueHold.netAmount, locale)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>

              <div className="overflow-hidden rounded-[28px] border bg-white" style={{ borderColor: "#dfc0b3" }}>
                <div className="flex items-center gap-2 border-b px-5 py-4" style={{ borderColor: "#f4ded5" }}>
                  <ReceiptText size={18} className="text-[#a04100]" />
                  <h2 className="text-[#241914]" style={{ fontFamily: "Lexend, sans-serif", fontSize: "20px", fontWeight: 800 }}>
                    {t("admin.finance.settlementHistoryTitle")}
                  </h2>
                </div>
                {!data?.recentSettlements.length ? (
                  <div className="p-10 text-center">
                    <p className="text-[#8b7266]" style={{ fontFamily: "Inter, sans-serif", fontSize: "14px" }}>{t("admin.finance.emptySettlements")}</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[860px]">
                      <thead>
                        <tr style={{ background: "#fffaf7" }}>
                          {[
                            t("admin.finance.table.owner"),
                            t("admin.finance.table.venue"),
                            t("admin.finance.table.gross"),
                            t("admin.finance.table.commission"),
                            t("admin.finance.table.net"),
                            t("admin.finance.table.settledAt"),
                          ].map((label, index) => (
                            <th
                              key={label}
                              className={`px-4 py-3 ${index >= 2 ? "text-right" : "text-left"}`}
                              style={{ fontFamily: "Inter, sans-serif", fontSize: "11px", fontWeight: 800, color: "#8b7266", letterSpacing: "0.08em", textTransform: "uppercase" }}
                            >
                              {label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {data.recentSettlements.map((settlement) => (
                          <SettlementRow key={settlement.id} settlement={settlement} locale={locale} t={t} />
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
