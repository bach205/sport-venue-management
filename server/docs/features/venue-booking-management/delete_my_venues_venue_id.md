# DELETE /api/v1/my-venues/:venueId

## Mục đích
Cho owner xóa một sân chưa phát sinh booking history.

## Input
### Headers
- `Authorization: Bearer <token>`

### Params
- `venueId`: id của sân.

### Query
- Không có.

### Body
- Không có.

### Validation quan trọng
- `venueId` phải là ObjectId hợp lệ.
- Token phải hợp lệ.
- User phải có role `owner`.
- Chỉ owner của sân mới xóa được sân đó.
- Route chỉ cho xóa khi venue chưa có booking nào liên quan.

## Response
### Success - 200
```json
{
  "message": "Venue deleted successfully.",
  "data": {
    "id": "6820venue123..."
  }
}
```

### Error - 400
Sân đã có booking history nên không được xóa.
```json
{
  "message": "This venue cannot be deleted because it already has booking history."
}
```

### Error - 401
Token thiếu hoặc sai.

### Error - 403
User không có role `owner`.

### Error - 404
Không tìm thấy sân thuộc owner hiện tại.
```json
{
  "message": "Venue not found for this owner."
}
```

## Logic flow
1. Route đi qua `authMiddleware`.
2. Route đi tiếp qua `requireRole("owner")`.
3. Controller validate `venueId`.
4. Service chỉ tìm venue theo cặp `_id + owner_id`.
5. Service đếm số booking liên quan đến venue.
6. Nếu venue đã có booking history, service trả lỗi và không xóa.
7. Nếu chưa có booking nào, service xóa toàn bộ `venue_availability_overrides` của sân rồi xóa venue.
8. Response trả về `id` của venue đã xóa.

## Ghi chú
- Rule hiện tại ưu tiên bảo toàn lịch sử booking/refund. Vì vậy route không cho xóa venue đã từng có booking.
