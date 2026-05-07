# POST /api/v1/auth/login

## Mục đích
Đăng nhập bằng email và password. Route chỉ cho phép đăng nhập khi email đã được xác thực và tài khoản không ở trạng thái `banned`.

## Input
### Headers
- `Content-Type: application/json`

### Params
- Không có.

### Query
- Không có.

### Body
```json
{
  "email": "player@example.com",
  "password": "secret123"
}
```

### Validation quan trọng
- `email` là bắt buộc.
- `password` là bắt buộc.
- Email được chuẩn hóa về lowercase trước khi truy vấn user.

## Response
### Success - 200
```json
{
  "message": "Login successful.",
  "data": {
    "token": "jwt-token",
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
      "sport_preference": [],
      "reputation_score": 0
    }
  }
}
```

### Error - 400
Sai email hoặc password.
```json
{
  "message": "Invalid email or password."
}
```

Lỗi validation.
```json
{
  "errors": [
    "Email is required."
  ]
}
```

### Error - 403
Email chưa xác thực.
```json
{
  "message": "Please verify your email before logging in."
}
```

Tài khoản bị cấm.
```json
{
  "message": "This account has been banned."
}
```

## Logic flow
1. Route đi thẳng vào controller, không qua `authMiddleware`.
2. Controller validate body bằng `validateLoginPayload`.
3. Service tìm user theo email và lấy cả `password_hash`.
4. Nếu không tìm thấy user, route trả lỗi email hoặc password không đúng.
5. Service gọi `comparePassword` trên model user.
6. Nếu password sai, route trả lỗi email hoặc password không đúng.
7. Nếu `is_verified=false`, route chặn đăng nhập.
8. Nếu `status=banned`, route chặn đăng nhập.
9. Nếu hợp lệ, service lấy profile hiện tại của user.
10. Service ký JWT bằng `signToken`.
11. Response trả về `token`, `user`, và `profile`.

## Ghi chú
- `warning` không chặn đăng nhập. Trạng thái này chỉ được trả về để frontend hiển thị cảnh báo.
- Token là JWT stateless. Backend không lưu session.
