# Đặc tả use case BrewLite

## UC-01 — Đặt và thanh toán đơn hàng

| Thuộc tính | Mô tả |
|---|---|
| Mục tiêu | Khách hàng tạo đơn từ giỏ hàng và thanh toán bằng phương thức mô phỏng. |
| Phạm vi | Website BrewLite và dịch vụ thanh toán mô phỏng. |
| Actor chính | Khách hàng (`CUSTOMER`). |
| Actor phụ | Dịch vụ thanh toán mô phỏng. |
| Mức ưu tiên | Must — luồng cốt lõi của MVP. |
| Trigger | Khách hàng chọn **Đặt hàng/Thanh toán** tại trang giỏ hàng. |

### Tiền điều kiện

1. Khách hàng có tài khoản và đã đăng nhập.
2. Giỏ hàng có ít nhất một món với tùy chọn hợp lệ.
3. Các sản phẩm trong giỏ đang được bán và hệ thống có thể tiếp nhận yêu cầu.

### Hậu điều kiện

**Thành công:** Đơn hàng được lưu với đúng khách hàng, các món, tùy chọn, số lượng và tổng tiền do backend tính; tồn kho được giữ nhất quán với việc tạo đơn; giao dịch mô phỏng thành công; trạng thái thanh toán là `SUCCEEDED` và trạng thái đơn là `CONFIRMED`.

**Thanh toán thất bại:** Đơn và payment attempt được lưu; trạng thái payment là `FAILED`, đơn ở `PENDING_PAYMENT` để khách có thể thử thanh toán lại. Không ghi nhận thanh toán thành công.

**Yêu cầu không hợp lệ hoặc lỗi trước khi tạo đơn:** Không tạo đơn và không thay đổi tồn kho. Việc tạo đơn và giữ tồn kho phải cùng thành công hoặc cùng rollback trong một transaction.

### Luồng chính

1. Khách hàng mở giỏ hàng và xem các món, tùy chọn, số lượng cùng tổng tiền tạm tính.
2. Khách hàng chọn đặt hàng.
3. Hệ thống xác thực phiên đăng nhập và kiểm tra quyền `CUSTOMER`.
4. Hệ thống kiểm tra giỏ hàng không rỗng, sản phẩm còn bán, tùy chọn và số lượng hợp lệ; backend lấy giá hiện hành và tự tính tổng tiền.
5. Hệ thống kiểm tra tồn kho. Nếu hợp lệ, hệ thống tạo đơn ở trạng thái `PENDING_PAYMENT` và giữ tồn kho trong cùng một transaction.
6. Khách hàng chọn Ví hoặc Thẻ mô phỏng.
7. Hệ thống gửi yêu cầu đến dịch vụ thanh toán mô phỏng kèm idempotency key.
8. Dịch vụ thanh toán trả kết quả thành công.
9. Hệ thống lưu payment là `SUCCEEDED`, chuyển đơn sang `CONFIRMED` và trả mã đơn cùng kết quả cho khách hàng.

### Luồng thay thế

**A1 — Phiên đăng nhập hết hạn (tại bước 3)**

1. Hệ thống yêu cầu khách hàng đăng nhập lại.
2. Sau khi xác thực thành công, khách hàng có thể tiếp tục đặt đơn nếu giỏ hàng vẫn hợp lệ.
3. Nếu đăng nhập thất bại hoặc khách hàng dừng thao tác, use case kết thúc mà không tạo đơn.

**A2 — Giá hoặc giỏ hàng thay đổi (tại bước 4)**

1. Hệ thống tính lại giá từ dữ liệu hiện hành, không tin tổng tiền do trình duyệt gửi lên.
2. Hệ thống hiển thị nội dung/tổng tiền mới để khách hàng xác nhận lại.
3. Khi khách xác nhận, tiếp tục tại bước 5; nếu khách không xác nhận thì kết thúc, chưa tạo đơn.

**A3 — Thanh toán mô phỏng thất bại (tại bước 8)**

1. Hệ thống lưu payment attempt với trạng thái `FAILED`; đơn giữ trạng thái `PENDING_PAYMENT`.
2. Hệ thống thông báo thanh toán thất bại và cho phép khách thử lại.
3. Mỗi lần thử mới dùng idempotency key mới và được lưu là attempt mới của cùng đơn.
4. Nếu khách thử lại và thanh toán thành công, tiếp tục tại bước 9; nếu khách dừng, use case kết thúc với đơn chưa thanh toán.

### Luồng ngoại lệ

**E1 — Giỏ hàng rỗng hoặc dữ liệu món/tùy chọn không hợp lệ (bước 4):** Hệ thống từ chối yêu cầu, nêu lỗi cần sửa; không tạo đơn.

**E2 — Sản phẩm ngừng bán, giá không còn hợp lệ hoặc hết hàng (bước 4–5):** Hệ thống báo món không thể đặt và yêu cầu khách cập nhật giỏ hàng. Transaction rollback; không tạo đơn và không giảm tồn kho.

**E3 — Lỗi khi ghi đơn hoặc giữ tồn kho (bước 5):** Hệ thống rollback toàn bộ transaction và báo chưa thể tạo đơn; không tạo trạng thái đơn dở dang.

**E4 — Phương thức thanh toán không được hỗ trợ (bước 6):** Hệ thống yêu cầu chọn Ví hoặc Thẻ mô phỏng; chưa gửi yêu cầu thanh toán.

**E5 — Dịch vụ thanh toán không phản hồi hoặc trả lỗi kỹ thuật (bước 7–8):** Hệ thống không đánh dấu giao dịch thành công, thông báo kết quả chưa xử lý được và cho phép kiểm tra/thử lại theo cơ chế idempotency. Trạng thái đơn không được chuyển sang `CONFIRMED` nếu chưa có kết quả thành công.

**E6 — Idempotency key đã dùng với cùng nội dung (bước 7):** Hệ thống trả lại kết quả đã lưu, không tạo payment attempt trùng.

**E7 — Idempotency key đã dùng với nội dung khác (bước 7):** Hệ thống từ chối yêu cầu; không tạo giao dịch mới.

### Quy tắc và giới hạn phạm vi

- Thanh toán của MVP chỉ là mô phỏng Ví/Thẻ; không chuyển tiền thật và không thu thập/lưu số thẻ hoặc CVV.
- Khách phải đăng nhập để đặt đơn; khách chưa có tài khoản cần đăng ký bằng số điện thoại trước. SMS/OTP chưa thuộc MVP.
- Nhân viên và quản lý không tham gia luồng checkout này; họ dùng tài khoản nội bộ do quản lý cấp.
- Use case kết thúc khi hệ thống trả kết quả tạo đơn/thanh toán. Chuẩn bị món, giao hàng và xử lý hoàn tiền không thuộc luồng này.

### Liên kết yêu cầu

| Yêu cầu | Nội dung được thực hiện trong use case |
|---|---|
| FR-04 | Chọn size, mức đá, mức đường và topping khả dụng cho từng món. |
| FR-05–FR-07 | Thêm món, xem giỏ hàng, cập nhật số lượng hoặc xóa món. |
| FR-08–FR-10 | Đăng ký/đăng nhập và phân quyền theo vai trò; checkout yêu cầu `CUSTOMER` đã xác thực. |
| FR-11 | Tạo đơn từ giỏ hợp lệ; backend tự tính tổng tiền. |
| FR-12 | Kiểm tra và giữ tồn kho cùng lúc tạo đơn bằng transaction. |
| FR-13 | Chọn phương thức Ví hoặc Thẻ mô phỏng. |
| FR-14 | Lưu kết quả thanh toán và cập nhật trạng thái payment/đơn hàng. |
| FR-15 | Chống tạo giao dịch trùng bằng idempotency key và hỗ trợ lần thử mới. |

### Sơ đồ liên quan

Sơ đồ phạm vi use case đặt và thanh toán nằm ở trang **Use case chi tiết - Đặt và thanh toán** trong [`../diagrams/brewlite-usecase.drawio`](../diagrams/brewlite-usecase.drawio). Trang này thể hiện actor Khách hàng, Dịch vụ thanh toán mô phỏng, các use case con và các quan hệ `<<include>>`/`<<extend>>`.
