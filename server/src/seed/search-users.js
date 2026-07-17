require("dotenv").config({ path: __dirname + "/../../.env" });
const mongoose = require("mongoose");

/**
 * Tìm kiếm users theo keyword trong email hoặc name (profile), không phân biệt hoa thường.
 *
 * Chạy: node src/seed/search-users.js
 *
 * Các keyword mặc định: giap, thai, bach, nga, huy, anh, linh
 * Có thể sửa biến KEYWORDS bên dưới hoặc truyền qua env: KEYWORDS=giap,thai node src/seed/search-users.js
 */

const KEYWORDS = (process.env.KEYWORDS || "giap,thai,bach,nga,huy,anh,linh").split(",");

async function searchUsers() {
  try {
    const uri = process.env.MONGODB_URI || "mongodb://localhost:27016/matchill";
    await mongoose.connect(uri);
    const db = mongoose.connection.db;

    const pattern = KEYWORDS.join("|");
    const regex = new RegExp(pattern, "i");

    const users = await db
      .collection("users")
      .aggregate([
        {
          $lookup: {
            from: "profiles",
            localField: "_id",
            foreignField: "user_id",
            as: "p",
          },
        },
        { $unwind: { path: "$p", preserveNullAndEmptyArrays: true } },
        {
          $match: {
            $or: [
              { email: regex },
              { "p.name": regex },
            ],
          },
        },
        {
          $project: {
            email: 1,
            name: "$p.name",
            _id: 0,
          },
        },
        { $sort: { email: 1 } },
      ])
      .toArray();

    if (users.length === 0) {
      console.log(`Không tìm thấy user nào khớp với: ${KEYWORDS.join(", ")}`);
      process.exit(0);
    }

    console.log(`Tìm thấy ${users.length} users khớp với keyword: ${KEYWORDS.join(", ")}\n`);
    console.log("Email | Name");
    console.log("---");
    users.forEach((u) => console.log(`${u.email} | ${u.name || "N/A"}`));

    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}

searchUsers();
