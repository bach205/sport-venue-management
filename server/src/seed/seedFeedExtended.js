require("dotenv").config({ path: __dirname + "/../../.env" });
const connectDb = require("../configs/db");
const fs = require("fs");
const { Post, Comment, Like } = require("../modules/social/model");
const { User } = require("../modules/user/model");

/**
 * Seed marketplace feed: posts mua/bán, comments, likes
 *
 * Cần chạy AFTER seedUsers.js
 * Chạy: node src/seed/seedFeedExtended.js
 */

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

const SELL_POSTS = [
  {
    intentType: "sell",
    sport: "Football",
    category: "Apparel",
    title: "Áo đội tuyển Tây Ban Nha sân khách 2026",
    details:
      "Áo đội tuyển Tây Ban Nha sân khách 2026. Vải thun mè co giãn tốt, thoáng mát, thấm hút mồ hôi. Phù hợp cho các hoạt động thể thao ngoài trời. Độ bền cao, không mất form dáng, chống nhăn, nhanh khô. Size S - M - L - XL - XXL - XXXL.",
    quantity: 43,
    priceType: "fixed",
    priceMin: 145000,
    currency: "VND",
    condition: "new",
    image_url:
      "https://cdn.hstatic.net/products/200000293662/27_70d639f5e8a14b20994bf2b127e2c16b.png",
  },
  {
    intentType: "sell",
    sport: "Badminton",
    category: "Equipment",
    title: "Vợt cầu lông VNB V200 Đỏ",
    details:
      "Vợt cầu lông VNB V200 Đỏ chính hãng - dành cho người mới chơi. Trọng lượng 4U (84±2g), độ dẻo trung bình, điểm cân bằng 295mm, sức căng tối đa 28-30 LBS. Khung và thân bằng Carbon High Modulus. Màu đen/đỏ, thiết kế mặt cắt lưỡi kiếm giảm cản gió. Tặng 2 quấn cán vợt.",
    quantity: 19,
    priceType: "fixed",
    priceMin: 529000,
    currency: "VND",
    condition: "new",
    image_url:
      "https://down-vn.img.susercontent.com/file/vn-11134207-820l4-meryrvggnvnk7d",
  },
  {
    intentType: "sell",
    sport: "Football",
    category: "Apparel",
    title: "Bộ Quần Áo Bóng Đá ĐTQG Bồ Đào Nha 2026",
    details:
      "Bộ quần áo bóng đá ĐTQG Bồ Đào Nha 2026, áo Ronaldo chuẩn thi đấu. Vải Polyester Gai Thái Cao Cấp, logo dệt sắc sảo, thấm hút tốt. Size S (50-60kg) đến XXL (90-100kg). Có tùy chọn Full Logo hoặc Full Logo + CR7.",
    quantity: 32,
    priceType: "fixed",
    priceMin: 290000,
    currency: "VND",
    condition: "new",
    image_url:
      "https://down-vn.img.susercontent.com/file/vn-11134207-820l4-mi4o69ocqpkz15",
  },
  {
    intentType: "sell",
    sport: "Football",
    category: "Accessories",
    title: "Shin Pads Conopery Thoáng khí - Ống đồng bảo vệ chân",
    details:
      "Conopery 1 Cặp Bóng Đá Shin Guards, nhẹ, bảo vệ ống đồng chân khi chơi bóng đá. Thiết kế thoáng khí, ôm sát chân. Mới 100%, còn 50 sản phẩm. Giá 45,000đ / cặp.",
    quantity: 46,
    priceType: "fixed",
    priceMin: 45000,
    currency: "VND",
    condition: "new",
    image_url:
      "https://down-vn.img.susercontent.com/file/sg-11134201-7rd4t-lw48f1iz3pvjc2",
  },
];

const BUY_POSTS = [];

const COMMENT_TEMPLATES = [
  "Sản phẩm còn ko bạn?",
  "Mk quan tâm ib mk nhé",
  "Mình ở huyện khác ship được ko b ơi?",
  "Hàng đẹp! Mình đặt 1 cái nhé.",
  "Ngon quá, giá hợp lý đấy",
  "Bạn ở đâu để mình qua xem",
  "Đặt hàng giúp mình với!",
  "Mình muốn mua, còn hàng k?",
];

// ─── Tạo comments thông minh hơn theo từng loại intentType ───
function generateComments(post, users) {
  const commentCount = 1 + Math.floor(Math.random() * 5);
  const comments = [];
  const usedUsers = new Set();

  for (let i = 0; i < commentCount; i++) {
    let user;
    do {
      user = pick(users);
    } while (usedUsers.has(String(user._id)) && usedUsers.size < users.length);
    usedUsers.add(String(user._id));

    const template = pick(
      post.intentType === "buy" ? BUYER_COMMENTS : SELLER_COMMENTS,
    );
    comments.push({
      user_id: user._id,
      content: template,
      createdAt: new Date(
        Date.now() - Math.floor(Math.random() * 7 * 86400000),
      ),
    });
  }
  return comments;
}

const BUYER_COMMENTS = [
  "Mình có hàng này, inbox mình nhé!",
  "Để mình kiếm, có thì báo bạn.",
  "Mình cũng đang có ý định bán cái này.",
  "Bạn muốn mua mới hay used?",
  "Mình có người quen đang bán, để hỏi giúp.",
  "Sản phẩm này bên kia bán ổn hơn bạn ạ.",
  "Mình ở gần, để qua xem cho.",
];

const SELLER_COMMENTS = [
  "Sản phẩm còn ko bn?",
  "Mình muốn mua, còn hàng k ạ?",
  "Cho mình xin thêm ảnh thực tế với ạ",
  "Đã đặt mua!",
  "Bn có ship Hà Nội ko?",
  "Hàng chuẩn ko bn ơi?",
  "ib chốt đơn nhé!",
  "Bạn ở đâu để mình qua xem",
  "Mk quan tâm ib mk nhé",
  "Mình ở huyện khác ship được ko b ơi?",
];

async function seedFeedExtended() {
  try {
    await connectDb();
    console.log("Connected to DB");

    const seedContent = fs.readFileSync(__dirname + "/seedUsers.js", "utf8");
    const seedEmails = [...seedContent.matchAll(/\["([^"]+)",\s*"([^"]+)"/g)]
      .map((m) => m[2])
      .filter((e) => e.includes("@"));
    const users = await User.find({ email: { $in: seedEmails } }).limit(50);
    if (users.length < 5) {
      console.log("Need at least 5 users. Run seedUsers.js first.");
      process.exit(1);
    }
    console.log(`Found ${users.length} users`);

    let postCount = 0;
    let commentCount = 0;
    let likeCount = 0;

    // ─── 1. Tạo SELL posts ───
    console.log("\n─── Creating SELL Posts ───");
    for (const postData of SELL_POSTS) {
      const user = pick(users);
      const existing = await Post.findOne({
        user_id: user._id,
        title: postData.title,
      });
      if (existing) {
        console.log(`  Skipped (exists): ${postData.title}`);
        continue;
      }

      // Bypass Mongoose pre-save hook — dùng raw collection
      const postAgeDays = 14 + Math.floor(Math.random() * 7);
      const postTime = new Date(Date.now() - postAgeDays * 86400000);

      const postRaw = await Post.collection.insertOne({
        user_id: user._id,
        content: postData.details,
        image_url: postData.image_url,
        intentType: postData.intentType,
        sport: postData.sport,
        category: postData.category,
        title: postData.title,
        details: postData.details,
        quantity: postData.quantity,
        priceType: postData.priceType,
        priceMin: postData.priceMin,
        priceMax: postData.priceMax,
        currency: postData.currency,
        condition: postData.condition,
        status: "open",
        createdAt: postTime,
        updatedAt: postTime,
      });
      const post = await Post.findById(postRaw.insertedId);

      console.log(
        `  Created sell post: ${postData.title} (${postData.priceMin}đ)`,
      );
      postCount++;

      // Tạo comments (3-4 comments mỗi bài) — sau post 1-3 ngày
      const commenters = users.filter(
        (u) => String(u._id) !== String(user._id),
      );
      const numComments = 3 + Math.floor(Math.random() * 2);
      const commentDocs = [];
      for (let i = 0; i < numComments && i < commenters.length; i++) {
        const commentDate = new Date(
          postTime.getTime() +
            (1 + Math.floor(Math.random() * 3)) * 86400000 +
            Math.floor(Math.random() * 86400000),
        );
        commentDocs.push({
          post_id: post._id,
          user_id: commenters[i]._id,
          content: pick(
            post.intentType === "sell" ? SELLER_COMMENTS : BUYER_COMMENTS,
          ),
          createdAt: commentDate,
          updatedAt: commentDate,
        });
      }
      if (commentDocs.length) await Comment.collection.insertMany(commentDocs);
      commentCount += commentDocs.length;

      // Tạo likes (10-15 likes mỗi bài) — rải rác trong vòng 1 tuần sau post
      const pool = users.filter((u) => String(u._id) !== String(user._id));
      const numLikes = 10 + Math.floor(Math.random() * 6);
      const shuffled = [...pool].sort(() => Math.random() - 0.5);
      const likeDocs = [];
      for (let i = 0; i < numLikes && i < shuffled.length; i++) {
        likeDocs.push({
          post_id: post._id,
          user_id: shuffled[i]._id,
          createdAt: new Date(
            postTime.getTime() + Math.floor(Math.random() * 7 * 86400000),
          ),
        });
      }
      try {
        if (likeDocs.length)
          await Like.collection.insertMany(likeDocs, { ordered: false });
        likeCount += likeDocs.length;
      } catch (e) {
        // unique constraint — vẫn count được các doc đã insert
        likeCount += likeDocs.length;
      }
    }

    console.log(
      `\nDone! Posts: ${postCount}, Comments: ${commentCount}, Likes: ${likeCount}`,
    );
    process.exit(0);
  } catch (err) {
    console.error("Error seeding feed:", err);
    process.exit(1);
  }
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

seedFeedExtended();
