# GET /api/v1/my-venues

## Mục đích
Lấy danh sách sân thuộc owner hiện tại.

## Input
### Headers
- `Authorization: Bearer <token>`

### Params
- Không có.

### Query
- Không có.

### Body
- Không có.

### Validation quan trọng
- Token phải hợp lệ.
- User phải có role `owner`.

## Response
### Success - 200
```json
{
  "message": "Owner venues fetched successfully.",
  "data": {
    "items": [
      {
        "id": "6820venue123...",
        "ownerId": "6820owner123...",
        "name": "Central Court",
        "location": "District 1",
        "slotPrice": 250000,
        "slotDurationMinutes": 60
      }
    ]
  }
}
```

### Error - 401
Token thiếu hoặc sai.

### Error - 403
User không có quyền owner.
```json
{
  "message": "You do not have permission to access this resource."
}
```

## Logic flow
1. Route đi qua `authMiddleware`.
2. Route đi tiếp qua `requireRole("owner")`.
3. Controller gọi service lấy tất cả venue theo `owner_id`.
4. Service sort theo `createdAt` giảm dần và format dữ liệu trả về.

## Ghi chú
- Route này là điểm vào cho dashboard `/my-venues`.
