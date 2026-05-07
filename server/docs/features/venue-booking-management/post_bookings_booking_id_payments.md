# POST /api/v1/bookings/:bookingId/payments

## Mục đích
Tạo payment record cho booking đang ở trạng thái `hold` và chuyển booking sang `payment_pending`.

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

## Response
### Success - 201
```json
{
  "message": "Payment created successfully.",
  "data": {
    "booking": {
      "id": "6820booking123...",
      "status": "payment_pending"
    },
    "payment": {
      "id": "6820payment123...",
      "bookingId": "6820booking123...",
      "amount": 250000,
      "provider": "stub",
      "providerReference": "ORDER-001",
      "status": "pending"
    }
  }
}
```

### Error - 400
Booking sai trạng thái hoặc đã có payment.
```json
{
  "message": "Payment can only be created for a booking that is on hold."
}
```

hoặc
```json
{
  "message": "A payment already exists for this booking."
}
```

### Error - 403
Không phải chủ booking.

### Error - 404
Không tìm thấy booking.

## Logic flow
1. Route đi qua `authMiddleware`.
2. Controller validate `bookingId` và body.
3. Service expire booking nếu hold đã hết hạn.
4. Service lấy booking và kiểm tra quyền sở hữu.
5. Service chỉ cho đi tiếp nếu booking đang là `hold`.
6. Nếu hold đã hết hạn, service chuyển booking sang `expired` và trả lỗi.
7. Service kiểm tra booking đã có payment hay chưa.
8. Service cập nhật booking sang `payment_pending`.
9. Service tạo `payment` mới với status `pending`.

## Ghi chú
- Route này chỉ tạo payment record nội bộ. Route chưa xác nhận thanh toán thành công.
