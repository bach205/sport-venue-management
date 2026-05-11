# DELETE /social/posts/:postId/like

## Mục đích
Người dùng hủy bỏ hành động "Like" đối với một bài đăng.

## Input
### Headers
- `Authorization: Bearer <token>`

### Params
- `postId`: ID của bài đăng muốn bỏ like.

## Response
### Success - 200 OK
Trả về thông tin bài đăng sau khi đã bỏ like.
```json
{
  "message": "Post unliked successfully.",
  "data": {
    "id": "...",
    "likeCount": 10,
    "hasLiked": false,
    ...
  }
}
```

### Error - 400 Bad Request
Trả về khi người dùng chưa like bài đăng này nhưng lại gửi yêu cầu unlike.
```json
{
  "message": "Post is not liked yet."
}
```

## Logic flow
1. Xác thực người dùng.
2. Kiểm tra sự tồn tại của bài đăng.
3. Tìm và xóa bản ghi trong collection `likes` tương ứng với `postId` và `userId`.
4. Nếu không tìm thấy bản ghi nào để xóa, trả lỗi 400.
5. Trả về thông tin bài đăng đã cập nhật.
