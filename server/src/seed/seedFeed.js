require("dotenv").config({ path: __dirname + "/../../.env" });
const connectDb = require("../configs/db");
const { Post } = require("../modules/social/model");
const { User } = require("../modules/user/model");

async function seed() {
  try {
    await connectDb();
    console.log("Connected to DB");

    // Fetch some users to assign posts to
    const users = await User.find().limit(3);
    if (users.length === 0) {
      console.log(
        "No users found. Please register a user first to run the seed.",
      );
      process.exit(1);
    }

    await Post.deleteMany({});
    console.log("Cleared existing posts.");

    const seedPosts = [
      {
        user_id: users[0]._id,
        intentType: "sell",
        sport: "Pickleball",
        category: "Equipment",
        title: "Vợt Pickleball Jogarbola Solus Core Pink JG-SolusC-04",
        details:
          "Vợt carbon chính hãng, mặt êm, kiểm soát tốt. Mới 99%, chỉ thử vài lần.",
        quantity: 1,
        priceType: "fixed",
        priceMin: 1750000,
        currency: "VND",
        condition: "like_new",
        status: "open",
        image_url:
          "https://bizweb.dktcdn.net/100/485/982/products/1-1773896309379.jpg?v=1773896312797",
      },
      {
        user_id: users[minIdx(users.length, 1)]._id,
        intentType: "sell",
        sport: "Pickleball",
        category: "Apparel",
        title: "Giày Pickleball Nam Jogarbola Vortex Blue/White JG-VORTEX-01",
        details:
          "Size 42, đế carbon nhẹ, thoáng khí. Mới nguyên hộp chưa sử dụng.",
        quantity: 1,
        priceType: "fixed",
        priceMin: 1490000,
        currency: "VND",
        condition: "new",
        status: "open",
        image_url:
          "https://bizweb.dktcdn.net/100/485/982/products/1-1773896309379.jpg?v=1773896312797",
      },
      {
        user_id: users[minIdx(users.length, 2)]._id,
        intentType: "sell",
        sport: "Badminton",
        category: "Equipment",
        title: "Vợt Cầu Lông Promax PR-880 Xanh Lá Đen",
        details: "Vợt carbon nhẹ, căng sẵn. Tình trạng tốt khoảng 90%.",
        quantity: 1,
        priceType: "fixed",
        priceMin: 380000,
        currency: "VND",
        condition: "used",
        status: "open",
        image_url:
          "https://bizweb.dktcdn.net/100/485/982/products/1-1773896309379.jpg?v=1773896312797",
      },
      {
        user_id: users[0]._id,
        intentType: "sell",
        sport: "Football",
        category: "Equipment",
        title: "Quả Bóng Đá Futsan UHV 2.76 Trong Nhà",
        details: "Bóng chính hãng Động Lực, độ nảy tốt cho sân trong nhà.",
        quantity: 10,
        priceType: "fixed",
        priceMin: 650000,
        currency: "VND",
        condition: "new",
        status: "open",
        image_url:
          "https://bizweb.dktcdn.net/100/485/982/products/1-1773896309379.jpg?v=1773896312797",
      },
      {
        user_id: users[minIdx(users.length, 1)]._id,
        intentType: "buy",
        sport: "Pickleball",
        category: "Equipment",
        title: "Vợt Pickleball Zocker Happy HP03 Blue",
        details:
          "Cần mua vợt Zocker Happy HP03 màu Blue, ưu tiên mới 95% trở lên.",
        quantity: 1,
        priceType: "negotiable",
        currency: "VND",
        condition: "new",
        status: "open",
        image_url:
          "https://bizweb.dktcdn.net/100/485/982/products/1-1773896309379.jpg?v=1773896312797",
      },
    ];

    await Post.insertMany(seedPosts);
    console.log("Successfully seeded", seedPosts.length, "marketplace posts!");

    process.exit(0);
  } catch (err) {
    console.error("Error seeding DB:", err);
    process.exit(1);
  }
}

function minIdx(len, idx) {
  return len > idx ? idx : 0;
}

seed();
