# Kế hoạch: Venue Browsing, Booking, Refund và Owner Management

## Tóm tắt
Triển khai `venue` thành một backend module hoàn chỉnh theo hướng `template + exceptions`, chỉ tập trung backend contract/API. Slot sẽ không được lưu sẵn theo từng ngày; thay vào đó hệ thống sinh slot theo ngày từ lịch mặc định của sân, rồi trừ đi booking đang active và các ngoại lệ `unavailable`. Realtime ở phase này là `polling-friendly API`, không thêm Socket.IO cho venue.

## Thay đổi chính
- Mở rộng `Venue` để chứa `slot_price`, `slot_duration_minutes`, và `weekly_schedule` (lịch mở cửa theo thứ trong tuần).
- Ngừng phụ thuộc vào mô hình `venue_slots` kiểu “1 document cho 1 slot”; thay bằng:
  - `bookings`: lưu giữ chỗ, booking đã thanh toán, refund state.
  - `payments`: lưu vòng đời thanh toán theo kiểu gateway-ready.
  - `refunds`: lưu auto/manual refund request.
  - `venue_availability_overrides` hoặc collection tương đương: chỉ lưu ngoại lệ `unavailable` theo `venue + date + time range`.
- Thêm middleware `requireRole('owner')`; giả định user role `owner` đã tồn tại, không làm flow cấp quyền.
- Thêm partial unique index ở DB để chặn double booking trên cùng `venue_id + date + start_time + end_time` cho các booking đang active (`hold`, `payment_pending`, `confirmed`, `refund_processing`).
- Chuẩn hóa status:
  - `Booking`: `hold`, `payment_pending`, `confirmed`, `refund_processing`, `refunded`, `refund_rejected`, `expired`
  - `Payment`: `pending`, `paid`, `failed`, `refund_pending`, `refunded`
  - `Refund`: `pending_auto`, `pending_manual`, `approved`, `rejected`, `completed`

## API và luồng nghiệp vụ
- Public/user APIs:
  - `GET /venues` và `GET /venues/:venueId/slots?date=YYYY-MM-DD` để duyệt sân và xem slot theo ngày.
- `POST /bookings/holds` để giữ chỗ tạm thời trước thanh toán. Hold TTL mặc định 5 phút.
- `POST /bookings/:bookingId/payments` để tạo payment theo contract gateway-ready.
- `GET /payments/:paymentId` để client kiểm tra trạng thái thanh toán hiện tại.
- `POST /payments/:paymentId/confirm` dùng cho adapter nội bộ/stub ở phase đầu; sau này thay bằng webhook/provider callback mà không đổi flow chính.
  - `POST /bookings/:bookingId/refund` để user yêu cầu refund.
  - `GET /bookings/me` và `GET /bookings/me/:id` để xem lịch sử booking.
- Owner APIs:
  - `GET /my-venues`, `PATCH /my-venues/:venueId` để quản lý và sửa thông tin sân.
  - `PUT /my-venues/:venueId/schedule` để cập nhật `weekly_schedule`, `slot_duration_minutes`, `slot_price`.
  - `PUT /my-venues/:venueId/availability` để toggle slot giữa `available` và `unavailable`.
  - `GET /my-venues/:venueId/bookings?date=...&status=...` để xem lịch và booking.
  - `GET /my-venues/:venueId/refund-requests` và `PATCH /my-venues/refund-requests/:refundId` để xử lý refund thủ công.
- Quy tắc slot:
  - `available`: slot nằm trong `weekly_schedule`, không có override `unavailable`, và không có booking active.
  - `unavailable`: owner hoặc hệ thống đánh dấu không khả dụng; mở lại slot bằng cách xóa override.
- Quy tắc booking/payment:
  - User chọn slot -> tạo `hold`.
  - Bắt đầu thanh toán -> booking sang `payment_pending`, payment sang `pending`.
  - Thanh toán thành công -> booking sang `confirmed`, payment sang `paid`.
  - Hold hết hạn hoặc payment fail -> booking sang `expired`, slot tự mở lại do không còn booking active.
- Quy tắc refund:
  - Trong 5 phút từ `payment.paid_at`: tạo `refund` kiểu auto, booking sang `refund_processing`, payment sang `refund_pending`; khi hoàn tất thì booking `refunded`, payment `refunded`, slot mở lại.
  - Sau 5 phút: không auto refund; tạo `refund` kiểu `pending_manual` để owner xử lý trong `/my-venues`.
  - Owner approve -> booking `refunded`, payment `refunded`, slot mở lại.
  - Owner reject -> booking quay về `confirmed`, refund `rejected`.

## Kiểm thử
- Thêm test API/service cho các case chính bằng `jest + supertest + mongodb-memory-server`.
- Các scenario bắt buộc:
  - Xem slot theo ngày trả đúng `available/unavailable`.
  - Tạo hold thành công cho slot trống và thất bại khi slot đã bị giữ/đặt.
  - Hai request đồng thời vào cùng một slot chỉ có 1 request thành công.
  - Payment confirm chuyển booking từ `hold/payment_pending` sang `confirmed`.
  - Hold hết hạn thì slot xuất hiện lại trong API.
  - Refund trong 5 phút đi theo nhánh auto và mở lại slot.
  - Refund sau 5 phút tạo manual request cho owner.
  - Owner approve/reject manual refund cập nhật đúng booking/payment/refund.
  - Toggle `available/unavailable` của owner ảnh hưởng ngay tới kết quả `GET /slots`.

## Giả định và mặc định đã chốt
- Scope là backend only.
- Realtime phase này dùng refetch/polling, không thêm socket events cho venue.
- `owner` role đã có sẵn trong dữ liệu.
- Một booking chỉ gắn với một slot.
- Giá là `default venue price` cho mỗi slot.
- Mỗi venue có `slot_duration_minutes` cố định.
- Timezone mặc định theo timezone hệ thống/venue hiện có; chưa thêm multi-timezone support.
- Nếu cần giữ tương thích tài liệu hiện tại, `docs/database.md` và `docs/project_structure.md` sẽ được cập nhật để phản ánh mô hình “schedule + overrides” thay cho `venue_slots` vật lý.
