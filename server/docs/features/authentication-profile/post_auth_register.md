# POST /api/v1/auth/register

## Mục đích
Tạo tài khoản bằng email và password. Route này cũng tạo profile mặc định, tạo mã xác thực email, và gửi email xác thực tới người dùng.

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
- `password` phải có ít nhất 6 ký tự.
- Email được chuẩn hóa về lowercase trước khi lưu và trước khi kiểm tra trùng.

## Response
### Success - 201
Trường hợp email chưa tồn tại.
```json
{
  "message": "Registration successful. Please verify your email before logging in.",
  "data": {
    "user": {
      "_id": "6820abc123...",
      "email": "player@example.com",
      "status": "active",
      "is_verified": false,
      "createdAt": "2026-05-07T10:00:00.000Z",
      "updatedAt": "2026-05-07T10:00:00.000Z"
    }
  }
}
```

Trường hợp email đã đăng ký nhưng chưa xác thực và mã cũ đã hết hạn.
```json
{
  "message": "Your verification email had expired. A new verification email has been sent.",
  "data": {
    "user": {
      "_id": "6820abc123...",
      "email": "player@example.com",
      "status": "active",
      "is_verified": false
    }
  }
}
```

### Error - 400
Email đã tồn tại và đã xác thực.
```json
{
  "message": "User already exists."
}
```

Email đã tồn tại, chưa xác thực, và mã xác thực hiện tại vẫn còn hạn.
```json
{
  "message": "This email is already registered. Please check your inbox to verify your account."
}
```

Lỗi validation.
```json
{
  "errors": [
    "Email is required.",
    "Password must be at least 6 characters."
  ]
}
```

### Error - 500
Lỗi trong quá trình tạo user, tạo profile, tạo token, hoặc gửi mail.
```json
{
  "message": "Could not complete registration."
}
```

## Logic flow
1. Route đi thẳng vào controller, không qua `authMiddleware`.
2. Controller gọi `validateRegisterPayload`.
3. Service chuẩn hóa email về lowercase.
4. Service kiểm tra user theo email.
5. Nếu user đã tồn tại và `is_verified=true`, route trả lỗi `User already exists.`
6. Nếu user đã tồn tại và `is_verified=false`, service tìm mã xác thực chưa dùng mới nhất.
7. Nếu mã cũ còn hạn, route không gửi lại mail và trả thông báo yêu cầu người dùng kiểm tra inbox.
8. Nếu mã cũ đã hết hạn, service xóa các mã chưa dùng cũ, tạo mã mới, rồi gửi lại email xác thực.
9. Nếu email chưa tồn tại, service tạo `users`, tạo `profiles` mặc định, tạo `user_roles` mặc định (role là `user`), tạo mã xác thực email, rồi gửi mail.
10. Nếu có lỗi sau khi user đã được tạo, service dọn dữ liệu vừa tạo bằng cách xóa token xác thực, xóa profile, và xóa user.

## Ghi chú
- Route này không trả JWT. Người dùng chỉ được login sau khi xác thực email thành công.
- Link xác thực trong email dùng `FRONTEND_URL/verify-email?token=...`.
- Side effect của route là gửi email thật qua SMTP và tạo dữ liệu trong `users`, `profiles`, `user_roles`, `email_verification_tokens`.
