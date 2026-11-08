# Bối cảnh và phạm vi BrewLite

## 1. Bối cảnh nghiệp vụ

BrewLite hỗ trợ khách hàng xem menu và chi tiết đồ uống, tùy chỉnh đồ uống, quản lý giỏ hàng, đặt hàng, thanh toán mô phỏng và theo dõi đơn. Nhân viên tiếp nhận, chuẩn bị và cập nhật trạng thái đơn hàng. Quản lý cửa hàng quản lý đồ uống, theo dõi đơn hàng và xem báo cáo doanh thu. Tìm kiếm đồ uống và quản lý tài khoản nhân viên không thuộc phạm vi MVP.

Hệ thống hướng tới việc giúp khách đặt đồ uống thuận tiện hơn, giảm thời gian chờ tại quầy và giúp cửa hàng xử lý đơn rõ ràng, hạn chế sai sót. Trong phạm vi bài tập, thanh toán được mô phỏng và không xử lý giao dịch tiền thật.

## 2. Stakeholder

| Stakeholder | Vai trò | Mục tiêu/kỳ vọng | Mối quan tâm |
|---|---|---|---|
| Khách hàng | Đăng ký bằng tên hiển thị, số điện thoại, mật khẩu và xác minh OTP; sau đó xem và đặt đồ uống trên website | Dễ tạo tài khoản, xác minh số điện thoại trong môi trường kiểm thử, nhận biết tài khoản cá nhân sau khi đăng nhập, chọn và tùy chỉnh món, đặt hàng, thanh toán và theo dõi đơn thuận tiện | Giao diện dễ dùng; tên hiển thị đúng tài khoản; menu, giá và tùy chọn chính xác; OTP và trạng thái đơn rõ ràng; số điện thoại và thông tin tài khoản được bảo vệ |
| Nhân viên quầy | Đăng nhập bằng tài khoản được cấp; tiếp nhận, chuẩn bị và cập nhật trạng thái đơn | Nhận đúng thông tin đơn và xử lý đơn nhanh chóng | Dễ xem đơn mới và chi tiết món; cập nhật trạng thái chính xác; chỉ truy cập chức năng phù hợp vai trò |
| Quản lý cửa hàng | Đăng nhập bằng tài khoản quản lý; quản lý hoạt động bán hàng | Quản lý menu và nhân viên, theo dõi đơn và tình hình kinh doanh | Dữ liệu doanh thu và đơn hàng chính xác; thao tác quản trị được phân quyền và bảo vệ |
| Giảng viên/người nghiệm thu | Đánh giá hệ thống và kết quả thực hiện | Hệ thống đáp ứng yêu cầu, tiêu chí nghiệm thu và phạm vi đề tài | Tính đầy đủ, chính xác, khả dụng; tài liệu và chức năng có thể kiểm chứng |
| Nhóm phát triển | Phân tích, thiết kế, xây dựng, kiểm thử và triển khai hệ thống | Hoàn thành hệ thống đúng yêu cầu và tiến độ | Yêu cầu nghiệp vụ rõ ràng; thiết kế, dữ liệu, phân quyền và mã nguồn nhất quán; hệ thống có thể chạy và triển khai |
| Dịch vụ thanh toán mô phỏng | Nhận yêu cầu thanh toán thử nghiệm và trả kết quả | Trả về kết quả thành công hoặc thất bại để kiểm thử luồng đặt hàng | Kết quả và trạng thái giao dịch nhất quán; không xử lý tiền thật |

## 3. Phạm vi MVP (In-scope)

- Khách hàng tự đăng ký bằng tên hiển thị, số điện thoại và mật khẩu, sau đó xác minh OTP gồm 6 chữ số. Trong môi trường phát triển/kiểm thử, hệ thống tạo OTP và hiển thị mã trong terminal; OTP không được gửi qua SMS thật. Khi đăng nhập bằng số điện thoại và mật khẩu thành công, giao diện hiển thị tên đã đăng ký. Nhân viên và quản lý đăng nhập bằng tài khoản được cấp hoặc tài khoản mẫu được tạo sẵn.
- Phân quyền theo vai trò `CUSTOMER`, `STAFF` và `MANAGER`; backend kiểm tra quyền khi gọi chức năng được bảo vệ.
- Khách hàng xem menu, tìm kiếm và xem chi tiết đồ uống.
- Khách hàng chọn size, mức đá, mức đường và topping theo cấu hình sản phẩm.
- Khách hàng thêm món vào giỏ, xem giỏ, sửa số lượng và xóa món.
- Khách hàng tạo đơn hàng, chọn phương thức và thanh toán qua dịch vụ mô phỏng; xem kết quả thanh toán.
- Khách hàng xem lịch sử đơn và theo dõi trạng thái đơn hàng.
- Nhân viên xem đơn mới/chi tiết đơn và cập nhật trạng thái đơn trong phạm vi quyền được cấp.
- Quản lý thêm, sửa, ẩn hoặc xóa đồ uống; xem báo cáo doanh thu cơ bản.

## 4. Phạm vi mở rộng

- Tích hợp cổng thanh toán thật sau khi MVP hoàn tất và được cho phép.
- Tích hợp nhà cung cấp SMS để gửi OTP thật đến điện thoại; MVP chỉ hiển thị OTP trong terminal phục vụ kiểm thử.
- Quản lý nhiều chi nhánh, tồn kho nâng cao và báo cáo phân tích chuyên sâu.
- Thông báo đẩy hoặc SMS về trạng thái đơn.

## 5. Ngoài phạm vi (Out-of-scope)

- Xử lý giao dịch tiền thật hoặc lưu thông tin thẻ ngân hàng.
- Giao hàng thực tế, định vị shipper hoặc theo dõi lộ trình giao hàng.
- Tìm kiếm đồ uống trong menu.
- Tạo, sửa, khóa hoặc quản lý tài khoản nhân viên qua giao diện.
Khuyến mãi, mã giảm giá và tích điểm thành viên không thuộc MVP và không nằm trong mô hình dữ liệu của đồ án.
- Tích hợp hệ thống kế toán, hóa đơn điện tử hoặc phần mềm bán hàng bên thứ ba.
- Đăng ký công khai tài khoản nhân viên/quản lý; các tài khoản nội bộ do quản lý tạo hoặc được seed sẵn.
- Gửi OTP qua SMS thật; mã OTP trong phiên bản MVP chỉ được tạo và hiển thị trong terminal của môi trường phát triển/kiểm thử.
- Vận hành chuỗi nhiều cửa hàng trong phiên bản MVP.

## 6. Giả định

- Nhóm cung cấp dữ liệu mẫu về đồ uống, giá, size và topping.
- Người dùng có kết nối Internet và trình duyệt hiện đại để truy cập website.
- Khách hàng tự đăng ký bằng tên hiển thị, số điện thoại và mật khẩu rồi xác minh OTP 6 chữ số. Trong phát triển/kiểm thử, OTP được tạo và in ra terminal; hệ thống chưa gửi SMS thật. Tên hiển thị được lưu để hiển thị sau khi đăng nhập. Tài khoản nhân viên/quản lý do quản lý tạo hoặc được seed sẵn cho môi trường demo.
- Mỗi tài khoản có một vai trò chính; quyền được kiểm tra ở backend, không chỉ ẩn chức năng trên giao diện.
- Dịch vụ thanh toán trong MVP là mô phỏng và có thể trả kết quả thành công/thất bại.
- MVP mô hình hóa một cửa hàng và các trạng thái đơn cơ bản.
- Tài khoản nhân viên và quản lý được cấu hình sẵn; quản lý không tạo tài khoản qua giao diện.

## 7. Ràng buộc

- Công nghệ bắt buộc: Next.js cho frontend, NestJS cho backend và PostgreSQL cho dữ liệu.
- Frontend được thiết kế theo hướng mobile-first/PWA.
- Hệ thống phải quản lý xác thực và phân quyền phù hợp với vai trò khách hàng, nhân viên và quản lý.
- Các task của assignment được thực hiện theo thứ tự; tạo phẩm phải được lưu trong repository có lịch sử thay đổi.
- Thời gian và nguồn lực của nhóm giới hạn mức độ tính năng, kiểm thử và hạ tầng triển khai.

## 8. Rủi ro ban đầu

| Rủi ro | Ảnh hưởng | Cách giảm thiểu sơ bộ |
|---|---|---|
| Phân quyền theo vai trò không nhất quán giữa giao diện và API | Người dùng có thể truy cập chức năng không được phép | Kiểm tra quyền ở backend và kiểm thử API với từng vai trò |
| Tích hợp frontend, backend và database chậm | Trễ tiến độ MVP | Chốt hợp đồng API sớm, tích hợp theo từng chức năng nhỏ |
| Đơn hàng, giá hoặc tồn kho không nhất quán | Sai tổng tiền hoặc nhận đơn vượt khả năng phục vụ | Kiểm tra dữ liệu ở backend và dùng transaction khi tạo đơn/cập nhật tồn kho |
| Cấu hình triển khai hoặc secret sai | Hệ thống production không truy cập được hoặc lộ thông tin | Dùng biến môi trường, kiểm tra health endpoint và không commit secret |
| Không đủ thời gian kiểm thử luồng thanh toán | Lỗi ở luồng đặt hàng đầu-cuối | Ưu tiên kiểm thử các luồng thành công, thất bại và thử lại |
