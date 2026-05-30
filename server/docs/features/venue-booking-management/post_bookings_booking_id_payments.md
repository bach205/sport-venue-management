# POST /api/v1/bookings/:bookingId/payments

## Mục đích
Tạo payment record cho booking đang ở trạng thái `hold` và chuyển booking sang `payment_pending`. Một payment vẫn gắn với một booking cha, nhưng booking đó có thể chứa nhiều `booking_items`.

## Input
### Headers
- `Authorization: Bearer <token>`
- `Content-Type: application/json`

### Params
- `bookingId`: id của booking.

### Query
- Không có.

### Body
```json
{
  "provider": "stub",
  "provider_reference": "ORDER-001"
}
```

### Validation quan trọng
- `bookingId` phải là ObjectId hợp lệ.
- `provider` không vượt quá `50` ký tự.
- `provider_reference` không vượt quá `120` ký tự.
- Chỉ chủ booking mới được tạo payment.
- Booking phải đang ở trạng thái `hold` và chưa quá hạn.
- `amount` của payment bằng tổng tiền của toàn bộ slot con trong booking.

## Response
### Success - 201
```json
{
  "message": "Payment created successfully.",
  "data": {
    "booking": {
      "id": "6820booking123...",
      "status": "payment_pending",
      "slotCount": 2
    },
    "payment": {
      "id": "6820payment123...",
      "bookingId": "6820booking123...",
      "amount": 500000,
      "provider": "stub",
      "providerReference": "ORDER-001",
      "status": "pending"
    }
  }
}
```

### Error - 400
Booking sai trạng thái hoặc hold đã hết hạn.

### Error - 403
Không phải chủ booking.

### Error - 404
Không tìm thấy booking.

## Logic flow
1. Route đi qua `authMiddleware`.
2. Controller validate `bookingId` và body.
3. Service expire booking nếu hold đã hết hạn.
4. Service lấy booking và kiểm tra quyền sở hữu.
5. Nếu booking đang là `hold`, service cập nhật booking sang `payment_pending`.
6. Service đồng bộ toàn bộ `booking_items` của booking sang `payment_pending`.
7. Service tạo `payment` mới với status `pending`.
8. Response trả về booking cha và payment.

## Ghi chú
- Frontend chỉ cần thanh toán một lần cho booking cha, dù booking đó có nhiều slot con.
