# POST /api/v1/payments/:paymentId/confirm

## Mục đích
Xác nhận payment thành công trong flow gateway stub hiện tại. Route chuyển payment sang `paid` và booking sang `confirmed`.

## Input
### Headers
- `Authorization: Bearer <token>`
- `Content-Type: application/json`

### Params
- `paymentId`: id của payment.

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
- `paymentId` phải là ObjectId hợp lệ.
- Chỉ chủ booking mới được xác nhận payment.
- Booking phải đang ở trạng thái `payment_pending`.
- Payment phải đang ở trạng thái `pending`.
- Hold của booking chưa được hết hạn tại thời điểm xác nhận.

## Response
### Success - 200
```json
{
  "message": "Payment confirmed successfully.",
  "data": {
    "booking": {
      "id": "6820booking123...",
      "status": "confirmed"
    },
    "payment": {
      "id": "6820payment123...",
      "status": "paid",
      "paidAt": "2026-05-11T08:02:00.000Z"
    }
  }
}
```

### Error - 400
Payment hoặc booking sai trạng thái.
```json
{
  "message": "This payment can no longer be confirmed for the current booking state."
}
```

hoặc
```json
{
  "message": "Payment is not pending anymore."
}
```

### Error - 403
Không phải chủ booking.

### Error - 404
Không tìm thấy payment hoặc booking liên quan.

## Logic flow
1. Route đi qua `authMiddleware`.
2. Controller validate `paymentId` và body.
3. Service lấy payment, rồi lấy booking tương ứng.
4. Service kiểm tra quyền sở hữu booking.
5. Service expire booking nếu hold đã hết hạn.
6. Service kiểm tra booking còn là `payment_pending` và payment còn là `pending`.
7. Nếu booking đã quá hạn, service cập nhật booking `expired`, payment `failed`, rồi trả lỗi.
8. Nếu hợp lệ, service cập nhật payment sang `paid`, set `paid_at`, và cập nhật booking sang `confirmed`.

## Ghi chú
- Đây là route xác nhận nội bộ. Sau này có thể thay bằng callback từ cổng thanh toán mà vẫn giữ nguyên state machine.
