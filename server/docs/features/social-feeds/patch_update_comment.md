# PATCH /social/comments/:commentId

## Mục đích
Chỉnh sửa nội dung một bình luận đã đăng.

## Input
### Headers
- `Authorization: Bearer <token>`

### Params
- `commentId`: ID của bình luận cần sửa.

### Body
```json
{
  "content": "Nội dung bình luận mới."
}
```

## Response
### Success - 200 OK
Trả về thông tin bình luận sau khi cập nhật.

## Logic flow
1. Xác thực người dùng.
2. Kiểm tra `commentId` hợp lệ và bình luận có tồn tại.
3. Kiểm tra quyền sở hữu bình luận.
4. Cập nhật nội dung và lưu vào database.
5. Trả về dữ liệu bình luận đã format.
