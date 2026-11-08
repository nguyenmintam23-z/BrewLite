# Đối chiếu sơ đồ với SRS và code

Tài liệu này ghi lại kết quả đối chiếu ba sơ đồ của UC-01 với tài liệu yêu cầu và với mã nguồn.

| Sơ đồ | File nguồn | Ảnh |
|---|---|---|
| Activity | [`activity-order-flow.puml`](activity-order-flow.puml) | [`exports/Activity_Order_Checkout.png`](exports/Activity_Order_Checkout.png) |
| Sequence | [`sequence-order-flow.puml`](sequence-order-flow.puml) | [`exports/Sequence_Order_Checkout.png`](exports/Sequence_Order_Checkout.png) |
| Class | [`class-model.puml`](class-model.puml) | [`exports/Class_Diagram_Model.png`](exports/Class_Diagram_Model.png) |

**Nguồn đối chiếu**

- Yêu cầu: [`use-cases.md`](../requirements/use-cases.md) (UC-01) và [`srs.md`](../requirements/srs.md), bản ngày 08/11/2026. Mã FR dùng theo cách đánh số mới của bản này.
- Code: `apps/api` (NestJS) trong bản làm việc của nhóm ngày 08/11/2026. **Phần code này chưa được đẩy lên repository**; khi code được push, cần đối chiếu lại.

**Ký hiệu:** ✅ khớp · ⚠️ lệch, cần thống nhất · ❌ chưa có · ⏳ chưa có code để đối chiếu

## 1. Activity và sequence diagram so với UC-01 / SRS

| Bước trong UC-01 | Yêu cầu | Activity | Sequence | Kết quả |
|---|---|---|---|---|
| 1–2. Mở giỏ hàng, chọn Đặt hàng | FR-05 | Hai hoạt động đầu tiên | `Customer → FE` | ✅ |
| 3. Xác thực phiên, kiểm tra role `CUSTOMER` | FR-08, FR-09, NFR-03 | Quyết định "Phiên hợp lệ và role CUSTOMER?" | `BE` kiểm tra JWT và role | ✅ |
| A1. Phiên hết hạn, đăng nhập lại bằng số điện thoại và mật khẩu | FR-08 | Nhánh "Không / Hết hạn [A1]" | `alt` A1 trả `401` | ✅ |
| 4. Kiểm tra giỏ, backend tự tính tổng tiền | FR-10, FR-03 | "Backend lấy giá hiện hành và tự tính tổng tiền" | `BE → BE` tự tính tổng | ✅ |
| E1. Giỏ rỗng hoặc dữ liệu không hợp lệ | FR-10, NFR-04 | Nhánh "[E1]" → dừng | `400 Bad Request` | ✅ |
| A2. Giá hoặc giỏ thay đổi, khách xác nhận lại | FR-10 | Nhánh "[A2]" | `opt` A2 trả `409` | ✅ |
| 5. Tạo đơn `PENDING_PAYMENT` và giữ tồn kho trong một transaction | FR-11 | Partition "Database Transaction" | `BEGIN … COMMIT` | ✅ |
| E2. Hết hàng hoặc ngừng bán → rollback | FR-11 | Nhánh "[E2]" có ROLLBACK | `409 Conflict` | ✅ |
| E3. Lỗi ghi đơn → rollback toàn bộ | FR-11 | Nhánh "[E3]" | `500` | ✅ |
| 6. Chọn Ví hoặc Thẻ mô phỏng | FR-12 | "Khách hàng chọn Ví hoặc Thẻ mô phỏng" | Đầu vòng `loop` | ✅ |
| E4. Phương thức không hỗ trợ | FR-12 | Vòng `while` [E4] | `alt` E4, chưa gửi yêu cầu | ✅ |
| 7. Gửi yêu cầu thanh toán kèm idempotency key | FR-14 | "Gửi yêu cầu thanh toán kèm idempotency key" | `POST /payments` | ✅ |
| E6. Trùng key, cùng nội dung → trả kết quả đã lưu | FR-14 | Nhánh "[E6]" | `alt` E6 | ✅ |
| E7. Trùng key, khác nội dung → từ chối | FR-14 | Nhánh "[E7]" | `409 Conflict` | ✅ |
| 8–9. Thành công → payment `SUCCEEDED`, đơn `CONFIRMED` | FR-13 | Nhánh "Thành công" | `200 OK (CONFIRMED)` | ✅ |
| A3. Thất bại → `FAILED`, đơn giữ `PENDING_PAYMENT`, thử lại bằng key mới | FR-13, FR-14 | Nhánh "[A3]" và vòng `repeat` | `alt` A3, vòng `loop` | ✅ |
| E5. Dịch vụ thanh toán không phản hồi | FR-13 | Nhánh "[E5]", dùng lại key cũ | `503`, `-->x` | ✅ |

**Kết luận:** activity và sequence diagram thể hiện đủ luồng chính, A1–A3 và E1–E7 của UC-01, đúng thứ tự và không thêm bước ngoài đặc tả.

## 2. Class diagram so với SRS

| Dữ liệu SRS yêu cầu | Yêu cầu | Trong class diagram | Kết quả |
|---|---|---|---|
| Tên hiển thị, số điện thoại (duy nhất), mật khẩu đã hash | FR-07, NFR-02 | `User.displayName`, `phoneNumber <<unique>>`, `passwordHash` | ✅ |
| Vai trò `CUSTOMER`, `STAFF`, `MANAGER` | FR-09 | enum `Role` | ✅ |
| Tùy chọn size, đá, đường, topping và phụ phí | FR-03 | `ProductOption`, enum `OptionType` | ✅ |
| Đơn lưu món, tùy chọn, số lượng, giá tại lúc đặt | FR-10 | `Order`, `OrderItem.unitPrice`, `selectedOptions` | ✅ |
| Tồn kho | FR-11 | `Product.stockQuantity` | ✅ |
| Trạng thái đơn `PENDING_PAYMENT → CONFIRMED → PREPARING → COMPLETED`, `CANCELLED` | FR-13, FR-17 | enum `OrderStatus` | ✅ |
| Nhiều lần thử thanh toán cho một đơn, idempotency key | FR-14 | `Order 1 — 0..* Payment`, `idempotencyKey <<unique>>`, `requestHash` | ✅ |
| Các mốc cập nhật trạng thái đơn | FR-16 | `OrderStatusHistory` | ✅ |
| Xác minh OTP khi đăng ký | FR-07 | Chưa có | ⚠️ SRS mới thêm, sơ đồ chưa cập nhật |

## 3. Class diagram so với code (`apps/api/src`)

| Lớp trong sơ đồ | Entity trong code | Kết quả | Ghi chú |
|---|---|---|---|
| `User` | `users/user.entity.ts` | ✅ | Sơ đồ ghi `phoneNumber`, code ghi `phone`. Code có thêm `username` (dùng cho nhân viên đăng nhập). |
| `Product` | `products/product.entity.ts` | ✅ | Sơ đồ ghi `basePrice`, code ghi `price`. Code có thêm `createdAt`. |
| `ProductOption` | `products/product-option.entity.ts` | ✅ | Sơ đồ ghi `type` / `extraPrice`, code ghi `optionType` / `priceAdjustment`. |
| `Order` | `orders/order.entity.ts` | ✅ | Code không có `updatedAt`; có thêm `stockReserved`. `calculateTotal()` nằm trong `OrdersService`. |
| `OrderItem` | `orders/order-item.entity.ts` | ✅ | Khớp hoàn toàn. |
| `Payment` | `payments/payment.entity.ts` | ⚠️ | Enum sơ đồ `MOCK_WALLET/MOCK_CARD`, code `WALLET/CARD`. Code **không có** `requestHash`, `transactionRef`; có thêm `attemptNumber`. |
| `OrderStatusHistory` | Không có | ❌ | Code chưa lưu các mốc trạng thái (FR-16). |
| Không có | `auth/registration-otp.entity.ts`, `auth/password-reset-otp.entity.ts` | ⚠️ | Code đã có OTP đăng ký và quên mật khẩu; sơ đồ chưa có. |
| Enum `Role`, `OrderStatus`, `PaymentStatus`, `OptionType` | `UserRole`, `OrderStatus`, `PaymentStatus`, `ProductOptionType` | ✅ | Giá trị khớp. |

## 4. Activity và sequence diagram so với code

| Trong sơ đồ | Trong code | Kết quả |
|---|---|---|
| Đặt hàng: `POST /orders/checkout` | `POST /orders` (`OrdersController.create`) | ⚠️ Khác đường dẫn |
| Đăng nhập lại (A1): `POST /auth/login` | `POST /auth/customers/login` | ⚠️ Khác đường dẫn |
| Chỉ `CUSTOMER` được đặt hàng, sai role trả `403` | `@Roles(UserRole.CUSTOMER)` + `RolesGuard` | ✅ |
| Backend tự tính tổng tiền từ giá hiện hành | `OrdersService.create` tính từ `price` và `priceAdjustment` | ✅ |
| Tạo đơn và giữ tồn kho trong một transaction, khóa dòng sản phẩm, rollback khi lỗi (E3) | `dataSource.transaction` + `lock: pessimistic_write` | ✅ |
| E1: món hoặc tùy chọn không hợp lệ trả `400` | Không tìm thấy món trả `404`; tùy chọn sai trả `400` | ⚠️ |
| E2: hết hàng trả `409` | Không đủ tồn kho trả `400` | ⚠️ |
| A2: giá thay đổi thì hỏi khách xác nhận lại | Không có | ❌ |
| Khách chọn phương thức rồi gửi yêu cầu thanh toán kèm idempotency key | Payment được tạo ngay khi tạo đơn; server tự sinh key (`randomUUID()`) | ⚠️ |
| Backend gọi dịch vụ thanh toán mô phỏng | Khách gửi kết quả qua `POST /payments/:id/mock-result?success=true\|false` | ⚠️ |
| Thành công: payment `SUCCEEDED`, đơn `CONFIRMED` | `PaymentsService.setMockResultForCustomer` | ✅ |
| Thất bại: payment `FAILED`, đơn giữ `PENDING_PAYMENT` | Có | ✅ |
| A3: thử lại bằng key mới, lưu attempt mới | Chưa có endpoint tạo lần thanh toán mới sau khi `FAILED` | ❌ |
| E5: dịch vụ không phản hồi → `503` | Không có | ❌ |
| E6 / E7: xử lý trùng idempotency key | Không có; gửi lại kết quả cho payment đã xử lý trả `409` | ❌ |

## 5. Tổng hợp và đề xuất

**Khớp:** cấu trúc dữ liệu chính (User, Product, ProductOption, Order, OrderItem), phân quyền theo vai trò, transaction tạo đơn và giữ tồn kho, cập nhật trạng thái khi thanh toán thành công hoặc thất bại.

**Lệch cần nhóm thống nhất:**

1. **Luồng thanh toán** (A2, A3, E5, E6, E7, FR-14): code đơn giản hơn SRS. Nhóm cần chọn một trong hai hướng:
   - bổ sung code theo SRS, giữ nguyên sơ đồ; hoặc
   - cập nhật SRS theo code, sau đó cập nhật activity và sequence diagram.
2. **Tên endpoint và mã lỗi:** `POST /orders` và `POST /auth/customers/login`; mã `404`/`400` cho E1, E2.
3. **Lịch sử trạng thái đơn** (FR-16): code chưa có `OrderStatusHistory`.

**Cập nhật class diagram theo code (không phụ thuộc quyết định trên):**

- Thêm `RegistrationOtp` và `PasswordResetOtp` (FR-07).
- Đổi tên thuộc tính cho khớp code: `phone`, `price`, `optionType`, `priceAdjustment`.
- Đổi enum `PaymentMethod` thành `WALLET`, `CARD`; thêm `Payment.attemptNumber`; thêm `User.username`.

## 6. Lịch sử đối chiếu

| Ngày | Nội dung |
|---|---|
| 02/11/2026 | Đối chiếu sơ đồ với UC-01 và SRS; đổi `fullName` thành `displayName` theo yêu cầu đăng ký. |
| 08/11/2026 | Cập nhật mã FR trong sơ đồ theo cách đánh số mới của SRS (bỏ FR-03 cũ "tìm kiếm" và FR-20 cũ "quản lý nhân viên"). Đối chiếu sơ đồ với code `apps/api`. |
