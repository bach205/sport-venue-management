# GET /api/v1/venues

## Mục đích
Lấy danh sách sân khả dụng để frontend hiển thị màn browse venue.

## Input
### Headers
- Không bắt buộc.

### Params
- Không có.

### Query
- `page`: số trang, mặc định `1`.
- `limit`: số phần tử mỗi trang, mặc định `20`, tối đa `100`.

### Body
- Không có.

### Validation quan trọng
- `page` phải là số nguyên dương.
- `limit` phải là số nguyên dương và không vượt quá `100`.

## Response
### Success - 200
```json
{
  "message": "Venues fetched successfully.",
  "data": {
    "items": [
      {
        "id": "6820abc123...",
        "ownerId": "6820owner123...",
        "name": "Central Court",
        "location": "District 1",
        "description": "Indoor court",
        "slotPrice": 250000,
        "slotDurationMinutes": 60,
        "weeklySchedule": [
          {
            "dayOfWeek": 1,
            "startTime": "08:00",
            "endTime": "12:00"
          }
        ],
        "createdAt": "2026-05-07T09:00:00.000Z",
        "updatedAt": "2026-05-07T09:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "pages": 1
    }
  }
}
```

### Error - 400
Lỗi query.
```json
{
  "errors": [
    "Limit must not exceed 100."
  ]
}
```

## Logic flow
1. Route đi thẳng vào controller, không qua auth.
2. Controller validate `page` và `limit`.
3. Service query collection `venues`, sort theo `createdAt` giảm dần.
4. Service format từng venue về shape dùng cho API.
5. Response trả về `items` và `pagination`.

## Ghi chú
- Route này chỉ trả metadata của sân. Route không tính slot theo ngày.
