import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowDownToLine, Landmark, PlusCircle, Wallet as WalletIcon } from "lucide-react";
import { toast } from "sonner";

import {
  createPayoutProfile,
  createWalletTopup,
  createWithdrawRequest,
  fetchMyWallet,
  fetchMyWalletTransactions,
  fetchMyWithdrawRequests,
} from "../api/walletApi";
import type { PayoutProfile, Wallet, WalletTransaction, WithdrawRequest } from "../types/wallet.types";

const DEFAULT_PROFILE = {
  bank_code: "",
  bank_name: "",
  account_number: "",
  account_name: "",
  note: "",
};

function formatMoney(value: number, locale: string) {
  return `${new Intl.NumberFormat(locale).format(value)}đ`;
}

function formatDate(value: string | null | undefined, locale: string, emptyLabel: string) {
  if (!value) return emptyLabel;
  return new Date(value).toLocaleString(locale);
}

export default function WalletPage() {
  const { t, i18n } = useTranslation("matching");
  const locale = i18n.resolvedLanguage === "en" ? "en-US" : "vi-VN";
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [withdrawRequests, setWithdrawRequests] = useState<WithdrawRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [topupAmount, setTopupAmount] = useState(100000);
  const [withdrawAmount, setWithdrawAmount] = useState(50000);
  const [selectedPayoutProfileId, setSelectedPayoutProfileId] = useState("");
  const [topupReference, setTopupReference] = useState("");
  const [profileDraft, setProfileDraft] = useState(DEFAULT_PROFILE);

  const loadWallet = async () => {
    setLoading(true);
    try {
      const [walletData, transactionData, withdrawData] = await Promise.all([
        fetchMyWallet(),
        fetchMyWalletTransactions({ page: 1, limit: 20 }),
        fetchMyWithdrawRequests({ page: 1, limit: 10 }),
      ]);

      setWallet(walletData.wallet);
      setTransactions(transactionData.items);
      setWithdrawRequests(withdrawData.items);
      setSelectedPayoutProfileId((current) => {
        if (current) return current;
        return walletData.wallet.payoutProfiles.find((profile) => profile.isDefault)?.id || "";
      });
    } catch (error: any) {
      toast.error(error?.response?.data?.message || t("wallet.errors.load"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWallet();
  }, []);

  const payoutProfiles = wallet?.payoutProfiles || [];
  const selectedProfile = payoutProfiles.find((profile) => profile.id === selectedPayoutProfileId) || null;

  const recentWithdrawSummary = useMemo(
    () =>
      withdrawRequests
        .slice(0, 3)
        .map((request) => `${formatMoney(request.amount, locale)} · ${request.status}`),
    [locale, withdrawRequests]
  );

  const handleCreateTopup = async () => {
    try {
      const data = await createWalletTopup({ amount: topupAmount });
      setWallet(data.wallet);
      setTopupReference(data.paymentInstructions.providerReference);
      toast.success(t("wallet.toasts.topupCreated"));
      await loadWallet();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || t("wallet.errors.topup"));
    }
  };

  const handleCreatePayoutProfile = async () => {
    try {
      const data = await createPayoutProfile({
        ...profileDraft,
        is_default: payoutProfiles.length === 0,
      });
      setWallet(data.wallet);
      setProfileDraft(DEFAULT_PROFILE);
      setSelectedPayoutProfileId(data.payoutProfile.id);
      toast.success(t("wallet.toasts.profileSaved"));
    } catch (error: any) {
      toast.error(error?.response?.data?.message || t("wallet.errors.profile"));
    }
  };

  const handleCreateWithdraw = async () => {
    if (!selectedPayoutProfileId) {
      toast.error(t("wallet.errors.selectPayout"));
      return;
    }

    try {
      const data = await createWithdrawRequest({
        amount: withdrawAmount,
        payout_profile_id: selectedPayoutProfileId,
      });
      setWallet(data.wallet);
      toast.success(t("wallet.toasts.withdrawCreated"));
      await loadWallet();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || t("wallet.errors.withdraw"));
    }
  };

  const cards = [
    {
      label: t("wallet.cards.available"),
      value: formatMoney(wallet?.availableBalance || 0, locale),
      icon: <WalletIcon size={18} />,
      bg: "#fff1eb",
      color: "#a04100",
    },
    {
      label: t("wallet.cards.pending"),
      value: formatMoney(wallet?.pendingWithdrawBalance || 0, locale),
      icon: <ArrowDownToLine size={18} />,
      bg: "#eefbf7",
      color: "#006a65",
    },
    {
      label: t("wallet.cards.requests"),
      value: String(withdrawRequests.length).padStart(2, "0"),
      icon: <Landmark size={18} />,
      bg: "#f3f7ff",
      color: "#1a5fb4",
      note: recentWithdrawSummary.join(" | ") || t("wallet.empty.withdrawRequests"),
    },
  ];

  const tableHeaders = [
    t("wallet.table.type"),
    t("wallet.table.amount"),
    t("wallet.table.available"),
    t("wallet.table.pending"),
    t("wallet.table.status"),
    t("wallet.table.time"),
  ];

  return (
    <div className="min-h-screen bg-[#fff8f6] px-6 py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-[28px] border bg-white p-6" style={{ borderColor: "#dfc0b3" }}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[#a04100] uppercase tracking-[0.18em]" style={{ fontFamily: "Inter, sans-serif", fontSize: "11px", fontWeight: 700 }}>
                {t("wallet.badge")}
              </p>
              <h1 className="mt-2 text-[#241914]" style={{ fontFamily: "Lexend, sans-serif", fontSize: "32px", fontWeight: 700 }}>
                {t("wallet.title")}
              </h1>
              <p className="mt-2 text-[#584238]" style={{ fontFamily: "Inter, sans-serif", fontSize: "14px" }}>
                {t("wallet.subtitle")}
              </p>
            </div>
            {topupReference && (
              <div className="rounded-2xl border px-4 py-3" style={{ borderColor: "#dfc0b3", background: "#fffaf7" }}>
                <p style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: "#8b7266" }}>{t("wallet.latestTopupReference")}</p>
                <p style={{ fontFamily: "Lexend, sans-serif", fontSize: "16px", fontWeight: 700, color: "#241914" }}>
                  {topupReference}
                </p>
              </div>
            )}
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {cards.map((card) => (
            <div key={card.label} className="rounded-[24px] border bg-white p-5" style={{ borderColor: "#dfc0b3" }}>
              <div className="mb-3 inline-flex rounded-xl p-2" style={{ background: card.bg, color: card.color }}>
                {card.icon}
              </div>
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: "#8b7266" }}>{card.label}</p>
              <h2 className="mt-1 text-[#241914]" style={{ fontFamily: "Lexend, sans-serif", fontSize: "24px", fontWeight: 700 }}>
                {card.value}
              </h2>
              {"note" in card && card.note ? (
                <p className="mt-2 text-[#584238]" style={{ fontFamily: "Inter, sans-serif", fontSize: "12px" }}>
                  {card.note}
                </p>
              ) : null}
            </div>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <div className="rounded-[28px] border bg-white p-6" style={{ borderColor: "#dfc0b3" }}>
              <div className="flex items-center gap-2">
                <PlusCircle size={18} className="text-[#a04100]" />
                <h2 style={{ fontFamily: "Lexend, sans-serif", fontSize: "20px", fontWeight: 700, color: "#241914" }}>
                  {t("wallet.topup.title")}
                </h2>
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <input
                  type="number"
                  value={topupAmount}
                  onChange={(event) => setTopupAmount(Number(event.target.value) || 0)}
                  className="h-11 flex-1 rounded-xl border px-3"
                  style={{ borderColor: "#dfc0b3", fontFamily: "Inter, sans-serif" }}
                  aria-label={t("wallet.topup.amount")}
                />
                <button
                  onClick={handleCreateTopup}
                  className="h-11 rounded-xl px-5 text-white"
                  style={{ background: "linear-gradient(90deg,#a04100,#ff7e36)", fontFamily: "Lexend, sans-serif", fontWeight: 700 }}
                >
                  {t("wallet.topup.create")}
                </button>
              </div>
              <p className="mt-3 text-[#8b7266]" style={{ fontFamily: "Inter, sans-serif", fontSize: "12px" }}>
                {t("wallet.topup.note")}
              </p>
            </div>

            <div className="rounded-[28px] border bg-white p-6" style={{ borderColor: "#dfc0b3" }}>
              <h2 style={{ fontFamily: "Lexend, sans-serif", fontSize: "20px", fontWeight: 700, color: "#241914" }}>
                {t("wallet.payout.title")}
              </h2>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <input value={profileDraft.bank_code} onChange={(event) => setProfileDraft((current) => ({ ...current, bank_code: event.target.value }))} placeholder={t("wallet.payout.bankCode")} className="h-11 rounded-xl border px-3" style={{ borderColor: "#dfc0b3", fontFamily: "Inter, sans-serif" }} />
                <input value={profileDraft.bank_name} onChange={(event) => setProfileDraft((current) => ({ ...current, bank_name: event.target.value }))} placeholder={t("wallet.payout.bankName")} className="h-11 rounded-xl border px-3" style={{ borderColor: "#dfc0b3", fontFamily: "Inter, sans-serif" }} />
                <input value={profileDraft.account_number} onChange={(event) => setProfileDraft((current) => ({ ...current, account_number: event.target.value }))} placeholder={t("wallet.payout.accountNumber")} className="h-11 rounded-xl border px-3" style={{ borderColor: "#dfc0b3", fontFamily: "Inter, sans-serif" }} />
                <input value={profileDraft.account_name} onChange={(event) => setProfileDraft((current) => ({ ...current, account_name: event.target.value }))} placeholder={t("wallet.payout.accountName")} className="h-11 rounded-xl border px-3" style={{ borderColor: "#dfc0b3", fontFamily: "Inter, sans-serif" }} />
              </div>
              <button
                onClick={handleCreatePayoutProfile}
                className="mt-4 h-11 rounded-xl px-5 text-white"
                style={{ background: "#241914", fontFamily: "Lexend, sans-serif", fontWeight: 700 }}
              >
                {t("wallet.payout.save")}
              </button>

              <div className="mt-4 space-y-3">
                {payoutProfiles.map((profile: PayoutProfile) => (
                  <div key={profile.id} className="rounded-2xl border p-4" style={{ borderColor: "#dfc0b3", background: profile.isDefault ? "#fffaf7" : "#fff" }}>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p style={{ fontFamily: "Lexend, sans-serif", fontSize: "15px", fontWeight: 700, color: "#241914" }}>
                          {profile.bankName} · {profile.accountNumber}
                        </p>
                        <p style={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: "#584238" }}>
                          {profile.accountName}
                        </p>
                      </div>
                      {profile.isDefault ? (
                        <span className="rounded-full px-2 py-1 text-[#006a65]" style={{ background: "#eefbf7", fontFamily: "Inter, sans-serif", fontSize: "11px", fontWeight: 700 }}>
                          {t("wallet.payout.default")}
                        </span>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[28px] border bg-white p-6" style={{ borderColor: "#dfc0b3" }}>
              <h2 style={{ fontFamily: "Lexend, sans-serif", fontSize: "20px", fontWeight: 700, color: "#241914" }}>
                {t("wallet.withdraw.title")}
              </h2>
              <div className="mt-4 space-y-3">
                <select
                  value={selectedPayoutProfileId}
                  onChange={(event) => setSelectedPayoutProfileId(event.target.value)}
                  className="h-11 w-full rounded-xl border px-3"
                  style={{ borderColor: "#dfc0b3", fontFamily: "Inter, sans-serif" }}
                  aria-label={t("wallet.withdraw.selectProfile")}
                >
                  <option value="">{t("wallet.withdraw.selectProfile")}</option>
                  {payoutProfiles.map((profile) => (
                    <option key={profile.id} value={profile.id}>
                      {profile.bankName} · {profile.accountNumber}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={(event) => setWithdrawAmount(Number(event.target.value) || 0)}
                  className="h-11 w-full rounded-xl border px-3"
                  style={{ borderColor: "#dfc0b3", fontFamily: "Inter, sans-serif" }}
                  aria-label={t("wallet.withdraw.amount")}
                />
                <button
                  onClick={handleCreateWithdraw}
                  className="h-11 w-full rounded-xl text-white"
                  style={{ background: "#006a65", fontFamily: "Lexend, sans-serif", fontWeight: 700 }}
                >
                  {t("wallet.withdraw.create")}
                </button>
              </div>
              {selectedProfile ? (
                <p className="mt-3 text-[#8b7266]" style={{ fontFamily: "Inter, sans-serif", fontSize: "12px" }}>
                  {t("wallet.withdraw.selectedHint", {
                    accountName: selectedProfile.accountName,
                    accountNumber: selectedProfile.accountNumber,
                  })}
                </p>
              ) : null}
            </div>

            <div className="rounded-[28px] border bg-white p-6" style={{ borderColor: "#dfc0b3" }}>
              <h2 style={{ fontFamily: "Lexend, sans-serif", fontSize: "20px", fontWeight: 700, color: "#241914" }}>
                {t("wallet.withdraw.recent")}
              </h2>
              <div className="mt-4 space-y-3">
                {withdrawRequests.length === 0 ? (
                  <p style={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: "#8b7266" }}>
                    {t("wallet.empty.withdrawRequests")}
                  </p>
                ) : (
                  withdrawRequests.map((request) => (
                    <div key={request.id} className="rounded-2xl border p-4" style={{ borderColor: "#dfc0b3" }}>
                      <div className="flex items-center justify-between gap-3">
                        <p style={{ fontFamily: "Lexend, sans-serif", fontSize: "15px", fontWeight: 700, color: "#241914" }}>
                          {formatMoney(request.amount, locale)}
                        </p>
                        <span className="rounded-full px-2 py-1" style={{ background: "#fff1eb", fontFamily: "Inter, sans-serif", fontSize: "11px", fontWeight: 700, color: "#a04100" }}>
                          {t(`wallet.withdrawStatuses.${request.status}`)}
                        </span>
                      </div>
                      <p className="mt-2 text-[#584238]" style={{ fontFamily: "Inter, sans-serif", fontSize: "12px" }}>
                        {request.payoutAccountSnapshot.bankName} · {request.payoutAccountSnapshot.accountNumber}
                      </p>
                      <p className="mt-1 text-[#8b7266]" style={{ fontFamily: "Inter, sans-serif", fontSize: "12px" }}>
                        {formatDate(request.createdAt, locale, t("wallet.na"))}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border bg-white p-6" style={{ borderColor: "#dfc0b3" }}>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 style={{ fontFamily: "Lexend, sans-serif", fontSize: "20px", fontWeight: 700, color: "#241914" }}>
              {t("wallet.transactions.title")}
            </h2>
            {loading ? (
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: "#8b7266" }}>{t("wallet.loading")}</span>
            ) : null}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background: "#fffaf7" }}>
                  {tableHeaders.map((label) => (
                    <th key={label} className="px-3 py-3 text-left" style={{ fontFamily: "Inter, sans-serif", fontSize: "11px", color: "#8b7266", textTransform: "uppercase" }}>
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => (
                  <tr key={transaction.id} className="border-b" style={{ borderColor: "#f4ded5" }}>
                    <td className="px-3 py-3" style={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: "#241914" }}>{t(`wallet.transactionTypes.${transaction.type}`)}</td>
                    <td className="px-3 py-3" style={{ fontFamily: "Lexend, sans-serif", fontSize: "13px", fontWeight: 700, color: transaction.direction === "credit" ? "#006a65" : "#a04100" }}>
                      {transaction.direction === "credit" ? "+" : "-"}{formatMoney(transaction.amount, locale)}
                    </td>
                    <td className="px-3 py-3" style={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: "#584238" }}>{formatMoney(transaction.balanceAfter, locale)}</td>
                    <td className="px-3 py-3" style={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: "#584238" }}>{formatMoney(transaction.pendingAfter, locale)}</td>
                    <td className="px-3 py-3" style={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: "#241914" }}>{t(`wallet.transactionStatuses.${transaction.status}`)}</td>
                    <td className="px-3 py-3" style={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: "#8b7266" }}>{formatDate(transaction.createdAt, locale, t("wallet.na"))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
