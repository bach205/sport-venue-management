# POST /api/v1/bookings/:bookingId/refund

## Mục đích
Tạo refund tự động hoặc refund thủ công cho booking đã thanh toán.

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
  "note": "Need to cancel"
}
```

### Validation quan trọng
- `bookingId` phải là ObjectId hợp lệ.
- `note` không vượt quá `500` ký tự.
- Chỉ chủ booking mới được yêu cầu refund.
- Booking phải ở trạng thái `confirmed`.
- Payment của booking phải ở trạng thái `paid`.

## Response
### Success - 200
Refund tự động trong 5 phút.
```json
{
  "message": "Refund processed successfully.",
  "data": {
    "mode": "auto",
    "booking": {
      "id": "6820booking123...",
      "status": "refunded"
    },
    "payment": {
      "id": "6820payment123...",
      "status": "refunded"
    },
    "refund": {
      "id": "6820refund123...",
      "type": "auto",
      "status": "completed"
    }
  }
}
```

Refund thủ công sau 5 phút.
```json
{
  "message": "Manual refund request created successfully.",
  "data": {
    "mode": "manual",
    "booking": {
      "id": "6820booking123...",
      "status": "confirmed"
    },
    "refund": {
      "id": "6820refund123...",
      "type": "manual",
      "status": "pending_manual"
    }
  }
}
```

### Error - 400
Booking không đủ điều kiện refund hoặc đã có refund request.

### Error - 403
Không phải chủ booking.

### Error - 404
Không tìm thấy booking hoặc payment.

## Logic flow
1. Route đi qua `authMiddleware`.
2. Controller validate `bookingId` và body.
3. Service lấy booking, kiểm tra quyền sở hữu, và chỉ cho refund khi booking đang `confirmed`.
4. Service lấy payment của booking và kiểm tra `status=paid`.
5. Service kiểm tra xem booking đã có refund đang chờ hoặc đã xử lý hay chưa.
6. Nếu thời gian từ `paid_at` đến hiện tại không quá 5 phút:
7. Service chuyển booking sang `refund_processing`, payment sang `refund_pending`.
8. Service tạo `refund` type `auto`, status `pending_auto`.
9. Service hoàn tất refund ngay trong flow hiện tại bằng cách cập nhật payment `refunded`, booking `refunded`, refund `completed`.
10. Nếu đã quá 5 phút, service tạo `refund` type `manual`, status `pending_manual`, và giữ booking ở trạng thái `confirmed`.

## Ghi chú
- Khi refund hoàn tất, slot sẽ tự mở lại vì slot availability chỉ dựa trên booking active.
