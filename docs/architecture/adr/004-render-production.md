# ADR 004 – Lựa chọn Render làm nền tảng triển khai Production
---

## 1. Bối cảnh (Context)

BrewLite là hệ thống quản lý và bán đồ uống được phát triển bằng Next.js cho frontend, NestJS cho backend và PostgreSQL làm hệ quản trị cơ sở dữ liệu.

Theo yêu cầu của Assignment 2, hệ thống cần được triển khai trên một môi trường production có thể truy cập qua Internet, đồng thời bảo đảm khả năng vận hành, quản lý cấu hình và giám sát các thành phần.

Môi trường production cần đáp ứng những yêu cầu chính sau:

- Frontend Next.js có thể truy cập thông qua HTTPS.
- Backend NestJS cung cấp API để frontend thực hiện các chức năng nghiệp vụ.
- PostgreSQL lưu trữ dữ liệu bền vững, không phụ thuộc vào vòng đời của ứng dụng.
- Các thông tin nhạy cảm được quản lý thông qua environment variables hoặc secrets.
- Hệ thống hỗ trợ ghi nhận log phục vụ theo dõi và xử lý sự cố.
- Có cơ chế Health Check nhằm kiểm tra trạng thái hoạt động của các dịch vụ.
- Quy trình triển khai có khả năng tích hợp với GitHub và CI/CD.
- Deployment Diagram phản ánh đúng các thành phần và môi trường triển khai thực tế.

Trong cấu trúc dự án, frontend Next.js được đặt tại `apps/web-next/`, backend NestJS chính được xác định tại `apps/api/`.

Nhóm cần lựa chọn một nền tảng triển khai phù hợp với quy mô đồ án, hỗ trợ các công nghệ đang sử dụng và hạn chế độ phức tạp trong quản trị hạ tầng.

Ngày 08/11/2026, nhóm đã xác nhận lựa chọn Render làm nền tảng production cho BrewLite.

## 2. Quyết định kiến trúc (Decision)

BrewLite lựa chọn **Render** làm nền tảng triển khai và vận hành hệ thống trong môi trường production.

Kiến trúc triển khai được định hướng phân tách frontend, backend và cơ sở dữ liệu thành các dịch vụ riêng biệt.

### 2.1. Triển khai Frontend Next.js

Frontend của BrewLite được phát triển bằng Next.js và đặt tại thư mục `apps/web-next/`.

Phương án triển khai đề xuất là sử dụng một Render Web Service dành riêng cho frontend.

Dịch vụ này chịu trách nhiệm cung cấp giao diện website, xử lý các chức năng frontend và giao tiếp với backend thông qua API.

Người dùng truy cập website qua HTTPS bằng địa chỉ production được Render cung cấp hoặc tên miền được cấu hình cho dự án.

Cấu hình Root Directory, Build Command và Start Command của dịch vụ frontend cần được xác định phù hợp với cấu trúc thực tế của ứng dụng Next.js.

### 2.2. Triển khai Backend NestJS

Backend chính của BrewLite được đặt tại thư mục `apps/api/`, sử dụng NestJS và được tổ chức theo các module nghiệp vụ như đã xác định trong ADR 002.

Phương án triển khai đề xuất là sử dụng một Render Web Service riêng cho backend.

Dịch vụ backend chịu trách nhiệm tiếp nhận các yêu cầu API, thực thi logic nghiệp vụ và truy cập cơ sở dữ liệu PostgreSQL.

Frontend và backend được triển khai độc lập ở cấp dịch vụ, cho phép quản lý cấu hình, quá trình build và hoạt động vận hành của từng thành phần.

Các yêu cầu từ frontend đến backend production được thực hiện thông qua HTTPS.

Cấu hình CORS của NestJS cần giới hạn những nguồn truy cập được cho phép dựa trên địa chỉ frontend production thực tế.

### 2.3. Triển khai cơ sở dữ liệu PostgreSQL

BrewLite lựa chọn **Render Postgres** làm phương án cơ sở dữ liệu production, phù hợp với quyết định sử dụng PostgreSQL và TypeORM trong ADR 003.

PostgreSQL được tổ chức thành một dịch vụ dữ liệu riêng biệt với frontend và backend.

Backend NestJS truy cập cơ sở dữ liệu thông qua thông tin kết nối được quản lý bằng environment variables hoặc secrets.

Kết nối giữa backend và PostgreSQL được định hướng sử dụng địa chỉ nội bộ của Render khi các dịch vụ được triển khai trong điều kiện hỗ trợ kết nối nội bộ.

Frontend không kết nối trực tiếp đến PostgreSQL. Các thao tác dữ liệu được thực hiện thông qua backend NestJS.

Dịch vụ PostgreSQL phải bảo đảm khả năng lưu trữ dữ liệu bền vững. Gói dịch vụ cụ thể cần đáp ứng yêu cầu về dung lượng lưu trữ, thời gian duy trì hệ thống và phương án sao lưu dữ liệu.

### 2.4. Quản lý cấu hình và thông tin nhạy cảm

Các thông số cấu hình của hệ thống được quản lý riêng cho từng môi trường.

Những thông tin như địa chỉ kết nối cơ sở dữ liệu, tài khoản, mật khẩu, JWT secret và các giá trị nhạy cảm khác phải được lưu trữ thông qua environment variables hoặc cơ chế quản lý secrets phù hợp.

Thông tin nhạy cảm không được ghi trực tiếp vào mã nguồn, commit lên Git repository hoặc xuất hiện trong log ứng dụng.

Các giá trị cấu hình không nhạy cảm có thể được mô tả trong file `.env.example` để hỗ trợ quá trình thiết lập môi trường.

### 2.5. Health Check và Logging

Backend NestJS được thiết kế cung cấp endpoint `GET /health` để phục vụ kiểm tra trạng thái hoạt động của hệ thống.

Cơ chế Health Check được định hướng sử dụng thư viện `@nestjs/terminus`, hỗ trợ kiểm tra trạng thái API và khả năng kết nối PostgreSQL.

Khi cơ chế này được triển khai, Render có thể được cấu hình sử dụng endpoint Health Check phù hợp để giám sát trạng thái dịch vụ.

Hoạt động ghi nhật ký được định hướng sử dụng NestJS Logger.

Log ứng dụng được xuất qua `stdout/stderr` để có thể theo dõi thông qua hệ thống log của Render.

Thông tin log cần hỗ trợ quá trình phát hiện, phân tích và xử lý sự cố, đồng thời không tiết lộ dữ liệu nhạy cảm.

Health Check và Logging là các thành phần thuộc thiết kế kiến trúc. Việc hiện thực và kiểm thử thực tế được thực hiện trong giai đoạn triển khai.

### 2.6. Tích hợp GitHub và CI/CD

Mã nguồn BrewLite được quản lý trong GitHub repository theo cấu trúc Monorepo được mô tả trong ADR 001.

Quy trình CI/CD được định hướng hỗ trợ các hoạt động kiểm tra chất lượng mã nguồn, build và triển khai ứng dụng.

Pipeline cần xác định rõ thư mục ứng dụng frontend và backend nhằm bảo đảm quá trình build sử dụng đúng mã nguồn.

Đối với việc quản lý Docker image, nhóm đang xem xét sử dụng **GitHub Container Registry (GHCR)** làm nơi lưu trữ image của frontend và backend.

GHCR hiện là phương án đề xuất và chưa được xác nhận là thành phần chính thức của hệ thống triển khai.

Trong trường hợp nhóm lựa chọn triển khai trực tiếp từ GitHub thông qua cơ chế build của Render, quy trình triển khai sẽ được thiết kế tương ứng và không mặc định có bước đẩy image lên container registry.

Quy trình CD chính thức phải được xác định dựa trên phương án triển khai thực tế của nhóm.

### 2.7. Quản lý Database Migrations khi triển khai

BrewLite sử dụng TypeORM Migrations để quản lý những thay đổi cấu trúc cơ sở dữ liệu, theo quyết định được trình bày trong ADR 003.

Quy trình triển khai cần bảo đảm migration được kiểm tra trước khi áp dụng trên PostgreSQL production.

Migration phải được thực thi ở thời điểm phù hợp với phiên bản backend nhằm duy trì tính tương thích giữa ứng dụng và schema cơ sở dữ liệu.

Nếu migration thất bại, quy trình triển khai phiên bản phụ thuộc vào schema mới phải dừng để kiểm tra và xử lý sự cố.

Những thay đổi schema có nguy cơ ảnh hưởng dữ liệu cần được đánh giá và có phương án sao lưu, khôi phục thích hợp.

## 3. Cơ sở lựa chọn (Rationale)

Render được lựa chọn vì phù hợp với định hướng triển khai hệ thống web gồm frontend Next.js, backend NestJS và PostgreSQL.

Nền tảng này cung cấp các loại dịch vụ hỗ trợ triển khai ứng dụng web và quản lý cơ sở dữ liệu, cho phép tổ chức các thành phần của BrewLite thành những dịch vụ riêng biệt.

Việc sử dụng nền tảng triển khai được quản lý giúp nhóm hạn chế nhu cầu tự thiết lập và quản trị máy chủ, đồng thời tập trung nguồn lực vào phát triển, tích hợp và kiểm thử ứng dụng.

Render hỗ trợ kết nối với GitHub, tạo điều kiện xây dựng quy trình triển khai gắn với repository và các thay đổi mã nguồn.

Các chức năng quản lý environment variables, logs và cấu hình dịch vụ giúp đơn giản hóa hoạt động vận hành so với phương án tự quản lý toàn bộ máy chủ.

Việc lựa chọn Render cũng phù hợp với quy mô đồ án BrewLite và yêu cầu trình diễn hệ thống trên một môi trường có thể truy cập công khai.

Bên cạnh đó, việc phân tách frontend, backend và PostgreSQL thành các dịch vụ riêng tạo điều kiện quản lý cấu hình và giám sát từng thành phần mà không yêu cầu thay đổi kiến trúc ứng dụng sang Microservices.

## 4. Hệ quả kiến trúc (Consequences)

### 4.1. Tác động tích cực

**Đơn giản hóa quản trị hạ tầng:** Nhóm không cần trực tiếp xây dựng và vận hành toàn bộ máy chủ ứng dụng và cơ sở dữ liệu.

**Phân tách các thành phần triển khai:** Frontend, backend và PostgreSQL được quản lý thành các dịch vụ riêng biệt, phù hợp với kiến trúc hệ thống.

**Hỗ trợ triển khai qua GitHub:** Nền tảng có khả năng tích hợp với GitHub để hỗ trợ quá trình cập nhật và phát hành ứng dụng.

**Quản lý cấu hình tập trung:** Environment variables và secrets có thể được cấu hình cho từng dịch vụ, hạn chế việc lưu thông tin nhạy cảm trong mã nguồn.

**Hỗ trợ theo dõi hoạt động:** Các chức năng logs và Health Check hỗ trợ giám sát tình trạng vận hành và xử lý sự cố.

**Phù hợp với quy mô đồ án:** Phương án triển khai trên nền tảng được quản lý giúp giảm khối lượng công việc vận hành hạ tầng trong quá trình phát triển BrewLite.

**Thuận tiện trình diễn hệ thống:** Môi trường production có thể cung cấp các địa chỉ HTTPS phục vụ kiểm thử và đánh giá sản phẩm.

### 4.2. Hạn chế và đánh đổi

**Phụ thuộc vào nhà cung cấp dịch vụ:** Khả năng vận hành hệ thống chịu ảnh hưởng bởi chính sách dịch vụ, giới hạn tài nguyên và tình trạng hoạt động của Render.

**Chi phí vận hành:** Việc sử dụng các dịch vụ web và cơ sở dữ liệu có thể phát sinh chi phí, tùy theo gói dịch vụ được lựa chọn.

**Giới hạn tài nguyên:** Hiệu năng và khả năng duy trì hoạt động phụ thuộc vào cấu hình và tài nguyên của từng dịch vụ.

**Yêu cầu quản lý nhiều cấu hình:** Frontend, backend và PostgreSQL có các thông số kết nối và môi trường khác nhau, đòi hỏi việc cấu hình chính xác.

**Yêu cầu cấu hình giao tiếp giữa các dịch vụ:** Backend cần cấu hình CORS, thông tin kết nối cơ sở dữ liệu và các thông số bảo mật phù hợp với môi trường production.

**Phụ thuộc vào quy trình triển khai:** Việc lựa chọn triển khai từ GitHub hay Docker image ảnh hưởng đến thiết kế pipeline CI/CD và hoạt động quản lý phiên bản.

**Yêu cầu bảo vệ dữ liệu:** PostgreSQL production cần phương án sao lưu, khôi phục và giám sát phù hợp để hạn chế rủi ro mất dữ liệu.

## 5. Tác động đến kiến trúc hệ thống

Kiến trúc triển khai production của BrewLite được tổ chức theo ba thành phần chính:

| Thành phần | Công nghệ | Phương án triển khai |
|---|---|---|
| Frontend | Next.js | Render Web Service |
| Backend | NestJS | Render Web Service |
| Database | PostgreSQL | Render Postgres |

Người dùng truy cập frontend Next.js thông qua HTTPS.

Frontend gửi yêu cầu nghiệp vụ đến backend NestJS thông qua HTTPS và các API đã được định nghĩa.

Backend xử lý yêu cầu và truy cập PostgreSQL để lưu trữ hoặc truy xuất dữ liệu.

Cơ sở dữ liệu được thiết kế tách biệt khỏi frontend và backend, đồng thời sử dụng cơ chế lưu trữ bền vững phù hợp.

GitHub đóng vai trò lưu trữ và quản lý mã nguồn. Quy trình CI/CD được thiết kế để kiểm tra chất lượng và triển khai những thay đổi đã được chấp thuận.

GHCR được xem xét như thành phần container registry tùy chọn, chỉ được đưa vào luồng triển khai chính thức nếu nhóm quyết định sử dụng Docker image từ registry.

Mô hình triển khai này là cơ sở cho UML Deployment Diagram của BrewLite, đồng thời cần được cập nhật khi cấu hình production thực tế được hoàn thiện.

## 6. Các nội dung cần hoàn thiện và kiểm chứng

Quyết định lựa chọn Render đã được nhóm xác nhận. Tuy nhiên, những nội dung cấu hình và triển khai sau đây cần tiếp tục được hoàn thiện:

1. **Region:** Xác định khu vực triển khai phù hợp cho frontend, backend và PostgreSQL.
2. **Frontend Service:** Xác nhận loại dịch vụ, Root Directory, Build Command và Start Command cho `apps/web-next/`.
3. **Backend Service:** Xác nhận Root Directory, Build Command và Start Command cho `apps/api/`.
4. **PostgreSQL:** Xác nhận gói Render Postgres, cấu hình kết nối nội bộ, thời gian duy trì dữ liệu và cơ chế sao lưu.
5. **Environment Variables:** Xác định danh sách cấu hình bắt buộc và phương pháp quản lý secrets.
6. **HTTPS và CORS:** Xác nhận URL production của frontend và API, đồng thời kiểm thử cấu hình giao tiếp giữa hai dịch vụ.
7. **Health Check:** Hiện thực và kiểm thử endpoint `GET /health`, bao gồm kiểm tra khả năng kết nối PostgreSQL.
8. **Logging:** Kiểm thử khả năng ghi nhận và theo dõi log thông qua Render.
9. **CI/CD và Container Registry:** Thống nhất lựa chọn triển khai trực tiếp từ GitHub hoặc sử dụng Docker image thông qua registry như GHCR.
10. **Database Migrations:** Xác nhận quy trình thực thi migration trong quá trình triển khai.
11. **Backup và Rollback:** Xác định và kiểm thử phương án xử lý khi triển khai hoặc cập nhật dữ liệu thất bại.
12. **Smoke Test:** Kiểm tra những chức năng quan trọng sau khi triển khai để xác nhận frontend, backend và cơ sở dữ liệu hoạt động đồng bộ.

Các công việc trên thuộc giai đoạn cấu hình, hiện thực, kiểm thử và vận hành production.

Việc chưa hoàn tất các công việc này không làm thay đổi quyết định lựa chọn Render làm nền tảng production của BrewLite.

## 7. Kết luận

BrewLite lựa chọn Render làm nền tảng triển khai production theo quyết định đã được nhóm xác nhận ngày 08/11/2026.

Kiến trúc triển khai được định hướng phân tách frontend Next.js, backend NestJS và PostgreSQL thành những dịch vụ độc lập ở cấp hạ tầng.

Phương án này phù hợp với quy mô đồ án, hỗ trợ tích hợp GitHub, quản lý cấu hình và theo dõi hoạt động của hệ thống.

Các cơ chế HTTPS, secrets, Health Check, Logging, Database Migrations và CI/CD được xác định là những thành phần cần thiết của kiến trúc triển khai.

Chi tiết về cấu hình dịch vụ, container registry, quy trình CD và các phương án kiểm thử, sao lưu, khôi phục tiếp tục được hoàn thiện trong các giai đoạn triển khai.
