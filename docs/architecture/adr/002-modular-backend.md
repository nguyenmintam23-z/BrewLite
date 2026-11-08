# ADR 002 – Tổ chức Backend NestJS theo Module nghiệp vụ
---

## 1. Bối cảnh (Context)

BrewLite là hệ thống quản lý và bán đồ uống, hỗ trợ các nghiệp vụ xác thực người dùng, quản lý sản phẩm, xử lý đơn hàng và thanh toán mô phỏng.

Hệ thống sử dụng Next.js cho frontend, NestJS cho backend và PostgreSQL để lưu trữ dữ liệu. Các thành phần được quản lý trong cùng một repository theo mô hình Monorepo.

Backend chính của BrewLite được xác định tại thư mục `apps/api/`. Ứng dụng sử dụng framework NestJS và tổ chức các chức năng theo module nghiệp vụ.

Theo cấu trúc mã nguồn đã ghi nhận, file `apps/api/src/app.module.ts` đăng ký các module chính:

| Module | Trách nhiệm nghiệp vụ |
|---|---|
| Auth | Xác thực người dùng và hỗ trợ kiểm soát truy cập |
| Products | Quản lý thông tin sản phẩm và đồ uống |
| Orders | Xử lý các nghiệp vụ liên quan đến đơn hàng |
| Payments | Xử lý nghiệp vụ thanh toán, bao gồm thanh toán mô phỏng |

Ngoài ứng dụng tại `apps/api/`, repository còn tồn tại thư mục `src/` ở cấp gốc, chứa mã nguồn NestJS khác. Thành phần này không được xác định là backend nghiệp vụ chính trong quyết định kiến trúc hiện tại.

Các nghiệp vụ của BrewLite có phạm vi xử lý riêng nhưng cần phối hợp trong những luồng hoạt động chung. Vì vậy, backend cần được tổ chức nhằm phân tách trách nhiệm, hạn chế phụ thuộc không cần thiết và hỗ trợ quá trình phát triển, kiểm thử, bảo trì.

## 2. Quyết định kiến trúc (Decision)

BrewLite sử dụng ứng dụng NestJS tại `apps/api/` làm backend nghiệp vụ chính của hệ thống.

Backend được tổ chức theo kiến trúc **Modular Monolith**, trong đó các chức năng nghiệp vụ được phân chia thành những module riêng biệt nhưng cùng hoạt động trong một ứng dụng NestJS.

Các module chính bao gồm:

- **AuthModule:** Phụ trách xác thực người dùng và hỗ trợ kiểm soát truy cập.
- **ProductsModule:** Phụ trách quản lý và cung cấp dữ liệu sản phẩm.
- **OrdersModule:** Phụ trách xử lý các nghiệp vụ liên quan đến đơn hàng.
- **PaymentsModule:** Phụ trách xử lý nghiệp vụ thanh toán của hệ thống.

Mỗi module được tổ chức theo cơ chế của NestJS, với controller tiếp nhận yêu cầu HTTP, service xử lý logic nghiệp vụ và các thành phần truy cập dữ liệu khi cần thiết.

Các module phối hợp thông qua cơ chế dependency injection và các service được công khai theo phạm vi phù hợp. Logic nghiệp vụ được định hướng đặt trong module chịu trách nhiệm tương ứng nhằm hạn chế trùng lặp và phụ thuộc chéo không cần thiết.

Frontend Next.js tại `apps/web-next/` tương tác với backend thông qua API HTTP/REST.

Ứng dụng NestJS tại thư mục `src/` cấp gốc không được lựa chọn làm backend nghiệp vụ chính. Việc duy trì, hợp nhất hoặc loại bỏ thành phần này được xem xét riêng, dựa trên vai trò và sự phụ thuộc thực tế trong repository.

## 3. Cơ sở lựa chọn (Rationale)

Việc lựa chọn kiến trúc backend theo module nghiệp vụ nhằm bảo đảm sự phân tách trách nhiệm và khả năng mở rộng cấu trúc của BrewLite.

NestJS cung cấp cơ chế module hóa cho phép tổ chức các controller, service và provider theo từng phạm vi chức năng. Cách tổ chức này giúp cấu trúc mã nguồn phản ánh rõ các nghiệp vụ của hệ thống.

Đối với BrewLite, các chức năng xác thực, sản phẩm, đơn hàng và thanh toán có trách nhiệm riêng nhưng cần phối hợp trong quá trình xử lý yêu cầu từ người dùng.

Kiến trúc Modular Monolith cho phép duy trì sự phân tách giữa các module mà không yêu cầu mỗi module phải được triển khai thành một dịch vụ độc lập.

So với kiến trúc Microservices, phương án này giảm độ phức tạp trong giao tiếp giữa các dịch vụ, quản lý cấu hình, giám sát và triển khai hạ tầng.

Việc duy trì một ứng dụng backend thống nhất phù hợp với phạm vi đồ án và định hướng triển khai hệ thống trên Render.

Đồng thời, cách tiếp cận này tận dụng cơ chế module của NestJS, hạn chế nhu cầu tái cấu trúc toàn bộ mã nguồn và tạo điều kiện bổ sung các module nghiệp vụ trong tương lai.

## 4. Hệ quả kiến trúc (Consequences)

### 4.1. Tác động tích cực

**Phân tách trách nhiệm nghiệp vụ:** Các chức năng được tổ chức theo module, giúp xác định rõ phạm vi và trách nhiệm xử lý của từng thành phần.

**Tăng khả năng bảo trì:** Việc chỉnh sửa hoặc bổ sung chức năng có thể tập trung vào module tương ứng, giảm mức độ ảnh hưởng đến các thành phần không liên quan.

**Hỗ trợ kiểm thử:** Cơ chế dependency injection của NestJS tạo điều kiện kiểm thử các controller và service độc lập.

**Thuận tiện phối hợp phát triển:** Các thành viên có thể phân chia công việc theo nhóm nghiệp vụ, hỗ trợ quản lý thay đổi trong cùng repository.

**Đơn giản hóa triển khai:** Các module được đóng gói trong một ứng dụng backend thống nhất, không yêu cầu triển khai và quản lý nhiều microservice riêng biệt.

**Hỗ trợ mở rộng chức năng:** Các nghiệp vụ mới có thể được bổ sung dưới dạng module mà không cần thay đổi toàn bộ cấu trúc ứng dụng.

### 4.2. Hạn chế và đánh đổi

**Phụ thuộc giữa các module:** Các nghiệp vụ có liên quan có thể tạo ra sự phụ thuộc chéo. Nếu không kiểm soát tốt, cấu trúc module có thể trở nên khó bảo trì.

**Yêu cầu thống nhất API Contract:** Frontend và backend cần thống nhất cấu trúc request, response, quy tắc xác thực và cách xử lý lỗi để bảo đảm khả năng tích hợp.

**Triển khai đồng thời:** Do các module cùng thuộc một ứng dụng, thay đổi trong một module thường yêu cầu build và triển khai lại toàn bộ backend.

**Giới hạn khả năng mở rộng độc lập:** Các module không thể được phân bổ tài nguyên và mở rộng độc lập như những dịch vụ trong kiến trúc Microservices.

**Yêu cầu kiểm soát cấu hình:** Việc tồn tại mã nguồn NestJS tại cả `apps/api/` và `src/` cấp gốc đòi hỏi cấu hình build, start và deployment phải xác định rõ ứng dụng backend chính.

## 5. Tác động đến kiến trúc hệ thống và triển khai

Trong kiến trúc tổng thể BrewLite, backend NestJS tại `apps/api/` đóng vai trò xử lý các yêu cầu nghiệp vụ từ frontend Next.js.

Các yêu cầu được tiếp nhận thông qua API HTTP/REST và chuyển đến controller, service thuộc module nghiệp vụ tương ứng.

Backend được thiết kế kết nối với PostgreSQL để lưu trữ và truy xuất dữ liệu. Quyết định sử dụng PostgreSQL và cơ chế quản lý schema bằng TypeORM được trình bày trong ADR 003.

Trong môi trường production trên Render, backend NestJS được thiết kế triển khai như một dịch vụ API riêng biệt với frontend Next.js.

Các module Auth, Products, Orders và Payments hoạt động trong cùng ứng dụng NestJS, không được triển khai thành các dịch vụ độc lập.

Hệ thống được định hướng sử dụng endpoint `GET /health` kết hợp với `@nestjs/terminus` để hỗ trợ kiểm tra trạng thái ứng dụng và kết nối cơ sở dữ liệu.

Hoạt động ghi nhật ký được định hướng sử dụng NestJS Logger, xuất log qua `stdout/stderr` và theo dõi thông qua Render Logs.

Các cơ chế Health Check và Logging thuộc thiết kế kiến trúc của hệ thống. Việc hiện thực và kiểm thử thực tế được thực hiện trong giai đoạn triển khai.

## 6. Phạm vi áp dụng và các vấn đề còn tồn tại

Quyết định kiến trúc này áp dụng cho ứng dụng backend chính tại `apps/api/` và các module nghiệp vụ thuộc ứng dụng.

Các cấu hình build, start, CI/CD và deployment phải xác định đúng thư mục ứng dụng backend chính, tránh nhầm lẫn với mã nguồn NestJS tại `src/` cấp gốc.

Vai trò cụ thể của thư mục `src/` cấp gốc cần tiếp tục được làm rõ để bảo đảm repository không duy trì các thành phần trùng lặp hoặc không còn được sử dụng.

Việc hoàn thiện API Contract, kiểm thử tích hợp giữa frontend và backend, cũng như triển khai Health Check và Logging được thực hiện trong các giai đoạn phát triển tiếp theo.

Những công việc triển khai chưa hoàn tất không làm thay đổi quyết định sử dụng `apps/api/` làm backend chính và tổ chức ứng dụng theo các module nghiệp vụ.

## 7. Kết luận

BrewLite lựa chọn ứng dụng NestJS tại `apps/api/` làm backend nghiệp vụ chính và áp dụng kiến trúc Modular Monolith để tổ chức các chức năng của hệ thống.

Các module Auth, Products, Orders và Payments được tổ chức theo phạm vi nghiệp vụ, hỗ trợ phân tách trách nhiệm, phát triển, kiểm thử và bảo trì.

Kiến trúc này phù hợp với quy mô hiện tại của BrewLite, đồng thời duy trì sự đơn giản trong quá trình tích hợp và triển khai hệ thống.
