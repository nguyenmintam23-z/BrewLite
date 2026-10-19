# Bối cảnh và phạm vi BrewLite

## 1. Bối cảnh nghiệp vụ
BrewLite là website hỗ trợ khách hàng xem menu, xem chi tiết và tùy chỉnh đồ uống, quản lý giỏ hàng, đặt đơn, thanh toán mô phỏng và theo dõi trạng thái đơn hàng. Hệ thống cũng hỗ trợ nhân viên tiếp nhận, chuẩn bị và cập nhật đơn; quản lý cửa hàng theo dõi hoạt động bán hàng. BrewLite hướng tới việc giúp khách hàng đặt đồ uống thuận tiện hơn, giảm thời gian chờ tại quầy và giúp cửa hàng xử lý đơn rõ ràng, hạn chế sai sót. Trong phạm vi bài tập, thanh toán được mô phỏng và không xử lý giao dịch tiền thật.

## 2. Stakeholder
| Stakeholder | Vai trò | Mục tiêu/kỳ vọng | Mối quan tâm |
|---|---|---|---|
| Khách hàng | Người sử dụng website để xem và đặt đồ uống | Dễ dàng xem menu, tùy chỉnh đồ uống, đặt hàng, thanh toán và theo dõi đơn | Giao diện dễ sử dụng, thông tin đặt đồ uống chính xác, đặt hàng nhanh, thanh toán thuận tiện |
| Nhân viên quầy | Tiếp nhận và xử lý đơn hàng từ khách | Nhận đơn chính xác và xử lý đơn nhanh chóng | Thông tin đơn rõ ràng, hạn chế sai sót, dễ xem đơn mới và cập nhật trạng thái chính xác |
| Quản lý cửa hàng | Quản lý đồ uống, đơn hàng, nhân viên và hoạt động kinh doanh | Quản lý cửa hàng hiệu quả, theo dõi tình hình kinh doanh | Đơn hàng, sản phẩm, nhân viên và doanh thu|
| Giảng viên/người nghiệm thu | Đánh giá hệ thống và kết quả đồ án | Hệ thống đáp ứng yêu cầu và tiêu chí nghiệm thu của đề bài và đúng phạm vi đề tài | Tính đầy đủ, chính xác, tính khả dụng, và khả năng hoạt động của hệ thống |
| Nhóm phát triển | Phân tích, xây dựng, kiểm thử và triển khai hệ thống đúng tiến dộ | Hoàn thành hệ thống đúng yêu cầu và tiến độ | Yêu cầu nghiệp vụ, thiết kế hệ thống, chức năng, dữ liệu và khả năng triển khai |
| Đơn vị thanh toán | Dịch vụ thanh toán mô phỏng   | nhận yêu cầu thanh toán và trả về kết quả thành công/thất bại | Bảo mật dịch vụ, tính chính xác của thanh toán và trạng thái giao dịch |

## 3. Phạm vi MVP (In-scope)
- Khách hàng đăng ký và đăng nhập; nhân viên và quản lý đăng nhập bằng tài khoản được cấp hoặc tài khoản mẫu được tạo sẵn.
- Phân quyền theo vai trò `CUSTOMER`, `STAFF` và `MANAGER`; backend kiểm tra quyền khi gọi chức năng được bảo vệ.
- Khách hàng xem menu, tìm kiếm và xem chi tiết đồ uống.
- Khách hàng chọn size, mức đá, mức đường và topping theo cấu hình sản phẩm.
- Khách hàng thêm món vào giỏ, xem giỏ, sửa số lượng và xóa món.
- Khách hàng tạo đơn hàng, chọn phương thức và thanh toán qua dịch vụ mô phỏng; xem kết quả thanh toán.
- Khách hàng xem lịch sử đơn và theo dõi trạng thái đơn hàng.
- Nhân viên xem đơn mới/chi tiết đơn và cập nhật trạng thái đơn trong phạm vi quyền được cấp.
- Quản lý thêm, sửa, ẩn hoặc xóa đồ uống; quản lý tài khoản nhân viên; xem báo cáo doanh thu cơ bản.

## 4. Phạm vi mở rộng
- Tích hợp cổng thanh toán thật sau khi MVP hoàn tất và được cho phép.
- Tích điểm thành viên, mã khuyến mãi và chương trình chăm sóc khách hàng.
- Quản lý nhiều chi nhánh, tồn kho nâng cao và báo cáo phân tích chuyên sâu.
- Thông báo đẩy hoặc SMS về trạng thái đơn.

## 5. Ngoài phạm vi (Out-of-scope)
- Xử lý giao dịch tiền thật hoặc lưu thông tin thẻ ngân hàng.
- Giao hàng thực tế, định vị shipper hoặc theo dõi lộ trình giao hàng.
- Tích hợp hệ thống kế toán, hóa đơn điện tử hoặc phần mềm bán hàng bên thứ ba.
- Đăng ký công khai tài khoản nhân viên/quản lý; các tài khoản nội bộ do quản lý tạo hoặc được seed sẵn.
- Vận hành chuỗi nhiều cửa hàng trong phiên bản MVP.

## 6. Giả định
- Nhóm cung cấp dữ liệu mẫu về đồ uống, giá, size và topping.
- Người dùng có kết nối Internet và trình duyệt hiện đại để truy cập website.
- Khách hàng tự đăng ký tài khoản; tài khoản nhân viên/quản lý do quản lý tạo hoặc được seed sẵn cho môi trường demo.
- Mỗi tài khoản có một vai trò chính; quyền được kiểm tra ở backend, không chỉ ẩn chức năng trên giao diện.
- Dịch vụ thanh toán trong MVP là mô phỏng và có thể trả kết quả thành công/thất bại.
- MVP mô hình hóa một cửa hàng và các trạng thái đơn cơ bản.

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