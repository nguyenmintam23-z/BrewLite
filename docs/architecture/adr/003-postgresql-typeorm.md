# ADR 003 – Sử dụng PostgreSQL với TypeORM và Database Migrations
---

## 1. Bối cảnh (Context)

BrewLite là hệ thống quản lý và bán đồ uống, hỗ trợ các nghiệp vụ xác thực người dùng, quản lý sản phẩm, xử lý đơn hàng và thanh toán mô phỏng.

Hệ thống sử dụng Next.js cho frontend, NestJS cho backend và PostgreSQL để lưu trữ dữ liệu. Backend chính được xác định tại thư mục `apps/api/`, với các chức năng được tổ chức theo module nghiệp vụ như mô tả trong ADR 002.

Các dữ liệu người dùng, sản phẩm, đơn hàng và thanh toán có mối quan hệ với nhau, đòi hỏi hệ thống phải bảo đảm tính nhất quán, toàn vẹn và khả năng duy trì dữ liệu trong quá trình vận hành.

Trong cấu trúc mã nguồn hiện tại, ứng dụng NestJS tại `apps/api/` đã được cấu hình sử dụng TypeORM kết hợp với PostgreSQL.

File `apps/api/src/app.module.ts` có cấu hình `synchronize: false`, nhằm vô hiệu hóa việc TypeORM tự động đồng bộ cấu trúc cơ sở dữ liệu khi ứng dụng khởi động.

Dự án sử dụng cấu hình DataSource tại `database/data-source.ts` để xác định kết nối cơ sở dữ liệu và vị trí các file migration. Các file migration được quản lý trong mã nguồn nhằm hỗ trợ cập nhật schema theo phiên bản.

Trong môi trường phát triển cục bộ, PostgreSQL được chạy thông qua Docker Compose và sử dụng named volume để duy trì dữ liệu độc lập với vòng đời của container.

Việc thay đổi cấu trúc dữ liệu trong quá trình phát triển cần được kiểm soát nhằm hạn chế rủi ro mất dữ liệu, sai lệch schema và không tương thích giữa phiên bản ứng dụng với cơ sở dữ liệu.

Do đó, hệ thống cần một phương án thống nhất về công nghệ lưu trữ, quản lý schema, lưu trữ production và xử lý sự cố dữ liệu.

## 2. Quyết định kiến trúc (Decision)

BrewLite lựa chọn **PostgreSQL** làm hệ quản trị cơ sở dữ liệu quan hệ chính và sử dụng **TypeORM** để tích hợp cơ sở dữ liệu với backend NestJS tại `apps/api/`.

Các thay đổi cấu trúc cơ sở dữ liệu được quản lý bằng **TypeORM Migrations**, thay vì sử dụng cơ chế tự động đồng bộ schema.

### 2.1. Công nghệ cơ sở dữ liệu

PostgreSQL được sử dụng để lưu trữ dữ liệu nghiệp vụ của BrewLite.

TypeORM đóng vai trò ánh xạ các thực thể trong ứng dụng NestJS với cấu trúc dữ liệu quan hệ, đồng thời hỗ trợ truy vấn và cập nhật dữ liệu thông qua entity và repository.

Các thành phần nghiệp vụ của backend truy cập dữ liệu thông qua các cơ chế do TypeORM cung cấp, kết hợp với truy vấn SQL khi cần thiết.

### 2.2. Quản lý thay đổi schema

BrewLite sử dụng TypeORM Migrations để ghi nhận và thực hiện các thay đổi cấu trúc cơ sở dữ liệu.

Các file migration được lưu trong Git repository để quản lý lịch sử thay đổi và đồng bộ schema giữa các môi trường.

Cấu hình `synchronize: false` được duy trì nhằm ngăn TypeORM tự động cập nhật cấu trúc bảng khi ứng dụng khởi động.

Migration phải được thực thi bằng một quy trình có kiểm soát và phù hợp với phiên bản backend được triển khai.

Trước khi áp dụng migration trên production, cần kiểm tra tính tương thích với schema hiện tại và đánh giá nguy cơ ảnh hưởng đến dữ liệu.

### 2.3. Cơ sở dữ liệu trong môi trường local

Trong môi trường phát triển cục bộ, PostgreSQL được vận hành thông qua Docker Compose.

Dữ liệu được lưu trữ bằng Docker named volume nhằm duy trì dữ liệu khi container được khởi động lại hoặc tạo lại.

Cấu hình kết nối được quản lý thông qua biến môi trường, bảo đảm phù hợp với ứng dụng backend NestJS.

### 2.4. Cơ sở dữ liệu trong môi trường production

BrewLite lựa chọn **Render Postgres** làm phương án cơ sở dữ liệu production, phù hợp với định hướng triển khai frontend và backend trên Render.

Backend NestJS kết nối đến PostgreSQL thông qua thông tin kết nối được cấu hình bằng environment variables hoặc cơ chế quản lý secrets của Render.

Cơ sở dữ liệu production không được thiết kế để frontend hoặc người dùng bên ngoài truy cập trực tiếp.

Kết nối giữa backend và cơ sở dữ liệu được ưu tiên sử dụng mạng nội bộ của Render khi các dịch vụ được triển khai trong điều kiện hỗ trợ kết nối nội bộ.

Gói dịch vụ PostgreSQL phải đáp ứng yêu cầu duy trì dữ liệu trong thời gian vận hành và trình diễn hệ thống. Việc lựa chọn gói cụ thể được thực hiện trong giai đoạn triển khai, có xem xét giới hạn lưu trữ, thời hạn sử dụng và khả năng sao lưu.

### 2.5. Sao lưu và xử lý sự cố

BrewLite áp dụng nguyên tắc sao lưu dữ liệu trước khi thực hiện những thay đổi schema quan trọng có nguy cơ ảnh hưởng đến dữ liệu hiện có.

Các bản sao lưu cần được bảo quản an toàn và có khả năng sử dụng trong quá trình khôi phục dữ liệu.

Nếu migration thất bại, quy trình triển khai phải dừng để kiểm tra và xử lý lỗi trước khi tiếp tục.

Đối với migration có thể đảo ngược an toàn, nhóm có thể sử dụng cơ chế rollback phù hợp.

Đối với những thay đổi không thể đảo ngược hoặc có nguy cơ mất dữ liệu, việc khôi phục cần dựa trên bản sao lưu và phương án phục hồi đã được kiểm chứng.

## 3. Cơ sở lựa chọn (Rationale)

PostgreSQL là hệ quản trị cơ sở dữ liệu quan hệ phù hợp với nhu cầu lưu trữ dữ liệu có cấu trúc và các mối quan hệ nghiệp vụ trong BrewLite.

Các chức năng quản lý người dùng, sản phẩm, đơn hàng và thanh toán cần duy trì sự nhất quán của dữ liệu trong quá trình xử lý.

PostgreSQL cung cấp transaction, khóa ngoại và các ràng buộc toàn vẹn dữ liệu, giúp hỗ trợ yêu cầu này.

TypeORM được lựa chọn do khả năng tích hợp với NestJS và cơ chế ánh xạ đối tượng – quan hệ, giúp tổ chức hoạt động truy cập dữ liệu thông qua entity và repository.

Việc duy trì PostgreSQL và TypeORM cũng tận dụng các thành phần đã được cấu hình trong mã nguồn, hạn chế thay đổi công nghệ và giảm chi phí điều chỉnh kiến trúc hiện tại.

TypeORM Migrations được lựa chọn để kiểm soát sự thay đổi của schema theo từng phiên bản.

So với việc tự động đồng bộ schema, migration giúp nhóm chủ động xác định những thay đổi cần áp dụng, theo dõi lịch sử thay đổi và phối hợp tốt hơn với quy trình quản lý mã nguồn bằng Git.

Trong môi trường local, Docker Compose giúp đơn giản hóa việc khởi tạo PostgreSQL và duy trì cấu hình nhất quán giữa các thành viên.

Đối với production, Render Postgres được lựa chọn nhằm đồng bộ với nền tảng triển khai dự kiến của hệ thống, giảm nhu cầu tự quản trị máy chủ cơ sở dữ liệu.

## 4. Hệ quả kiến trúc (Consequences)

### 4.1. Tác động tích cực

**Bảo đảm tính toàn vẹn dữ liệu:** PostgreSQL cung cấp các cơ chế quản lý quan hệ và transaction, hỗ trợ duy trì dữ liệu nghiệp vụ nhất quán.

**Quản lý schema theo phiên bản:** TypeORM Migrations cho phép ghi nhận và kiểm soát những thay đổi trong cấu trúc cơ sở dữ liệu.

**Hạn chế thay đổi ngoài ý muốn:** Cấu hình `synchronize: false` giúp tránh việc tự động đồng bộ schema khi backend khởi động.

**Thuận tiện phát triển và kiểm thử:** Docker Compose cung cấp môi trường PostgreSQL local có thể tái sử dụng giữa các lần chạy ứng dụng.

**Tích hợp với NestJS:** TypeORM hỗ trợ tổ chức các thao tác truy cập dữ liệu theo cấu trúc của ứng dụng backend.

**Thống nhất hạ tầng production:** Render Postgres phù hợp với định hướng triển khai ứng dụng BrewLite trên Render.

**Hỗ trợ truy vết thay đổi:** Các file migration được quản lý trong repository, giúp liên kết thay đổi schema với lịch sử phát triển mã nguồn.

### 4.2. Hạn chế và đánh đổi

**Yêu cầu quản lý migration:** Các thay đổi schema cần được xây dựng, kiểm thử và thực thi theo quy trình phù hợp.

**Rủi ro khi thay đổi cấu trúc dữ liệu:** Migration không chính xác có thể gây lỗi ứng dụng hoặc ảnh hưởng đến dữ liệu hiện có.

**Khả năng rollback bị giới hạn:** Không phải mọi migration đều có thể đảo ngược an toàn, đặc biệt đối với những thay đổi liên quan đến xóa hoặc chuyển đổi dữ liệu.

**Phụ thuộc vào nền tảng production:** Việc sử dụng Render Postgres tạo ra sự phụ thuộc nhất định vào chính sách dịch vụ, cấu hình và chi phí vận hành của Render.

**Yêu cầu sao lưu và khôi phục:** Hệ thống cần có phương án bảo vệ dữ liệu, đặc biệt trước các thay đổi quan trọng trên production.

**Yêu cầu tương thích phiên bản:** Backend và schema cơ sở dữ liệu phải tương thích trong quá trình triển khai và cập nhật hệ thống.

## 5. Tác động đến kiến trúc hệ thống và triển khai

Trong kiến trúc tổng thể BrewLite, PostgreSQL đóng vai trò là thành phần lưu trữ dữ liệu chính.

Frontend Next.js tại `apps/web-next/` không truy cập trực tiếp PostgreSQL mà gửi yêu cầu thông qua API HTTP/REST đến backend NestJS tại `apps/api/`.

Backend xử lý nghiệp vụ và thực hiện các thao tác truy xuất, cập nhật dữ liệu thông qua TypeORM.

Trong môi trường local, PostgreSQL chạy bằng Docker Compose với named volume. Backend sử dụng cấu hình kết nối phù hợp với môi trường phát triển.

Trong môi trường production, backend NestJS và cơ sở dữ liệu Render Postgres được thiết kế hoạt động như những dịch vụ riêng biệt.

Thông tin kết nối cơ sở dữ liệu được quản lý bằng environment variables hoặc secrets, không lưu trực tiếp trong mã nguồn.

Quy trình CI/CD cần phối hợp việc cập nhật phiên bản ứng dụng với các thay đổi schema.

Migration phải được kiểm tra trước khi triển khai và thực thi theo trình tự phù hợp để hạn chế thời gian gián đoạn và bảo đảm tính tương thích dữ liệu.

Khi migration thất bại, việc triển khai phiên bản ứng dụng phụ thuộc vào schema mới phải dừng lại cho đến khi sự cố được xử lý.

Công tác sao lưu, khôi phục và kiểm thử migration được thực hiện trong các giai đoạn triển khai tiếp theo.

## 6. Công việc triển khai và kiểm chứng

Các quyết định công nghệ và định hướng quản lý dữ liệu đã được xác lập. Những công việc kỹ thuật cần thực hiện để hiện thực và kiểm chứng quyết định gồm:

1. Kiểm tra cấu hình TypeORM và DataSource trong backend chính tại `apps/api/`.
2. Xác nhận và kiểm thử lệnh thực thi TypeORM Migrations.
3. Kiểm tra quy trình seed dữ liệu ban đầu và khả năng chạy lại an toàn.
4. Cấu hình dịch vụ Render Postgres và kết nối với backend production.
5. Lựa chọn gói dịch vụ đáp ứng yêu cầu lưu trữ và thời gian duy trì hệ thống.
6. Thiết lập và kiểm thử phương án sao lưu, khôi phục dữ liệu.
7. Xây dựng quy trình xử lý sự cố migration và rollback phù hợp.
8. Kiểm tra tính tương thích giữa phiên bản backend và schema trong quy trình triển khai.

Các công việc trên thuộc giai đoạn hiện thực, kiểm thử và triển khai, không làm thay đổi những quyết định công nghệ đã được xác lập trong ADR này.

## 7. Kết luận

BrewLite lựa chọn PostgreSQL làm hệ quản trị cơ sở dữ liệu chính, TypeORM làm công cụ tích hợp dữ liệu với NestJS và TypeORM Migrations để quản lý thay đổi cấu trúc cơ sở dữ liệu.

Hệ thống duy trì cấu hình `synchronize: false` nhằm kiểm soát thay đổi schema thông qua migration.

Trong môi trường local, PostgreSQL được vận hành bằng Docker Compose với named volume. Trong môi trường production, Render Postgres được lựa chọn làm phương án lưu trữ dữ liệu.

Các thay đổi schema quan trọng cần được kiểm tra và sao lưu dữ liệu trước khi áp dụng. Khi migration thất bại, quy trình triển khai phải dừng để xử lý sự cố và tiến hành khôi phục nếu cần thiết.
