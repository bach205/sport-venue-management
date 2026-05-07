# PATCH /api/v1/my-venues/:venueId

## Mục đích
Chỉnh sửa thông tin cơ bản của sân, gồm `name`, `location`, và `description`.

## Input
### Headers
- `Authorization: Bearer <token>`
- `Content-Type: application/json`

### Params
- `venueId`: id của sân.

### Query
- Không có.

### Body
```json
{
  "name": "Central Court Premium",
  "location": "District 7",
  "description": "Updated description"
}
```

### Validation quan trọng
- `venueId` phải là ObjectId hợp lệ.
- Body phải có ít nhất một field hợp lệ.
- Nếu có `name` hoặc `location` thì giá trị sau khi trim không được rỗng.
- Chỉ owner của sân mới sửa được sân đó.

## Response
### Success - 200
```json
{
  "message": "Venue updated successfully.",
  "data": {
    "id": "6820venue123...",
    "name": "Central Court Premium",
    "location": "District 7",
    "description": "Updated description"
  }
}
```

### Error - 400
Payload không hợp lệ.

### Error - 404
Không tìm thấy sân thuộc owner hiện tại.
```json
{
  "message": "Venue not found for this owner."
}
```

## Logic flow
1. Route đi qua `authMiddleware` và `requireRole("owner")`.
2. Controller validate `venueId` và body.
3. Service chỉ tìm venue theo cặp `_id + owner_id`.
4. Service gán các field mới lên document venue rồi `save`.
5. Response trả về venue sau khi format.

## Ghi chú
- Route này không sửa lịch vận hành, giá, hoặc thời lượng slot. Các field đó đi qua route schedule riêng.
