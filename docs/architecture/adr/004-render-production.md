# ADR 004 – Chọn Render làm nền tảng production

- **Trạng thái:** Accepted – quyết định nền tảng do nhóm xác nhận ngày 08/11/2026; chi tiết cấu hình còn Proposed.
- **Bối cảnh:** Assignment 2 yêu cầu môi trường production truy cập qua HTTPS, frontend Next.js, backend NestJS, PostgreSQL bền vững, logs, health check, secrets và sơ đồ đúng nền tảng thực tế.
- **Quyết định:** Nhóm sử dụng **Render**. Đề xuất hai Render Web Services cho `apps/web-next` (Next.js) và `apps/api` (NestJS), cùng **Render Postgres** (managed PostgreSQL) với kết nối database nội bộ. Dùng HTTPS cho người dùng và kết nối browser–API. Không đưa mật khẩu database vào Git.
- **Container registry:** Đề xuất GHCR cho Docker image web/API để thể hiện pipeline image-based trong deployment diagram; **chưa được nhóm xác nhận**. Nếu nhóm deploy trực tiếp từ GitHub trên Render, phải cập nhật ADR/sơ đồ và giải thích registry là bước dự kiến, không giả định có push image.
- **Lý do:** Tách dịch vụ rõ ràng, tích hợp GitHub, quản lý secrets và log qua giao diện Render, phù hợp đồ án.
- **Trade-offs:** Có thể phát sinh chi phí, giới hạn tài nguyên theo gói, cần xử lý CORS, environment, migration, healthcheck và giám sát dịch vụ. Không tự nhận đã triển khai.
- **Việc phải xác minh:** region, cấu hình build/start và root directory, PostgreSQL plan, connection URL, URL HTTPS, health endpoint, registry/CD, smoke test, backup/rollback.
