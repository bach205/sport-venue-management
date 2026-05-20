# POST /social/posts

## Mục đích
Tạo một bài đăng mới trên bảng tin mạng xã hội.

## Input
### Headers
- `Authorization: Bearer <token>`

### Body
```json
{
  "content": "Nội dung bài đăng của bạn ở đây."
}
```

### Điều kiện validation quan trọng
- `content`: Bắt buộc, không được để trống, độ dài tối đa 2000 ký tự.

## Response
### Success - 201 Created
Trả về thông tin chi tiết của bài đăng vừa tạo, bao gồm thông tin tác giả và trạng thái tương tác.
```json
{
  "message": "Post created successfully.",
  "data": {
    "id": "60d5ec18603102197485457a",
    "content": "Nội dung bài đăng của bạn ở đây.",
    "author": {
      "id": "60d5ec186031021974854570",
      "email": "user@example.com",
      "name": "Nguyễn Văn A"
    },
    "createdAt": "2026-05-11T16:00:00.000Z",
    "updatedAt": "2026-05-11T16:00:00.000Z",
    "likeCount": 0,
    "commentCount": 0,
    "isOwner": true,
    "hasLiked": false
  }
}
```

### Error - 400 Bad Request
```json
{
  "errors": ["Content is required."]
}
```

## Logic flow
1. Request đi qua `authMiddleware` để xác thực người dùng.
2. Controller gọi `validateCreatePostPayload` để kiểm tra dữ liệu đầu vào.
3. Nếu dữ liệu hợp lệ, `socialService.createPost` được gọi.
4. Service lưu bài đăng mới vào database (collection `posts`).
5. Service sau đó truy vấn thông tin bổ sung (profile tác giả, số lượng like, số lượng comment) để format dữ liệu trả về.
6. Trả về response thành công kèm object bài đăng đã được format.

## Ghi chú
- Bài đăng sau khi tạo sẽ xuất hiện ngay lập tức trên bảng tin toàn cầu.
