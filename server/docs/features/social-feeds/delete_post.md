# DELETE /social/posts/:postId

## Mục đích
Xóa một bài đăng vĩnh viễn khỏi hệ thống.

## Input
### Headers
- `Authorization: Bearer <token>`

### Params
- `postId`: ID của bài đăng cần xóa.

## Response
### Success - 200 OK
```json
{
  "message": "Post deleted successfully."
}
```

## Logic flow
1. Xác thực người dùng.
2. Kiểm tra `postId` hợp lệ.
3. Tìm bài đăng. Nếu không thấy, trả lỗi 404.
4. Kiểm tra quyền sở hữu. Nếu không phải chủ sở hữu, trả lỗi 403.
5. Thực hiện xóa bài đăng đồng thời với tất cả các like và comment liên quan đến bài đăng đó để đảm bảo tính toàn vẹn dữ liệu.
6. Trả về thông báo thành công.

## Ghi chú
- Hành động này không thể hoàn tác. Toàn bộ tương tác (like, comment) của bài đăng cũng sẽ bị xóa mất.
