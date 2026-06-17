require("dotenv").config({ path: __dirname + "/../../.env" });
const connectDb = require("../configs/db");
const { User, Profile, UserRole } = require("../modules/user/model");

const SHARED_PASSWORD_HASH = "$2a$10$gdgmDAL0lEC6YyvDG/yIvetjR3YjFd/7TzlXuLgjU3dJxgcHi9LPq";

const vietnameseUsers = [
  ["Nguyễn Văn Nam", "namvn@gmail.com", "male"],
  ["Trần Thị Mai", "maitt@gmail.com", "female"],
  ["Lê Minh Khoa", "khoalm@gmail.com", "male"],
  ["Phạm Thu Trang", "trangpt@gmail.com", "female"],
  ["Hoàng Gia Bảo", "baohg@gmail.com", "male"],
  ["Đặng Minh Anh", "anhdm@gmail.com", "female"],
  ["Võ Quốc Huy", "huyvq@gmail.com", "male"],
  ["Bùi Thanh Hà", "habt@gmail.com", "female"],
  ["Phan Nhật Minh", "minhpn@gmail.com", "male"],
  ["Đỗ Ngọc Lan", "landn@gmail.com", "female"],
  ["Nguyễn Đức Anh", "anhnd@gmail.com", "male"],
  ["Trần Quỳnh Như", "nhutq@gmail.com", "female"],
  ["Lê Hoàng Long", "longlh@gmail.com", "male"],
  ["Phạm Thảo Vy", "vypt@gmail.com", "female"],
  ["Vũ Minh Tuấn", "tuanvm@gmail.com", "male"],
  ["Ngô Kim Ngân", "ngannk@gmail.com", "female"],
  ["Đinh Quốc Việt", "vietdq@gmail.com", "male"],
  ["Mai Phương Linh", "linhmp@gmail.com", "female"],
  ["Lý Thành Công", "conglt@gmail.com", "male"],
  ["Trương Mỹ Duyên", "duyentm@gmail.com", "female"],
  ["Nguyễn Hải Đăng", "dangnh@gmail.com", "male"],
  ["Trần Bảo Ngọc", "ngoctb@gmail.com", "female"],
  ["Lê Tuấn Kiệt", "kietlt@gmail.com", "male"],
  ["Phạm Khánh Ly", "lypk@gmail.com", "female"],
  ["Hoàng Đức Mạnh", "manhhd@gmail.com", "male"],
  ["Đặng Ngọc Hân", "handn@gmail.com", "female"],
  ["Võ Thành Đạt", "datvt@gmail.com", "male"],
  ["Bùi Thanh Tâm", "tambt@gmail.com", "female"],
  ["Phan Quốc Khánh", "khanhpq@gmail.com", "male"],
  ["Đỗ Minh Châu", "chaudm@gmail.com", "female"],
  ["Nguyễn Thành Nam", "namnt@gmail.com", "male"],
  ["Trần Minh Thư", "thutm@gmail.com", "female"],
  ["Lê Quốc Bảo", "baolq@gmail.com", "male"],
  ["Phạm Ngọc Mai", "maipn@gmail.com", "female"],
  ["Hoàng Anh Tuấn", "tuanha@gmail.com", "male"],
  ["Đặng Thảo Nhi", "nhidt@gmail.com", "female"],
  ["Vũ Gia Hưng", "hungvg@gmail.com", "male"],
  ["Ngô Thanh Trúc", "trucnt@gmail.com", "female"],
  ["Đinh Minh Quân", "quandm@gmail.com", "male"],
  ["Mai Khánh Chi", "chimk@gmail.com", "female"],
];

const sports = [
  ["Pickleball"],
  ["Badminton"],
  ["Football"],
  ["Basketball"],
  ["Volleyball"],
  ["Tennis"],
  ["Table Tennis"],
  ["Pickleball", "Badminton"],
  ["Football", "Basketball"],
  ["Tennis", "Pickleball"],
  ["Badminton", "Volleyball"],
];

const locations = [
  "Hà Nội",
  "TP. Hồ Chí Minh",
  "Đà Nẵng",
  "Cần Thơ",
  "Hải Phòng",
  "Nha Trang",
  "Huế",
  "Vũng Tàu",
];

const skillLevels = [
  "beginner",
  "intermediate",
  "advanced",
  "expert",
];

const mockUsers = vietnameseUsers.map(([name, email, gender], index) => ({
  email,
  status: "active",
  is_verified: true,
  profile: {
    name,
    age: 18 + Math.floor(Math.random() * 5), // 18-23
    gender,
    sport_preference:
      sports[Math.floor(Math.random() * sports.length)],
    skill_level:
      skillLevels[Math.floor(Math.random() * skillLevels.length)],
    location:
      locations[Math.floor(Math.random() * locations.length)],
    avatar_url: `https://i.pravatar.cc/150?img=${index + 1}`,
    reputation_score: 80 + Math.floor(Math.random() * 20),
  },
}));

async function seedUsers() {
  try {
    await connectDb();
    console.log("Connected to DB");

    let createdCount = 0;
    let skippedCount = 0;

    for (const mockUser of mockUsers) {
      // Bỏ qua nếu email đã tồn tại
      const existing = await User.findOne({ email: mockUser.email });
      if (existing) {
        console.log(`Skipped (already exists): ${mockUser.email}`);
        skippedCount++;
        continue;
      }

      // Tạo user
      const user = new User({
        email: mockUser.email,
        password_hash: SHARED_PASSWORD_HASH,
        status: mockUser.status,
        is_verified: mockUser.is_verified,
      });
      await user.save();

      // Tạo profile
      const profile = new Profile({
        user_id: user._id,
        ...mockUser.profile,
      });
      await profile.save();

      // Tạo user role (mặc định là "user")
      const userRole = new UserRole({
        user_id: user._id,
        role: "user",
      });
      await userRole.save();

      console.log(`Created user: ${mockUser.email}`);
      createdCount++;
    }

    console.log(`\nDone! Created: ${createdCount}, Skipped: ${skippedCount}`);
    process.exit(0);
  } catch (err) {
    console.error("Error seeding users:", err);
    process.exit(1);
  }
}

seedUsers();

