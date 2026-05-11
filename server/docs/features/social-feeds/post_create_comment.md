# POST /social/posts/:postId/comments

## Mục đích
Thêm một bình luận mới vào bài đăng.

## Input
### Headers
- `Authorization: Bearer <token>`

### Params
- `postId`: ID của bài đăng muốn bình luận.

### Body
```json
{
  "content": "Bình luận của tôi."
}
```

## Response
### Success - 201 Created
Trả về thông tin chi tiết của bình luận vừa tạo.
```json
{
  "message": "Comment created successfully.",
  "data": {
    "id": "60d5ec186031021974854580",
    "postId": "60d5ec18603102197485457a",
    "content": "Bình luận của tôi.",
    "author": {
      "id": "...",
      "email": "...",
      "name": "..."
    },
    "createdAt": "...",
    "updatedAt": "...",
    "isOwner": true
  }
}
```

## Logic flow
1. Xác thực người dùng.
2. Kiểm tra bài đăng mục tiêu có tồn tại hay không.
3. Validate nội dung bình luận (`content` không trống, tối đa 2000 ký tự).
4. Lưu bình luận vào collection `comments`.
5. Format dữ liệu bình luận (bao gồm thông tin tác giả từ profile) và trả về.
