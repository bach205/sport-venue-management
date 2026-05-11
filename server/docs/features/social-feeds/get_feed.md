# GET /social/feed

## Mục đích
Lấy danh sách các bài đăng trên bảng tin toàn cầu với tính năng phân trang.

## Input
### Headers
- `Authorization: Bearer <token>`

### Query Params
- `page`: Số trang hiện tại (mặc định: 1).
- `limit`: Số lượng bài đăng trên mỗi trang (mặc định: 20, tối đa: 100).

## Response
### Success - 200 OK
```json
{
  "message": "Feed fetched successfully.",
  "data": {
    "items": [
      {
        "id": "60d5ec18603102197485457a",
        "content": "Nội dung bài đăng...",
        "author": {
          "id": "60d5ec186031021974854570",
          "email": "user@example.com",
          "name": "Nguyễn Văn A"
        },
        "createdAt": "2026-05-11T16:00:00.000Z",
        "updatedAt": "2026-05-11T16:00:00.000Z",
        "likeCount": 10,
        "commentCount": 5,
        "isOwner": false,
        "hasLiked": true
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "pages": 8
    },
    "meta": {
      "scope": "global"
    }
  }
}
```

## Logic flow
1. Request đi qua `authMiddleware` để xác định người dùng đang xem (viewer).
2. Controller gọi `validatePaginationQuery` để xử lý các tham số phân trang.
3. `socialService.getFeed` thực hiện truy vấn danh sách bài đăng từ database, sắp xếp theo thời gian mới nhất (`createdAt: -1`).
4. Service thực hiện truy vấn đồng thời (parallel query) để lấy:
   - Danh sách bài đăng.
   - Tổng số lượng bài đăng.
   - Số lượng like và comment cho từng bài đăng trong trang hiện tại.
   - Trạng thái "đã like" của người dùng hiện tại đối với các bài đăng này.
   - Thông tin profile của các tác giả.
5. Dữ liệu được gộp lại và format thành các item hoàn chỉnh.
6. Trả về response chứa danh sách items và thông tin phân trang.

## Ghi chú
- Hiện tại bảng tin đang hiển thị tất cả các bài đăng trong hệ thống (global scope).
