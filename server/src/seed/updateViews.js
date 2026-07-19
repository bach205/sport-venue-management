require("dotenv").config({ path: __dirname + "/../../.env" });
const connectDb = require("../configs/db");
const mongoose = require("mongoose");

/**
 * Set tổng lượt xem web về ~3,581
 *
 * Cấu trúc: view_counters collection
 *   { target_type: "page", target_id: "home", count: 3581 }
 *
 * Chạy: node src/seed/updateViews.js
 */

const TARGET_VIEWS = 3581;

async function updateViews() {
  try {
    await connectDb();
    const db = mongoose.connection.db;

    // Upsert view counter cho trang chủ
    await db.collection("view_counters").updateOne(
      { target_type: "page", target_id: "home" },
      { $set: { count: TARGET_VIEWS } },
      { upsert: true }
    );

    const result = await db.collection("view_counters").findOne({
      target_type: "page",
      target_id: "home",
    });

    console.log(
      `✅ View count updated: ${result.count.toLocaleString()} lượt xem`
    );

    process.exit(0);
  } catch (err) {
    console.error("Error updating views:", err);
    process.exit(1);
  }
}

updateViews();
