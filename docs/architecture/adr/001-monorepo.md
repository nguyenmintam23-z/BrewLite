# ADR 001 – Quản lý mã nguồn theo mô hình Monorepo
---

## 1. Bối cảnh (Context)

BrewLite là hệ thống quản lý và bán đồ uống được phát triển theo kiến trúc ứng dụng web, bao gồm giao diện người dùng, hệ thống xử lý nghiệp vụ, cơ sở dữ liệu và các thành phần hỗ trợ triển khai.

Dự án sử dụng Next.js cho frontend, NestJS cho backend và PostgreSQL cho cơ sở dữ liệu. Các thành phần có mối quan hệ phụ thuộc trong quá trình phát triển, tích hợp, kiểm thử và triển khai.

Cấu trúc repository hiện tại bao gồm các thư mục và thành phần chính:

| Thành phần | Vai trò |
|---|---|
| `apps/web-next/` | Mã nguồn ứng dụng frontend Next.js |
| `apps/api/` | Mã nguồn backend NestJS |
| `src/` | Mã nguồn NestJS tại thư mục gốc, cần xác định vai trò trong kiến trúc tổng thể |
| `docs/` | Tài liệu phân tích, thiết kế và kiến trúc hệ thống |
| `.github/workflows/` | Cấu hình quy trình GitHub Actions |
| `docker-compose.yml` | Cấu hình môi trường Docker Compose |

Việc phát triển các thành phần trong cùng một hệ thống đòi hỏi phương án quản lý mã nguồn có khả năng hỗ trợ phối hợp giữa các thành viên, đồng bộ thay đổi và duy trì tính nhất quán giữa mã nguồn với tài liệu kiến trúc.

Hai phương án tổ chức mã nguồn được xem xét là Monorepo, trong đó các thành phần được quản lý trong một repository chung, và Multi-repo, trong đó frontend, backend cùng các thành phần liên quan được quản lý bằng những repository riêng biệt.

## 2. Quyết định kiến trúc (Decision)

BrewLite đề xuất áp dụng mô hình **Monorepo** để tổ chức và quản lý mã nguồn của hệ thống.

Theo mô hình này, frontend Next.js, backend NestJS, tài liệu kiến trúc, cấu hình kiểm thử và cấu hình triển khai được quản lý tập trung trong một GitHub repository.

Cấu trúc thư mục hiện tại được duy trì nhằm bảo đảm tính tương thích với mã nguồn và các cấu hình đã tồn tại. Việc chuẩn hóa hoặc điều chỉnh cấu trúc sẽ được xem xét sau khi xác định đầy đủ vai trò của từng thành phần.

Trong đó, `apps/web-next/` được xác định là thành phần frontend và `apps/api/` là thành phần backend được đề xuất sử dụng trong kiến trúc triển khai. Thư mục `src/` tại cấp root cần được làm rõ vai trò trước khi xác nhận cấu hình build và deployment cuối cùng.

Các thành phần ứng dụng được tổ chức theo thư mục riêng, cho phép phát triển và kiểm thử độc lập ở mức ứng dụng, đồng thời vẫn duy trì khả năng quản lý tập trung trong repository chung.

## 3. Cơ sở lựa chọn (Rationale)

Việc lựa chọn Monorepo xuất phát từ đặc điểm kỹ thuật và phạm vi phát triển của BrewLite.

Trước hết, frontend và backend là hai thành phần của cùng một hệ thống, thường xuyên có những thay đổi liên quan đến cấu trúc API, dữ liệu trao đổi và quy trình nghiệp vụ. Quản lý chung trong một repository giúp theo dõi những thay đổi này trong cùng lịch sử phiên bản.

Bên cạnh đó, tài liệu kiến trúc, sơ đồ triển khai và cấu hình hệ thống có thể được lưu trữ cùng mã nguồn. Điều này tạo điều kiện đối chiếu giữa thiết kế và hiện thực, giảm nguy cơ tài liệu không phản ánh đúng cấu trúc dự án.

Monorepo cũng phù hợp với quy mô phát triển của BrewLite, trong đó các thành viên cùng làm việc trên một sản phẩm và sử dụng GitHub để phối hợp, quản lý nhánh và tích hợp thay đổi.

So với Multi-repo, phương án Monorepo giảm nhu cầu đồng bộ nhiều repository độc lập. Tuy nhiên, phương án này đòi hỏi quy ước tổ chức thư mục và cấu hình CI/CD rõ ràng để tránh ảnh hưởng không cần thiết giữa các thành phần.

## 4. Hệ quả kiến trúc (Consequences)

### 4.1. Tác động tích cực

**Quản lý mã nguồn tập trung:** Các thành phần chính của BrewLite được quản lý trong cùng repository, tạo thuận lợi cho việc theo dõi phiên bản, kiểm soát thay đổi và phối hợp phát triển.

**Đồng bộ giữa frontend và backend:** Những thay đổi liên quan đến giao diện API và chức năng nghiệp vụ có thể được theo dõi và tích hợp trong cùng quy trình quản lý mã nguồn.

**Truy vết kiến trúc:** Tài liệu kiến trúc và sơ đồ triển khai được lưu trữ cùng mã nguồn, hỗ trợ việc đối chiếu giữa thiết kế và thành phần hiện thực.

**Hỗ trợ tích hợp liên tục:** GitHub Actions có thể được cấu hình để kiểm tra, xây dựng và kiểm thử các ứng dụng trong cùng repository.

**Phù hợp với quy mô dự án:** Phương án quản lý tập trung giúp giảm độ phức tạp về tổ chức repository trong phạm vi phát triển hiện tại.

### 4.2. Hạn chế và đánh đổi

**Độ phức tạp của CI/CD:** Các ứng dụng có công nghệ và quy trình build riêng. Workflow cần xác định chính xác thư mục làm việc, dependencies và lệnh kiểm thử tương ứng.

**Nguy cơ nhầm lẫn thành phần backend:** Sự tồn tại đồng thời của `apps/api/` và `src/` tại cấp root có thể dẫn đến việc lựa chọn sai mã nguồn khi xây dựng hoặc triển khai ứng dụng.

**Gia tăng quy mô repository:** Khi hệ thống mở rộng, số lượng thư mục, dependencies và cấu hình có thể làm tăng độ phức tạp trong quản lý.

**Phụ thuộc vào quy ước phối hợp:** Các thành viên cần thống nhất cách đặt tên nhánh, phạm vi thay đổi và quy trình tích hợp để hạn chế xung đột mã nguồn.

## 5. Tác động đến triển khai và vận hành

Quyết định sử dụng Monorepo ảnh hưởng trực tiếp đến cách tổ chức quy trình CI/CD và triển khai ứng dụng.

Các quy trình build và kiểm thử cần phân biệt rõ frontend Next.js và backend NestJS thông qua đường dẫn mã nguồn tương ứng.

Trong môi trường production trên Render, frontend và backend được thiết kế thành các dịch vụ triển khai riêng biệt, mặc dù mã nguồn của chúng được quản lý trong cùng repository.

Cấu hình triển khai phải xác định đúng thư mục ứng dụng, lệnh build, lệnh khởi động và các biến môi trường cần thiết cho từng dịch vụ.

Việc sử dụng Monorepo không yêu cầu các thành phần phải chạy trong cùng một tiến trình hoặc cùng một dịch vụ triển khai. Ranh giới giữa các thành phần ứng dụng vẫn được duy trì theo kiến trúc hệ thống.

## 6. Các vấn đề chưa được xác nhận

Tại thời điểm lập ADR, vai trò của thư mục `src/` tại cấp root chưa được xác nhận đầy đủ.

Việc lựa chọn `apps/api/` làm backend chính cho môi trường triển khai cần được nhóm xác nhận để bảo đảm thống nhất giữa mã nguồn, tài liệu kiến trúc và cấu hình CI/CD.

Các thay đổi liên quan đến chuẩn hóa thư mục hoặc loại bỏ thành phần trùng lặp chỉ được thực hiện sau khi có quyết định chung của nhóm và đánh giá tác động đến hệ thống.

## 7. Kết luận

Mô hình Monorepo được đề xuất là phương án tổ chức mã nguồn phù hợp với kiến trúc và phạm vi phát triển hiện tại của BrewLite.

Phương án này hỗ trợ quản lý tập trung, đồng bộ thay đổi giữa các thành phần và duy trì khả năng truy vết từ tài liệu kiến trúc đến mã nguồn.
