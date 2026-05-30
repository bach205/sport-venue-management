# POST /api/v1/bookings/holds

## Mục đích
Giữ chỗ tạm thời cho một khoảng thời gian trước khi thanh toán. Backend mở rộng khoảng `start_time -> end_time` thành nhiều `booking_items` nếu khoảng này bao phủ nhiều slot liên tiếp.

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
  "end_time": "10:00"
}
```

### Validation quan trọng
- `venue_id` là bắt buộc và phải là ObjectId hợp lệ.
- `date` phải đúng định dạng `YYYY-MM-DD`.
- `start_time` và `end_time` phải đúng định dạng `HH:mm`.
- `end_time` phải lớn hơn `start_time`.
- Khoảng thời gian phải khớp với các slot được sinh từ `weekly_schedule`.
- Khoảng thời gian phải bao phủ các slot liên tiếp, không được có khoảng hở giữa chừng.
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
      "amount": 500000,
      "slotCount": 2,
      "holdExpiresAt": "2026-05-11T08:05:00.000Z",
      "slot": {
        "date": "2026-05-11",
        "startTime": "08:00",
        "endTime": "10:00"
      },
      "slots": [
        {
          "date": "2026-05-11",
          "startTime": "08:00",
          "endTime": "09:00"
        },
        {
          "date": "2026-05-11",
          "startTime": "09:00",
          "endTime": "10:00"
        }
      ]
    },
    "payment": null
  }
}
```

Nếu chính user đó đã có hold hoặc payment pending còn hiệu lực cho đúng khoảng này, route trả lại booking/payment cũ.

### Error - 400
Khoảng thời gian không hợp lệ hoặc không còn trống.
```json
{
  "message": "This slot is no longer available."
}
```

hoặc
```json
{
  "message": "The selected time range must align with generated venue slots."
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
2. Controller validate payload.
3. Service expire các booking quá hạn của ngày đó.
4. Service kiểm tra sân tồn tại.
5. Service mở rộng khoảng `start_time/end_time` thành các slot con từ `weekly_schedule`.
6. Service kiểm tra từng slot con có bị owner đánh dấu `unavailable` hay không.
7. Service kiểm tra từng slot con có `booking_item` active nào khác hay không.
8. Nếu khoảng này trùng với booking active của chính user và booking còn ở `hold` hoặc `payment_pending`, service gia hạn hold và trả lại booking cũ.
9. Nếu hợp lệ, service tạo booking cha với `slotCount`, tổng `amount`, và `hold_expires_at`.
10. Service tạo `booking_items` cho từng slot con thuộc khoảng đã chọn.
11. Unique index trên `booking_items` chặn double booking ở cấp từng slot con.

## Ghi chú
- `slot` là khoảng tổng quát của booking.
- `slots` là danh sách slot con thực tế.
- Route chưa tạo payment. Payment được tạo ở route riêng.
