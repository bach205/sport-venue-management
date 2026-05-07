# PUT /api/v1/my-venues/:venueId/availability

## Mục đích
Toggle một slot cụ thể giữa `available` và `unavailable` để owner xử lý ngoài hệ thống.

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
  "date": "2026-05-11",
  "start_time": "11:00",
  "end_time": "12:00",
  "status": "unavailable",
  "reason": "outside system booking"
}
```

### Validation quan trọng
- `venueId` phải là ObjectId hợp lệ.
- `date`, `start_time`, `end_time`, và `status` là bắt buộc.
- `status` chỉ nhận `available` hoặc `unavailable`.
- Slot phải thuộc `weekly_schedule` của sân.
- Owner không thể đánh dấu `unavailable` cho slot đang có booking active.

## Response
### Success - 200
```json
{
  "message": "Venue availability updated successfully.",
  "data": {
    "venue": {
      "id": "6820venue123..."
    },
    "date": "2026-05-11",
    "slot": {
      "date": "2026-05-11",
      "startTime": "11:00",
      "endTime": "12:00",
      "status": "unavailable",
      "bookingId": null
    }
  }
}
```

### Error - 400
Slot không thuộc lịch hoặc đang có booking active.

### Error - 404
Không tìm thấy sân thuộc owner hiện tại.

## Logic flow
1. Route đi qua `authMiddleware` và `requireRole("owner")`.
2. Controller validate `venueId` và body.
3. Service expire các booking cũ của ngày đó nếu đã quá hạn.
4. Service lấy venue của owner và kiểm tra slot có nằm trong schedule không.
5. Nếu `status=unavailable`, service kiểm tra slot không có booking active rồi upsert vào `venue_availability_overrides`.
6. Nếu `status=available`, service xóa override tương ứng nếu tồn tại.
7. Service gọi lại logic `getVenueSlots` để trả về trạng thái slot mới nhất.

## Ghi chú
- Route này không tạo slot mới. Route chỉ thêm hoặc xóa override trên slot được sinh từ schedule.
