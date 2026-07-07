require("dotenv").config({ path: __dirname + "/../../.env" });
const connectDb = require("../configs/db");
const { User, Profile, UserRole } = require("../modules/user/model");

const SHARED_PASSWORD_HASH = "$2a$10$gdgmDAL0lEC6YyvDG/yIvetjR3YjFd/7TzlXuLgjU3dJxgcHi9LPq";

const vietnameseUsers = [
  // ─── 1-47: Original set ───
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

  // ─── 41-80 ───
  ["Nguyễn Văn Hùng", "hungnv@gmail.com", "male"],
  ["Trần Thị Lan", "lantt@gmail.com", "female"],
  ["Lê Văn Tùng", "tunglv@gmail.com", "male"],
  ["Phạm Thị Hoa", "hoapt@gmail.com", "female"],
  ["Hoàng Văn Sơn", "sonhv@gmail.com", "male"],
  ["Đặng Thị Yến", "yendt@gmail.com", "female"],
  ["Võ Văn Phúc", "phucvv@gmail.com", "male"],
  ["Bùi Thị Hạnh", "hanhbt@gmail.com", "female"],
  ["Phan Văn Đức", "ducpv@gmail.com", "male"],
  ["Đỗ Thị Nhung", "nhungdt@gmail.com", "female"],
  ["Nguyễn Thị Tuyết", "tuyetnt@gmail.com", "female"],
  ["Trần Văn Thắng", "thangtv@gmail.com", "male"],
  ["Lê Thị Xuân", "xuanlt@gmail.com", "female"],
  ["Phạm Văn Long", "longpv@gmail.com", "male"],
  ["Hoàng Thị Hồng", "honght@gmail.com", "female"],
  ["Đặng Văn Hải", "haidv@gmail.com", "male"],
  ["Võ Thị Mỹ", "myvt@gmail.com", "female"],
  ["Bùi Văn Tiến", "tienbv@gmail.com", "male"],
  ["Phan Thị Vân", "vanpt@gmail.com", "female"],
  ["Đỗ Văn Dũng", "dungdv@gmail.com", "male"],
  ["Nguyễn Thị Huệ", "huent@gmail.com", "female"],
  ["Trần Văn Hiệp", "hieptv@gmail.com", "male"],
  ["Lê Thị Lý", "lylt@gmail.com", "female"],
  ["Phạm Văn Cường", "cuongpv@gmail.com", "male"],
  ["Hoàng Thị Bích", "bichht@gmail.com", "female"],
  ["Đặng Văn Trường", "truongdv@gmail.com", "male"],
  ["Võ Thị Kim", "kimvt@gmail.com", "female"],
  ["Bùi Văn Phương", "phuongbv@gmail.com", "male"],
  ["Phan Thị Hiền", "hienpt@gmail.com", "female"],
  ["Đỗ Văn Thịnh", "thinhdv@gmail.com", "male"],
  ["Nguyễn Thị Đào", "daont@gmail.com", "female"],
  ["Trần Văn Lợi", "loitv@gmail.com", "male"],
  ["Lê Thị Phượng", "phuonglt@gmail.com", "female"],
  ["Phạm Văn Nghĩa", "nghiapv@gmail.com", "male"],
  ["Hoàng Thị Hương", "huonght@gmail.com", "female"],
  ["Đặng Văn Cảnh", "canhdv@gmail.com", "male"],
  ["Võ Thị Hằng", "hangvt@gmail.com", "female"],
  ["Bùi Văn Huy", "huybv@gmail.com", "male"],
  ["Phan Thị Hải", "haipt@gmail.com", "female"],
  ["Đỗ Văn Hòa", "hoadv@gmail.com", "male"],

  // ─── 81-120 ───
  ["Nguyễn Văn Sang", "sangnv@gmail.com", "male"],
  ["Trần Thị Liên", "lientt@gmail.com", "female"],
  ["Lê Văn Hoàng", "hoanglv@gmail.com", "male"],
  ["Phạm Thị Nguyệt", "nguyetpt@gmail.com", "female"],
  ["Hoàng Văn Toản", "toanhv@gmail.com", "male"],
  ["Đặng Thị Thùy", "thuydt@gmail.com", "female"],
  ["Võ Văn Khang", "khangvv@gmail.com", "male"],
  ["Bùi Thị Tâm", "tambt2@gmail.com", "female"],
  ["Phan Văn Đông", "dongpv@gmail.com", "male"],
  ["Đỗ Thị Nga", "ngadt@gmail.com", "female"],
  ["Nguyễn Thị Thu", "thunt@gmail.com", "female"],
  ["Trần Văn Bình", "binhtv@gmail.com", "male"],
  ["Lê Thị Phúc", "phuclt@gmail.com", "female"],
  ["Phạm Văn Thái", "thaipv@gmail.com", "male"],
  ["Hoàng Thị Ngọc", "ngoht@gmail.com", "female"],
  ["Đặng Văn Tú", "tudv@gmail.com", "male"],
  ["Võ Thị Sáu", "sauvt@gmail.com", "female"],
  ["Bùi Văn Hậu", "haubv@gmail.com", "male"],
  ["Phan Thị Thanh", "thanhpt@gmail.com", "female"],
  ["Đỗ Văn Phước", "phuocdv@gmail.com", "male"],
  ["Nguyễn Thị Cúc", "cucnt@gmail.com", "female"],
  ["Trần Văn Vũ", "vutv@gmail.com", "male"],
  ["Lê Thị Hồng", "honglt@gmail.com", "female"],
  ["Phạm Văn Lộc", "locpv@gmail.com", "male"],
  ["Hoàng Thị Oanh", "oanhht@gmail.com", "female"],
  ["Đặng Văn Khanh", "khanhdv@gmail.com", "male"],
  ["Võ Thị Trà", "travt@gmail.com", "female"],
  ["Bùi Văn Tài", "taibv@gmail.com", "male"],
  ["Phan Thị Thơm", "thompt@gmail.com", "female"],
  ["Đỗ Văn Bảy", "baydv@gmail.com", "male"],
  ["Nguyễn Thị Tuyết", "tuyetnt2@gmail.com", "female"],
  ["Trần Văn Trung", "trungtv@gmail.com", "male"],
  ["Lê Thị Thắm", "thamlt@gmail.com", "female"],
  ["Phạm Văn Hiếu", "hieupv@gmail.com", "male"],
  ["Hoàng Thị Nụ", "nuht@gmail.com", "female"],
  ["Đặng Văn Lâm", "lamdv@gmail.com", "male"],
  ["Võ Thị Hà", "havt@gmail.com", "female"],
  ["Bùi Văn Đô", "dobv@gmail.com", "male"],
  ["Phan Thị Lan", "lanpt@gmail.com", "female"],
  ["Đỗ Văn Tân", "tandv@gmail.com", "male"],

  // ─── 121-160 ───
  ["Nguyễn Văn Toàn", "toannv@gmail.com", "male"],
  ["Trần Thị Lài", "laitt@gmail.com", "female"],
  ["Lê Văn Tâm", "tamlv@gmail.com", "male"],
  ["Phạm Thị Nhàn", "nhanpt@gmail.com", "female"],
  ["Hoàng Văn Khoa", "khoahv@gmail.com", "male"],
  ["Đặng Thị Diễm", "diemdt@gmail.com", "female"],
  ["Võ Văn Hội", "hoivv@gmail.com", "male"],
  ["Bùi Thị Thoa", "thoabt@gmail.com", "female"],
  ["Phan Văn Bách", "bachpv@gmail.com", "male"],
  ["Đỗ Thị Dung", "dungdt@gmail.com", "female"],
  ["Nguyễn Thị Hồng", "hongnt@gmail.com", "female"],
  ["Trần Văn Triều", "trieutv@gmail.com", "male"],
  ["Lê Thị Ánh", "anhlt@gmail.com", "female"],
  ["Phạm Văn Tú", "tupv@gmail.com", "male"],
  ["Hoàng Thị Loan", "loanht@gmail.com", "female"],
  ["Đặng Văn Tùng", "tungdv@gmail.com", "male"],
  ["Võ Thị Cẩm", "camvt@gmail.com", "female"],
  ["Bùi Văn Nhân", "nhanbv@gmail.com", "male"],
  ["Phan Thị Thúy", "thuypt@gmail.com", "female"],
  ["Đỗ Văn Huân", "huandv@gmail.com", "male"],
  ["Nguyễn Thị Hạ", "hant@gmail.com", "female"],
  ["Trần Văn Duy", "duytv@gmail.com", "male"],
  ["Lê Thị Tình", "tinhtl@gmail.com", "female"],
  ["Phạm Văn Lực", "lucpv@gmail.com", "male"],
  ["Hoàng Thị Sương", "suonght@gmail.com", "female"],
  ["Đặng Văn Tuyển", "tuyendv@gmail.com", "male"],
  ["Võ Thị Ái", "aivt@gmail.com", "female"],
  ["Bùi Văn Hùng", "hungbv@gmail.com", "male"],
  ["Phan Thị Xoan", "xoanpt@gmail.com", "female"],
  ["Đỗ Văn Chiến", "chiendv@gmail.com", "male"],
  ["Nguyễn Thị Duyên", "duyennt@gmail.com", "female"],
  ["Trần Văn Khải", "khaitv@gmail.com", "male"],
  ["Lê Thị Hồi", "hoilt@gmail.com", "female"],
  ["Phạm Văn Thọ", "thopv@gmail.com", "male"],
  ["Hoàng Thị Luận", "luanht@gmail.com", "female"],
  ["Đặng Văn Hiển", "hiendv@gmail.com", "male"],
  ["Võ Thị Như", "nhuvt@gmail.com", "female"],
  ["Bùi Văn Dũng", "dungbv@gmail.com", "male"],
  ["Phan Thị Tươi", "tuoipt@gmail.com", "female"],
  ["Đỗ Văn Chinh", "chinhdv@gmail.com", "male"],

  // ─── 161-201 ───
  ["Nguyễn Văn Bền", "bennv@gmail.com", "male"],
  ["Trần Thị Trúc", "tructt@gmail.com", "female"],
  ["Lê Văn Hoan", "hoanlv@gmail.com", "male"],
  ["Phạm Thị Bình", "binhpt@gmail.com", "female"],
  ["Hoàng Văn Phú", "phuhv@gmail.com", "male"],
  ["Đặng Thị Dân", "dandt@gmail.com", "female"],
  ["Võ Văn Nhật", "nhatvv@gmail.com", "male"],
  ["Bùi Thị Quyên", "quyenbt@gmail.com", "female"],
  ["Phan Văn Thuận", "thuanpv@gmail.com", "male"],
  ["Đỗ Thị Tuyền", "tuyendt@gmail.com", "female"],
  ["Nguyễn Thị Giang", "giangnt@gmail.com", "female"],
  ["Trần Văn Thông", "thongtv@gmail.com", "male"],
  ["Lê Thị Minh", "minhlt@gmail.com", "female"],
  ["Phạm Văn Đoàn", "doanpv@gmail.com", "male"],
  ["Hoàng Thị Nhiên", "nhienht@gmail.com", "female"],
  ["Đặng Văn Hợp", "hopdv@gmail.com", "male"],
  ["Võ Thị Tuyết", "tuyetvt@gmail.com", "female"],
  ["Bùi Văn Thu", "thubv@gmail.com", "male"],
  ["Phan Thị Cúc", "cucpt@gmail.com", "female"],
  ["Đỗ Văn Thành", "thanhdv@gmail.com", "male"],
  ["Nguyễn Thị Lệ", "lent@gmail.com", "female"],
  ["Trần Văn Mạnh", "manhtv@gmail.com", "male"],
  ["Lê Thị Cẩm", "camlt@gmail.com", "female"],
  ["Phạm Văn Quân", "quanpv@gmail.com", "male"],
  ["Hoàng Thị Hậu", "hauht@gmail.com", "female"],
  ["Đặng Văn Biên", "biendv@gmail.com", "male"],
  ["Võ Thị Sa", "savt@gmail.com", "female"],
  ["Bùi Văn Thủy", "thuybv@gmail.com", "male"],
  ["Phan Thị Hường", "huongpt@gmail.com", "female"],
  ["Đỗ Văn Lương", "luongdv@gmail.com", "male"],
  ["Nguyễn Thị Kiều", "kieunt@gmail.com", "female"],
  ["Trần Văn Tín", "tintv@gmail.com", "male"],
  ["Lê Thị Mỹ", "mylt@gmail.com", "female"],
  ["Phạm Văn Sỹ", "sypv@gmail.com", "male"],
  ["Hoàng Thị Ngà", "ngaht@gmail.com", "female"],
  ["Đặng Văn Quảng", "quangdv@gmail.com", "male"],
  ["Võ Thị Nhi", "nhivt@gmail.com", "female"],
  ["Bùi Văn Ân", "anbv@gmail.com", "male"],
  ["Phan Thị Ly", "lypt@gmail.com", "female"],
  ["Đỗ Văn Tạo", "taodv@gmail.com", "male"],
  ["Nguyễn Thị Chín", "chinnt@gmail.com", "female"],

  // ─── 202-241 ───
  ["Trần Văn Bảy", "baytv@gmail.com", "male"],
  ["Lê Thị Nguyên", "nguyenlt@gmail.com", "female"],
  ["Phạm Văn Tiệp", "tieppv@gmail.com", "male"],
  ["Hoàng Thị Bông", "bonght@gmail.com", "female"],
  ["Đặng Văn Phát", "phatdv@gmail.com", "male"],
  ["Võ Thị Trinh", "trinhvt@gmail.com", "female"],
  ["Bùi Văn Thanh", "thanhbv@gmail.com", "male"],
  ["Phan Thị Nở", "nopt@gmail.com", "female"],
  ["Đỗ Văn Bửu", "buudv@gmail.com", "male"],
  ["Nguyễn Thị Tâm", "tamnt@gmail.com", "female"],
  ["Trần Văn Nhân", "nhantv@gmail.com", "male"],
  ["Lê Thị Phụng", "phunglt@gmail.com", "female"],
  ["Phạm Văn Điệp", "dieppv@gmail.com", "male"],
  ["Hoàng Thị Cúc", "cucht@gmail.com", "female"],
  ["Đặng Văn Phước", "phuocdv2@gmail.com", "male"],
  ["Võ Thị Đào", "daovt@gmail.com", "female"],
  ["Bùi Văn Huỳnh", "huynhbv@gmail.com", "male"],
  ["Phan Thị Hòa", "hoapt2@gmail.com", "female"],
  ["Đỗ Văn Phú", "phudv@gmail.com", "male"],
  ["Nguyễn Thị Lý", "lynt@gmail.com", "female"],
  ["Trần Văn Niên", "nientv@gmail.com", "male"],
  ["Lê Thị Nhung", "nhunglt@gmail.com", "female"],
  ["Phạm Văn Siêu", "sieupv@gmail.com", "male"],
  ["Hoàng Thị Hạnh", "hanhht@gmail.com", "female"],
  ["Đặng Văn Thọ", "thodv@gmail.com", "male"],
  ["Võ Thị Nhàn", "nhanvt@gmail.com", "female"],
  ["Bùi Văn Đức", "ducbv@gmail.com", "male"],
  ["Phan Thị Vui", "vuipt@gmail.com", "female"],
  ["Đỗ Văn Toản", "toandv@gmail.com", "male"],
  ["Nguyễn Thị Hảo", "haont@gmail.com", "female"],
  ["Trần Văn Hỷ", "hytv@gmail.com", "male"],
  ["Lê Thị Ngà", "ngalt@gmail.com", "female"],
  ["Phạm Văn Minh", "minhpv@gmail.com", "male"],
  ["Hoàng Thị Thuần", "thuanht@gmail.com", "female"],
  ["Đặng Văn Trọng", "trongdv@gmail.com", "male"],
  ["Võ Thị Gái", "gaivt@gmail.com", "female"],
  ["Bùi Văn Tuyển", "tuyenbv@gmail.com", "male"],
  ["Phan Thị Liễu", "lieupt@gmail.com", "female"],
  ["Đỗ Văn Oai", "oaidv@gmail.com", "male"],
  ["Nguyễn Thị Nga", "ngant2@gmail.com", "female"],

  // ─── 242-281 ───
  ["Trần Văn Bính", "binhtv2@gmail.com", "male"],
  ["Lê Thị Tuyết", "tuyetlt@gmail.com", "female"],
  ["Phạm Văn Chất", "chatpv@gmail.com", "male"],
  ["Hoàng Thị Nhâm", "nhamht@gmail.com", "female"],
  ["Đặng Văn Xuyến", "xuyendv@gmail.com", "male"],
  ["Võ Thị Huyền", "huyenvt@gmail.com", "female"],
  ["Bùi Văn Nghệ", "nghebv@gmail.com", "male"],
  ["Phan Thị Ngọt", "ngotpt@gmail.com", "female"],
  ["Đỗ Văn Ninh", "ninhdv@gmail.com", "male"],
  ["Nguyễn Thị Trà", "trant@gmail.com", "female"],
  ["Trần Văn Quế", "quetv@gmail.com", "male"],
  ["Lê Thị Đậu", "dault@gmail.com", "female"],
  ["Phạm Văn Hướng", "huongpv@gmail.com", "male"],
  ["Hoàng Thị Xuyến", "xuyenht@gmail.com", "female"],
  ["Đặng Văn Tiến", "tiendv@gmail.com", "male"],
  ["Võ Thị Mùi", "muivt@gmail.com", "female"],
  ["Bùi Văn Thân", "thanbv@gmail.com", "male"],
  ["Phan Thị Thêu", "theupt@gmail.com", "female"],
  ["Đỗ Văn Bích", "bichdv@gmail.com", "male"],
  ["Nguyễn Thị Hoa", "hoant@gmail.com", "female"],
  ["Trần Văn Mười", "muoitv@gmail.com", "male"],
  ["Lê Thị Đô", "dolt@gmail.com", "female"],
  ["Phạm Văn Tiến", "tienpv2@gmail.com", "male"],
  ["Hoàng Thị Nhiễu", "nhieuht@gmail.com", "female"],
  ["Đặng Văn Đồng", "dongdv@gmail.com", "male"],
  ["Võ Thị Tần", "tanvt@gmail.com", "female"],
  ["Bùi Văn Sơn", "sonbv@gmail.com", "male"],
  ["Phan Thị Luyến", "luyenpt@gmail.com", "female"],
  ["Đỗ Văn Mẫn", "mandv@gmail.com", "male"],
  ["Nguyễn Thị Cảnh", "canhnt@gmail.com", "female"],
  ["Trần Văn Hào", "haotv@gmail.com", "male"],
  ["Lê Thị Phương", "phuonglt2@gmail.com", "female"],
  ["Phạm Văn Kỳ", "kypv@gmail.com", "male"],
  ["Hoàng Thị Phượng", "phuonght@gmail.com", "female"],
  ["Đặng Văn Quốc", "quocdv@gmail.com", "male"],
  ["Võ Thị Tư", "tuvt@gmail.com", "female"],
  ["Bùi Văn Hùng", "hungbv2@gmail.com", "male"],
  ["Phan Thị Thìn", "thinpt@gmail.com", "female"],
  ["Đỗ Văn Nam", "namdv@gmail.com", "male"],
  ["Nguyễn Thị Ất", "atnt@gmail.com", "female"],

  // ─── 282-304 ───
  ["Trần Văn Định", "dinhtv@gmail.com", "male"],
  ["Lê Thị Tân", "tanlt@gmail.com", "female"],
  ["Phạm Văn Chương", "chuongpv@gmail.com", "male"],
  ["Hoàng Thị Nhung", "nhunght2@gmail.com", "female"],
  ["Đặng Văn Phúc", "phucdv2@gmail.com", "male"],
  ["Võ Thị Loan", "loanvt@gmail.com", "female"],
  ["Bùi Văn Cần", "canbv@gmail.com", "male"],
  ["Phan Thị Năm", "nampt@gmail.com", "female"],
  ["Đỗ Văn Tài", "taidv2@gmail.com", "male"],
  ["Nguyễn Thị Sửu", "suunt@gmail.com", "female"],
  ["Trần Văn Dần", "dantv@gmail.com", "male"],
  ["Lê Thị Mão", "maolt@gmail.com", "female"],
  ["Phạm Văn Thân", "thanpv@gmail.com", "male"],
  ["Hoàng Thị Dậu", "dauht@gmail.com", "female"],
  ["Đặng Văn Tuất", "tuatdv@gmail.com", "male"],
  ["Võ Thị Hợi", "hoivt@gmail.com", "female"],
  ["Bùi Văn Tý", "tybv@gmail.com", "male"],
  ["Phan Thị Sửu", "suupt@gmail.com", "female"],
  ["Đỗ Văn Ngọ", "ngodv@gmail.com", "male"],
  ["Nguyễn Thị Mùi", "muint@gmail.com", "female"],
  ["Trần Văn Thân", "thantv@gmail.com", "male"],
  ["Lê Thị Dần", "danlt@gmail.com", "female"],
  ["Phạm Văn Tuất", "tuatpv@gmail.com", "male"],
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

const HANOI_RATIO = 0.95; // 95% users ở Hà Nội, 5% ở TP. Hồ Chí Minh

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
      Math.random() < HANOI_RATIO ? "Hà Nội" : "TP. Hồ Chí Minh",
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
      // Bypass pre("save") hook để không hash lại hash đã có
      const data = user.toObject();
      delete data._id;
      const inserted = await User.collection.insertOne(data);
      user._id = inserted.insertedId;

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

