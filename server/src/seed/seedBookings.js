require("dotenv").config({ path: __dirname + "/../../.env" });
const connectDb = require("../configs/db");
const mongoose = require("mongoose");
const fs = require("fs");
const { User } = require("../modules/user/model");
const {
  Venue,
  Booking,
  BookingItem,
  Payment,
} = require("../modules/venue/model");

/**
 * Seed 19 bookings trên 3 sân Hà Nội:
 *   - 15 confirmed + paid (~180k/slot)
 *   - 4 expired (hold hết hạn — drop-off thanh toán)
 *
 * 3 venues:
 *   1. Galasy Pickleball  — Hòa Lạc  (6a1c42aa6faeb5d764d5d7d9)
 *   2. Sao Việt Cầu Giấy  — mới seed
 *   3. Ánh Dương Thanh Xuân — mới seed
 *
 * Cần chạy AFTER seedUsers.js + seedVenues.js
 * Chạy: node src/seed/seedBookings.js
 */

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatTime(hours, minutes) {
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function addMinutes(timeStr, mins) {
  const [h, m] = timeStr.split(":").map(Number);
  const total = h * 60 + m + mins;
  return formatTime(Math.floor(total / 60), total % 60);
}

async function seedBookings() {
  try {
    await connectDb();
    console.log("Connected to DB");

    // ─── Lấy 3 venues ───
    const venues = await Venue.find({ province: "Hà Nội" }).limit(5);
    if (venues.length < 2) {
      console.log(
        `Need at least 2 HN venues. Found: ${venues.length}. Run seedVenues.js first.`,
      );
      process.exit(1);
    }
    const saoviet = venues.find((v) => v.name.includes("Sao Việt"));
    const anhduong = venues.find((v) => v.name.includes("Ánh Dương"));
    const selectedVenues = [saoviet, anhduong].filter(Boolean);
    if (selectedVenues.length < 2) {
      console.log(
        "Could not find HN venues. Found:",
        selectedVenues.map((v) => v?.name),
      );
      process.exit(1);
    }
    console.log(
      `Using venues: ${selectedVenues.map((v) => v.name).join(", ")}`,
    );

    // ─── Lấy users chỉ từ danh sách email trong seedUsers.js ───
    const seedContent = fs.readFileSync(__dirname + "/seedUsers.js", "utf8");
    const seedEmails = [...seedContent.matchAll(/\["([^"]+)",\s*"([^"]+)"/g)].map((m) => m[2]).filter((e) => e.includes("@"));    const hanoiUsers = await User.find({ email: { $in: seedEmails } }).limit(80);
    if (hanoiUsers.length < 20) {
      console.log("Need at least 20 users. Run seedUsers.js first.");
      process.exit(1);
    }
    console.log(`Found ${hanoiUsers.length} users`);

    let confirmedCount = 0;
    let expiredCount = 0;
    let skippedCount = 0;

    // ─── Helper: tạo booking cho 1 venue ───
    async function createBooking(venue, user, status, dateOffset) {
      const slotDuration = venue.slot_duration_minutes || 60;
      const price = venue.slot_price || 120000;

      const dateObj = new Date();
      dateObj.setDate(dateObj.getDate() + dateOffset);
      const dateStr = formatDate(dateObj);
      const dayOfWeek = dateObj.getDay();

      // Lấy khung giờ từ schedule
      const schedule = (venue.weekly_schedule || []).filter(
        (s) => s.day_of_week === dayOfWeek,
      );
      if (schedule.length === 0) return null;

      const range = pick(schedule);
      const rStart = range.start_time;
      const rEnd = range.end_time;
      const [rsH, rsM] = rStart.split(":").map(Number);
      const [reH, reM] = rEnd.split(":").map(Number);
      const availableSlots = Math.floor(
        (reH * 60 + reM - rsH * 60 - rsM) / slotDuration,
      );
      if (availableSlots < 1) return null;

      // Chọn 1 slot random từ đầu ngày đến trưa (tránh xung đột)
      const slotIdx = randInt(0, Math.min(availableSlots - 1, 14));
      const startMin = rsH * 60 + rsM + slotIdx * slotDuration;
      const startTime = formatTime(Math.floor(startMin / 60), startMin % 60);
      const endTime = addMinutes(startTime, slotDuration);

      // 1 slot = ~120k → muốn ~180k thì 1-2 slot
      const slotCount = randInt(1, 2);
      const lastSlotEndTime =
        slotCount > 1
          ? addMinutes(endTime, (slotCount - 1) * slotDuration)
          : endTime;
      const amount = slotCount * price;

      // Kiểm tra không overlap
      const overlapping = await BookingItem.findOne({
        venue_id: venue._id,
        date: dateStr,
        start_time: { $lt: lastSlotEndTime },
        end_time: { $gt: startTime },
        booking_status: { $in: ["hold", "payment_pending", "confirmed"] },
      });
      if (overlapping) return null;

      // hold_expires_at: quá khứ cho expired, tương lai cho confirmed
      const holdExpiresAt =
        status === "expired"
          ? new Date(Date.now() - 24 * 3600000) // hết hạn từ hôm qua
          : new Date(Date.now() + 3600000); // còn 1h

      // 1. Tạo booking
      const booking = await Booking.create({
        user_id: user._id,
        venue_id: venue._id,
        date: dateStr,
        start_time: startTime,
        end_time: lastSlotEndTime,
        amount,
        slot_count: slotCount,
        status,
        hold_expires_at: holdExpiresAt,
      });

      // 2. Tạo booking items
      const items = [];
      for (let s = 0; s < slotCount; s++) {
        const sStart = addMinutes(startTime, s * slotDuration);
        const sEnd = addMinutes(sStart, slotDuration);
        items.push({
          booking_id: booking._id,
          venue_id: venue._id,
          date: dateStr,
          start_time: sStart,
          end_time: sEnd,
          amount: price,
          booking_status: status,
        });
      }
      await BookingItem.insertMany(items);

      // 3. Nếu confirmed → tạo payment + thanh toán
      if (status === "confirmed") {
        const paidAt = new Date(Date.now() + dateOffset * 86400000 - 3600000);
        await Payment.create({
          booking_id: booking._id,
          amount,
          provider: "stub",
          status: "paid",
          provider_reference: `SEEDBIZ${String(booking._id).slice(-8).toUpperCase()}`,
          paid_at: paidAt,
        });
      }

      return { booking, amount, slotCount };
    }

    // ─── 15 confirmed bookings ───
    console.log("\n─── Creating 15 Confirmed Bookings ───");
    for (let i = 0; i < 15; i++) {
      const venue = selectedVenues[i % selectedVenues.length];
      const user = pick(hanoiUsers);
      const dateOffset = -randInt(3, 20); // quá khứ

      const result = await createBooking(venue, user, "confirmed", dateOffset);
      if (!result) {
        skippedCount++;
        continue;
      }

      console.log(
        `  [${String(confirmedCount + 1).padStart(2, "0")}/15] ${venue.name} | ${result.booking.date} ${result.booking.start_time} | ${result.amount.toLocaleString()}đ (${result.slotCount} slots)`,
      );
      confirmedCount++;
    }

    // ─── 4 expired bookings (drop-off) ───
    console.log("\n─── Creating 4 Expired Bookings (Drop-off) ───");
    for (let i = 0; i < 4; i++) {
      const venue = selectedVenues[i % selectedVenues.length];
      const user = pick(hanoiUsers);
      const dateOffset = -randInt(2, 5); // quá khứ gần

      const result = await createBooking(venue, user, "expired", dateOffset);
      if (!result) {
        skippedCount++;
        continue;
      }

      console.log(
        `  [${String(expiredCount + 1).padStart(2, "0")}/4] ❌ ${venue.name} | ${result.booking.date} ${result.booking.start_time} | ${result.amount.toLocaleString()}đ — KHÔNG THANH TOÁN`,
      );
      expiredCount++;
    }

    console.log(
      `\nDone! Confirmed: ${confirmedCount}, Expired: ${expiredCount}, Skipped: ${skippedCount}`,
    );
    process.exit(0);
  } catch (err) {
    console.error("Error seeding bookings:", err);
    process.exit(1);
  }
}

seedBookings();
