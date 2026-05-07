# PUT /api/v1/users/profile

## Mục đích
Cập nhật profile của user hiện tại.

## Input
### Headers
- `Authorization: Bearer <token>`
- `Content-Type: application/json`

### Params
- Không có.

### Query
- Không có.

### Body
Body không bị giới hạn chặt ở controller hiện tại. Các field phổ biến là:
```json
{
  "name": "Player One",
  "age": 24,
  "gender": "male",
  "sport_preference": ["badminton", "football"],
  "skill_level": "intermediate",
  "location": "Ho Chi Minh City"
}
```

### Validation quan trọng
- Route hiện chưa có layer validation riêng cho profile.
- Dữ liệu thực tế vẫn bị ràng buộc bởi schema Mongoose của `Profile`.
- Nếu profile chưa tồn tại, service sẽ tạo profile mới bằng dữ liệu gửi lên.

## Response
### Success - 200
```json
{
  "message": "User profile updated successfully.",
  "data": {
    "_id": "6820def456...",
    "user_id": {
      "_id": "6820abc123...",
      "email": "player@example.com",
      "status": "active",
      "is_verified": true
    },
    "name": "Player One",
    "age": 24,
    "gender": "male",
    "sport_preference": ["badminton", "football"],
    "skill_level": "intermediate",
    "location": "Ho Chi Minh City",
    "reputation_score": 0
  }
}
```

### Error - 400
Lỗi schema hoặc dữ liệu cập nhật không hợp lệ.
```json
{
  "message": "Profile validation error message"
}
```

### Error - 401
Thiếu token, token sai, hoặc user không còn tồn tại.
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

## Logic flow
1. Route đi qua `authMiddleware`.
2. Middleware verify JWT, nạp user từ DB, và chặn user `banned`.
3. Controller gọi `userService.updateUserProfile(req.user.id, req.body)`.
4. Service tìm profile theo `user_id`.
5. Nếu chưa có profile, service tạo profile mới từ dữ liệu gửi lên.
6. Nếu đã có profile, service gán dữ liệu mới vào document hiện tại rồi `save`.
7. Service populate lại `user_id` và trả document profile hoàn chỉnh.

## Ghi chú
- Route này không sửa trực tiếp `email`, `status`, hay `is_verified` trong collection `users`.
- Vì chưa có validation riêng cho profile, khi mở rộng feature nên cân nhắc thêm validator để tránh ghi các field ngoài ý muốn.
