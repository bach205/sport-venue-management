# GET /api/v1/bookings/me

## Mục đích
Lấy lịch sử booking của user hiện tại.

## Input
### Headers
- `Authorization: Bearer <token>`

### Params
- Không có.

### Query
- `page`: số trang, mặc định `1`.
- `limit`: số phần tử mỗi trang, mặc định `20`, tối đa `100`.
- `status`: lọc theo status booking.

### Body
- Không có.

### Validation quan trọng
- `page` và `limit` phải hợp lệ.
- `status` chỉ nhận một trong các giá trị:
  - `hold`
  - `payment_pending`
  - `confirmed`
  - `refund_processing`
  - `refunded`
  - `refund_rejected`
  - `expired`

## Response
### Success - 200
```json
{
  "message": "Booking history fetched successfully.",
  "data": {
    "items": [
      {
        "id": "6820booking123...",
        "status": "confirmed",
        "amount": 500000,
        "slotCount": 2,
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
        ],
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
    ]
  }
}
```

## Logic flow
1. Route đi qua `authMiddleware`.
2. Controller validate pagination và status filter.
3. Service expire các booking quá hạn của user nếu cần.
4. Service query `bookings` theo `user_id`.
5. Service nạp thêm `booking_items`, `venue`, `payment`, và refund mới nhất cho từng booking.
6. Response trả về cả khoảng tổng quát `slot` và danh sách slot con `slots`.

## Ghi chú
- `slot` là khoảng tổng quát.
- `slots` là các slot con thực tế dùng để khóa lịch.
