# GET /api/v1/payments/:paymentId

## Mục đích
Lấy trạng thái payment hiện tại để client kiểm tra xem giao dịch đã `paid` hay vẫn còn `pending`/`failed`.

## Input
### Headers
- `Authorization: Bearer <token>`

### Params
- `paymentId`: id của payment.

### Query
- Không có.

### Body
- Không có.

### Validation quan trọng
- `paymentId` phải là ObjectId hợp lệ.
- Chỉ chủ booking mới được xem payment của chính mình.
- Route sẽ refresh trạng thái hold hết hạn trước khi trả dữ liệu.

## Response
### Success - 200
```json
{
  "message": "Payment status fetched successfully.",
  "data": {
    "booking": {
      "id": "6820booking123...",
      "status": "payment_pending"
    },
    "payment": {
      "id": "6820payment123...",
      "bookingId": "6820booking123...",
      "amount": 250000,
      "provider": "bank",
      "providerReference": "ORDER-001",
      "status": "pending",
      "paidAt": null
    }
  }
}
```

### Error - 403
Không phải chủ booking.

### Error - 404
Không tìm thấy payment.

## Logic flow
1. Route đi qua `authMiddleware`.
2. Controller validate `paymentId`.
3. Service lấy payment và booking liên quan.
4. Service kiểm tra quyền sở hữu booking.
5. Service expire hold cũ nếu đã hết hạn.
6. Service load lại booking/payment mới nhất rồi trả về cho client.

## Ghi chú
- Route này không confirm thanh toán, chỉ dùng để check trạng thái hiện tại.
- Khi payment đã được confirm bởi webhook hoặc route confirm nội bộ, response sẽ trả `payment.status = "paid"` và `booking.status = "confirmed"`.
