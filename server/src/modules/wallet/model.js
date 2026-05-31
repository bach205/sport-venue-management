const mongoose = require("mongoose");

const CURRENCY = "VND";
const WALLET_TRANSACTION_TYPES = [
  "topup",
  "withdraw_hold",
  "withdraw_approved",
  "withdraw_rejected",
  "refund_auto_credit",
  "owner_settlement_credit",
  "platform_commission",
  "adjustment",
];
const WALLET_TRANSACTION_DIRECTIONS = ["credit", "debit"];
const WALLET_TRANSACTION_STATUSES = ["pending", "completed", "failed", "canceled"];
const WITHDRAW_REQUEST_STATUSES = ["pending", "approved", "rejected", "paid"];

const PayoutProfileSchema = new mongoose.Schema(
  {
    bank_code: { type: String, required: true, trim: true },
    bank_name: { type: String, required: true, trim: true },
    account_number: { type: String, required: true, trim: true },
    account_name: { type: String, required: true, trim: true },
    is_default: { type: Boolean, default: false },
    note: { type: String, default: "", trim: true },
  },
  { _id: true }
);

const WalletSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    available_balance: { type: Number, default: 0, min: 0 },
    pending_withdraw_balance: { type: Number, default: 0, min: 0 },
    currency: { type: String, default: CURRENCY, trim: true },
    payout_profiles: { type: [PayoutProfileSchema], default: [] },
    last_transaction_at: { type: Date, default: null },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date },
  },
  { timestamps: true, collection: "wallets" }
);

const WalletTransactionSchema = new mongoose.Schema(
  {
    wallet_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Wallet",
      default: null,
      index: true,
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    type: {
      type: String,
      enum: WALLET_TRANSACTION_TYPES,
      required: true,
      index: true,
    },
    direction: {
      type: String,
      enum: WALLET_TRANSACTION_DIRECTIONS,
      required: true,
    },
    amount: { type: Number, required: true, min: 0 },
    balance_before: { type: Number, required: true, min: 0 },
    balance_after: { type: Number, required: true, min: 0 },
    pending_before: { type: Number, required: true, min: 0, default: 0 },
    pending_after: { type: Number, required: true, min: 0, default: 0 },
    status: {
      type: String,
      enum: WALLET_TRANSACTION_STATUSES,
      default: "completed",
      required: true,
      index: true,
    },
    provider: { type: String, default: "", trim: true },
    provider_reference: { type: String, default: "", trim: true, index: true },
    reference_type: { type: String, default: "", trim: true, index: true },
    reference_id: { type: String, default: "", trim: true, index: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    completed_at: { type: Date, default: null },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date },
  },
  { timestamps: true, collection: "wallet_transactions" }
);

WalletTransactionSchema.index(
  { provider: 1, provider_reference: 1, type: 1 },
  {
    unique: true,
    partialFilterExpression: {
      type: "topup",
    },
    name: "unique_wallet_topup_provider_reference",
  }
);

const WithdrawRequestSchema = new mongoose.Schema(
  {
    wallet_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Wallet",
      required: true,
      index: true,
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    amount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: WITHDRAW_REQUEST_STATUSES,
      default: "pending",
      required: true,
      index: true,
    },
    payout_account_snapshot: {
      bank_code: { type: String, required: true, trim: true },
      bank_name: { type: String, required: true, trim: true },
      account_number: { type: String, required: true, trim: true },
      account_name: { type: String, required: true, trim: true },
      note: { type: String, default: "", trim: true },
    },
    note: { type: String, default: "", trim: true },
    reviewed_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    reviewed_at: { type: Date, default: null },
    rejection_reason: { type: String, default: "", trim: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date },
  },
  { timestamps: true, collection: "withdraw_requests" }
);

const OwnerSettlementSchema = new mongoose.Schema(
  {
    booking_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
      unique: true,
      index: true,
    },
    payment_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
      required: true,
      index: true,
    },
    owner_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    venue_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Venue",
      required: true,
      index: true,
    },
    gross_amount: { type: Number, required: true, min: 0 },
    commission_rate: { type: Number, required: true, min: 0 },
    commission_amount: { type: Number, required: true, min: 0 },
    net_amount: { type: Number, required: true, min: 0 },
    eligible_at: { type: Date, required: true },
    settled_at: { type: Date, default: null, index: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date },
  },
  { timestamps: true, collection: "owner_settlements" }
);

function updateTimestamp(next) {
  this.set({ updatedAt: Date.now() });
  next();
}

[WalletSchema, WalletTransactionSchema, WithdrawRequestSchema, OwnerSettlementSchema].forEach(
  (schema) => {
    schema.pre("save", function saveHook(next) {
      if (this.isNew) {
        this.createdAt = Date.now();
      }

      this.updatedAt = Date.now();
      next();
    });

    schema.pre("findOneAndUpdate", updateTimestamp);
    schema.pre("updateOne", updateTimestamp);
    schema.pre("updateMany", updateTimestamp);
    schema.pre("findByIdAndUpdate", updateTimestamp);
  }
);

const Wallet = mongoose.model("Wallet", WalletSchema);
const WalletTransaction = mongoose.model("WalletTransaction", WalletTransactionSchema);
const WithdrawRequest = mongoose.model("WithdrawRequest", WithdrawRequestSchema);
const OwnerSettlement = mongoose.model("OwnerSettlement", OwnerSettlementSchema);

module.exports = {
  CURRENCY,
  WALLET_TRANSACTION_TYPES,
  WALLET_TRANSACTION_STATUSES,
  WITHDRAW_REQUEST_STATUSES,
  Wallet,
  WalletTransaction,
  WithdrawRequest,
  OwnerSettlement,
};
