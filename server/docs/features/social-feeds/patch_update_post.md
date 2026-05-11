# PATCH /social/posts/:postId

## Mục đích
Cập nhật nội dung của một bài đăng hiện có. Chỉ người sở hữu bài đăng mới có quyền thực hiện.

## Input
### Headers
- `Authorization: Bearer <token>`

### Params
- `postId`: ID của bài đăng cần cập nhật.

### Body
```json
{
  "content": "Nội dung bài đăng đã được chỉnh sửa."
}
```

### Điều kiện validation quan trọng
- `postId`: Phải là một ObjectId hợp lệ.
- `content`: Không được để trống (nếu có gửi lên), độ dài tối đa 2000 ký tự.

## Response
### Success - 200 OK
Trả về thông tin bài đăng sau khi cập nhật.
```json
{
  "message": "Post updated successfully.",
  "data": {
    "id": "60d5ec18603102197485457a",
    "content": "Nội dung bài đăng đã được chỉnh sửa.",
    "author": { ... },
    "updatedAt": "2026-05-11T16:10:00.000Z",
    ...
  }
}
```

### Error - 403 Forbidden
Trả về khi người dùng cố gắng sửa bài đăng của người khác.
```json
{
  "message": "You can only update your own posts."
}
```

### Error - 404 Not Found
Trả về khi không tìm thấy bài đăng với ID đã cung cấp.

## Logic flow
1. Xác thực người dùng qua middleware.
2. Kiểm tra tính hợp lệ của `postId` và dữ liệu body.
3. Tìm bài đăng trong database. Nếu không thấy, trả lỗi 404.
4. Kiểm tra quyền sở hữu (`post.user_id` so với `req.user.id`). Nếu không khớp, trả lỗi 403.
5. Cập nhật các trường dữ liệu được yêu cầu.
6. Lưu bài đăng và trả về dữ liệu đã được format lại.

## Ghi chú
- Trường `updatedAt` sẽ tự động được cập nhật thời gian hiện tại.
