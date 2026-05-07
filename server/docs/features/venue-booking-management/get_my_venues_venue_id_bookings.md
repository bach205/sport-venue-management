# GET /api/v1/my-venues/:venueId/bookings

## Mục đích
Cho owner xem danh sách booking của một sân, có thể lọc theo ngày và status.

## Input
### Headers
- `Authorization: Bearer <token>`

### Params
- `venueId`: id của sân.

### Query
- `page`: số trang, mặc định `1`.
- `limit`: số phần tử mỗi trang, mặc định `20`, tối đa `100`.
- `date`: lọc theo ngày `YYYY-MM-DD`.
- `status`: lọc theo status booking.

### Body
- Không có.

### Validation quan trọng
- `venueId` phải là ObjectId hợp lệ.
- `date` nếu có phải đúng định dạng `YYYY-MM-DD`.
- `status` nếu có phải nằm trong danh sách status booking hợp lệ.
- Chỉ owner của sân mới xem được dữ liệu.

## Response
### Success - 200
```json
{
  "message": "Venue bookings fetched successfully.",
  "data": {
    "venue": {
      "id": "6820venue123...",
      "name": "Central Court"
    },
    "items": [
      {
        "id": "6820booking123...",
        "status": "confirmed",
        "slot": {
          "date": "2026-05-11",
          "startTime": "08:00",
          "endTime": "09:00"
        },
        "user": {
          "id": "6820user123...",
          "email": "player@example.com",
          "name": "player"
        },
        "payment": {
          "id": "6820payment123...",
          "status": "paid"
        }
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
Lỗi query hoặc params.

### Error - 404
Không tìm thấy sân thuộc owner hiện tại.

## Logic flow
1. Route đi qua `authMiddleware` và `requireRole("owner")`.
2. Controller validate `venueId` và query.
3. Service kiểm tra venue thuộc owner hiện tại.
4. Service expire các booking cũ của sân nếu đã quá hạn.
5. Service query bookings theo `venue_id`, `date`, và `status` nếu có.
6. Service nạp thêm venue, payment, refund mới nhất, và thông tin user đặt sân.
7. Response trả về danh sách đã format cho dashboard owner.

## Ghi chú
- Route này là danh sách booking tổng quát. Refund requests có route riêng để owner lọc nhanh các case cần xử lý.
