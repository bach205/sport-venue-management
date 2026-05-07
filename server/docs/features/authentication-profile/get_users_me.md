# GET /api/v1/users/me

## Mục đích
Lấy thông tin user hiện tại và profile tương ứng của chính user đó.

## Input
### Headers
- `Authorization: Bearer <token>`

### Params
- Không có.

### Query
- Không có.

### Body
- Không có.

### Validation quan trọng
- Header `Authorization` là bắt buộc.
- Token phải hợp lệ.
- User trong DB phải tồn tại và không bị `banned`.

## Response
### Success - 200
```json
{
  "message": "User profile fetched successfully.",
  "data": {
    "user": {
      "_id": "6820abc123...",
      "email": "player@example.com",
      "status": "warning",
      "is_verified": true
    },
    "profile": {
      "_id": "6820def456...",
      "user_id": {
        "_id": "6820abc123...",
        "email": "player@example.com",
        "status": "warning",
        "is_verified": true
      },
      "name": "player",
      "age": 24,
      "gender": "male",
      "sport_preference": [
        "badminton"
      ],
      "skill_level": "intermediate",
      "location": "Ho Chi Minh City",
      "reputation_score": 0
    }
  }
}
```

### Error - 401
Thiếu token, token sai, hoặc user trong token không còn tồn tại.
```json
{
  "message": "Unauthorized."
}
```

hoặc
```json
{
  "message": "Invalid or expired token."
}
```

hoặc
```json
{
  "message": "User not found."
}
```

### Error - 403
Tài khoản bị cấm.
```json
{
  "message": "This account has been banned."
}
```

### Error - 404
Không tìm thấy user trong service.
```json
{
  "message": "User not found"
}
```

## Logic flow
1. Route đi qua `authMiddleware`.
2. Middleware verify JWT, nạp user mới nhất từ DB, và chặn user `banned`.
3. Controller gọi `userService.getUserDetails(req.user.id)`.
4. Service lấy user từ collection `users`.
5. Service gọi `getUserProfile`.
6. Nếu profile chưa tồn tại, service tự tạo profile mặc định.
7. Response trả về cả `user` và `profile`.

## Ghi chú
- Route này luôn trả `status` và `is_verified`, nên frontend có thể dùng trực tiếp để hiển thị cảnh báo account.
- Trạng thái `warning` không chặn route.
