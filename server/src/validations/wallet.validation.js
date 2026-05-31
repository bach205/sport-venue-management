const mongoose = require("mongoose");
const { validatePaginationQuery } = require("./venue.validation");

const normalizeOptionalString = (value) =>
  value === undefined || value === null ? undefined : String(value).trim();

const validateWalletTransactionsQuery = (query = {}) => {
  const pagination = validatePaginationQuery(query);
  const errors = [...pagination.errors];
  const type = normalizeOptionalString(query.type);
  const status = normalizeOptionalString(query.status);
  const allowedTypes = [
    "topup",
    "withdraw_hold",
    "withdraw_approved",
    "withdraw_rejected",
    "refund_auto_credit",
    "owner_settlement_credit",
    "platform_commission",
    "adjustment",
  ];
  const allowedStatuses = ["pending", "completed", "failed", "canceled"];

  if (type && !allowedTypes.includes(type)) {
    errors.push("Transaction type filter is invalid.");
  }

  if (status && !allowedStatuses.includes(status)) {
    errors.push("Transaction status filter is invalid.");
  }

  return {
    isValid: errors.length === 0,
    errors,
    value: {
      ...pagination.value,
      type: type || undefined,
      status: status || undefined,
    },
  };
};

const validateTopupPayload = (payload = {}) => {
  const amount = Number(payload.amount);
  const provider = normalizeOptionalString(payload.provider) || "sepay";
  const note = normalizeOptionalString(payload.note) || "";
  const errors = [];

  if (!Number.isFinite(amount) || amount <= 0) {
    errors.push("Amount must be a positive number.");
  }

  if (provider.length > 50) {
    errors.push("Provider must not exceed 50 characters.");
  }

  if (note.length > 500) {
    errors.push("Note must not exceed 500 characters.");
  }

  return {
    isValid: errors.length === 0,
    errors,
    value: {
      amount: Number.isFinite(amount) ? amount : undefined,
      provider,
      note,
    },
  };
};

const validatePayoutProfilePayload = (payload = {}) => {
  const bankCode = normalizeOptionalString(payload.bank_code);
  const bankName = normalizeOptionalString(payload.bank_name);
  const accountNumber = normalizeOptionalString(payload.account_number);
  const accountName = normalizeOptionalString(payload.account_name);
  const note = normalizeOptionalString(payload.note) || "";
  const isDefault = Boolean(payload.is_default);
  const errors = [];

  if (!bankCode) {
    errors.push("Bank code is required.");
  }

  if (!bankName) {
    errors.push("Bank name is required.");
  }

  if (!accountNumber) {
    errors.push("Account number is required.");
  }

  if (!accountName) {
    errors.push("Account name is required.");
  }

  if (note.length > 500) {
    errors.push("Note must not exceed 500 characters.");
  }

  return {
    isValid: errors.length === 0,
    errors,
    value: {
      bank_code: bankCode,
      bank_name: bankName,
      account_number: accountNumber,
      account_name: accountName,
      note,
      is_default: isDefault,
    },
  };
};

const validateWithdrawRequestPayload = (payload = {}) => {
  const amount = Number(payload.amount);
  const payoutProfileId = normalizeOptionalString(payload.payout_profile_id);
  const note = normalizeOptionalString(payload.note) || "";
  const errors = [];

  if (!Number.isFinite(amount) || amount <= 0) {
    errors.push("Amount must be a positive number.");
  }

  if (!payoutProfileId) {
    errors.push("Payout profile id is required.");
  } else if (!mongoose.Types.ObjectId.isValid(payoutProfileId)) {
    errors.push("Payout profile id is invalid.");
  }

  if (note.length > 500) {
    errors.push("Note must not exceed 500 characters.");
  }

  return {
    isValid: errors.length === 0,
    errors,
    value: {
      amount: Number.isFinite(amount) ? amount : undefined,
      payout_profile_id: payoutProfileId,
      note,
    },
  };
};

const validateWithdrawRequestsQuery = (query = {}) => {
  const pagination = validatePaginationQuery(query);
  const errors = [...pagination.errors];
  const status = normalizeOptionalString(query.status);
  const allowedStatuses = ["pending", "approved", "rejected", "paid"];

  if (status && !allowedStatuses.includes(status)) {
    errors.push("Withdraw request status filter is invalid.");
  }

  return {
    isValid: errors.length === 0,
    errors,
    value: {
      ...pagination.value,
      status: status || undefined,
    },
  };
};

const validateWithdrawReviewPayload = (payload = {}) => {
  const action = normalizeOptionalString(payload.action);
  const note = normalizeOptionalString(payload.note) || "";
  const errors = [];

  if (!action) {
    errors.push("Action is required.");
  } else if (!["approve", "reject"].includes(action)) {
    errors.push("Action must be either approve or reject.");
  }

  if (note.length > 500) {
    errors.push("Note must not exceed 500 characters.");
  }

  return {
    isValid: errors.length === 0,
    errors,
    value: {
      action,
      note,
    },
  };
};

const validateWalletTopupWebhookPayload = (payload = {}) => {
  const providerReference = normalizeOptionalString(payload.code || payload.content);
  const transactionDate = normalizeOptionalString(payload.transactionDate) || "";
  const transferAmount = Number(payload.transferAmount);
  const transferType = normalizeOptionalString(payload.transferType);
  const errors = [];

  if (!providerReference) {
    errors.push("Wallet topup webhook must include code or content.");
  }

  if (!transferType) {
    errors.push("Transfer type is required.");
  } else if (!["in", "out"].includes(transferType)) {
    errors.push("Transfer type must be either in or out.");
  }

  if (!Number.isFinite(transferAmount) || transferAmount < 0) {
    errors.push("Transfer amount must be a non-negative number.");
  }

  if (transactionDate && Number.isNaN(new Date(transactionDate.replace(" ", "T")).getTime())) {
    errors.push("Transaction date must be a valid datetime.");
  }

  return {
    isValid: errors.length === 0,
    errors,
    value: {
      provider_reference: providerReference.trim().replace(/\s+/g, " ").split(" ")[0].toUpperCase(),
      amount: transferAmount,
      paid_at: transactionDate ? new Date(transactionDate.replace(" ", "T")).toISOString() : undefined,
      metadata: payload,
      transfer_type: transferType,
    },
  };
};

const validateAdminTransactionsQuery = (query = {}) => {
  const transactionQuery = validateWalletTransactionsQuery(query);
  const errors = [...transactionQuery.errors];
  const userId = normalizeOptionalString(query.user_id);

  if (userId && !mongoose.Types.ObjectId.isValid(userId)) {
    errors.push("User id filter is invalid.");
  }

  return {
    isValid: errors.length === 0,
    errors,
    value: {
      ...transactionQuery.value,
      user_id: userId || undefined,
    },
  };
};

module.exports = {
  validateWalletTransactionsQuery,
  validateTopupPayload,
  validatePayoutProfilePayload,
  validateWithdrawRequestPayload,
  validateWithdrawRequestsQuery,
  validateWithdrawReviewPayload,
  validateWalletTopupWebhookPayload,
  validateAdminTransactionsQuery,
};
