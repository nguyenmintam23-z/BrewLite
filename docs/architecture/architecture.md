# BrewLite – Tài liệu thiết kế kiến trúc (Task 3.1)

**Trạng thái:** DRAFT – nhóm đã chọn Render làm nền tảng production; backend chính vẫn chờ xác nhận. Chưa có bằng chứng hệ thống đã deploy.  
**Căn cứ:** Assignment 2, Task 3.1–3.2; bản mã nguồn BrewLite ZIP cung cấp ngày 08/11/2026.

## 1. Mục tiêu và phạm vi

Mô tả kiến trúc đề xuất cho luồng xem menu → chọn tùy chọn → giỏ hàng → đặt đơn → thanh toán mô phỏng → theo dõi đơn. Kiến trúc phân lớp kết hợp backend NestJS chia module. Tài liệu phân biệt **hiện trạng đã quan sát** với **hạng mục dự kiến**.

## 2. Kiến trúc ứng dụng đề xuất

```text
Thiết bị người dùng (Browser)
        | HTTP(S) / JSON
        v
Next.js frontend [apps/web-next/]
        | REST API (cấu hình địa chỉ API cần kiểm tra)
        v
NestJS backend [apps/api/ – ĐỀ XUẤT]
  | Auth | Products | Orders | Payments |
        | TypeORM
        v
PostgreSQL (local: Docker Compose + named volume)
```

Đây là sơ đồ **ứng dụng**, chưa phải sơ đồ triển khai production.

## 3. Các thành phần và mã nguồn đối chiếu

| Thành phần | Bằng chứng trong repository | Nhận định |
|---|---|---|
| Next.js | `apps/web-next/package.json`, `next.config.ts` | Có ứng dụng Next.js; chưa thấy cấu hình PWA trong `next.config.ts` |
| NestJS API | `apps/api/src/app.module.ts` | Đăng ký `ProductsModule`, `OrdersModule`, `PaymentsModule`, `AuthModule` |
| NestJS thứ hai | `package.json`, `nest-cli.json`, `src/` ở root | Có thể khởi chạy riêng; vai trò chính thức chưa xác nhận |
| PostgreSQL | `docker-compose.yml` | `postgres:17-alpine`, chỉ bind cổng 5432 lên loopback local, có volume `postgres_data` và DB healthcheck |
| ORM | `apps/api/src/app.module.ts`, `database/data-source.ts` | TypeORM, `synchronize: false`; cấu hình DB qua environment |
| Migration | `apps/api/src/database/migrations/` | Có migration; chưa xác minh chạy migration thành công |
| Thanh toán mô phỏng | `apps/api/src/payments/payments.controller.ts`, `payments.service.ts` | API `POST /payments/:id/mock-result`; xử lý kết quả thành công/thất bại trong transaction |
| CI | `.github/workflows/CI.yml` | Hiện chỉ checkout và echo, chưa có lint/test/build |

## 4. Luồng xử lý ở mức kiến trúc

1. Người dùng thao tác trên giao diện Next.js.
2. Frontend gọi REST API NestJS (địa chỉ và cơ chế gọi thực tế cần xác minh thêm).
3. NestJS xử lý xác thực và nghiệp vụ qua các module, lưu dữ liệu bằng TypeORM vào PostgreSQL.
4. Module Payments cung cấp thao tác mô phỏng kết quả thanh toán; đây **không phải** tích hợp cổng thanh toán ngân hàng.
5. Backend trả trạng thái xử lý để frontend hiển thị.

## 5. Cấu hình, bảo mật và vận hành

- `apps/api/src/app.module.ts` dùng `ConfigModule` và biến môi trường DB; không đưa mật khẩu thực vào repository.
- `apps/api/src/main.ts` có `ValidationPipe` với `whitelist` và `transform`; CORS hiện cấu hình cho `http://localhost:3001`, cần điều chỉnh theo production.
- PostgreSQL local có healthcheck `pg_isready`; **chưa xác nhận API có `GET /health`**. Healthcheck database không thay thế API health endpoint.
- Chưa xác minh hệ thống logging tập trung. Đề xuất dùng logging NestJS và thu thập log từ nền tảng triển khai.
- PWA chưa thấy cấu hình trong `next.config.ts`; cần bổ sung hoặc xác minh các tệp manifest/service worker trước nghiệm thu.
- `.env` thực tế không được đưa vào tài liệu hay commit; nên có `.env.example` không chứa secret.

## 6. Kiến trúc triển khai

**Local (đã quan sát):** `docker-compose.yml` chỉ chạy PostgreSQL. Next.js và NestJS có scripts riêng; chưa chứng minh hai ứng dụng đã được chạy cùng Compose.

**CI (đã quan sát):** GitHub Actions chạy khi push/PR vào `main` nhưng workflow hiện chỉ echo. Lint/test/build và đóng gói image thuộc phần triển khai cần hoàn thiện sau.

**Production (đã thống nhất nền tảng Render; chưa triển khai/kiểm chứng):** Nhóm đã quyết định dùng **Render**. Phương án kiến trúc đề xuất: (1) Render Web Service chạy Next.js trong `apps/web-next`; (2) Render Web Service chạy NestJS trong `apps/api`; (3) Render Postgres managed database, sử dụng kết nối nội bộ từ API và lưu trữ bền vững do Render quản lý. Browser gọi Next.js qua HTTPS; frontend gọi NestJS qua URL HTTPS API. **Không** dùng PostgreSQL trong Docker Compose local làm database production. Các dịch vụ cần được tạo trên cùng vùng/khả năng kết nối phù hợp, sau đó kiểm tra internal database URL.

**Container registry (yêu cầu sơ đồ):** Đề xuất **GitHub Container Registry (GHCR)** lưu image của web/API để phục vụ quy trình CI/CD dùng Docker. Đây là **quyết định triển khai còn phải xác nhận**, vì Render cũng hỗ trợ triển khai trực tiếp từ repository; không được ghi GHCR là đã dùng khi chưa cấu hình push image. Sơ đồ thể hiện rõ nhánh registry *dự kiến*.

**Cấu hình vận hành production cần làm:** khai báo biến môi trường trên Render (không commit secrets), `PORT` cho NestJS, `DATABASE_URL` hoặc bộ biến `DB_*` tương ứng với code, cấu hình CORS theo URL frontend Render, thiết lập `/health` ở API, log qua Render Logs, migration trước khi nhận traffic và HTTPS do nền tảng cung cấp. Các mục này là **việc phải làm/kiểm chứng**, không phải chức năng đã có. Render Postgres có persistence riêng; không dùng Docker named volume local làm bằng chứng cho production.

Sơ đồ `deployment-diagram.puml` mô tả **mục tiêu triển khai trên Render**; không đại diện hệ thống đã chạy production.

## 7. Lý do chọn kiến trúc, ưu điểm và trade-off

- **Kiến trúc phân lớp / module:** dễ phân chia nhiệm vụ, đọc và kiểm thử từng nghiệp vụ; đổi lại cần kiểm soát phụ thuộc và hợp đồng API.
- **Monorepo đề xuất:** đặt frontend/backend/tài liệu cùng repository giúp truy vết và phối hợp; đổi lại cần CI xác định đúng thư mục và tránh phụ thuộc lẫn nhau.
- **PostgreSQL + TypeORM migrations:** dữ liệu quan hệ và thay đổi schema có thể kiểm soát phiên bản; đổi lại migration phải được kiểm thử và quản lý rollback.
- **Mock payment:** phù hợp phạm vi học phần, tránh phụ thuộc nhà cung cấp thanh toán; không chứng minh được quy trình giao dịch thực tế.

## 8. Repository organization

```text
BrewLite/
├── apps/
│   ├── web-next/     # Next.js (tên thực tế khác apps/web trong đề mẫu)
│   └── api/          # NestJS nhiều module – backend đề xuất
├── src/              # NestJS root – chưa xác nhận vai trò
├── docs/
│   ├── requirements/
│   ├── diagram/       # tên thực tế khác docs/diagrams trong đề mẫu
│   └── architecture/  # tài liệu Task 3 cần bổ sung
├── .github/workflows/CI.yml
└── docker-compose.yml
```

Không tự ý đổi tên hoặc xóa thư mục trước khi nhóm thống nhất.
## 9.Logging and Health Check

### Health Check

BrewLite sử dụng Health Check để theo dõi trạng thái hoạt động của backend NestJS trên nền tảng Render.

**Thiết kế đã được nhóm thống nhất:**

- Endpoint: `GET /health`.
- Thư viện: `@nestjs/terminus`.
- Kiểm tra trạng thái API và kết nối PostgreSQL.
- Sử dụng Render Health Check để giám sát backend.
- Trả về HTTP 200 khi hệ thống khỏe mạnh; HTTP 503 khi kiểm tra thất bại.

### Logging

BrewLite sử dụng cơ chế ghi nhật ký để hỗ trợ giám sát và xử lý lỗi trong quá trình vận hành.

**Thiết kế đã được nhóm thống nhất:**

- Sử dụng `Logger` tích hợp trong NestJS.
- Ghi nhật ký ra `stdout/stderr`.
- Xem nhật ký thông qua Render Dashboard → Logs.
- Ghi nhận sự kiện khởi động, cảnh báo, lỗi API và lỗi kết nối database.
- Không ghi mật khẩu, JWT hoặc thông tin nhạy cảm.

### Architectural Rationale

Nhóm lựa chọn NestJS Terminus và NestJS Logger vì chúng phù hợp với công nghệ backend hiện tại, dễ tích hợp và không yêu cầu triển khai thêm hệ thống giám sát phức tạp.

**Ưu điểm:** Đơn giản, dễ bảo trì và phù hợp với phạm vi đồ án.

**Hạn chế:** Khả năng lưu trữ và phân tích nhật ký phụ thuộc vào các tính năng và giới hạn của Render.

### Implementation Status

**Agreed / Planned:** Nhóm đã thống nhất thiết kế. Thành viên Task 5 sẽ chịu trách nhiệm triển khai và kiểm thử Health Check và Logging trên môi trường thực tế.
## 10. Các điểm phải xác nhận trước nghiệm thu

- [ ] Nhóm xác nhận backend chính: `apps/api/` hay root `src/`.
- [ ] Xác nhận địa chỉ frontend gọi backend và luồng API hoạt động.
- [x] Nhóm chốt nền tảng production: **Render**.
- [ ] Chốt hình thức deploy trên Render (Git source hay Docker image/GHCR), tạo Render Postgres và kiểm tra persistence/kết nối nội bộ.
- [ ] Bổ sung/kiểm chứng PWA, API healthcheck, logging, CORS Render, PORT, cấu hình secrets và database URL.
- [ ] Kiểm tra lệnh chạy migration/seed, CI thực tế và phương án triển khai.
- [ ] Đối chiếu deployment diagram với cấu hình triển khai cuối cùng.

## 11. Quyết định kiến trúc liên quan

- [ADR 001 – Monorepo](adr/001-monorepo.md)
- [ADR 002 – Modular NestJS backend](adr/002-modular-backend.md)
- [ADR 003 – PostgreSQL và TypeORM migrations](adr/003-postgresql-typeorm.md)

- [ADR 004 – Triển khai production trên Render](adr/004-render-production.md)
