export type WalletTransactionType =
  | "topup"
  | "withdraw_hold"
  | "withdraw_approved"
  | "withdraw_rejected"
  | "refund_auto_credit"
  | "owner_settlement_credit"
  | "platform_commission"
  | "adjustment";

export type WalletTransactionStatus = "pending" | "completed" | "failed" | "canceled";
export type WithdrawRequestStatus = "pending" | "approved" | "rejected" | "paid";

export interface PayoutProfile {
  id: string;
  bankCode: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  isDefault: boolean;
  note: string;
}

export interface Wallet {
  id: string;
  userId: string;
  availableBalance: number;
  pendingWithdrawBalance: number;
  currency: string;
  payoutProfiles: PayoutProfile[];
  lastTransactionAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WalletTransaction {
  id: string;
  walletId: string | null;
  userId: string | null;
  type: WalletTransactionType;
  direction: "credit" | "debit";
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  pendingBefore: number;
  pendingAfter: number;
  status: WalletTransactionStatus;
  provider: string;
  providerReference: string;
  referenceType: string;
  referenceId: string;
  metadata: Record<string, unknown>;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WithdrawRequest {
  id: string;
  walletId: string;
  userId: string;
  amount: number;
  status: WithdrawRequestStatus;
  payoutAccountSnapshot: {
    bankCode: string;
    bankName: string;
    accountNumber: string;
    accountName: string;
    note: string;
  };
  note: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
  rejectionReason: string;
  createdAt: string;
  updatedAt: string;
  wallet?: Wallet | null;
  user?: {
    id: string;
    email: string | null;
    name: string;
  } | null;
}

export interface OwnerSettlement {
  id: string;
  bookingId: string;
  paymentId: string;
  ownerId: string;
  venueId: string;
  grossAmount: number;
  commissionRate: number;
  commissionAmount: number;
  netAmount: number;
  eligibleAt: string;
  settledAt: string | null;
  createdAt: string;
  updatedAt: string;
  owner: {
    id: string;
    email: string | null;
    name: string;
  } | null;
  venue: {
    id: string;
    ownerId: string;
    name: string;
    location: string;
  } | null;
}

export interface OwnerHold {
  owner: {
    id: string;
    email: string | null;
    name: string;
  };
  grossAmount: number;
  commissionAmount: number;
  netAmount: number;
  bookingCount: number;
  venues: Array<{
    venue: {
      id: string;
      ownerId: string;
      name: string;
      location: string;
    };
    grossAmount: number;
    commissionAmount: number;
    netAmount: number;
    bookingCount: number;
  }>;
}

export interface AdminSettlementDashboard {
  summary: {
    platformHoldGrossAmount: number;
    ownerPendingNetAmount: number;
    pendingCommissionAmount: number;
    pendingBookingCount: number;
    settledGrossAmount: number;
    paidToOwnersAmount: number;
    platformCommissionEarnedAmount: number;
    settledCount: number;
  };
  ownerHolds: OwnerHold[];
  recentSettlements: OwnerSettlement[];
}
