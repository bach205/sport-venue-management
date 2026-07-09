require("dotenv").config({ path: __dirname + "/../../.env" });
const connectDb = require("../configs/db");
const { User, Profile, UserRole } = require("../modules/user/model");
const { Venue } = require("../modules/venue/model");

const SHARED_PASSWORD_HASH =
  "$2a$10$gdgmDAL0lEC6YyvDG/yIvetjR3YjFd/7TzlXuLgjU3dJxgcHi9LPq";

// ─── 2 chủ sân ───
const venueOwners = [
  {
    name: "Công ty TNHH Thể thao Sao Việt",
    email: "saoviet.sports@gmail.com",
    gender: "male",
  },
  {
    name: "Hộ kinh doanh Sân thể thao Ánh Dương",
    email: "anhduong.badminton@gmail.com",
    gender: "female",
  },
];

// ─── 2 sân mới ở Hà Nội ───
const venuesData = [
  // --- Chủ sân 1: Sao Việt ---
  {
    name: "Sân Pickleball Sao Việt - Hòa Lạc",
    province: "Hà Nội",
    ward: "xã Hòa Lạc",
    address_detail: "Thôn 4, Hòa Lạc",
    phone_number: "0985342712",
    description:
      "Sân Pickleball đạt chuẩn quốc tế, mặt sân acrylic cao cấp, lưới chuyên dụng, đèn LED. Nằm tại khu vực Hòa Lạc, Thạch Thất, Hà Nội. Có nước uống miễn phí, wifi, chỗ đỗ xe rộng.",
    image_url:
      "https://irace.vn/wp-content/uploads/2025/08/san-vn-pickleball-me-tri-nam-tu-liem.png",
    slot_price: 120000,
    slot_duration_minutes: 60,
    weekly_schedule: [
      { day_of_week: 0, start_time: "06:00", end_time: "22:00" },
      { day_of_week: 1, start_time: "06:00", end_time: "22:00" },
      { day_of_week: 2, start_time: "06:00", end_time: "22:00" },
      { day_of_week: 3, start_time: "06:00", end_time: "22:00" },
      { day_of_week: 4, start_time: "06:00", end_time: "22:00" },
      { day_of_week: 5, start_time: "06:00", end_time: "22:00" },
      { day_of_week: 6, start_time: "06:00", end_time: "22:00" },
    ],
  },
  // --- Chủ sân 2: Ánh Dương ---
  {
    name: "Sân Cầu Lông Ánh Dương - Hòa Lạc",
    province: "Hà Nội",
    ward: "xã Hòa Lạc",
    address_detail: "Thôn 8, Hòa Lạc",
    phone_number: "0986824312",
    description:
      "Sân cầu lông trong nhà, sàn gỗ chuyên dụng, đèn không chói, có máy lạnh. Tọa lạc tại khu vực Hòa Lạc, Thạch Thất, dễ dàng di chuyển từ trung tâm Hà Nội theo Đại lộ Thăng Long.",
    image_url:
      "https://qvbadminton.com/wp-content/uploads/2024/12/san-cau-long-nha-thi-dau-cau-giay-7dac29ea.webp",
    slot_price: 120000,
    slot_duration_minutes: 60,
    weekly_schedule: [
      { day_of_week: 0, start_time: "06:00", end_time: "22:00" },
      { day_of_week: 1, start_time: "06:00", end_time: "22:00" },
      { day_of_week: 2, start_time: "06:00", end_time: "22:00" },
      { day_of_week: 3, start_time: "06:00", end_time: "22:00" },
      { day_of_week: 4, start_time: "06:00", end_time: "22:00" },
      { day_of_week: 5, start_time: "06:00", end_time: "22:00" },
      { day_of_week: 6, start_time: "06:00", end_time: "22:00" },
    ],
  },
];

async function seedVenues() {
  try {
    await connectDb();
    console.log("Connected to DB");

    // ─── Bước 1: Tạo 2 chủ sân (owner) ───
    const ownerIds = [];
    for (const ownerData of venueOwners) {
      const existing = await User.findOne({ email: ownerData.email });
      if (existing) {
        console.log(
          `Owner already exists: ${ownerData.email} (id: ${existing._id})`,
        );
        let role = await UserRole.findOne({
          user_id: existing._id,
          role: "owner",
        });
        if (!role) {
          await UserRole.create({ user_id: existing._id, role: "owner" });
          console.log(`  → Added owner role for ${ownerData.email}`);
        }
        ownerIds.push(existing._id);
        continue;
      }

      const userDoc = new User({
        email: ownerData.email,
        password_hash: SHARED_PASSWORD_HASH,
        status: "active",
        is_verified: true,
      });
      // Bypass pre("save") hook để không hash lại hash đã có
      const data = userDoc.toObject();
      delete data._id;
      const inserted = await User.collection.insertOne(data);
      const userId = inserted.insertedId;
      const user = await User.findById(userId);

      await Profile.create({
        user_id: user._id,
        name: ownerData.name,
        age: 35 + Math.floor(Math.random() * 15),
        gender: ownerData.gender,
        sport_preference: ["Pickleball", "Badminton", "Football"],
        skill_level: "advanced",
        location: "Hà Nội",
        avatar_url: `https://i.pravatar.cc/150?img=${40 + ownerIds.length}`,
        reputation_score: 95,
      });

      await UserRole.create({ user_id: user._id, role: "owner" });
      await UserRole.create({ user_id: user._id, role: "user" });

      console.log(`Created owner: ${ownerData.email} (id: ${user._id})`);
      ownerIds.push(user._id);
    }

    // ─── Bước 2: Gán owner cho venue ───
    const venueAssignments = venuesData.map((venueData, index) => ({
      ...venueData,
      owner_id: index < 1 ? ownerIds[0] : ownerIds[1],
    }));

    // ─── Bước 3: Tạo venues ───
    let createdCount = 0;
    let skippedCount = 0;

    for (const venueData of venueAssignments) {
      const existing = await Venue.findOne({
        name: venueData.name,
        owner_id: venueData.owner_id,
      });
      if (existing) {
        console.log(`Skipped (already exists): ${venueData.name}`);
        skippedCount++;
        continue;
      }

      const location = [
        venueData.address_detail,
        venueData.ward,
        venueData.province,
      ]
        .map((p) => String(p || "").trim())
        .filter(Boolean)
        .join(", ");

      await Venue.create({
        owner_id: venueData.owner_id,
        name: venueData.name,
        location,
        province: venueData.province,
        ward: venueData.ward,
        address_detail: venueData.address_detail,
        phone_number: venueData.phone_number,
        description: venueData.description,
        image_url: venueData.image_url,
        slot_price: venueData.slot_price,
        slot_duration_minutes: venueData.slot_duration_minutes,
        weekly_schedule: venueData.weekly_schedule,
      });

      console.log(`Created venue: ${venueData.name}`);
      createdCount++;
    }

    console.log(
      `\nDone! Venues created: ${createdCount}, skipped: ${skippedCount}`,
    );
    process.exit(0);
  } catch (err) {
    console.error("Error seeding venues:", err);
    process.exit(1);
  }
}

seedVenues();
