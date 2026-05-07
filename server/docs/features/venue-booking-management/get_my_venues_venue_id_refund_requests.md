# GET /api/v1/my-venues/:venueId/refund-requests

## Mục đích
Cho owner xem danh sách refund requests của một sân.

## Input
### Headers
- `Authorization: Bearer <token>`

### Params
- `venueId`: id của sân.

### Query
- `page`: số trang, mặc định `1`.
- `limit`: số phần tử mỗi trang, mặc định `20`, tối đa `100`.
- `status`: lọc theo status refund.

### Body
- Không có.

### Validation quan trọng
- `venueId` phải là ObjectId hợp lệ.
- `status` nếu có chỉ nhận:
  - `pending_auto`
  - `pending_manual`
  - `approved`
  - `rejected`
  - `completed`
- Chỉ owner của sân mới xem được dữ liệu.

## Response
### Success - 200
```json
{
  "message": "Venue refund requests fetched successfully.",
  "data": {
    "items": [
      {
        "id": "6820refund123...",
        "type": "manual",
        "status": "pending_manual",
        "note": "Late cancel",
        "booking": {
          "id": "6820booking123...",
          "status": "confirmed"
        },
        "payment": {
          "id": "6820payment123...",
          "status": "paid"
        },
        "requester": {
          "id": "6820user123...",
          "email": "player@example.com",
          "name": "player"
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
3. Service kiểm tra quyền sở hữu venue.
4. Service lấy toàn bộ `booking_id` thuộc venue đó.
5. Service query refunds theo danh sách `booking_id` và `status` nếu có.
6. Service nạp thêm booking, payment, venue, và requester summary.
7. Response trả về danh sách refund request đã format.

## Ghi chú
- Route này không xử lý refund. Route chỉ dùng để liệt kê và lọc request trước khi owner quyết định.
