# POST /social/posts/:postId/like

## Mục đích
Người dùng thực hiện hành động "Like" một bài đăng.

## Input
### Headers
- `Authorization: Bearer <token>`

### Params
- `postId`: ID của bài đăng muốn like.

## Response
### Success - 200 OK
Trả về thông tin bài đăng sau khi đã được like (cập nhật `likeCount` và `hasLiked`).
```json
{
  "message": "Post liked successfully.",
  "data": {
    "id": "...",
    "likeCount": 11,
    "hasLiked": true,
    ...
  }
}
```

### Error - 400 Bad Request
Trả về khi người dùng cố gắng like một bài đăng mà họ đã like trước đó.
```json
{
  "message": "Post already liked."
}
```

## Logic flow
1. Xác thực người dùng.
2. Kiểm tra bài đăng có tồn tại hay không.
3. Kiểm tra xem người dùng đã like bài đăng này chưa (truy vấn collection `likes`).
4. Nếu chưa, tạo một bản ghi like mới.
5. Nếu đã like rồi (hoặc xảy ra lỗi duplicate key từ database), trả về lỗi 400.
6. Lấy lại thông tin bài đăng đã được format mới nhất và trả về.
