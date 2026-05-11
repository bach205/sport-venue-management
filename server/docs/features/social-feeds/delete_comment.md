# DELETE /social/comments/:commentId

## Mục đích
Xóa một bình luận.

## Input
### Headers
- `Authorization: Bearer <token>`

### Params
- `commentId`: ID của bình luận cần xóa.

## Response
### Success - 200 OK
```json
{
  "message": "Comment deleted successfully."
}
```

## Logic flow
1. Xác thực người dùng.
2. Kiểm tra bình luận tồn tại.
3. Kiểm tra quyền sở hữu bình luận.
4. Xóa bình luận khỏi collection `comments`.
5. Trả về thông báo thành công.
