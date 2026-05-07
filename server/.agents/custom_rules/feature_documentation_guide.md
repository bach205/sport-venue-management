# Feature Documentation Guide

## Mục đích
File này hướng dẫn cách viết tài liệu cho từng feature trong repository. Mục tiêu là để mỗi route có một tài liệu riêng, dễ tra cứu, dễ bảo trì, và phản ánh đúng luồng xử lý trong code.

## Vị trí lưu trữ
Mọi tài liệu của feature phải được đặt trong thư mục:

- `docs/features/<feature-name>/`

Ví dụ:

- `docs/features/streak/`
- `docs/features/question_bank/`

## Quy ước tài liệu
Trong mỗi thư mục feature, chỉ tạo các file Markdown mô tả từng route. Mỗi file `.md` tương ứng với một route cụ thể.
Nội dung của một file route phải đủ để người đọc hiểu toàn bộ route đó mà không cần chuyển qua nhiều file khác.

## Nội dung bắt buộc cho mỗi file route
Mỗi file tài liệu route cần mô tả rõ các phần sau:

1. Tên route
   - Method
   - Path
   - Mục đích của route

2. Input
   - Headers cần thiết
   - Params
   - Query
   - Body
   - Điều kiện validation quan trọng

3. Response
   - HTTP status có thể trả về
   - Cấu trúc response success
   - Cấu trúc response error
   - Ý nghĩa của các field quan trọng

4. Logic flow
   - Route đi qua middleware nào
   - Controller xử lý gì
   - Model hoặc service nào được gọi
   - Điều kiện rẽ nhánh quan trọng
   - Cách dữ liệu được tạo, cập nhật, hoặc trả về

5. Ghi chú mở rộng nếu cần
   - Phụ thuộc với route khác
   - Side effect như gửi mail, tạo log, cập nhật ranking, unlock dữ liệu
   - Lưu ý khi sửa hoặc mở rộng route

## Quy tắc đặt tên
- Tên thư mục feature dùng dạng `kebab-case`.
- Tên file nên phản ánh đúng route, ưu tiên theo dạng `method_route_name.md`.
- Không dùng dấu cách hoặc ký tự đặc biệt trong tên file hoặc thư mục.

Ví dụ tên file:

- `post_create_subject_test.md`
- `get_subject_test_detail.md`
- `put_update_question_bank.md`

## Skill bắt buộc khi viết tài liệu
Khi viết tài liệu cho route, **phải sử dụng skill** `writing-clearly-and-concisely` từ `.agents\skills\writing-clearly-and-concisely\SKILL.md`.

Skill này đảm bảo:
- Văn phong rõ ràng, không lủng lẳng
- Dùng tiếng chủ động thay vì bị động
- Omit needless words - tránh dài dòng
- Sử dụng ngôn ngữ cụ thể, không chung chung

Áp dụng các quy tắc từ Strunk's Elements of Style, đặc biệt:
- Elementary Principles of Composition (active voice, positive form, definite language, omit needless words)
- Tránh lối viết AI: puffery, empty "-ing" phrases, promotional adjectives, overused vocabulary

## Khi yêu cầu viết tài liệu cho feature mới
Khi cần viết tài liệu cho một feature mới, hãy thực hiện các bước sau:

1. Tạo thư mục `docs/features/<feature-name>/`.
2. Xác định các route thuộc feature đó.
3. Tạo một file `.md` cho từng route.
4. Trong mỗi file, mô tả đầy đủ input, response, và logic flow của route.
5. Nếu feature có nhiều route, tất cả tài liệu vẫn nằm trong cùng thư mục feature.

## Ví dụ cấu trúc
```
docs/
  features/
    streak/
      post_check_in.md
      get_streak_summary.md
      get_streak_history.md
```

## Gợi ý bố cục cho một file route
~~~markdown
# POST /streak/check-in

## Mục đích
Mô tả ngắn gọn route dùng để làm gì.

## Input
### Headers
- `Authorization: Bearer <token>`

### Body
```json
{
  "date": "2026-04-24"
}
```

## Response
### Success - 200
```json
{
  "success": true,
  "message": "Check-in successful",
  "data": {
    "currentStreak": 12
  }
}
```

### Error - 400
```json
{
  "success": false,
  "message": "Already checked in today"
}
```

## Logic flow
1. Route nhận request và đi qua middleware xác thực.
2. Controller lấy `userId` từ token.
3. Controller kiểm tra trạng thái check-in hiện tại.
4. Nếu đã check-in trong ngày thì trả lỗi.
5. Nếu chưa check-in thì cập nhật streak và lưu lịch sử.
6. Trả response chứa streak mới nhất.
~~~

## Ghi chú
- Nếu feature chưa có route nào, chưa cần tạo thư mục tài liệu.
- Mỗi file nên tập trung vào đúng một route, không gộp nhiều route vào cùng một tài liệu.
- Nội dung phải bám sát code hiện tại trong route, controller, service, model, và middleware liên quan.
