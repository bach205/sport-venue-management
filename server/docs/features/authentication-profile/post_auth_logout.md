# POST /api/v1/auth/logout

## Mục đích
Đăng xuất user hiện tại theo mô hình stateless JWT. Backend không hủy token trong database. Frontend nhận response thành công rồi tự xóa token đang giữ.

## Input
### Headers
- `Authorization: Bearer <token>`

### Params
- Không có.

### Query
- Không có.

### Body
- Không yêu cầu body.

### Validation quan trọng
- Header `Authorization` phải có dạng `Bearer <token>`.
- Token phải là JWT hợp lệ.
- User trong DB phải còn tồn tại và không ở trạng thái `banned`.

## Response
### Success - 200
```json
{
  "message": "Logout successful."
}
```

### Error - 401
Thiếu header hoặc token sai định dạng.
```json
{
  "message": "Unauthorized."
}
```

Token không hợp lệ hoặc hết hạn.
```json
{
  "message": "Invalid or expired token."
}
```

User trong token không còn tồn tại.
```json
{
  "message": "User not found."
}
```

### Error - 403
User bị cấm.
```json
{
  "message": "This account has been banned."
}
```

## Logic flow
1. Route đi qua `authMiddleware`.
2. Middleware đọc Bearer token từ header.
3. Middleware verify JWT bằng `verifyToken`.
4. Middleware tìm user trong DB theo `payload.id`.
5. Nếu user không tồn tại, middleware trả `401`.
6. Nếu user có `status=banned`, middleware trả `403`.
7. Nếu hợp lệ, middleware gắn `req.user`.
8. Controller chỉ trả message đăng xuất thành công.

## Ghi chú
- Route này không xóa session trong DB vì hệ thống đang dùng JWT stateless.
- Nếu sau này cần revoke token theo thiết bị hoặc theo phiên, logic của route này phải thay đổi.
