# PATCH /api/v1/my-venues/refund-requests/:refundId

## Mục đích
Cho owner approve hoặc reject một manual refund request.

## Input
### Headers
- `Authorization: Bearer <token>`
- `Content-Type: application/json`

### Params
- `refundId`: id của refund request.

### Query
- Không có.

### Body
```json
{
  "action": "approve",
  "note": "approved by owner"
}
```

### Validation quan trọng
- `refundId` phải là ObjectId hợp lệ.
- `action` là bắt buộc và chỉ nhận `approve` hoặc `reject`.
- `note` không vượt quá `500` ký tự.
- Chỉ owner của venue chứa booking đó mới xử lý được request.
- Chỉ refund có status `pending_manual` mới được xử lý.

## Response
### Success - 200
Approve:
```json
{
  "message": "Refund request processed successfully.",
  "data": {
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
      "status": "completed"
    }
  }
}
```

Reject:
```json
{
  "message": "Refund request processed successfully.",
  "data": {
    "booking": {
      "id": "6820booking123...",
      "status": "confirmed"
    },
    "refund": {
      "id": "6820refund123...",
      "status": "rejected"
    }
  }
}
```

### Error - 400
Refund không còn ở trạng thái `pending_manual`.
```json
{
  "message": "Only pending manual refund requests can be processed."
}
```

### Error - 404
Không tìm thấy refund request hoặc venue không thuộc owner hiện tại.

## Logic flow
1. Route đi qua `authMiddleware` và `requireRole("owner")`.
2. Controller validate `refundId` và body.
3. Service lấy refund, booking, payment, và venue tương ứng.
4. Service kiểm tra owner hiện tại có sở hữu venue đó hay không.
5. Service chỉ cho xử lý khi refund đang là `pending_manual`.
6. Nếu `action=approve`:
7. Service chuyển booking sang `refund_processing`, payment sang `refund_pending`, refund sang `approved`.
8. Sau đó service hoàn tất refund bằng cách cập nhật booking `refunded`, payment `refunded`, refund `completed`.
9. Nếu `action=reject`, service cập nhật refund `rejected`, giữ booking ở `confirmed`.

## Ghi chú
- Khi owner approve, slot sẽ mở lại tự động vì booking không còn là booking active.
