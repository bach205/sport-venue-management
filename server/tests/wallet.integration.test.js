const mongoose = require("mongoose");
const request = require("supertest");
const { MongoMemoryServer } = require("mongodb-memory-server");

const app = require("../app");
const { signToken } = require("../src/utils/jwt");
const { User, Profile, UserRole } = require("../src/modules/user/model");
const { Venue, Booking, BookingItem, Payment, Refund } = require("../src/modules/venue/model");
const {
  Wallet,
  WalletTransaction,
  WithdrawRequest,
  OwnerSettlement,
} = require("../src/modules/wallet/model");
const walletService = require("../src/modules/wallet/service");

const TEST_DATE = "2026-05-11";
const TEST_DAY_OF_WEEK = new Date(`${TEST_DATE}T00:00:00`).getDay();

let mongoServer;

const authHeader = (token) => ({ Authorization: `Bearer ${token}` });

const createUser = async (role, email) => {
  const user = await User.create({
    email,
    password_hash: "password123",
    is_verified: true,
  });

  await Profile.create({
    user_id: user._id,
    name: email.split("@")[0],
  });

  await UserRole.create({
    user_id: user._id,
    role,
  });

  return {
    user,
    token: signToken({ id: user._id, email: user.email }),
  };
};

const createVenue = async (ownerId) =>
  Venue.create({
    owner_id: ownerId,
    name: "Settlement Court",
    location: "District 7",
    description: "Indoor court",
    slot_price: 250000,
    slot_duration_minutes: 60,
    weekly_schedule: [
      { day_of_week: TEST_DAY_OF_WEEK, start_time: "08:00", end_time: "12:00" },
    ],
  });

const createHold = async (token, venueId, startTime, endTime) =>
  request(app)
    .post("/api/v1/bookings/holds")
    .set(authHeader(token))
    .send({
      venue_id: String(venueId),
      date: TEST_DATE,
      start_time: startTime,
      end_time: endTime,
    });

const createPayment = async (token, bookingId, payload = {}) =>
  request(app)
    .post(`/api/v1/bookings/${bookingId}/payments`)
    .set(authHeader(token))
    .send(payload);

const sendPaymentWebhook = async (provider, payload) =>
  request(app)
    .post(`/api/v1/webhooks/payments/${provider}`)
    .send(payload);

const createConfirmedBooking = async (token, venueId, startTime, endTime, paidAt) => {
  const holdResponse = await createHold(token, venueId, startTime, endTime);
  const bookingId = holdResponse.body.data.booking.id;
  const paymentResponse = await createPayment(token, bookingId);
  const paymentId = paymentResponse.body.data.payment.id;
  const provider = paymentResponse.body.data.payment.provider;

  await sendPaymentWebhook(provider, {
    payment_id: paymentId,
    status: "paid",
    paid_at: paidAt ? paidAt.toISOString() : undefined,
  });

  if (paidAt) {
    await Payment.findByIdAndUpdate(paymentId, { paid_at: paidAt });
  }

  return {
    bookingId,
    paymentId,
  };
};

beforeAll(async () => {
  process.env.JWT_SECRET = "test_secret";
  process.env.SEPAY_API_KEY = "wallet_test_key";
  process.env.SEPAY_BANK = "VCB";
  process.env.SEPAY_ACCOUNT_NUMBER = "0123456789";
  process.env.SEPAY_ACCOUNT_NAME = "MATCHILL";
  process.env.PLATFORM_COMMISSION_RATE = "0.1";
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  await Promise.all([
    Booking.syncIndexes(),
    BookingItem.syncIndexes(),
    Wallet.syncIndexes(),
    WalletTransaction.syncIndexes(),
    WithdrawRequest.syncIndexes(),
    OwnerSettlement.syncIndexes(),
  ]);
});

afterEach(async () => {
  walletService.stopSettlementScheduler();
  const collections = mongoose.connection.collections;
  await Promise.all(Object.values(collections).map((collection) => collection.deleteMany({})));
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe("Wallet module", () => {
  test("creates a withdraw request and moves funds from available_balance to pending_withdraw_balance", async () => {
    const user = await createUser("user", "wallet-user@example.com");

    const profileResponse = await request(app)
      .post("/api/v1/wallet/payout-profiles")
      .set(authHeader(user.token))
      .send({
        bank_code: "VCB",
        bank_name: "Vietcombank",
        account_number: "0123456789",
        account_name: "Wallet User",
        is_default: true,
      });

    const wallet = await Wallet.findOne({ user_id: user.user._id });
    wallet.available_balance = 500000;
    await wallet.save();

    const response = await request(app)
      .post("/api/v1/wallet/withdraw-requests")
      .set(authHeader(user.token))
      .send({
        amount: 200000,
        payout_profile_id: profileResponse.body.data.payoutProfile.id,
        note: "Need payout",
      });

    expect(response.status).toBe(201);
    expect(response.body.data.wallet.availableBalance).toBe(300000);
    expect(response.body.data.wallet.pendingWithdrawBalance).toBe(200000);
    expect(response.body.data.withdrawRequest.status).toBe("pending");

    const transaction = await WalletTransaction.findOne({
      reference_id: response.body.data.withdrawRequest.id,
      type: "withdraw_hold",
    });

    expect(transaction).not.toBeNull();
    expect(transaction.balance_before).toBe(500000);
    expect(transaction.balance_after).toBe(300000);
    expect(transaction.pending_before).toBe(0);
    expect(transaction.pending_after).toBe(200000);
  });

  test("approving a withdraw request decreases pending_withdraw_balance without changing available_balance again", async () => {
    const user = await createUser("user", "wallet-approve-user@example.com");
    const admin = await createUser("admin", "wallet-admin@example.com");

    const profileResponse = await request(app)
      .post("/api/v1/wallet/payout-profiles")
      .set(authHeader(user.token))
      .send({
        bank_code: "TCB",
        bank_name: "Techcombank",
        account_number: "1234567890",
        account_name: "Approve User",
        is_default: true,
      });

    const wallet = await Wallet.findOne({ user_id: user.user._id });
    wallet.available_balance = 400000;
    await wallet.save();

    const withdrawResponse = await request(app)
      .post("/api/v1/wallet/withdraw-requests")
      .set(authHeader(user.token))
      .send({
        amount: 150000,
        payout_profile_id: profileResponse.body.data.payoutProfile.id,
      });

    const reviewResponse = await request(app)
      .patch(`/api/v1/admin/wallet/withdraw-requests/${withdrawResponse.body.data.withdrawRequest.id}`)
      .set(authHeader(admin.token))
      .send({
        action: "approve",
        note: "paid out",
      });

    expect(reviewResponse.status).toBe(200);
    expect(reviewResponse.body.data.wallet.availableBalance).toBe(250000);
    expect(reviewResponse.body.data.wallet.pendingWithdrawBalance).toBe(0);
    expect(reviewResponse.body.data.withdrawRequest.status).toBe("paid");

    const transaction = await WalletTransaction.findOne({
      reference_id: withdrawResponse.body.data.withdrawRequest.id,
      type: "withdraw_approved",
    });

    expect(transaction.balance_before).toBe(250000);
    expect(transaction.balance_after).toBe(250000);
    expect(transaction.pending_before).toBe(150000);
    expect(transaction.pending_after).toBe(0);
  });

  test("rejecting a withdraw request restores available_balance and decreases pending_withdraw_balance", async () => {
    const user = await createUser("user", "wallet-reject-user@example.com");
    const admin = await createUser("admin", "wallet-reject-admin@example.com");

    const profileResponse = await request(app)
      .post("/api/v1/wallet/payout-profiles")
      .set(authHeader(user.token))
      .send({
        bank_code: "ACB",
        bank_name: "ACB",
        account_number: "88888888",
        account_name: "Reject User",
        is_default: true,
      });

    const wallet = await Wallet.findOne({ user_id: user.user._id });
    wallet.available_balance = 280000;
    await wallet.save();

    const withdrawResponse = await request(app)
      .post("/api/v1/wallet/withdraw-requests")
      .set(authHeader(user.token))
      .send({
        amount: 80000,
        payout_profile_id: profileResponse.body.data.payoutProfile.id,
      });

    const reviewResponse = await request(app)
      .patch(`/api/v1/admin/wallet/withdraw-requests/${withdrawResponse.body.data.withdrawRequest.id}`)
      .set(authHeader(admin.token))
      .send({
        action: "reject",
        note: "invalid payout info",
      });

    expect(reviewResponse.status).toBe(200);
    expect(reviewResponse.body.data.wallet.availableBalance).toBe(280000);
    expect(reviewResponse.body.data.wallet.pendingWithdrawBalance).toBe(0);
    expect(reviewResponse.body.data.withdrawRequest.status).toBe("rejected");
  });

  test("credits wallet exactly once when topup webhook is delivered repeatedly", async () => {
    const user = await createUser("user", "wallet-topup@example.com");

    const topupResponse = await request(app)
      .post("/api/v1/wallet/topups")
      .set(authHeader(user.token))
      .send({
        amount: 125000,
      });

    const providerReference = topupResponse.body.data.transaction.providerReference;
    const webhookPayload = {
      code: providerReference,
      transferType: "in",
      transferAmount: 125000,
      transactionDate: "2026-05-31 08:00:00",
    };

    const firstResponse = await request(app)
      .post("/api/v1/webhooks/wallet-topups/sepay")
      .set("Authorization", "Bearer wallet_test_key")
      .send(webhookPayload);
    const secondResponse = await request(app)
      .post("/api/v1/webhooks/wallet-topups/sepay")
      .set("Authorization", "Bearer wallet_test_key")
      .send(webhookPayload);

    expect(firstResponse.status).toBe(200);
    expect(secondResponse.status).toBe(200);
    expect(firstResponse.body.data.wallet.availableBalance).toBe(125000);
    expect(secondResponse.body.data.wallet.availableBalance).toBe(125000);

    const transactions = await WalletTransaction.find({
      provider_reference: providerReference,
      type: "topup",
    });

    expect(transactions).toHaveLength(1);
    expect(transactions[0].status).toBe("completed");
  });

  test("credits user wallet on auto refund but not on manual refund", async () => {
    const owner = await createUser("owner", "wallet-owner@example.com");
    const userAuto = await createUser("user", "wallet-refund-auto@example.com");
    const userManual = await createUser("user", "wallet-refund-manual@example.com");
    const venue = await createVenue(owner.user._id);

    const autoBooking = await createConfirmedBooking(
      userAuto.token,
      venue._id,
      "08:00",
      "09:00",
      new Date()
    );

    const autoRefundResponse = await request(app)
      .post(`/api/v1/bookings/${autoBooking.bookingId}/refund`)
      .set(authHeader(userAuto.token))
      .send({ note: "auto refund" });

    expect(autoRefundResponse.status).toBe(200);
    expect(autoRefundResponse.body.data.mode).toBe("auto");
    expect(autoRefundResponse.body.data.wallet.availableBalance).toBe(250000);

    const autoWallet = await Wallet.findOne({ user_id: userAuto.user._id });
    expect(autoWallet.available_balance).toBe(250000);
    expect(
      await WalletTransaction.countDocuments({
        user_id: userAuto.user._id,
        type: "refund_auto_credit",
      })
    ).toBe(1);

    const manualBooking = await createConfirmedBooking(
      userManual.token,
      venue._id,
      "09:00",
      "10:00",
      new Date(Date.now() - (6 * 60 * 1000))
    );

    const manualRefundResponse = await request(app)
      .post(`/api/v1/bookings/${manualBooking.bookingId}/refund`)
      .set(authHeader(userManual.token))
      .send({ note: "manual refund" });

    expect(manualRefundResponse.status).toBe(200);
    expect(manualRefundResponse.body.data.mode).toBe("manual");
    expect(manualRefundResponse.body.data.wallet).toBeNull();
    expect(
      await WalletTransaction.countDocuments({
        user_id: userManual.user._id,
        type: "refund_auto_credit",
      })
    ).toBe(0);
  });

  test("settlement job credits owner wallet with net amount and stays idempotent", async () => {
    const owner = await createUser("owner", "wallet-settlement-owner@example.com");
    const user = await createUser("user", "wallet-settlement-user@example.com");
    const venue = await createVenue(owner.user._id);

    await createConfirmedBooking(
      user.token,
      venue._id,
      "10:00",
      "11:00",
      new Date(Date.now() - (10 * 60 * 1000))
    );

    const firstRun = await walletService.runDueOwnerSettlements();
    const secondRun = await walletService.runDueOwnerSettlements();

    expect(firstRun.processed).toBe(1);
    expect(secondRun.processed).toBe(0);

    const ownerWallet = await Wallet.findOne({ user_id: owner.user._id });
    expect(ownerWallet.available_balance).toBe(225000);

    expect(
      await OwnerSettlement.countDocuments({ owner_id: owner.user._id })
    ).toBe(1);
    expect(
      await WalletTransaction.countDocuments({
        user_id: owner.user._id,
        type: "owner_settlement_credit",
      })
    ).toBe(1);
  });
});
