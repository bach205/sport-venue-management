# GET /api/v1/bookings/me/:bookingId

## Mục đích
Lấy chi tiết một booking cụ thể của user hiện tại.

## Input
### Headers
- `Authorization: Bearer <token>`

### Params
- `bookingId`: id của booking.

### Query
- Không có.

### Body
- Không có.

### Validation quan trọng
- `bookingId` phải là ObjectId hợp lệ.
- Chỉ chủ booking mới xem được dữ liệu.

## Response
### Success - 200
```json
{
  "message": "Booking fetched successfully.",
  "data": {
    "id": "6820booking123...",
    "status": "confirmed",
    "amount": 250000,
    "slot": {
      "date": "2026-05-11",
      "startTime": "08:00",
      "endTime": "09:00"
    },
    "venue": {
      "id": "6820venue123...",
      "name": "Central Court"
    },
    "payment": {
      "id": "6820payment123...",
      "status": "paid"
    },
    "refund": null
  }
}
```

### Error - 400
`bookingId` không hợp lệ.

### Error - 404
Không tìm thấy booking của user hiện tại.
```json
{
  "message": "Booking not found."
}
```

## Logic flow
1. Route đi qua `authMiddleware`.
2. Controller validate `bookingId`.
3. Service expire booking nếu booking đó đã quá hạn.
4. Service chỉ tìm booking theo cặp `_id + user_id`.
5. Service nạp thêm `venue`, `payment`, refund mới nhất, và user summary.
6. Response trả về một object booking chi tiết.

## Ghi chú
- Route này phù hợp cho màn detail hoặc màn theo dõi trạng thái refund của user.
