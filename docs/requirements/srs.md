# SRS rút gọn - BrewLite

## 1. Mục đích và phạm vi

BrewLite là website đặt đồ uống. Khách có thể xem menu mà chưa cần đăng nhập; khách cần đăng ký bằng tên hiển thị, số điện thoại và mật khẩu, sau đó đăng nhập bằng số điện thoại và mật khẩu trước khi đặt đơn. Sau khi đăng nhập thành công, giao diện hiển thị tên đã đăng ký. MVP hỗ trợ tùy chỉnh đồ uống, quản lý giỏ hàng, đặt đơn, thanh toán mô phỏng và theo dõi đơn. Nhân viên xử lý đơn; quản lý quản lý đồ uống, tài khoản nhân viên và xem báo cáo cơ bản. Hệ thống dùng Next.js, NestJS và PostgreSQL.

Thanh toán trong MVP chỉ mô phỏng, không xử lý tiền thật. Sơ đồ use case tổng quát nằm tại [`docs/diagrams/brewlite-usecase.drawio`](../diagrams/brewlite-usecase.drawio), trang **Use case tổng quát**. Sơ đồ use case đặt và thanh toán nằm ở trang thứ hai.

## 2. Quy ước ưu tiên MoSCoW

| Mức | Ý nghĩa |
|---|---|
| Must | Bắt buộc để MVP được xem là hoàn thành |
| Should | Quan trọng nhưng có thể hoãn nếu không đủ nguồn lực cho MVP |
| Could | Tùy chọn, thực hiện khi còn nguồn lực |
| Won't | Không thực hiện trong MVP; ghi rõ để tránh hiểu nhầm về phạm vi |

## 3. Người dùng và vai trò

| Vai trò | Mô tả | Quyền chính |
|---|---|---|
| CUSTOMER | Khách hàng tự đăng ký bằng tên hiển thị, số điện thoại và mật khẩu | Xem menu, quản lý giỏ hàng, đặt/thanh toán đơn, xem đơn của mình; tên hiển thị được hiện sau khi đăng nhập |
| STAFF | Nhân viên dùng tài khoản do quản lý cấp | Xem đơn và cập nhật trạng thái xử lý |
| MANAGER | Quản lý dùng tài khoản quản lý được cấp | Các quyền quản lý đồ uống, nhân viên và báo cáo; có thể xử lý đơn |

## 4. Yêu cầu chức năng

| ID | Yêu cầu | Ưu tiên | Tiêu chí chấp nhận |
|---|---|---|---|
| FR-01 | Hệ thống cho phép khách xem danh sách đồ uống đang bán. | Must | `GET /products` trả `200 OK` và danh sách JSON chỉ chứa sản phẩm đang bán; nếu không có sản phẩm thì trả danh sách rỗng. |
| FR-02 | Hệ thống cho phép khách xem chi tiết đồ uống gồm mô tả, giá và các tùy chọn khả dụng. | Must | `GET /products/:id` với ID tồn tại trả `200 OK` và đủ thông tin; ID không tồn tại trả `404 Not Found`. |
| FR-03 | Khách có thể tìm kiếm đồ uống theo tên. | Could | Từ khóa khớp một phần tên thì kết quả chỉ gồm sản phẩm phù hợp; từ khóa không khớp trả danh sách rỗng. |
| FR-04 | Khách có thể chọn size, mức đá, mức đường và topping khả dụng cho đồ uống. | Must | Tùy chọn hợp lệ được lưu cùng món; giá món được tính theo giá gốc và phụ phí đã cấu hình; tùy chọn không khả dụng bị từ chối. |
| FR-05 | Khách có thể thêm một món đã chọn tùy chọn vào giỏ hàng. | Must | Món được thêm với đúng tùy chọn, số lượng và đơn giá; tổng tiền giỏ tăng đúng bằng thành tiền của món. |
| FR-06 | Khách có thể xem các món và tổng tiền trong giỏ hàng. | Must | Nội dung giỏ và tổng tiền hiển thị khớp với các món, số lượng, tùy chọn và giá hiện hành. |
| FR-07 | Khách có thể sửa số lượng hoặc xóa món khỏi giỏ hàng. | Must | Số lượng và tổng tiền thay đổi đúng sau khi sửa; sau khi xóa, món không còn trong giỏ và tổng tiền được tính lại. |
| FR-08 | Khách có thể tự đăng ký tài khoản bằng tên hiển thị, số điện thoại và mật khẩu hợp lệ; sau khi đăng nhập thành công, hệ thống hiển thị tên hiển thị của khách. | Must | Đăng ký hợp lệ tạo tài khoản `CUSTOMER` và lưu tên hiển thị; số điện thoại đã dùng hoặc dữ liệu không hợp lệ bị từ chối và không tạo tài khoản trùng. Khi khách đăng nhập thành công, giao diện hiển thị đúng tên hiển thị đã đăng ký. |
| FR-09 | Khách hàng, nhân viên và quản lý có thể đăng nhập bằng thông tin tài khoản hợp lệ. | Must | Khách hàng đăng nhập bằng số điện thoại và mật khẩu; nhân viên/quản lý dùng thông tin tài khoản được cấp. Đăng nhập thành công trả token và đúng vai trò; sai thông tin đăng nhập trả lỗi xác thực và không cấp token. |
| FR-10 | Hệ thống giới hạn chức năng theo vai trò `CUSTOMER`, `STAFF` và `MANAGER`. | Must | `STAFF` gọi API quản lý nhân viên/báo cáo nhận `403`; `CUSTOMER` gọi API nội bộ nhận `403`; `MANAGER` gọi được API quản trị được cấp. Yêu cầu không có token nhận `401`. |
| FR-11 | Khách đã đăng nhập có thể tạo đơn từ giỏ hàng hợp lệ; backend tự tính tổng tiền. | Must | Đơn được lưu với đúng chủ sở hữu, món, tùy chọn, số lượng và tổng tiền tính ở backend; giỏ rỗng hoặc dữ liệu sai bị từ chối. |
| FR-12 | Hệ thống kiểm tra và giữ tồn kho cùng lúc tạo đơn bằng một transaction. | Must | Đơn và thay đổi tồn kho cùng được ghi khi thành công; nếu một bước lỗi thì rollback toàn bộ; nếu không đủ hàng thì không tạo đơn và tồn kho không bị giảm. |
| FR-13 | Khách có thể chọn phương thức thanh toán Ví hoặc Thẻ mô phỏng cho đơn hàng. | Must | Hai lựa chọn Ví/Thẻ mô phỏng xuất hiện khi checkout và lựa chọn được lưu theo yêu cầu thanh toán; không gửi dữ liệu thẻ thật. |
| FR-14 | Hệ thống xử lý kết quả thanh toán mô phỏng và cập nhật trạng thái thanh toán/đơn hàng. | Must | Khi mô phỏng thành công, payment là `SUCCEEDED` và đơn chuyển `CONFIRMED`; khi thất bại, payment là `FAILED` và đơn giữ `PENDING_PAYMENT` để thử lại. |
| FR-15 | Hệ thống xử lý lặp yêu cầu thanh toán theo idempotency key mà không tạo giao dịch trùng. | Must | Cùng key và cùng nội dung trả lại kết quả đã lưu, chỉ có một payment attempt; cùng key nhưng nội dung khác bị từ chối; thử lại sau thất bại dùng key mới và được ghi là attempt mới của cùng đơn. |
| FR-16 | Khách có thể xem lịch sử các đơn thuộc tài khoản của mình. | Must | Danh sách trả về chỉ gồm đơn của khách đang đăng nhập; không thể xem lịch sử của tài khoản khác. |
| FR-17 | Khách có thể theo dõi trạng thái đơn hàng của mình. | Must | Với mã đơn hợp lệ thuộc tài khoản, hệ thống trả trạng thái hiện tại và các mốc cập nhật; khách khác không xem được đơn đó. |
| FR-18 | Nhân viên có thể xem đơn mới/chi tiết đơn và cập nhật trạng thái xử lý. | Must | `STAFF` xem được món và tùy chọn trong đơn; chỉ chuyển được trạng thái theo luồng `CONFIRMED → PREPARING → COMPLETED` hoặc hủy đơn chưa chuẩn bị; trạng thái không hợp lệ bị từ chối. |
| FR-19 | Quản lý có thể thêm, sửa, ẩn hoặc xóa đồ uống. | Must | `MANAGER` lưu thay đổi hợp lệ thì menu được cập nhật; `STAFF` và `CUSTOMER` gọi API này nhận `403`. |
| FR-20 | Quản lý có thể tạo, sửa hoặc vô hiệu hóa tài khoản nhân viên. | Should | Tài khoản mới được tạo với vai trò `STAFF`; chỉ `MANAGER` có quyền quản lý tài khoản này; tài khoản bị vô hiệu hóa không đăng nhập được. |
| FR-21 | Quản lý có thể xem báo cáo doanh thu cơ bản theo khoảng thời gian. | Should | Báo cáo trả tổng số đơn và tổng doanh thu của các đơn thanh toán thành công trong khoảng thời gian đã chọn; tổng khớp với dữ liệu đơn mẫu. |
| FR-22 | MVP không tích hợp thanh toán tiền thật và không lưu thông tin thẻ ngân hàng. | Won't | Cấu hình chỉ dùng Payment Service mô phỏng; không có endpoint tạo giao dịch thật hoặc trường lưu số thẻ/CVV. |

## 5. Yêu cầu phi chức năng

| ID | Yêu cầu | Ưu tiên | Tiêu chí chấp nhận |
|---|---|---|---|
| NFR-01 | API sản phẩm phản hồi trong ngưỡng thời gian chấp nhận được cho MVP. | Should | Với dữ liệu seed, 95% yêu cầu `GET /products` và `GET /products/:id` hoàn tất trong tối đa 2 giây khi có 20 yêu cầu đồng thời trong môi trường demo. |
| NFR-02 | Mật khẩu được lưu dưới dạng hash an toàn, không lưu dạng văn bản thuần. | Must | Sau khi đăng ký, database chỉ chứa password hash; mật khẩu gốc không xuất hiện trong database hoặc log. |
| NFR-03 | API được bảo vệ xác thực token và kiểm tra quyền ở backend. | Must | Thiếu/sai token nhận `401`; token hợp lệ nhưng sai vai trò nhận `403`; vai trò được phép gọi API thành công. |
| NFR-04 | Dữ liệu đầu vào được validate ở backend và lỗi trả theo định dạng nhất quán. | Must | Dữ liệu thiếu trường, sai kiểu hoặc ngoài giới hạn nhận lỗi `4xx`; không ghi dữ liệu không hợp lệ vào database. |
| NFR-05 | Số điện thoại và thông tin bí mật được bảo vệ. | Must | Số điện thoại không xuất hiện trong log không cần thiết; JWT secret và credential chỉ lấy từ biến môi trường, không có trong repository hoặc log CI. |
| NFR-06 | Dịch vụ API duy trì khả dụng trong phiên demo và báo đúng trạng thái sức khỏe. | Should | Trong phiên kiểm tra 30 phút, health check mỗi phút thành công ít nhất 29/30 lần; khi API hoặc database không sẵn sàng, health endpoint báo unhealthy hoặc trả mã lỗi phù hợp. |
| NFR-07 | Giao diện mobile-first sử dụng được trên màn hình điện thoại và máy tính. | Should | Các luồng xem menu, giỏ hàng và checkout không tràn ngang hoặc mất nút thao tác ở viewport 360×800 và 1280×720. |
| NFR-08 | Thành viên có thể dựng lại môi trường local từ repository. | Must | Làm theo README, `.env.example` và `docker-compose.yml` có thể khởi chạy web, API và PostgreSQL; migration/seed hoàn tất và `GET /health` trả `200`. |
| NFR-09 | Phiên bản production sử dụng HTTPS và không công khai database trực tiếp. | Must | Frontend và API truy cập được qua HTTPS với chứng chỉ hợp lệ; kết nối PostgreSQL chỉ nhận từ backend/nguồn được cho phép, không truy cập trực tiếp công khai. |
| NFR-10 | Pipeline CI chạy quality gate tự động cho pull request. | Must | Mỗi pull request chạy install, lint, unit test và build; nếu một bước thất bại thì pipeline báo thất bại và PR không đủ điều kiện merge theo branch protection. |

## 6. Use case tổng quát và liên kết

Sơ đồ tổng quát thể hiện các actor `CUSTOMER`, `STAFF`, `MANAGER`, dịch vụ thanh toán mô phỏng và các chức năng chính. File Draw.io gồm trang use case tổng quát và trang use case đặt, thanh toán đơn hàng.

## 7. Quy tắc và giả định nghiệp vụ dùng trong SRS

- Khách có thể xem menu mà không đăng nhập; cần đăng nhập để đặt đơn và xem dữ liệu đơn cá nhân.
- Đăng ký khách hàng dùng tên hiển thị, số điện thoại và mật khẩu; sau đăng nhập, giao diện hiển thị tên đã đăng ký. Xác minh SMS/OTP chưa nằm trong MVP.
- Nhân viên và quản lý không tự đăng ký; tài khoản nội bộ do quản lý tạo hoặc seed sẵn.
- Thanh toán chỉ mô phỏng Ví/Thẻ. Khi thanh toán thất bại, đơn giữ `PENDING_PAYMENT` để khách thử lại; cùng idempotency key trả cùng kết quả, lần thử mới dùng key mới.
- Đơn và phần tồn kho được giữ phải ghi nhất quán trong transaction. Khi nhân viên hủy đơn chưa chuẩn bị, phần tồn kho đã giữ được hoàn lại.
- Trạng thái đơn cơ bản: `PENDING_PAYMENT → CONFIRMED → PREPARING → COMPLETED`; đơn chưa chuẩn bị có thể chuyển sang `CANCELLED`. Trạng thái thanh toán: `PENDING`, `SUCCEEDED`, `FAILED`.
- Báo cáo doanh thu chỉ tính đơn có thanh toán thành công; phạm vi báo cáo là tổng số đơn và tổng doanh thu theo khoảng thời gian.
