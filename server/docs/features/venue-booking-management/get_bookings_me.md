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
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "pages": 1
    }
  }
}
```

### Error - 400
Lỗi query.

### Error - 401
Token thiếu hoặc sai.

## Logic flow
1. Route đi qua `authMiddleware`.
2. Controller validate pagination và status filter.
3. Service expire các booking cũ của user nếu đã quá hạn.
4. Service query `bookings` theo `user_id` và filter `status` nếu có.
5. Service nạp thêm `venue`, `payment`, và refund mới nhất cho từng booking.
6. Response trả về danh sách booking đã format sẵn cho frontend.

## Ghi chú
- Route này không trả thông tin requester hoặc owner vì người gọi là chính user đặt sân.
