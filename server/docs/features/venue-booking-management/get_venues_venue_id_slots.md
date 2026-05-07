# GET /api/v1/venues/:venueId/slots

## Mục đích
Lấy danh sách slot theo ngày cho một sân. Route này sinh slot động từ `weekly_schedule`, sau đó trừ đi booking active và các override `unavailable`.

## Input
### Headers
- Không bắt buộc.

### Params
- `venueId`: id của sân.

### Query
- `date`: ngày cần xem, định dạng `YYYY-MM-DD`.

### Body
- Không có.

### Validation quan trọng
- `venueId` phải là ObjectId hợp lệ.
- `date` là bắt buộc và phải đúng định dạng `YYYY-MM-DD`.

## Response
### Success - 200
```json
{
  "message": "Venue slots fetched successfully.",
  "data": {
    "venue": {
      "id": "6820abc123...",
      "name": "Central Court",
      "slotPrice": 250000,
      "slotDurationMinutes": 60
    },
    "date": "2026-05-11",
    "slots": [
      {
        "date": "2026-05-11",
        "startTime": "08:00",
        "endTime": "09:00",
        "status": "available",
        "bookingId": null
      },
      {
        "date": "2026-05-11",
        "startTime": "09:00",
        "endTime": "10:00",
        "status": "unavailable",
        "bookingId": null
      }
    ]
  }
}
```

### Error - 400
Lỗi params hoặc query.
```json
{
  "errors": [
    "Date must be in YYYY-MM-DD format."
  ]
}
```

### Error - 404
Không tìm thấy sân.
```json
{
  "message": "Venue not found."
}
```

## Logic flow
1. Route đi thẳng vào controller, không qua auth.
2. Controller validate `venueId` và `date`.
3. Service gọi `expireStaleBookings` để chuyển hold hoặc payment pending đã quá hạn sang `expired`.
4. Service lấy venue, các `venue_availability_overrides`, và các booking active của ngày đó.
5. Service sinh slot từ `weekly_schedule` dựa trên `slot_duration_minutes`.
6. Nếu slot có override thì status là `unavailable`.
7. Nếu slot có booking active thì status là `held`, `booked`, hoặc `refund_processing` tùy theo booking status.
8. Nếu không có override và không có booking active thì status là `available`.

## Ghi chú
- Route này không đọc từ `venue_slots` vật lý.
- Khi hold hết hạn, slot sẽ tự mở lại trong response sau lần gọi tiếp theo.
