# POST /api/v1/webhooks/payments/sepay

## Mục đích
Nhận webhook chuyển khoản vào từ Sepay, xác thực bằng API key trong header `Authorization`, đối soát payment theo `code/content`, rồi tự động cập nhật payment sang `paid` và booking sang `confirmed` khi giao dịch hợp lệ.

## Input
### Headers
- `Authorization: <SEPAY_API_KEY>` hoặc `Authorization: Bearer <SEPAY_API_KEY>`
- `Content-Type: application/json`

### Body
```json
{
  "id": 92704,
  "gateway": "Vietcombank",
  "transactionDate": "2024-07-02 11:08:33",
  "accountNumber": "1017588888",
  "subAccount": "",
  "code": "SEVN63DC8E5C",
  "content": "SEVN63DC8E5C chuyen tien",
  "transferType": "in",
  "description": "NGUYEN VAN A chuyen tien",
  "transferAmount": 5000000,
  "accumulated": 105000000,
  "referenceCode": "FT24012345678"
}
```

## Validation quan trọng
- `Authorization` phải khớp với `process.env.SEPAY_API_KEY`.
- Ít nhất một trong `code` hoặc `content` phải tồn tại để lấy mã đối soát.
- `transferType` chỉ chấp nhận `in` hoặc `out`.
- `transferAmount` phải là số không âm.
- `transactionDate` nếu có phải là datetime hợp lệ.

## Matching rule
- Backend ưu tiên dùng `code` làm `providerReference`.
- Nếu `code` rỗng, backend lấy token đầu tiên trong `content`.
- Payment Sepay được tạo với `provider = "sepay"` và `providerReference` tự sinh dạng `SEPAYXXXXXXXX`, client phải đưa đúng mã này vào nội dung chuyển khoản.

## Response
### Success - 200
```json
{
  "message": "Sepay webhook processed successfully.",
  "data": {
    "acknowledged": true,
    "booking": {
      "id": "6820booking123...",
      "status": "confirmed"
    },
    "payment": {
      "id": "6820payment123...",
      "provider": "sepay",
      "providerReference": "SEPAYABC12345",
      "status": "paid"
    }
  }
}
```

### Success - 200 ignored
```json
{
  "message": "Sepay webhook processed successfully.",
  "data": {
    "acknowledged": true,
    "ignored": true,
    "reason": "Transferred amount is lower than the payment amount."
  }
}
```

## Logic flow
1. Controller xác thực `Authorization` với `SEPAY_API_KEY`.
2. Controller validate payload Sepay.
3. Service lấy `providerReference` từ `code` hoặc token đầu trong `content`.
4. Service tìm `payment` với `provider = "sepay"` và `provider_reference` tương ứng.
5. Nếu giao dịch không phải `transferType = "in"` thì webhook được acknowledge nhưng bị ignore.
6. Nếu số tiền nhận nhỏ hơn `payment.amount` thì webhook được acknowledge nhưng chưa confirm booking.
7. Nếu hợp lệ, service gọi flow settlement sẵn có để cập nhật `payment = paid` và `booking = confirmed`.

## Ghi chú
- Webhook này idempotent: nếu payment đã `paid` và booking đã `confirmed` thì response vẫn trả acknowledge thành công.
- Nếu hold đã hết hạn trước khi tiền vào, settlement sẽ không xác nhận booking nữa.
