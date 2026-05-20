# Social Feeds Feature Overview

## Giới thiệu
Tính năng Social Feeds cho phép người dùng chia sẻ nội dung, tương tác với nhau thông qua các bài đăng (posts), lượt thích (likes) và bình luận (comments). Đây là không gian cộng đồng để các thành viên kết nối và trao đổi thông tin.

## Các thành phần chính
Tính năng được xây dựng dựa trên 3 mô hình dữ liệu chính:
1. **Post (Bài đăng)**: Lưu trữ nội dung văn bản và thông tin người đăng.
2. **Comment (Bình luận)**: Cho phép người dùng phản hồi dưới các bài đăng.
3. **Like (Lượt thích)**: Thể hiện sự quan tâm của người dùng đối với bài đăng.

## Cấu trúc API
Tất cả các API đều nằm dưới prefix `/api/v1/social` và yêu cầu xác thực người dùng qua JWT.

### Quản lý bài đăng
- `POST /posts`: Tạo bài đăng mới.
- `GET /feed`: Lấy bảng tin (hỗ trợ phân trang).
- `PATCH /posts/:postId`: Sửa bài đăng.
- `DELETE /posts/:postId`: Xóa bài đăng (xóa kèm like/comment).

### Tương tác (Like)
- `POST /posts/:postId/like`: Thích bài đăng.
- `DELETE /posts/:postId/like`: Bỏ thích bài đăng.

### Bình luận
- `POST /posts/:postId/comments`: Thêm bình luận.
- `GET /posts/:postId/comments`: Xem danh sách bình luận của bài đăng.
- `PATCH /comments/:commentId`: Sửa bình luận.
- `DELETE /comments/:commentId`: Xóa bình luận.

## Quy tắc chung
- Người dùng chỉ có quyền chỉnh sửa hoặc xóa nội dung do chính mình tạo ra (`isOwner`).
- Nội dung (bài đăng/bình luận) bị giới hạn tối đa 2000 ký tự.
- Bảng tin hiện tại có phạm vi toàn hệ thống (Global Feed).
