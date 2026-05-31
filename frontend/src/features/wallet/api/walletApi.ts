import { createAxiosInstance } from "@/shared/api/axiosBase";
import { API_BASE_URL } from "@/shared/constants/api";
import type {
  PayoutProfile,
  Wallet,
  WalletTransaction,
  WithdrawRequest,
} from "../types/wallet.types";

const api = createAxiosInstance(API_BASE_URL);

type Pagination = {
  page: number;
  limit: number;
  total: number;
  pages: number;
};

export async function fetchMyWallet() {
  const res = await api.get<{
    message: string;
    data: {
      wallet: Wallet;
      stats: { pendingWithdrawCount: number };
      recentTransactions: WalletTransaction[];
    };
  }>("/wallet/me");

  return res.data.data;
}

export async function fetchMyWalletTransactions(params?: {
  page?: number;
  limit?: number;
  type?: string;
  status?: string;
}) {
  const res = await api.get<{
    message: string;
    data: { items: WalletTransaction[]; pagination: Pagination };
  }>("/wallet/me/transactions", { params });

  return res.data.data;
}

export async function createWalletTopup(payload: { amount: number; provider?: string; note?: string }) {
  const res = await api.post<{
    message: string;
    data: {
      wallet: Wallet;
      transaction: WalletTransaction;
      paymentInstructions: {
        provider: string;
        bankName: string;
        accountNumber: string;
        accountName: string;
        providerReference: string;
        qrCodeUrl: string;
      };
    };
  }>("/wallet/topups", payload);

  return res.data.data;
}

export async function createPayoutProfile(payload: {
  bank_code: string;
  bank_name: string;
  account_number: string;
  account_name: string;
  note?: string;
  is_default?: boolean;
}) {
  const res = await api.post<{
    message: string;
    data: { wallet: Wallet; payoutProfile: PayoutProfile };
  }>("/wallet/payout-profiles", payload);

  return res.data.data;
}

export async function createWithdrawRequest(payload: {
  amount: number;
  payout_profile_id: string;
  note?: string;
}) {
  const res = await api.post<{
    message: string;
    data: { wallet: Wallet; withdrawRequest: WithdrawRequest; transaction: WalletTransaction };
  }>("/wallet/withdraw-requests", payload);

  return res.data.data;
}

export async function fetchMyWithdrawRequests(params?: { page?: number; limit?: number; status?: string }) {
  const res = await api.get<{
    message: string;
    data: { items: WithdrawRequest[]; pagination: Pagination };
  }>("/wallet/withdraw-requests", { params });

  return res.data.data;
}

export async function fetchAdminWithdrawRequests(params?: { page?: number; limit?: number; status?: string }) {
  const res = await api.get<{
    message: string;
    data: { items: WithdrawRequest[]; pagination: Pagination };
  }>("/admin/wallet/withdraw-requests", { params });

  return res.data.data;
}

export async function reviewAdminWithdrawRequest(
  withdrawRequestId: string,
  payload: { action: "approve" | "reject"; note?: string }
) {
  const res = await api.patch<{
    message: string;
    data: { wallet: Wallet; withdrawRequest: WithdrawRequest; transaction: WalletTransaction };
  }>(`/admin/wallet/withdraw-requests/${withdrawRequestId}`, payload);

  return res.data.data;
}
