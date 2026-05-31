const mongoose = require("mongoose");

const { HTTP_STATUS } = require("../../constants");
const createHttpError = require("../../utils/createHttpError");
const { User, Profile } = require("../user/model");
const { Venue, Booking, Payment, Refund } = require("../venue/model");
const {
  Wallet,
  WalletTransaction,
  WithdrawRequest,
  OwnerSettlement,
} = require("./model");

const AUTO_REFUND_WINDOW_MS = 15 * 60 * 1000;
const DEFAULT_COMMISSION_RATE = 0.05;
const DEFAULT_SETTLEMENT_INTERVAL_MS = 60 * 1000;
const SEPAY_PROVIDER = "sepay";
const WALLET_TOPUP_REFERENCE_PREFIX = "WALLET";

class WalletService {
  constructor() {
    this.settlementTimer = null;
    this.settlementRunning = false;
  }

  async getMyWallet(userId) {
    const wallet = await this.getOrCreateWallet(userId);
    const [pendingWithdrawCount, recentTransactions] = await Promise.all([
      WithdrawRequest.countDocuments({ user_id: userId, status: "pending" }),
      WalletTransaction.find({ user_id: userId }).sort({ createdAt: -1 }).limit(5),
    ]);

    return {
      wallet: this.formatWallet(wallet),
      stats: {
        pendingWithdrawCount,
      },
      recentTransactions: recentTransactions.map((transaction) =>
        this.formatWalletTransaction(transaction)
      ),
    };
  }

  async listMyTransactions(userId, options = {}) {
    await this.getOrCreateWallet(userId);
    const filter = { user_id: new mongoose.Types.ObjectId(userId) };

    if (options.type) {
      filter.type = options.type;
    }

    if (options.status) {
      filter.status = options.status;
    }

    return this.getTransactionCollection(filter, options.page, options.limit);
  }

  async createTopupIntent(userId, payload) {
    const wallet = await this.getOrCreateWallet(userId);
    const provider = this.getTopupProvider(payload.provider);
    const reference = this.buildTopupProviderReference(wallet._id);

    const transaction = await WalletTransaction.create({
      wallet_id: wallet._id,
      user_id: wallet.user_id,
      type: "topup",
      direction: "credit",
      amount: payload.amount,
      balance_before: wallet.available_balance,
      balance_after: wallet.available_balance,
      pending_before: wallet.pending_withdraw_balance,
      pending_after: wallet.pending_withdraw_balance,
      status: "pending",
      provider,
      provider_reference: reference,
      reference_type: "wallet_topup",
      reference_id: reference,
      metadata: {
        note: payload.note || "",
      },
    });

    return {
      wallet: this.formatWallet(wallet),
      transaction: this.formatWalletTransaction(transaction),
      paymentInstructions: this.buildSepayInstructions(reference, payload.amount),
    };
  }

  async handleTopupWebhook(provider, payload) {
    const normalizedProvider = this.getTopupProvider(provider);
    const transaction = await WalletTransaction.findOne({
      provider: normalizedProvider,
      provider_reference: payload.provider_reference,
      type: "topup",
    });

    if (!transaction) {
      throw createHttpError(HTTP_STATUS.NOT_FOUND, "Wallet topup reference not found.");
    }

    const wallet = await Wallet.findById(transaction.wallet_id);
    if (!wallet) {
      throw createHttpError(HTTP_STATUS.NOT_FOUND, "Wallet not found.");
    }

    if (transaction.status === "completed") {
      return {
        acknowledged: true,
        wallet: this.formatWallet(wallet),
        transaction: this.formatWalletTransaction(transaction),
      };
    }

    if (payload.amount < transaction.amount) {
      return {
        acknowledged: true,
        ignored: true,
        reason: "Transferred amount is lower than the requested topup amount.",
        wallet: this.formatWallet(wallet),
        transaction: this.formatWalletTransaction(transaction),
      };
    }

    const balanceBefore = wallet.available_balance;
    wallet.available_balance += transaction.amount;
    wallet.last_transaction_at = new Date();
    await wallet.save();

    transaction.status = "completed";
    transaction.balance_before = balanceBefore;
    transaction.balance_after = wallet.available_balance;
    transaction.pending_before = wallet.pending_withdraw_balance;
    transaction.pending_after = wallet.pending_withdraw_balance;
    transaction.completed_at = payload.paid_at ? new Date(payload.paid_at) : new Date();
    transaction.metadata = {
      ...(transaction.metadata || {}),
      webhook: payload.metadata || {},
    };
    await transaction.save();

    return {
      acknowledged: true,
      wallet: this.formatWallet(wallet),
      transaction: this.formatWalletTransaction(transaction),
    };
  }

  async createPayoutProfile(userId, payload) {
    const wallet = await this.getOrCreateWallet(userId);
    this.normalizeDefaultFlag(wallet, payload.is_default);

    wallet.payout_profiles.push({
      bank_code: payload.bank_code,
      bank_name: payload.bank_name,
      account_number: payload.account_number,
      account_name: payload.account_name,
      is_default: payload.is_default || wallet.payout_profiles.length === 0,
      note: payload.note || "",
    });
    await wallet.save();

    return {
      wallet: this.formatWallet(wallet),
      payoutProfile: this.formatPayoutProfile(wallet.payout_profiles[wallet.payout_profiles.length - 1]),
    };
  }

  async updatePayoutProfile(userId, profileId, payload) {
    const wallet = await this.getOrCreateWallet(userId);
    const profile = wallet.payout_profiles.id(profileId);

    if (!profile) {
      throw createHttpError(HTTP_STATUS.NOT_FOUND, "Payout profile not found.");
    }

    if (payload.is_default) {
      this.normalizeDefaultFlag(wallet, true);
    }

    profile.bank_code = payload.bank_code;
    profile.bank_name = payload.bank_name;
    profile.account_number = payload.account_number;
    profile.account_name = payload.account_name;
    profile.is_default = payload.is_default;
    profile.note = payload.note || "";
    await wallet.save();

    return {
      wallet: this.formatWallet(wallet),
      payoutProfile: this.formatPayoutProfile(profile),
    };
  }

  async deletePayoutProfile(userId, profileId) {
    const wallet = await this.getOrCreateWallet(userId);
    const profile = wallet.payout_profiles.id(profileId);

    if (!profile) {
      throw createHttpError(HTTP_STATUS.NOT_FOUND, "Payout profile not found.");
    }

    const wasDefault = profile.is_default;
    profile.deleteOne();

    if (wasDefault && wallet.payout_profiles.length > 0) {
      wallet.payout_profiles[0].is_default = true;
    }

    await wallet.save();

    return {
      wallet: this.formatWallet(wallet),
      deletedId: profileId,
    };
  }

  async createWithdrawRequest(userId, payload) {
    const wallet = await this.getOrCreateWallet(userId);
    const payoutProfile = wallet.payout_profiles.id(payload.payout_profile_id);

    if (!payoutProfile) {
      throw createHttpError(HTTP_STATUS.NOT_FOUND, "Payout profile not found.");
    }

    if (wallet.available_balance < payload.amount) {
      throw createHttpError(HTTP_STATUS.BAD_REQUEST, "Insufficient available balance.");
    }

    const availableBefore = wallet.available_balance;
    const pendingBefore = wallet.pending_withdraw_balance;

    wallet.available_balance -= payload.amount;
    wallet.pending_withdraw_balance += payload.amount;
    wallet.last_transaction_at = new Date();
    await wallet.save();

    const withdrawRequest = await WithdrawRequest.create({
      wallet_id: wallet._id,
      user_id: wallet.user_id,
      amount: payload.amount,
      status: "pending",
      payout_account_snapshot: {
        bank_code: payoutProfile.bank_code,
        bank_name: payoutProfile.bank_name,
        account_number: payoutProfile.account_number,
        account_name: payoutProfile.account_name,
        note: payoutProfile.note || "",
      },
      note: payload.note || "",
    });

    const transaction = await WalletTransaction.create({
      wallet_id: wallet._id,
      user_id: wallet.user_id,
      type: "withdraw_hold",
      direction: "debit",
      amount: payload.amount,
      balance_before: availableBefore,
      balance_after: wallet.available_balance,
      pending_before: pendingBefore,
      pending_after: wallet.pending_withdraw_balance,
      status: "completed",
      reference_type: "withdraw_request",
      reference_id: String(withdrawRequest._id),
      metadata: {
        payout_profile_id: String(payoutProfile._id),
      },
      completed_at: new Date(),
    });

    return {
      wallet: this.formatWallet(wallet),
      withdrawRequest: this.formatWithdrawRequest(withdrawRequest),
      transaction: this.formatWalletTransaction(transaction),
    };
  }

  async listMyWithdrawRequests(userId, options = {}) {
    await this.getOrCreateWallet(userId);
    const filter = { user_id: new mongoose.Types.ObjectId(userId) };

    if (options.status) {
      filter.status = options.status;
    }

    return this.getWithdrawRequestCollection(filter, options.page, options.limit);
  }

  async listAdminWithdrawRequests(options = {}) {
    const filter = {};
    if (options.status) {
      filter.status = options.status;
    }

    return this.getWithdrawRequestCollection(filter, options.page, options.limit, {
      includeUser: true,
    });
  }

  async listAdminTransactions(options = {}) {
    const filter = {};

    if (options.type) {
      filter.type = options.type;
    }

    if (options.status) {
      filter.status = options.status;
    }

    if (options.user_id) {
      filter.user_id = new mongoose.Types.ObjectId(options.user_id);
    }

    return this.getTransactionCollection(filter, options.page, options.limit, {
      includeUser: true,
    });
  }

  async getAdminSettlementDashboard() {
    const pendingItems = await this.getPendingSettlementItems();
    const [settledTotals, recentSettlements] = await Promise.all([
      this.getSettledTotals(),
      this.listAdminOwnerSettlements({ page: 1, limit: 8 }),
    ]);

    const ownerHoldMap = new Map();
    pendingItems.forEach((item) => {
      const key = item.owner.id;
      const current = ownerHoldMap.get(key) || {
        owner: item.owner,
        grossAmount: 0,
        commissionAmount: 0,
        netAmount: 0,
        bookingCount: 0,
        venues: new Map(),
      };

      current.grossAmount += item.grossAmount;
      current.commissionAmount += item.commissionAmount;
      current.netAmount += item.netAmount;
      current.bookingCount += 1;

      const venueKey = item.venue.id;
      const venue = current.venues.get(venueKey) || {
        venue: item.venue,
        grossAmount: 0,
        commissionAmount: 0,
        netAmount: 0,
        bookingCount: 0,
      };
      venue.grossAmount += item.grossAmount;
      venue.commissionAmount += item.commissionAmount;
      venue.netAmount += item.netAmount;
      venue.bookingCount += 1;
      current.venues.set(venueKey, venue);
      ownerHoldMap.set(key, current);
    });

    const pendingGrossAmount = pendingItems.reduce((sum, item) => sum + item.grossAmount, 0);
    const pendingCommissionAmount = pendingItems.reduce((sum, item) => sum + item.commissionAmount, 0);
    const pendingNetAmount = pendingItems.reduce((sum, item) => sum + item.netAmount, 0);

    return {
      summary: {
        platformHoldGrossAmount: pendingGrossAmount,
        ownerPendingNetAmount: pendingNetAmount,
        pendingCommissionAmount,
        pendingBookingCount: pendingItems.length,
        settledGrossAmount: settledTotals.grossAmount,
        paidToOwnersAmount: settledTotals.netAmount,
        platformCommissionEarnedAmount: settledTotals.commissionAmount,
        settledCount: settledTotals.count,
      },
      ownerHolds: [...ownerHoldMap.values()]
        .map((item) => ({
          owner: item.owner,
          grossAmount: item.grossAmount,
          commissionAmount: item.commissionAmount,
          netAmount: item.netAmount,
          bookingCount: item.bookingCount,
          venues: [...item.venues.values()],
        }))
        .sort((a, b) => b.netAmount - a.netAmount),
      recentSettlements: recentSettlements.items,
    };
  }

  async listAdminOwnerSettlements(options = {}) {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      OwnerSettlement.find({}).sort({ settled_at: -1, createdAt: -1 }).skip(skip).limit(limit),
      OwnerSettlement.countDocuments({}),
    ]);

    return {
      items: await this.formatOwnerSettlements(items),
      pagination: this.buildPagination(page, limit, total),
    };
  }

  async reviewWithdrawRequest(adminUserId, withdrawRequestId, payload) {
    const withdrawRequest = await WithdrawRequest.findById(withdrawRequestId);

    if (!withdrawRequest) {
      throw createHttpError(HTTP_STATUS.NOT_FOUND, "Withdraw request not found.");
    }

    if (withdrawRequest.status !== "pending") {
      throw createHttpError(
        HTTP_STATUS.BAD_REQUEST,
        "Withdraw request has already been processed."
      );
    }

    const wallet = await Wallet.findById(withdrawRequest.wallet_id);

    if (!wallet) {
      throw createHttpError(HTTP_STATUS.NOT_FOUND, "Wallet not found.");
    }

    const availableBefore = wallet.available_balance;
    const pendingBefore = wallet.pending_withdraw_balance;

    if (wallet.pending_withdraw_balance < withdrawRequest.amount) {
      throw createHttpError(
        HTTP_STATUS.BAD_REQUEST,
        "Pending withdraw balance is lower than the request amount."
      );
    }

    wallet.pending_withdraw_balance -= withdrawRequest.amount;

    if (payload.action === "reject") {
      wallet.available_balance += withdrawRequest.amount;
    }

    wallet.last_transaction_at = new Date();
    await wallet.save();

    withdrawRequest.status = payload.action === "approve" ? "paid" : "rejected";
    withdrawRequest.reviewed_by = adminUserId;
    withdrawRequest.reviewed_at = new Date();
    withdrawRequest.note = payload.note || withdrawRequest.note;
    withdrawRequest.rejection_reason =
      payload.action === "reject" ? payload.note || "" : "";
    await withdrawRequest.save();

    const transaction = await WalletTransaction.create({
      wallet_id: wallet._id,
      user_id: wallet.user_id,
      type: payload.action === "approve" ? "withdraw_approved" : "withdraw_rejected",
      direction: payload.action === "approve" ? "debit" : "credit",
      amount: withdrawRequest.amount,
      balance_before: availableBefore,
      balance_after: wallet.available_balance,
      pending_before: pendingBefore,
      pending_after: wallet.pending_withdraw_balance,
      status: "completed",
      reference_type: "withdraw_request",
      reference_id: String(withdrawRequest._id),
      metadata: {
        reviewed_by: String(adminUserId),
      },
      completed_at: new Date(),
    });

    return {
      wallet: this.formatWallet(wallet),
      withdrawRequest: this.formatWithdrawRequest(withdrawRequest),
      transaction: this.formatWalletTransaction(transaction),
    };
  }

  async applyAutoRefundCredit({ booking, payment, refund }) {
    const wallet = await this.getOrCreateWallet(booking.user_id);
    const existingTransaction = await WalletTransaction.findOne({
      user_id: booking.user_id,
      type: "refund_auto_credit",
      reference_type: "refund",
      reference_id: String(refund._id),
    });

    if (existingTransaction) {
      return this.formatWallet(wallet);
    }

    const balanceBefore = wallet.available_balance;
    wallet.available_balance += payment.amount;
    wallet.last_transaction_at = new Date();
    await wallet.save();

    await WalletTransaction.create({
      wallet_id: wallet._id,
      user_id: wallet.user_id,
      type: "refund_auto_credit",
      direction: "credit",
      amount: payment.amount,
      balance_before: balanceBefore,
      balance_after: wallet.available_balance,
      pending_before: wallet.pending_withdraw_balance,
      pending_after: wallet.pending_withdraw_balance,
      status: "completed",
      reference_type: "refund",
      reference_id: String(refund._id),
      metadata: {
        booking_id: String(booking._id),
        payment_id: String(payment._id),
      },
      completed_at: new Date(),
    });

    return this.formatWallet(wallet);
  }

  startSettlementScheduler() {
    const intervalMs = Number(process.env.SETTLEMENT_JOB_INTERVAL_MS || DEFAULT_SETTLEMENT_INTERVAL_MS);
    if (!Number.isFinite(intervalMs) || intervalMs <= 0) {
      return;
    }

    if (this.settlementTimer) {
      return;
    }

    this.settlementTimer = setInterval(() => {
      this.runDueOwnerSettlements().catch((error) => {
        console.error("Wallet settlement job failed:", error);
      });
    }, intervalMs);
  }

  stopSettlementScheduler() {
    if (this.settlementTimer) {
      clearInterval(this.settlementTimer);
      this.settlementTimer = null;
    }
  }

  async runDueOwnerSettlements() {
    if (this.settlementRunning) {
      return { processed: 0, skipped: true };
    }

    this.settlementRunning = true;

    try {
      const threshold = new Date(Date.now() - AUTO_REFUND_WINDOW_MS);
      const payments = await Payment.find({
        status: "paid",
        paid_at: { $ne: null, $lte: threshold },
      }).sort({ paid_at: 1 });

      let processed = 0;

      for (const payment of payments) {
        const existingSettlement = await OwnerSettlement.findOne({
          booking_id: payment.booking_id,
        });

        if (existingSettlement) {
          await this.ensureSettlementTransactions(existingSettlement);
          continue;
        }

        const booking = await Booking.findById(payment.booking_id);
        if (!booking || booking.status !== "confirmed") {
          continue;
        }

        const latestRefund = await Refund.findOne({ booking_id: booking._id }).sort({ createdAt: -1 });
        if (
          latestRefund &&
          latestRefund.type === "manual" &&
          latestRefund.status !== "rejected"
        ) {
          continue;
        }

        const venue = await Venue.findById(booking.venue_id);
        if (!venue) {
          continue;
        }

        await this.settleOwnerBooking({ booking, payment, venue });
        processed += 1;
      }

      return { processed };
    } finally {
      this.settlementRunning = false;
    }
  }

  async settleOwnerBooking({ booking, payment, venue }) {
    const ownerWallet = await this.getOrCreateWallet(venue.owner_id);
    const commissionRate = this.getCommissionRate();
    const grossAmount = payment.amount;
    const commissionAmount = Math.round(grossAmount * commissionRate);
    const netAmount = grossAmount - commissionAmount;

    const settlement = await OwnerSettlement.create({
      booking_id: booking._id,
      payment_id: payment._id,
      owner_id: venue.owner_id,
      venue_id: venue._id,
      gross_amount: grossAmount,
      commission_rate: commissionRate,
      commission_amount: commissionAmount,
      net_amount: netAmount,
      eligible_at: payment.paid_at,
      settled_at: new Date(),
    });

    const { wallet: updatedOwnerWallet, balanceBefore } =
      await this.incrementWalletAvailableBalance(ownerWallet, netAmount);

    await WalletTransaction.create({
      wallet_id: updatedOwnerWallet._id,
      user_id: updatedOwnerWallet.user_id,
      type: "owner_settlement_credit",
      direction: "credit",
      amount: netAmount,
      balance_before: balanceBefore,
      balance_after: updatedOwnerWallet.available_balance,
      pending_before: updatedOwnerWallet.pending_withdraw_balance,
      pending_after: updatedOwnerWallet.pending_withdraw_balance,
      status: "completed",
      reference_type: "owner_settlement",
      reference_id: String(settlement._id),
      metadata: {
        booking_id: String(booking._id),
        payment_id: String(payment._id),
        gross_amount: grossAmount,
      },
      completed_at: new Date(),
    });

    await WalletTransaction.create({
      wallet_id: null,
      user_id: null,
      type: "platform_commission",
      direction: "credit",
      amount: commissionAmount,
      balance_before: 0,
      balance_after: commissionAmount,
      pending_before: 0,
      pending_after: 0,
      status: "completed",
      reference_type: "owner_settlement",
      reference_id: String(settlement._id),
      metadata: {
        booking_id: String(booking._id),
        owner_id: String(venue.owner_id),
        venue_id: String(venue._id),
      },
      completed_at: new Date(),
    });
  }

  async ensureSettlementTransactions(settlement) {
    const credited = await this.ensureOwnerSettlementCredit(settlement);
    await this.ensurePlatformCommissionTransaction(settlement);
    return credited;
  }

  async ensureOwnerSettlementCredit(settlement) {
    const existingCredit = await WalletTransaction.findOne({
      type: "owner_settlement_credit",
      reference_type: "owner_settlement",
      reference_id: String(settlement._id),
    });

    if (existingCredit) {
      return false;
    }

    const ownerWallet = await this.getOrCreateWallet(settlement.owner_id);
    const { wallet: updatedOwnerWallet, balanceBefore } =
      await this.incrementWalletAvailableBalance(ownerWallet, settlement.net_amount);

    await WalletTransaction.create({
      wallet_id: updatedOwnerWallet._id,
      user_id: updatedOwnerWallet.user_id,
      type: "owner_settlement_credit",
      direction: "credit",
      amount: settlement.net_amount,
      balance_before: balanceBefore,
      balance_after: updatedOwnerWallet.available_balance,
      pending_before: updatedOwnerWallet.pending_withdraw_balance,
      pending_after: updatedOwnerWallet.pending_withdraw_balance,
      status: "completed",
      reference_type: "owner_settlement",
      reference_id: String(settlement._id),
      metadata: {
        booking_id: String(settlement.booking_id),
        payment_id: String(settlement.payment_id),
        gross_amount: settlement.gross_amount,
      },
      completed_at: new Date(),
    });

    return true;
  }

  async incrementWalletAvailableBalance(wallet, amount) {
    const balanceBefore = wallet.available_balance;
    const updatedWallet = await Wallet.findByIdAndUpdate(
      wallet._id,
      {
        $inc: { available_balance: amount },
        $set: { last_transaction_at: new Date() },
      },
      { new: true, runValidators: false }
    );

    if (!updatedWallet) {
      throw createHttpError(HTTP_STATUS.NOT_FOUND, "Wallet not found.");
    }

    return { wallet: updatedWallet, balanceBefore };
  }

  async ensurePlatformCommissionTransaction(settlement) {
    const existingCommission = await WalletTransaction.findOne({
      type: "platform_commission",
      reference_type: "owner_settlement",
      reference_id: String(settlement._id),
    });

    if (existingCommission) {
      return false;
    }

    await WalletTransaction.create({
      wallet_id: null,
      user_id: null,
      type: "platform_commission",
      direction: "credit",
      amount: settlement.commission_amount,
      balance_before: 0,
      balance_after: settlement.commission_amount,
      pending_before: 0,
      pending_after: 0,
      status: "completed",
      reference_type: "owner_settlement",
      reference_id: String(settlement._id),
      metadata: {
        booking_id: String(settlement.booking_id),
        owner_id: String(settlement.owner_id),
        venue_id: String(settlement.venue_id),
      },
      completed_at: new Date(),
    });

    return true;
  }

  async getPendingSettlementItems() {
    const payments = await Payment.find({
      status: "paid",
      paid_at: { $ne: null },
    }).sort({ paid_at: 1 });

    if (payments.length === 0) {
      return [];
    }

    const bookingIds = payments.map((payment) => payment.booking_id);
    const existingSettlements = await OwnerSettlement.find({ booking_id: { $in: bookingIds } }).select("booking_id");
    const settledBookingIds = new Set(existingSettlements.map((item) => String(item.booking_id)));
    const commissionRate = this.getCommissionRate();
    const items = [];

    for (const payment of payments) {
      if (settledBookingIds.has(String(payment.booking_id))) {
        continue;
      }

      const booking = await Booking.findById(payment.booking_id);
      if (!booking || booking.status !== "confirmed") {
        continue;
      }

      const latestRefund = await Refund.findOne({ booking_id: booking._id }).sort({ createdAt: -1 });
      if (
        latestRefund &&
        latestRefund.type === "manual" &&
        latestRefund.status !== "rejected"
      ) {
        continue;
      }

      const venue = await Venue.findById(booking.venue_id);
      if (!venue) {
        continue;
      }

      const ownerMap = await this.getUserSummaries([venue.owner_id]);
      const owner = ownerMap.get(String(venue.owner_id)) || {
        id: String(venue.owner_id),
        email: null,
        name: "Unknown owner",
      };
      const grossAmount = payment.amount;
      const commissionAmount = Math.round(grossAmount * commissionRate);
      const netAmount = grossAmount - commissionAmount;

      items.push({
        bookingId: String(booking._id),
        paymentId: String(payment._id),
        owner,
        venue: this.formatVenueSummary(venue),
        grossAmount,
        commissionRate,
        commissionAmount,
        netAmount,
        paidAt: payment.paid_at,
        eligibleAt: new Date(payment.paid_at.getTime() + AUTO_REFUND_WINDOW_MS),
      });
    }

    return items;
  }

  async getSettledTotals() {
    const [totals] = await OwnerSettlement.aggregate([
      {
        $group: {
          _id: null,
          grossAmount: { $sum: "$gross_amount" },
          commissionAmount: { $sum: "$commission_amount" },
          netAmount: { $sum: "$net_amount" },
          count: { $sum: 1 },
        },
      },
    ]);

    return {
      grossAmount: totals?.grossAmount || 0,
      commissionAmount: totals?.commissionAmount || 0,
      netAmount: totals?.netAmount || 0,
      count: totals?.count || 0,
    };
  }

  async formatOwnerSettlements(settlements = []) {
    if (settlements.length === 0) {
      return [];
    }

    const ownerMap = await this.getUserSummaries(settlements.map((item) => item.owner_id));
    const venues = await Venue.find({ _id: { $in: settlements.map((item) => item.venue_id) } });
    const venueMap = new Map(venues.map((venue) => [String(venue._id), venue]));

    return settlements.map((settlement) => this.formatOwnerSettlement(settlement, {
      owner: ownerMap.get(String(settlement.owner_id)) || null,
      venue: venueMap.has(String(settlement.venue_id))
        ? this.formatVenueSummary(venueMap.get(String(settlement.venue_id)))
        : null,
    }));
  }

  async getOrCreateWallet(userId) {
    let wallet = await Wallet.findOne({ user_id: userId });

    if (!wallet) {
      const user = await User.findById(userId);
      if (!user) {
        throw createHttpError(HTTP_STATUS.NOT_FOUND, "User not found.");
      }

      wallet = await Wallet.create({
        user_id: userId,
        currency: "VND",
        available_balance: 0,
        pending_withdraw_balance: 0,
      });
    }

    return wallet;
  }

  normalizeDefaultFlag(wallet, isDefault) {
    if (!isDefault) {
      return;
    }

    wallet.payout_profiles.forEach((item) => {
      item.is_default = false;
    });
  }

  getTopupProvider(provider) {
    const normalizedProvider = String(
      provider || process.env.WALLET_TOPUP_PROVIDER || SEPAY_PROVIDER
    )
      .trim()
      .toLowerCase();

    if (normalizedProvider !== SEPAY_PROVIDER) {
      throw createHttpError(HTTP_STATUS.BAD_REQUEST, "Unsupported wallet topup provider.");
    }

    return normalizedProvider;
  }

  getCommissionRate() {
    const raw = Number(process.env.PLATFORM_COMMISSION_RATE);
    if (!Number.isFinite(raw) || raw < 0 || raw > 1) {
      return DEFAULT_COMMISSION_RATE;
    }

    return raw;
  }

  buildTopupProviderReference(walletId) {
    return `${WALLET_TOPUP_REFERENCE_PREFIX}${String(walletId).slice(-8).toUpperCase()}${Date.now()}`;
  }

  buildSepayInstructions(reference, amount) {
    const bankName = String(process.env.SEPAY_BANK || "").trim();
    const accountNumber = String(process.env.SEPAY_ACCOUNT_NUMBER || "").trim();
    const accountName = String(process.env.SEPAY_ACCOUNT_NAME || "").trim();
    const template = String(process.env.SEPAY_QR_TEMPLATE || "compact").trim();

    const query = new URLSearchParams({
      acc: accountNumber,
      bank: bankName,
      amount: String(amount),
      des: reference,
      template,
    });

    return {
      provider: SEPAY_PROVIDER,
      bankName,
      accountNumber,
      accountName,
      providerReference: reference,
      qrCodeUrl: bankName && accountNumber ? `https://qr.sepay.vn/img?${query.toString()}` : "",
    };
  }

  async getTransactionCollection(filter, page = 1, limit = 20, options = {}) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      WalletTransaction.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      WalletTransaction.countDocuments(filter),
    ]);

    const userMap = options.includeUser
      ? await this.getUserSummaries(items.map((item) => item.user_id).filter(Boolean))
      : new Map();

    return {
      items: items.map((item) => ({
        ...this.formatWalletTransaction(item),
        user: options.includeUser ? userMap.get(String(item.user_id)) || null : undefined,
      })),
      pagination: this.buildPagination(page, limit, total),
    };
  }

  async getWithdrawRequestCollection(filter, page = 1, limit = 20, options = {}) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      WithdrawRequest.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      WithdrawRequest.countDocuments(filter),
    ]);

    const userMap = options.includeUser
      ? await this.getUserSummaries(items.map((item) => item.user_id).filter(Boolean))
      : new Map();

    const walletIds = [...new Set(items.map((item) => String(item.wallet_id)))];
    const wallets = await Wallet.find({ _id: { $in: walletIds } });
    const walletMap = new Map(wallets.map((wallet) => [String(wallet._id), wallet]));

    return {
      items: items.map((item) => ({
        ...this.formatWithdrawRequest(item),
        wallet: walletMap.has(String(item.wallet_id))
          ? this.formatWallet(walletMap.get(String(item.wallet_id)))
          : null,
        user: options.includeUser ? userMap.get(String(item.user_id)) || null : undefined,
      })),
      pagination: this.buildPagination(page, limit, total),
    };
  }

  async getUserSummaries(userIds = []) {
    if (userIds.length === 0) {
      return new Map();
    }

    const normalizedIds = [...new Set(userIds.map((item) => String(item)))];
    const profiles = await Profile.find({ user_id: { $in: normalizedIds } }).populate("user_id", "email");

    return new Map(
      profiles.map((profile) => [
        String(profile.user_id?._id || profile.user_id),
        {
          id: String(profile.user_id?._id || profile.user_id),
          email: profile.user_id?.email || null,
          name: profile.name,
        },
      ])
    );
  }

  buildPagination(page, limit, total) {
    return {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    };
  }

  formatWallet(wallet) {
    if (!wallet) {
      return null;
    }

    return {
      id: String(wallet._id),
      userId: String(wallet.user_id),
      availableBalance: wallet.available_balance,
      pendingWithdrawBalance: wallet.pending_withdraw_balance,
      currency: wallet.currency,
      payoutProfiles: wallet.payout_profiles.map((profile) => this.formatPayoutProfile(profile)),
      lastTransactionAt: wallet.last_transaction_at,
      createdAt: wallet.createdAt,
      updatedAt: wallet.updatedAt,
    };
  }

  formatPayoutProfile(profile) {
    if (!profile) {
      return null;
    }

    return {
      id: String(profile._id),
      bankCode: profile.bank_code,
      bankName: profile.bank_name,
      accountNumber: profile.account_number,
      accountName: profile.account_name,
      isDefault: Boolean(profile.is_default),
      note: profile.note || "",
    };
  }

  formatWalletTransaction(transaction) {
    if (!transaction) {
      return null;
    }

    return {
      id: String(transaction._id),
      walletId: transaction.wallet_id ? String(transaction.wallet_id) : null,
      userId: transaction.user_id ? String(transaction.user_id) : null,
      type: transaction.type,
      direction: transaction.direction,
      amount: transaction.amount,
      balanceBefore: transaction.balance_before,
      balanceAfter: transaction.balance_after,
      pendingBefore: transaction.pending_before,
      pendingAfter: transaction.pending_after,
      status: transaction.status,
      provider: transaction.provider || "",
      providerReference: transaction.provider_reference || "",
      referenceType: transaction.reference_type || "",
      referenceId: transaction.reference_id || "",
      metadata: transaction.metadata || {},
      completedAt: transaction.completed_at,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
    };
  }

  formatWithdrawRequest(withdrawRequest) {
    if (!withdrawRequest) {
      return null;
    }

    return {
      id: String(withdrawRequest._id),
      walletId: String(withdrawRequest.wallet_id),
      userId: String(withdrawRequest.user_id),
      amount: withdrawRequest.amount,
      status: withdrawRequest.status,
      payoutAccountSnapshot: {
        bankCode: withdrawRequest.payout_account_snapshot.bank_code,
        bankName: withdrawRequest.payout_account_snapshot.bank_name,
        accountNumber: withdrawRequest.payout_account_snapshot.account_number,
        accountName: withdrawRequest.payout_account_snapshot.account_name,
        note: withdrawRequest.payout_account_snapshot.note || "",
      },
      note: withdrawRequest.note || "",
      reviewedBy: withdrawRequest.reviewed_by ? String(withdrawRequest.reviewed_by) : null,
      reviewedAt: withdrawRequest.reviewed_at,
      rejectionReason: withdrawRequest.rejection_reason || "",
      createdAt: withdrawRequest.createdAt,
      updatedAt: withdrawRequest.updatedAt,
    };
  }

  formatVenueSummary(venue) {
    if (!venue) {
      return null;
    }

    return {
      id: String(venue._id),
      ownerId: String(venue.owner_id),
      name: venue.name,
      location: venue.location,
    };
  }

  formatOwnerSettlement(settlement, relations = {}) {
    if (!settlement) {
      return null;
    }

    return {
      id: String(settlement._id),
      bookingId: String(settlement.booking_id),
      paymentId: String(settlement.payment_id),
      ownerId: String(settlement.owner_id),
      venueId: String(settlement.venue_id),
      grossAmount: settlement.gross_amount,
      commissionRate: settlement.commission_rate,
      commissionAmount: settlement.commission_amount,
      netAmount: settlement.net_amount,
      eligibleAt: settlement.eligible_at,
      settledAt: settlement.settled_at,
      createdAt: settlement.createdAt,
      updatedAt: settlement.updatedAt,
      owner: relations.owner || null,
      venue: relations.venue || null,
    };
  }
}

module.exports = new WalletService();
