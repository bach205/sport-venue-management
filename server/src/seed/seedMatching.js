require("dotenv").config({ path: __dirname + "/../../.env" });
const connectDb = require("../configs/db");
const fs = require("fs");
const { User } = require("../modules/user/model");
const {
  MatchRequest,
  Match,
  MatchParticipant,
} = require("../modules/matching/model");
const chatService = require("../modules/chat/service");

/**
 * Seed 48 matches: 90% Hà Nội, 10% HCM — 50% tại 3 sân
 *
 * 3 venues in HN:
 *   1. Galasy Pickleball  — Hòa Lạc, Hà Nội       (20.960, 105.580)
 *   2. Sao Việt Cầu Giấy  — 123 Nguyễn Văn Huyên    (21.030, 105.790)
 *   3. Ánh Dương Thanh Xuân — 456 Tố Hữu             (20.990, 105.800)
 *
 * Cần chạy AFTER seedUsers.js
 * Chạy: node src/seed/seedMatching.js
 */

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function futureDate(daysAhead, hours) {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  d.setHours(hours || randInt(7, 21), 0, 0, 0);
  return d;
}

function pastDate(daysAgo, hours) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hours || randInt(7, 21), 0, 0, 0);
  return d;
}

// ─── Địa điểm chi tiết ───

const VENUE_LOCATIONS = [
  // 3 sân ở Hà Nội
  {
    label: "Galasy Pickleball - Hòa Lạc",
    location: "Thôn 4, xã Hòa Lạc, Hà Nội",
    lat: 20.96,
    lng: 105.58,
  },
  {
    label: "Sao Việt - 123 Nguyễn Văn Huyên, Cầu Giấy",
    location: "123 Nguyễn Văn Huyên, Cầu Giấy, Hà Nội",
    lat: 21.03,
    lng: 105.79,
  },
  {
    label: "Ánh Dương - 456 Tố Hữu, Thanh Xuân",
    location: "456 Tố Hữu, Thanh Xuân, Nam Từ Liêm, Hà Nội",
    lat: 20.99,
    lng: 105.8,
  },
];

const HN_OTHER_LOCATIONS = [
  {
    label: "Sân vận động Mỹ Đình",
    location: "Sân vận động Mỹ Đình, Nam Từ Liêm, Hà Nội",
    lat: 21.017,
    lng: 105.764,
  },
  {
    label: "Công viên Cầu Giấy",
    location: "Công viên Cầu Giấy, Cầu Giấy, Hà Nội",
    lat: 21.032,
    lng: 105.793,
  },
  {
    label: "Khu đô thị Royal City",
    location: "72A Nguyễn Trãi, Thanh Xuân, Hà Nội",
    lat: 20.998,
    lng: 105.808,
  },
  {
    label: "Khu đô thị Times City",
    location: "458 Minh Khai, Hai Bà Trưng, Hà Nội",
    lat: 20.999,
    lng: 105.862,
  },
  {
    label: "Nhà thi đấu Trịnh Hoài Đức",
    location: "Trịnh Hoài Đức, Đống Đa, Hà Nội",
    lat: 21.015,
    lng: 105.822,
  },
  {
    label: "Hồ Tây",
    location: "Đường Thanh Niên, Tây Hồ, Hà Nội",
    lat: 21.064,
    lng: 105.839,
  },
  {
    label: "Vinhomes Ocean Park",
    location: "Vinhomes Ocean Park, Gia Lâm, Hà Nội",
    lat: 20.98,
    lng: 105.94,
  },
  {
    label: "Khu đô thị Park City",
    location: "Nguyễn Xiển, Thanh Xuân, Hà Nội",
    lat: 20.976,
    lng: 105.816,
  },
  {
    label: "Công viên Thống Nhất",
    location: "Trần Nhân Tông, Hai Bà Trưng, Hà Nội",
    lat: 21.014,
    lng: 105.848,
  },
  {
    label: "Khu liên hợp thể thao Hà Nội",
    location: "Đường Lê Quang Đạo, Nam Từ Liêm, Hà Nội",
    lat: 21.024,
    lng: 105.773,
  },
  {
    label: "Trường ĐH Thương Mại",
    location: "79 Hồ Tùng Mậu, Cầu Giấy, Hà Nội",
    lat: 21.04,
    lng: 105.784,
  },
  {
    label: "KĐT Linh Đàm",
    location: "Linh Đàm, Hoàng Mai, Hà Nội",
    lat: 20.97,
    lng: 105.855,
  },
  {
    label: "Sân Pickleball Ciputra",
    location: "Khu đô thị Ciputra, Tây Hồ, Hà Nội",
    lat: 21.058,
    lng: 105.816,
  },
  {
    label: "Khu vực Bách Khoa",
    location: "Trần Đại Nghĩa, Hai Bà Trưng, Hà Nội",
    lat: 21.006,
    lng: 105.843,
  },
  {
    label: "Công viên Nghĩa Đô",
    location: "Công viên Nghĩa Đô, Cầu Giấy, Hà Nội",
    lat: 21.04,
    lng: 105.803,
  },
  {
    label: "Khu đô thị Gamuda",
    location: "Gamuda Gardens, Hoàng Mai, Hà Nội",
    lat: 20.963,
    lng: 105.841,
  },
];

const HCM_LOCATIONS = [
  {
    label: "Khu liên hợp thể thao Phú Thọ",
    location: "221 Lý Thường Kiệt, Quận 11, TP. Hồ Chí Minh",
    lat: 10.768,
    lng: 106.645,
  },
  {
    label: "Sân Pickleball Sala - Thủ Thiêm",
    location: "Sala, An Lợi Đông, Quận 2, TP. Hồ Chí Minh",
    lat: 10.775,
    lng: 106.745,
  },
  {
    label: "Công viên Gia Định",
    location: "Công viên Gia Định, Phú Nhuận, TP. Hồ Chí Minh",
    lat: 10.795,
    lng: 106.675,
  },
  {
    label: "Khu thể thao Lan Anh",
    location: "Số 6 Nguyễn Hữu Thọ, Nhà Bè, TP. Hồ Chí Minh",
    lat: 10.732,
    lng: 106.703,
  },
  {
    label: "Sân Pickleball Thảo Điền",
    location: "Thảo Điền, Quận 2, TP. Hồ Chí Minh",
    lat: 10.802,
    lng: 106.738,
  },
];

const SPORTS_VENUE = ["Pickleball", "Badminton", "Tennis"];
const SPORTS_OTHER = [
  ...SPORTS_VENUE,
  "Football",
  "Basketball",
  "Volleyball",
  "Table Tennis",
];

const SKILLS = ["beginner", "intermediate", "advanced", "expert"];
const MATCH_TYPES = ["teammate", "opponent"];

// ─── Cấu hình match ───
// Mỗi match = { location, lat, lng, sport, skill, matchType, daysAgo }

const HN_VENUE_MATCHES = [];
const HN_OTHER_MATCHES = [];
const HCM_MATCHES = [];

// 24 matches at 3 venues: 8 mỗi sân
for (const loc of VENUE_LOCATIONS) {
  for (let i = 0; i < 8; i++) {
    HN_VENUE_MATCHES.push({
      ...loc,
      sport: pick(SPORTS_VENUE),
      skill: pick(SKILLS),
      matchType: pick(MATCH_TYPES),
      daysAgo: randInt(1, 30),
    });
  }
}

// 19 matches at other HN locations
for (let i = 0; i < 19; i++) {
  const loc = pick(HN_OTHER_LOCATIONS);
  HN_OTHER_MATCHES.push({
    ...loc,
    sport: pick(SPORTS_OTHER),
    skill: pick(SKILLS),
    matchType: pick(MATCH_TYPES),
    daysAgo: randInt(1, 30),
  });
}

// 5 matches at HCM locations
for (let i = 0; i < 5; i++) {
  const loc = pick(HCM_LOCATIONS);
  HCM_MATCHES.push({
    ...loc,
    sport: pick(SPORTS_OTHER),
    skill: pick(SKILLS),
    matchType: pick(MATCH_TYPES),
    daysAgo: randInt(1, 30),
  });
}

const ALL_MATCHES = [...HN_VENUE_MATCHES, ...HN_OTHER_MATCHES, ...HCM_MATCHES];
// Tổng: 8*3 + 19 + 5 = 24 + 19 + 5 = 48

async function seedMatching() {
  try {
    await connectDb();
    console.log("Connected to DB");

    const seedContent = fs.readFileSync(__dirname + "/seedUsers.js", "utf8");
    const seedEmails = [...seedContent.matchAll(/\["([^"]+)",\s*"([^"]+)"/g)].map((m) => m[2]).filter((e) => e.includes("@"));
    const users = await User.find({ email: { $in: seedEmails } }).limit(201);
    if (users.length < 30) {
      console.log("Need at least 30 users. Run seedUsers.js first.");
      process.exit(1);
    }
    console.log(
      `Found ${users.length} users. Preparing ${ALL_MATCHES.length} matches...`,
    );

    let matchCount = 0;
    let skippedCount = 0;

    // Trộn users để không lặp cặp
    const shuffled = [...users].sort(() => Math.random() - 0.5);

    for (let i = 0; i < ALL_MATCHES.length; i++) {
      const m = ALL_MATCHES[i];
      const userA = shuffled[(i * 2) % shuffled.length];
      const userB = shuffled[(i * 2 + 1) % shuffled.length];

      if (String(userA._id) === String(userB._id)) continue;

      // Kiểm tra đã tồn tại match giữa 2 user này với cùng sport
      const existing = await MatchRequest.findOne({
        user_id: userA._id,
        sport: m.sport,
        status: "matched",
      });
      if (existing) {
        skippedCount++;
        continue;
      }

      const matchTime = pastDate(m.daysAgo, randInt(7, 21));

      try {
        // Tạo conversation
        const conversation = await chatService.createOrGetDirectConversation(
          userA._id,
          userB._id,
        );

        // Tạo match request A
        const reqA = await MatchRequest.create({
          user_id: userA._id,
          sport: m.sport,
          location: m.location,
          location_lat: m.lat,
          location_lng: m.lng,
          search_radius_km: randInt(3, 10),
          time: matchTime,
          time_type: "fixed",
          skill_level: m.skill,
          number_of_players: 1,
          match_type: m.matchType,
          status: "matched",
          createdAt: new Date(matchTime.getTime() - 3600000),
        });

        // Tạo match request B
        const reqB = await MatchRequest.create({
          user_id: userB._id,
          sport: m.sport,
          location: m.location,
          location_lat: m.lat + (Math.random() - 0.5) * 0.01,
          location_lng: m.lng + (Math.random() - 0.5) * 0.01,
          search_radius_km: randInt(3, 10),
          time: matchTime,
          time_type: "fixed",
          skill_level: m.skill,
          number_of_players: 1,
          match_type: m.matchType,
          status: "matched",
          createdAt: new Date(matchTime.getTime() - 1800000),
        });

        // Tạo match
        await Match.create({
          sport: m.sport,
          location: m.location,
          location_lat: m.lat,
          location_lng: m.lng,
          search_radius_km: 5,
          time: matchTime,
          status: "matched",
          conversation_id: conversation.id,
          request_ids: [reqA._id, reqB._id],
          createdAt: matchTime,
        });

        // Tạo participants
        await MatchParticipant.insertMany([
          { match_id: reqA._id, user_id: userA._id },
          { match_id: reqA._id, user_id: userB._id },
        ]);

        console.log(
          `[${String(i + 1).padStart(2, "0")}/48] Match: ${m.sport} | ${m.location} | ${userA.email.slice(0, 8)}... vs ${userB.email.slice(0, 8)}...`,
        );
        matchCount++;
      } catch (err) {
        console.log(`  Skipped (error): ${err.message}`);
        skippedCount++;
      }
    }

    console.log(`\nDone! Matches: ${matchCount}, Skipped: ${skippedCount}`);
    process.exit(0);
  } catch (err) {
    console.error("Error seeding matching:", err);
    process.exit(1);
  }
}

seedMatching();
