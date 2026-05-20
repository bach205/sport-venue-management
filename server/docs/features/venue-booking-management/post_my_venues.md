# POST /api/v1/my-venues

## Mục đích
Cho owner tạo một sân mới để đưa vào hệ thống quản lý sân.

## Input
### Headers
- `Authorization: Bearer <token>`
- `Content-Type: application/json`

### Params
- Không có.

### Query
- Không có.

### Body
```json
{
  "name": "Fresh Arena",
  "location": "Thu Duc",
  "description": "Newly opened venue",
  "slot_price": 300000,
  "slot_duration_minutes": 90,
  "weekly_schedule": [
    {
      "day_of_week": 1,
      "start_time": "07:00",
      "end_time": "10:00"
    }
  ]
}
```

### Validation quan trọng
- Token phải hợp lệ.
- User phải có role `owner`.
- `name` là bắt buộc.
- `location` là bắt buộc.
- `slot_price` phải là số không âm.
- `slot_duration_minutes` phải là số nguyên và tối thiểu `15`.
- `weekly_schedule` là tùy chọn. Nếu có, từng range phải hợp lệ và không chồng lấn trong cùng một ngày.

## Response
### Success - 201
```json
{
  "message": "Venue created successfully.",
  "data": {
    "id": "6820venue123...",
    "ownerId": "6820owner123...",
    "name": "Fresh Arena",
    "location": "Thu Duc",
    "description": "Newly opened venue",
    "slotPrice": 300000,
    "slotDurationMinutes": 90,
    "weeklySchedule": [
      {
        "dayOfWeek": 1,
        "startTime": "07:00",
        "endTime": "10:00"
      }
    ]
  }
}
```

### Error - 400
Payload không hợp lệ.
```json
{
  "errors": [
    "Name is required."
  ]
}
```

### Error - 401
Token thiếu hoặc sai.

### Error - 403
User không có role `owner`.
```json
{
  "message": "You do not have permission to access this resource."
}
```

## Logic flow
1. Route đi qua `authMiddleware`.
2. Route đi tiếp qua `requireRole("owner")`.
3. Controller validate body tạo sân.
4. Service tạo document `Venue` mới với `owner_id` lấy từ token.
5. Service lưu các field cơ bản, giá slot, thời lượng slot, và `weekly_schedule`.
6. Response trả về venue vừa tạo theo format API chung của module venue.

## Ghi chú
- `weekly_schedule` có thể để rỗng khi mới tạo sân, rồi cập nhật sau bằng route schedule.
