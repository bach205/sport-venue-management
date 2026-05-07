# POST /api/v1/bookings/holds

## Mục đích
Giữ chỗ tạm thời cho một slot trước khi thanh toán.

## Input
### Headers
- `Authorization: Bearer <token>`
- `Content-Type: application/json`

### Params
- Không có.

### Query
- Không có.

### Body
```json
{
  "venue_id": "6820abc123...",
  "date": "2026-05-11",
  "start_time": "08:00",
  "end_time": "09:00"
}
```

### Validation quan trọng
- `venue_id` là bắt buộc và phải là ObjectId hợp lệ.
- `date` phải đúng định dạng `YYYY-MM-DD`.
- `start_time` và `end_time` phải đúng định dạng `HH:mm`.
- `end_time` phải lớn hơn `start_time`.
- Token phải hợp lệ, user không bị `banned`.

## Response
### Success - 201
```json
{
  "message": "Booking hold created successfully.",
  "data": {
    "booking": {
      "id": "6820booking123...",
      "status": "hold",
      "amount": 250000,
      "holdExpiresAt": "2026-05-11T08:05:00.000Z",
      "slot": {
        "date": "2026-05-11",
        "startTime": "08:00",
        "endTime": "09:00"
      }
    }
  }
}
```

### Error - 400
Slot không hợp lệ hoặc không còn trống.
```json
{
  "message": "This slot is no longer available."
}
```

hoặc
```json
{
  "message": "This slot is unavailable."
}
```

### Error - 401
Token thiếu hoặc sai.

### Error - 404
Không tìm thấy sân.
```json
{
  "message": "Venue not found."
}
```

## Logic flow
1. Route đi qua `authMiddleware`.
2. Middleware verify JWT, nạp user, roles, và chặn user `banned`.
3. Controller validate payload.
4. Service expire các booking cũ của slot đó nếu đã quá hạn.
5. Service kiểm tra sân tồn tại.
6. Service kiểm tra slot có thuộc `weekly_schedule` của sân hay không.
7. Service kiểm tra slot có bị owner đánh dấu `unavailable` hay không.
8. Service kiểm tra slot có booking active nào khác hay không.
9. Nếu hợp lệ, service tạo booking mới với status `hold` và `hold_expires_at = now + 5 phút`.
10. Nếu bị race condition, unique index trên booking sẽ chặn double booking.

## Ghi chú
- Một booking chỉ gắn với một slot.
- Route chưa tạo payment. Payment được tạo ở route riêng.
