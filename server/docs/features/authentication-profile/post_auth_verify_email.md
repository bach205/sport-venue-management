# POST /api/v1/auth/verify-email

## Mục đích
Xác thực email bằng token mà frontend nhận từ link trong email. Route này bật `is_verified=true` cho user nếu token hợp lệ.

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
  "token": "raw-verification-token"
}
```

### Validation quan trọng
- `token` là bắt buộc.
- Token gửi lên là token thô từ query string của frontend.

## Response
### Success - 200
```json
{
  "message": "Email verified successfully.",
  "data": {
    "user": {
      "_id": "6820abc123...",
      "email": "player@example.com",
      "status": "active",
      "is_verified": true
    }
  }
}
```

### Error - 400
Token không hợp lệ.
```json
{
  "message": "Verification token is invalid."
}
```

Token đã dùng.
```json
{
  "message": "Verification token has already been used."
}
```

Token hết hạn.
```json
{
  "message": "Verification token has expired."
}
```

Lỗi validation.
```json
{
  "errors": [
    "Verification token is required."
  ]
}
```

### Error - 404
User gắn với token không còn tồn tại.
```json
{
  "message": "User not found."
}
```

## Logic flow
1. Route đi thẳng vào controller, không qua `authMiddleware`.
2. Controller validate body bằng `validateVerifyEmailPayload`.
3. Service băm token bằng SHA-256.
4. Service tìm document trong `email_verification_tokens` theo `token_hash`.
5. Nếu không tìm thấy token, route trả lỗi token không hợp lệ.
6. Nếu token đã có `used_at`, route trả lỗi token đã dùng.
7. Nếu `expires_at` nhỏ hơn thời điểm hiện tại, route trả lỗi token hết hạn.
8. Service lấy user theo `user_id` trong document token.
9. Service cập nhật `user.is_verified=true`.
10. Service cập nhật `used_at` của token để token không thể dùng lại.

## Ghi chú
- Route này không nhận token từ query string trực tiếp. Frontend phải lấy token từ URL rồi gửi vào body.
- Route này không trả JWT. Sau khi verify xong, người dùng vẫn cần gọi login.
