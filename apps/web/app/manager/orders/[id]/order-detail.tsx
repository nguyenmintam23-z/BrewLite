"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

type OrderItem = {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: string;
  selectedOptions: Record<string, string | string[]>;
};

type Payment = {
  id: string;
  method: string;
  status: string;
  amount: string;
  createdAt: string;
};

type OrderDetails = {
  id: string;
  status: string;
  totalAmount: string;
  createdAt: string;
  items: OrderItem[];
  payments: Payment[];
};

type PageState =
  | { status: "loading" }
  | { status: "unauthorized" }
  | { status: "error"; message: string }
  | { status: "ready"; order: OrderDetails };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStringRecord(
  value: unknown,
): value is Record<string, string | string[]> {
  if (!isRecord(value)) return false;
  return Object.values(value).every(
    (item) =>
      typeof item === "string" ||
      (Array.isArray(item) && item.every((entry) => typeof entry === "string")),
  );
}

function isOrderDetails(value: unknown): value is OrderDetails {
  if (!isRecord(value)) return false;

  return (
    typeof value.id === "string" &&
    typeof value.status === "string" &&
    typeof value.totalAmount === "string" &&
    typeof value.createdAt === "string" &&
    Array.isArray(value.items) &&
    value.items.every(
      (item) =>
        isRecord(item) &&
        typeof item.productId === "string" &&
        typeof item.productName === "string" &&
        typeof item.quantity === "number" &&
        typeof item.unitPrice === "string" &&
        isStringRecord(item.selectedOptions),
    ) &&
    Array.isArray(value.payments) &&
    value.payments.every(
      (payment) =>
        isRecord(payment) &&
        typeof payment.id === "string" &&
        typeof payment.method === "string" &&
        typeof payment.status === "string" &&
        typeof payment.amount === "string" &&
        typeof payment.createdAt === "string",
    )
  );
}

function formatCurrency(amount: string) {
  const value = Number(amount);
  if (!Number.isFinite(value)) return "Không xác định";

  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Không xác định";

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(date);
}

function getErrorMessage(value: unknown) {
  if (!isRecord(value)) return undefined;
  const message = value.message;
  if (typeof message === "string") return message;
  if (Array.isArray(message) && message.every((item) => typeof item === "string")) {
    return message.join(". ");
  }
  return undefined;
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    PENDING_PAYMENT: "Chờ thanh toán",
    CONFIRMED: "Đã xác nhận",
    PREPARING: "Đang chuẩn bị",
    COMPLETED: "Hoàn thành",
    CANCELLED: "Đã hủy",
    PENDING: "Đang chờ",
    SUCCEEDED: "Thành công",
    FAILED: "Thất bại",
    WALLET: "Ví điện tử",
    CARD: "Thẻ mô phỏng",
  };
  return labels[status] ?? status;
}

function statusClass(status: string) {
  return `status-pill status-${status.toLowerCase()}`;
}

export default function OrderDetail() {
  const { id: orderId } = useParams<{ id: string }>();
  const [pageState, setPageState] = useState<PageState>({ status: "loading" });
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadOrder() {
      try {
        const token = window.sessionStorage.getItem("brewlite.accessToken");
        const role = window.sessionStorage.getItem("brewlite.role");

        if (!token || role !== "MANAGER") {
          setPageState({ status: "unauthorized" });
          return;
        }

        const response = await fetch(
          `${API_URL}/manager/orders/${encodeURIComponent(orderId)}`,
          {
            headers: { Authorization: `Bearer ${token}` },
            signal: controller.signal,
          },
        );

        let payload: unknown;
        try {
          payload = await response.json();
        } catch {
          payload = undefined;
        }

        if (!response.ok) {
          const apiMessage = getErrorMessage(payload);
          const message =
            response.status === 401
              ? "Phiên đăng nhập không hợp lệ hoặc đã hết hạn. Hãy đăng nhập lại bằng tài khoản quản lý."
              : response.status === 403
                ? "Tài khoản hiện tại không có quyền quản lý đơn hàng."
                : apiMessage ||
                  `Không tải được đơn hàng (HTTP ${response.status}).`;
          throw new Error(message);
        }

        if (!isOrderDetails(payload)) {
          throw new Error("Dữ liệu đơn hàng từ API không đúng định dạng.");
        }

        if (!controller.signal.aborted) {
          setPageState({ status: "ready", order: payload });
        }
      } catch (error) {
        if (controller.signal.aborted) return;
        setPageState({
          status: "error",
          message:
            error instanceof TypeError
              ? "Không kết nối được API. Hãy kiểm tra backend và cấu hình địa chỉ API."
              : error instanceof Error
                ? error.message
                : "Đã xảy ra lỗi khi tải chi tiết đơn hàng.",
        });
      }
    }

    void loadOrder();
    return () => controller.abort();
  }, [orderId, retry]);

  return (
    <main className="manager-shell">
      <div className="manager-container">
        <nav className="manager-topline" aria-label="Điều hướng quản lý">
          <Link className="home-link" href="/">
            <span aria-hidden="true">←</span> Trang đăng nhập
          </Link>
          <span className="sprint-tag">BrewLite · Quản lý</span>
        </nav>

        <header className="manager-heading">
          <p className="eyebrow">QUẢN LÝ CỬA HÀNG</p>
          <h1>Chi tiết đơn hàng</h1>
          <p className="subtitle">Thông tin đơn hàng được tải trực tiếp từ hệ thống.</p>
        </header>

        {pageState.status === "loading" ? (
          <section className="manager-state" role="status" aria-live="polite">
            <span className="loading-indicator" aria-hidden="true" />
            <p>Đang tải chi tiết đơn hàng…</p>
          </section>
        ) : pageState.status === "unauthorized" ? (
          <section className="manager-state" role="alert">
            <div className="state-icon" aria-hidden="true">🔐</div>
            <h2>Cần đăng nhập quản lý</h2>
            <p>Hãy đăng nhập bằng tài khoản MANAGER để xem đơn hàng này.</p>
            <Link className="button manager-state-action" href="/">
              Đến trang đăng nhập
            </Link>
          </section>
        ) : pageState.status === "error" ? (
          <section className="manager-state manager-state-error" role="alert">
            <div className="state-icon" aria-hidden="true">!</div>
            <h2>Không thể tải đơn hàng</h2>
            <p>{pageState.message}</p>
            <button
              className="button manager-state-action"
              type="button"
              onClick={() => {
                setPageState({ status: "loading" });
                setRetry((value) => value + 1);
              }}
            >
              Thử lại
            </button>
          </section>
        ) : pageState.status === "ready" ? (
          <OrderContent order={pageState.order} />
        ) : null}
      </div>
    </main>
  );
}

function OrderContent({ order }: { order: OrderDetails }) {
  return (
    <div className="order-detail-content" aria-live="polite">
      <section className="order-summary-card">
        <div className="order-summary-header">
          <div>
            <p className="detail-label">MÃ ĐƠN HÀNG</p>
            <h2 className="order-id">{order.id}</h2>
          </div>
          <span className={statusClass(order.status)}>{statusLabel(order.status)}</span>
        </div>
        <div className="order-summary-grid">
          <div>
            <p className="detail-label">TỔNG TIỀN</p>
            <p className="order-total">{formatCurrency(order.totalAmount)}</p>
          </div>
          <div>
            <p className="detail-label">THỜI GIAN TẠO</p>
            <p className="detail-value">{formatDate(order.createdAt)}</p>
          </div>
        </div>
      </section>

      <section className="manager-card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">ĐƠN HÀNG</p>
            <h2>Món đã đặt</h2>
          </div>
          <span className="item-count">{order.items.length} món</span>
        </div>
        {order.items.length === 0 ? (
          <p className="empty-message">Đơn hàng chưa có món nào.</p>
        ) : (
          <div className="order-items">
            {order.items.map((item, index) => {
              const options = Object.entries(item.selectedOptions).flatMap(
                ([name, values]) =>
                  (Array.isArray(values) ? values : [values]).map(
                    (value) => `${name}: ${value}`,
                  ),
              );

              return (
                <article
                  className="order-item"
                  key={`${item.productId}-${index}`}
                >
                  <div className="item-main">
                    <h3>{item.productName}</h3>
                    <p className="muted">Số lượng: {item.quantity}</p>
                    {options.length > 0 && (
                      <p className="item-options">{options.join(" · ")}</p>
                    )}
                  </div>
                  <div className="item-price">
                    <span className="muted">Đơn giá</span>
                    <strong>{formatCurrency(item.unitPrice)}</strong>
                  </div>
                  <div className="item-price">
                    <span className="muted">Thành tiền</span>
                    <strong>
                      {formatCurrency(
                        (Number(item.unitPrice) * item.quantity).toString(),
                      )}
                    </strong>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="manager-card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">GIAO DỊCH</p>
            <h2>Thanh toán</h2>
          </div>
          <span className="item-count">{order.payments.length} giao dịch</span>
        </div>
        {order.payments.length === 0 ? (
          <p className="empty-message">Đơn hàng chưa có thông tin thanh toán.</p>
        ) : (
          <div className="payment-list">
            {order.payments.map((payment) => (
              <article className="payment-item" key={payment.id}>
                <div>
                  <p className="payment-method">{statusLabel(payment.method)}</p>
                  <p className="muted">{formatDate(payment.createdAt)}</p>
                </div>
                <div className="payment-result">
                  <span className={statusClass(payment.status)}>
                    {statusLabel(payment.status)}
                  </span>
                  <strong>{formatCurrency(payment.amount)}</strong>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
