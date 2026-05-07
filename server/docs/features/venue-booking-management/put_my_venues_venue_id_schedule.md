# PUT /api/v1/my-venues/:venueId/schedule

## Mục đích
Cập nhật lịch vận hành mặc định của sân, cùng với giá mỗi slot và thời lượng slot.

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
  "slot_price": 250000,
  "slot_duration_minutes": 60,
  "weekly_schedule": [
    {
      "day_of_week": 1,
      "start_time": "08:00",
      "end_time": "12:00"
    }
  ]
}
```

### Validation quan trọng
- `venueId` phải là ObjectId hợp lệ.
- `slot_price` phải là số không âm.
- `slot_duration_minutes` phải là số nguyên và tối thiểu `15`.
- `weekly_schedule` phải là mảng.
- `day_of_week` nằm trong `0..6`.
- `start_time` và `end_time` phải đúng định dạng `HH:mm`.
- Các range trong cùng một ngày không được chồng lấn.

## Response
### Success - 200
```json
{
  "message": "Venue schedule updated successfully.",
  "data": {
    "id": "6820venue123...",
    "slotPrice": 250000,
    "slotDurationMinutes": 60,
    "weeklySchedule": [
      {
        "dayOfWeek": 1,
        "startTime": "08:00",
        "endTime": "12:00"
      }
    ]
  }
}
```

### Error - 400
Lịch hoặc giá trị số không hợp lệ.

### Error - 404
Không tìm thấy sân thuộc owner hiện tại.

## Logic flow
1. Route đi qua `authMiddleware` và `requireRole("owner")`.
2. Controller validate `venueId` và body.
3. Validation chuẩn hóa `weekly_schedule` và chặn các khoảng giờ chồng lấn.
4. Service lấy venue của owner.
5. Service cập nhật `weekly_schedule`, `slot_price`, và `slot_duration_minutes`.
6. Service `save` venue và trả kết quả đã format.

## Ghi chú
- Các route slot browsing và hold đọc trực tiếp cấu hình được cập nhật ở đây.
