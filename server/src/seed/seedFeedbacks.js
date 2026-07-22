require("dotenv").config({ path: __dirname + "/../../.env" });
const connectDb = require("../configs/db");
const { User } = require("../modules/user/model");
const { Feedback, FEEDBACK_STATUS } = require("../modules/feedback/model");

const seedUserEmails = [
  "hungnv@gmail.com",
  "lantt@gmail.com",
  "tunglv@gmail.com",
  "hoapt@gmail.com",
  "sonhv@gmail.com",
  "yendt@gmail.com",
  "phucvv@gmail.com",
  "hanhbt@gmail.com",
  "ducpv@gmail.com",
  "nhungdt@gmail.com",
  "tuyetnt@gmail.com",
  "thangtv@gmail.com",
  "xuanlt@gmail.com",
  "longpv@gmail.com",
  "honght@gmail.com",
  "haidv@gmail.com",
  "myvt@gmail.com",
  "tienbv@gmail.com",
  "vanpt@gmail.com",
  "dungdv@gmail.com",
  "huent@gmail.com",
  "hieptv@gmail.com",
  "lylt@gmail.com",
  "cuongpv@gmail.com",
  "bichht@gmail.com",
];

const feedbackSeeds = [
  {
    category: "support",
    subject: "Ghép trận rất nhanh",
    message: "Tôi tạo nhu cầu tìm bạn chơi cầu lông buổi tối và chỉ vài phút đã có người phù hợp. Hồ sơ hiển thị rõ trình độ nên hẹn sân khá yên tâm.",
    rating: 5,
  },
  {
    category: "feature_request",
    subject: "Bộ lọc môn thể thao dễ dùng",
    message: "Phần lọc theo pickleball, tennis và khu vực giúp tôi tìm nhóm gần nhà nhanh hơn. Nếu thêm lưu bộ lọc yêu thích thì sẽ còn tiện hơn.",
    rating: 5,
  },
  {
    category: "support",
    subject: "Đặt sân mượt",
    message: "Quy trình xem sân, chọn khung giờ và kiểm tra thông tin khá rõ ràng. Tôi thích việc có ảnh sân và địa chỉ trước khi đặt.",
    rating: 5,
  },
  {
    category: "other",
    subject: "Giao diện dễ làm quen",
    message: "Các mục tìm người chơi, sân và tin nhắn được sắp xếp hợp lý. Người mới như tôi không mất nhiều thời gian để biết cần bấm ở đâu.",
    rating: 5,
  },
  {
    category: "support",
    subject: "Tin nhắn ổn định",
    message: "Sau khi match, tôi nhắn với bạn chơi để chốt giờ rất tiện. Thông báo đến nhanh và nội dung cuộc trò chuyện không bị rối.",
    rating: 5,
  },
  {
    category: "billing",
    subject: "Ví thanh toán rõ ràng",
    message: "Lịch sử giao dịch trong ví dễ kiểm tra, số dư và khoản đang chờ xử lý hiển thị tách bạch. Điều này giúp tôi yên tâm hơn khi đặt sân.",
    rating: 5,
  },
  {
    category: "support",
    subject: "Thông tin sân hữu ích",
    message: "Tôi đánh giá cao phần mô tả sân, giá và tiện ích. Trước đây phải hỏi nhiều nơi, giờ có thể so sánh ngay trong web.",
    rating: 4,
  },
  {
    category: "feature_request",
    subject: "Tìm bạn cùng trình tốt",
    message: "Matchill gợi ý người chơi khá sát trình độ của tôi. Các lựa chọn trình độ beginner, intermediate và advanced giúp tránh lệch quá nhiều.",
    rating: 5,
  },
  {
    category: "other",
    subject: "Phù hợp người chơi ở Hà Nội",
    message: "Có nhiều người chơi và sân ở Hà Nội nên việc tìm kèo sau giờ làm khá dễ. Tôi đã hẹn được vài trận cầu lông trong tuần.",
    rating: 5,
  },
  {
    category: "support",
    subject: "Trang cá nhân đầy đủ",
    message: "Hồ sơ có môn yêu thích, trình độ và điểm uy tín nên tôi dễ quyết định có nhận lời chơi chung hay không.",
    rating: 4,
  },
  {
    category: "support",
    subject: "Luồng đăng nhập đơn giản",
    message: "Tài khoản đăng nhập nhanh, vào web là có thể tìm sân và xem các bài tìm người chơi ngay. Trải nghiệm tổng thể khá trơn tru.",
    rating: 5,
  },
  {
    category: "feature_request",
    subject: "Nên giữ cách gợi ý theo khoảng cách",
    message: "Tôi thích cách web ưu tiên địa điểm gần khu vực mình chọn. Với người chơi thể thao sau giờ làm, khoảng cách là yếu tố rất quan trọng.",
    rating: 4,
  },
  {
    category: "support",
    subject: "Bài đăng tìm người rõ ràng",
    message: "Form tạo bài tìm người chơi có đủ môn, trình độ và thời gian. Người xem hiểu nhanh kèo có phù hợp với mình hay không.",
    rating: 5,
  },
  {
    category: "billing",
    subject: "Thanh toán đặt sân tiện",
    message: "Tôi không phải trao đổi quá nhiều với chủ sân vì thông tin đặt sân và thanh toán đã nằm trong một luồng. Rất hợp với người bận.",
    rating: 5,
  },
  {
    category: "other",
    subject: "Có cảm giác cộng đồng",
    message: "Web không chỉ là danh sách sân mà còn có người chơi thật, bài đăng thật và tin nhắn sau khi match. Điều này làm tôi muốn quay lại.",
    rating: 5,
  },
  {
    category: "support",
    subject: "Admin phản hồi nhanh",
    message: "Tôi gửi góp ý về thông tin sân và thấy trạng thái xử lý rõ ràng. Cảm giác phản hồi của người dùng được ghi nhận nghiêm túc.",
    rating: 5,
  },
  {
    category: "feature_request",
    subject: "Gợi ý thêm lịch rảnh",
    message: "Tính năng hiện tại đã tốt, nếu sau này thêm lịch rảnh cố định cho từng người chơi thì việc tìm đối thủ sẽ nhanh hơn nữa.",
    rating: 4,
  },
  {
    category: "support",
    subject: "Tốc độ tải ổn",
    message: "Danh sách sân và bài tìm người chơi tải nhanh trên máy của tôi. Khi chuyển qua trang tin nhắn cũng không bị khựng đáng kể.",
    rating: 5,
  },
  {
    category: "other",
    subject: "Phù hợp nhiều môn",
    message: "Tôi chơi cả tennis và pickleball nên thích việc web không bị bó vào một môn duy nhất. Chọn môn trong hồ sơ cũng rất dễ hiểu.",
    rating: 5,
  },
  {
    category: "support",
    subject: "Đánh giá sau trận hữu ích",
    message: "Việc có đánh giá sau trận giúp tôi chọn bạn chơi có uy tín hơn. Đây là điểm làm Matchill khác với nhắn tin hẹn sân thông thường.",
    rating: 5,
  },
  {
    category: "bug",
    subject: "Bộ lọc đôi lúc chưa giữ lựa chọn",
    message: "Có lúc tôi chọn môn và khu vực rồi quay lại trang trước thì bộ lọc bị reset. Không nghiêm trọng nhưng hơi mất công chọn lại.",
    rating: 2,
  },
  {
    category: "support",
    subject: "Cần thông báo rõ hơn khi sân hết chỗ",
    message: "Một vài khung giờ nhìn giống còn trống nhưng đến bước đặt mới biết không phù hợp. Nếu báo sớm hơn ở danh sách sân thì sẽ đỡ nhầm.",
    rating: 2,
  },
  {
    category: "bug",
    subject: "Tin nhắn có lúc cập nhật chậm",
    message: "Tôi từng phải tải lại trang mới thấy tin nhắn mới trong cuộc trò chuyện sau khi match. Mong phần realtime ổn định hơn.",
    rating: 2,
  },
  {
    category: "feature_request",
    subject: "Thiếu lọc theo khung giờ quen chơi",
    message: "Tôi thường chỉ chơi sau 19h, nhưng hiện phải xem từng bài hoặc từng sân. Nếu lọc theo khung giờ rảnh thì trải nghiệm sẽ tốt hơn.",
    rating: 3,
  },
  {
    category: "support",
    subject: "Một số mô tả sân còn thiếu",
    message: "Có sân chưa ghi rõ gửi xe, phòng thay đồ hoặc loại mặt sân. Những thông tin này ảnh hưởng khá nhiều khi quyết định đặt.",
    rating: 2,
  },
];

async function seedFeedbacks() {
  try {
    await connectDb();
    console.log("Connected to DB");

    const users = await User.find({ email: { $in: seedUserEmails } }).select("_id email");
    const usersByEmail = new Map(users.map((user) => [user.email, user]));

    const missingEmails = seedUserEmails.filter((email) => !usersByEmail.has(email));
    if (missingEmails.length > 0) {
      console.log(`Missing ${missingEmails.length} users. Run seedUsers.js first.`);
      console.log(missingEmails.join(", "));
      process.exit(1);
    }

    let createdCount = 0;
    let skippedCount = 0;

    for (const [index, feedbackSeed] of feedbackSeeds.entries()) {
      const email = seedUserEmails[index];
      const user = usersByEmail.get(email);
      const existing = await Feedback.findOne({
        user_id: user._id,
        subject: feedbackSeed.subject,
      });

      if (existing) {
        console.log(`Skipped (already exists): ${email} - ${feedbackSeed.subject}`);
        skippedCount++;
        continue;
      }

      await Feedback.create({
        user_id: user._id,
        ...feedbackSeed,
        status: index % 7 === 0 ? FEEDBACK_STATUS.REVIEWING : FEEDBACK_STATUS.NEW,
        createdAt: new Date(Date.now() - (feedbackSeeds.length - index) * 60 * 60 * 1000),
      });

      console.log(`Created feedback: ${email} - ${feedbackSeed.subject}`);
      createdCount++;
    }

    console.log(`\nDone! Created: ${createdCount}, Skipped: ${skippedCount}`);
    process.exit(0);
  } catch (err) {
    console.error("Error seeding feedbacks:", err);
    process.exit(1);
  }
}

seedFeedbacks();
