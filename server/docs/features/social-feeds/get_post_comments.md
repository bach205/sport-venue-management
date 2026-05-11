# GET /social/posts/:postId/comments

## Mục đích
Lấy danh sách các bình luận của một bài đăng cụ thể.

## Input
### Headers
- `Authorization: Bearer <token>`

### Params
- `postId`: ID của bài đăng cần lấy bình luận.

### Query Params
- `page`: Số trang (mặc định: 1).
- `limit`: Số lượng bình luận mỗi trang (mặc định: 20).

## Response
### Success - 200 OK
```json
{
  "message": "Comments fetched successfully.",
  "data": {
    "items": [
      {
        "id": "...",
        "postId": "...",
        "content": "...",
        "author": { ... },
        "createdAt": "...",
        "updatedAt": "...",
        "isOwner": false
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 5,
      "pages": 1
    }
  }
}
```

## Logic flow
1. Xác thực người dùng.
2. Kiểm tra bài đăng tồn tại.
3. Truy vấn danh sách bình luận từ collection `comments` theo `post_id`, sắp xếp mới nhất lên đầu.
4. Lấy thông tin profile của tất cả tác giả các bình luận này để format dữ liệu.
5. Trả về danh sách bình luận đã format kèm thông tin phân trang.
