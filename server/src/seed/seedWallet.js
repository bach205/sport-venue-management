require("dotenv").config({ path: __dirname + "/../../.env" });
const connectDb = require("../configs/db");
const mongoose = require("mongoose");
const { User, UserRole } = require("../modules/user/model");
const { Wallet, WalletTransaction, OwnerSettlement } = require("../modules/wallet/model");
const { Booking, Payment, Venue } = require("../modules/venue/model");

/**
 * Seed wallet: chỉ tạo ví cho users có liên quan đến giao dịch
 *   - 2 chủ sân: wallet + payout profile + settlement revenue + withdraw
 *   - Users có booking (confirmed/expired): wallet + topup (optional)
 *
 * Cần chạy AFTER seedUsers.js + seedVenues.js + seedBookings.js
 * Chạy: node src/seed/seedWallet.js
 */

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function seedWallet() {
  try {
    await connectDb();
    console.log("Connected to DB");

    // ─── Xác định users cần wallet: chỉ từ seed data ───
    // 1. User có booking từ seed (dùng provider_reference prefix "SEEDBIZ")
    const seedPayments = await Payment.find({
      provider_reference: /^SEEDBIZ/,
      status: "paid",
    }).lean();
    const seedBookingIds = [...new Set(seedPayments.map((p) => String(p.booking_id)))];
    const seedBookings = await Booking.find({ _id: { $in: seedBookingIds } }).lean();
    const bookingUserIds = seedBookings.map((b) => b.user_id);

    // 2. Owners: chỉ lấy 2 owner từ seedVenues.js (dùng email cố định)
    const ownerEmails = new Set(["saoviet.sports@gmail.com", "anhduong.badminton@gmail.com"]);
    const ownerRows = await User.find({ email: { $in: [...ownerEmails] } }).lean();
    const ownerIds = ownerRows.map((r) => String(r._id));

    const allRelevantIds = [...new Set([...ownerIds.map((id) => String(id)), ...bookingUserIds.map((id) => String(id))])];
    const relevantUsers = await User.find({ _id: { $in: allRelevantIds } });

    console.log(`Relevant users: ${relevantUsers.length} (${ownerRows.length} owners + ${bookingUserIds.length} booking users)`);

    let walletCount = 0;
    let txCount = 0;
    let settlementCount = 0;

    // ─── 1. Tạo ví cho owners ───
    console.log("\n─── Owner Wallets ───");
    for (const ownerRow of ownerRows) {
      const userId = ownerRow.user_id;
      const user = relevantUsers.find((u) => String(u._id) === String(userId));
      if (!user) continue;

      const existing = await Wallet.findOne({ user_id: userId });
      if (existing) {
        console.log(`  Already exists: ${user.email}`);
        continue;
      }

      const wallet = await Wallet.create({
        user_id: userId,
        available_balance: randInt(500000, 2000000),
        pending_withdraw_balance: 0,
        currency: "VND",
        payout_profiles: [
          {
            bank_code: "VCB",
            bank_name: "Vietcombank",
            account_number: `101${String(userId).slice(-8)}`,
            account_name: `Owner ${String(userId).slice(-6)}`,
            is_default: true,
            note: "Tài khoản thanh toán mặc định",
          },
        ],
        last_transaction_at: null,
      });
      console.log(`  ${user.email} | ${wallet.available_balance.toLocaleString()}đ`);
      walletCount++;
    }

    // ─── 2. Tạo ví cho users có booking ───
    console.log("\n─── Booking User Wallets ───");
    for (const userId of bookingUserIds) {
      const user = relevantUsers.find((u) => String(u._id) === String(userId));
      if (!user) continue;

      const existing = await Wallet.findOne({ user_id: userId });
      if (existing) continue;

      // Chủ sân không tạo lại
      if (ownerIds.some((oid) => String(oid) === String(userId))) continue;

      const wallet = await Wallet.create({
        user_id: userId,
        available_balance: randInt(100000, 500000),
        pending_withdraw_balance: 0,
        currency: "VND",
        payout_profiles: [],
        last_transaction_at: null,
      });
      console.log(`  ${user.email} | ${wallet.available_balance.toLocaleString()}đ (booking user)`);
      walletCount++;
    }

    // ─── 3. Owner Settlements (cho booking confirmed) ───
    console.log("\n─── Owner Settlements ───");
    const confirmedBookings = await Booking.find({ status: "confirmed" });

    for (const booking of confirmedBookings) {
      const existing = await OwnerSettlement.findOne({ booking_id: booking._id });
      if (existing) continue;

      const payment = await Payment.findOne({ booking_id: booking._id });
      if (!payment || payment.status !== "paid") continue;

      const venue = await Venue.findById(booking.venue_id);
      if (!venue) continue;

      const ownerWallet = await Wallet.findOne({ user_id: venue.owner_id });
      if (!ownerWallet) continue;

      const COMMISSION_RATE = 0.05;
      const gross = payment.amount;
      const commission = Math.round(gross * COMMISSION_RATE);
      const net = gross - commission;
      const settledAt = new Date();

      await OwnerSettlement.create({
        booking_id: booking._id,
        payment_id: payment._id,
        owner_id: venue.owner_id,
        venue_id: venue._id,
        gross_amount: gross,
        commission_rate: COMMISSION_RATE,
        commission_amount: commission,
        net_amount: net,
        eligible_at: payment.paid_at || new Date(),
        settled_at: settledAt,
      });

      const balBefore = ownerWallet.available_balance;
      ownerWallet.available_balance += net;
      ownerWallet.last_transaction_at = settledAt;
      await ownerWallet.save();

      await WalletTransaction.create({
        wallet_id: ownerWallet._id,
        user_id: ownerWallet.user_id,
        type: "owner_settlement_credit",
        direction: "credit",
        amount: net,
        balance_before: balBefore,
        balance_after: ownerWallet.available_balance,
        pending_before: ownerWallet.pending_withdraw_balance,
        pending_after: ownerWallet.pending_withdraw_balance,
        status: "completed",
        reference_type: "owner_settlement",
        reference_id: String(booking._id),
        metadata: { booking_id: String(booking._id), gross_amount: gross },
        completed_at: settledAt,
      });
      txCount++;

      await WalletTransaction.create({
        wallet_id: null,
        user_id: null,
        type: "platform_commission",
        direction: "credit",
        amount: commission,
        balance_before: 0,
        balance_after: commission,
        pending_before: 0,
        pending_after: 0,
        status: "completed",
        reference_type: "owner_settlement",
        reference_id: String(booking._id),
        metadata: { booking_id: String(booking._id), venue_id: String(venue._id) },
        completed_at: settledAt,
      });
      txCount++;

      console.log(`  ${venue.name} | gross: ${gross.toLocaleString()}đ → owner net: ${net.toLocaleString()}đ`);
      settlementCount++;
    }

    console.log(
      `\nDone! Wallets: ${walletCount}, Transactions: ${txCount}, Settlements: ${settlementCount}`
    );
    process.exit(0);
  } catch (err) {
    console.error("Error seeding wallet:", err);
    process.exit(1);
  }
}

seedWallet();
