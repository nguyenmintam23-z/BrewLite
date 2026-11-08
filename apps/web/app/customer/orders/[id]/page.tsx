"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import CustomerNav from "../../customer-nav";
import {
  CustomerApiError,
  customerRequest,
  customerStatusLabel,
  formatCustomerDate,
  formatCustomerMoney,
  getCustomerErrorMessage,
  isRecordValue,
} from "../../customer-api";

type OrderDetails = {
  id: string;
  status: string;
  totalAmount: string;
  createdAt: string;
  customer: { displayName: string } | null;
  items: Array<{
    productName: string;
    quantity: number;
    unitPrice: string;
    selectedOptions: Record<string, string | string[]>;
  }>;
  payments: Array<{
    id: string;
    method: string;
    status: string;
    amount: string;
    createdAt: string;
  }>;
};

function parseOrder(value: unknown): OrderDetails {
  if (
    !isRecordValue(value) ||
    typeof value.id !== "string" ||
    typeof value.status !== "string" ||
    typeof value.totalAmount !== "string" ||
    typeof value.createdAt !== "string" ||
    !(value.customer === null || (
      isRecordValue(value.customer) && typeof value.customer.displayName === "string"
    )) ||
    !Array.isArray(value.items) ||
    !Array.isArray(value.payments)
  ) {
    throw new Error("Dữ liệu chi tiết đơn hàng từ API không đúng định dạng.");
  }
  const items = value.items.map((item) => {
    if (
      !isRecordValue(item) ||
      typeof item.productName !== "string" ||
      typeof item.quantity !== "number" ||
      typeof item.unitPrice !== "string" ||
      !isRecordValue(item.selectedOptions)
    ) {
      throw new Error("Thông tin món trong đơn không đúng định dạng.");
    }
    const selectedOptions: Record<string, string | string[]> = {};
    for (const [type, choice] of Object.entries(item.selectedOptions)) {
      if (typeof choice === "string" || (Array.isArray(choice) && choice.every((name) => typeof name === "string"))) {
        selectedOptions[type] = choice as string | string[];
      } else {
        throw new Error("Tùy chọn món trong đơn không đúng định dạng.");
      }
    }
    return {
      productName: item.productName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      selectedOptions,
    };
  });
  const payments = value.payments.map((payment) => {
    if (
      !isRecordValue(payment) ||
      typeof payment.id !== "string" ||
      typeof payment.method !== "string" ||
      typeof payment.status !== "string" ||
      typeof payment.amount !== "string" ||
      typeof payment.createdAt !== "string"
    ) {
      throw new Error("Thông tin thanh toán từ API không đúng định dạng.");
    }
    return {
      id: payment.id,
      method: payment.method,
      status: payment.status,
      amount: payment.amount,
      createdAt: payment.createdAt,
    };
  });
  const customerValue = value.customer;
  const customer =
    customerValue === null
      ? null
      : isRecordValue(customerValue) &&
          typeof customerValue.displayName === "string"
        ? { displayName: customerValue.displayName }
        : null;
  return {
    id: value.id,
    status: value.status,
    totalAmount: value.totalAmount,
    createdAt: value.createdAt,
    customer,
    items,
    payments,
  };
}

function CustomerOrderDetails() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  const requestOrder = useCallback(
    async () =>
      parseOrder(
        await customerRequest(`/orders/${encodeURIComponent(id)}`, {}, true),
      ),
    [id],
  );

  useEffect(() => {
    let active = true;
    void requestOrder()
      .then((result) => {
        if (active) setOrder(result);
      })
      .catch((cause: unknown) => {
        if (!active) return;
        setError(getCustomerErrorMessage(cause));
        if (cause instanceof CustomerApiError && (cause.status === 401 || cause.status === 403)) {
          window.sessionStorage.removeItem("brewlite.accessToken");
          window.sessionStorage.removeItem("brewlite.role");
          window.sessionStorage.removeItem("brewlite.customerName");
          router.replace("/customer/login?reason=session");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [requestOrder, router]);

  async function loadOrder() {
    setError("");
    setLoading(true);
    try {
      setOrder(await requestOrder());
    } catch (cause: unknown) {
      setError(getCustomerErrorMessage(cause));
      if (cause instanceof CustomerApiError && (cause.status === 401 || cause.status === 403)) {
        window.sessionStorage.removeItem("brewlite.accessToken");
        window.sessionStorage.removeItem("brewlite.role");
        window.sessionStorage.removeItem("brewlite.customerName");
        router.replace("/customer/login?reason=session");
      }
    } finally {
      setLoading(false);
    }
  }

  async function cancelOrder() {
    if (!order || !window.confirm("Bạn có chắc muốn hủy đơn hàng này?")) return;
    setError("");
    setNotice("");
    setBusy(true);
    try {
      await customerRequest(
        `/orders/${encodeURIComponent(order.id)}/cancel`,
        { method: "PATCH" },
        true,
      );
      setNotice("Đã hủy đơn hàng.");
      setOrder(await requestOrder());
    } catch (cause: unknown) {
      setError(getCustomerErrorMessage(cause));
      if (cause instanceof CustomerApiError && (cause.status === 401 || cause.status === 403)) {
        window.sessionStorage.removeItem("brewlite.accessToken");
        window.sessionStorage.removeItem("brewlite.role");
        router.replace("/customer/login?reason=session");
      }
    } finally {
      setBusy(false);
    }
  }

  const canCancel = order?.status === "PENDING_PAYMENT" || order?.status === "CONFIRMED";

  return (
    <main className="manager-shell">
      <div className="manager-container customer-order-details">
        <CustomerNav />
        <p className="customer-back-link"><Link href="/customer/orders">← Quay lại đơn hàng</Link></p>
        {loading ? (
          <section className="manager-state" role="status"><span className="loading-indicator" aria-hidden="true" /><p>Đang tải chi tiết đơn hàng…</p></section>
        ) : error ? (
          <section className="manager-state manager-state-error" role="alert">
            <h2>Không tải được đơn hàng</h2><p>{error}</p>
            <button className="button manager-state-action" type="button" onClick={() => void loadOrder()}>Thử lại</button>
          </section>
        ) : !order ? (
          <section className="manager-state"><h2>Không tìm thấy đơn hàng</h2></section>
        ) : (
          <article className="manager-card customer-order-detail-card">
            <header className="customer-order-detail-heading">
              <div><p className="eyebrow">CHI TIẾT ĐƠN HÀNG</p><h1>{order.id}</h1></div>
              <span className={`customer-order-status status-${order.status.toLowerCase()}`}>{customerStatusLabel(order.status)}</span>
            </header>
            <div className="customer-order-meta">
              <div><span>Thời gian đặt</span><strong>{formatCustomerDate(order.createdAt)}</strong></div>
              <div><span>Khách hàng</span><strong>{order.customer?.displayName || "Khách hàng"}</strong></div>
              <div><span>Tổng tiền</span><strong>{formatCustomerMoney(order.totalAmount)}</strong></div>
            </div>
            <h2 className="customer-section-title">Món đã đặt</h2>
            {order.items.length === 0 ? (
              <p className="customer-empty-line">Đơn hàng chưa có món.</p>
            ) : (
              <div className="customer-detail-item-list">
                {order.items.map((item, index) => (
                  <div className="customer-detail-item" key={`${item.productName}-${index}`}>
                    <div><strong>{item.productName}</strong><span>Số lượng: {item.quantity}</span>
                      {Object.entries(item.selectedOptions).map(([type, choices]) => (
                        <span key={type}>{customerStatusLabel(type)}: {Array.isArray(choices) ? choices.join(", ") : choices}</span>
                      ))}
                    </div>
                    <strong>{formatCustomerMoney(Number(item.unitPrice) * item.quantity)}</strong>
                  </div>
                ))}
              </div>
            )}
            <h2 className="customer-section-title">Thanh toán</h2>
            {order.payments.length === 0 ? (
              <p className="customer-empty-line">Chưa có thông tin thanh toán.</p>
            ) : (
              <div className="customer-payment-list">
                {order.payments.map((payment) => (
                  <div className="customer-payment-row" key={payment.id}>
                    <div><strong>{customerStatusLabel(payment.method)}</strong><span>{formatCustomerDate(payment.createdAt)}</span></div>
                    <div><strong>{formatCustomerMoney(payment.amount)}</strong><span>{customerStatusLabel(payment.status)}</span></div>
                  </div>
                ))}
              </div>
            )}
            <p className="customer-simulation-note">Thanh toán đang dùng cơ chế mô phỏng của dự án, không phải giao dịch tiền thật.</p>
            {notice && <p className="feedback success" role="status">{notice}</p>}
            {error && <p className="feedback error" role="alert">{error}</p>}
            <div className="customer-detail-actions">
              {canCancel && <button className="button-secondary customer-cancel-button" type="button" disabled={busy} onClick={() => void cancelOrder()}>{busy ? "Đang hủy…" : "Hủy đơn hàng"}</button>}
              <button className="button-secondary" type="button" onClick={() => void loadOrder()}>Tải lại</button>
            </div>
          </article>
        )}
      </div>
    </main>
  );
}

export default function CustomerOrderDetailsPage() {
  return (
    <Suspense fallback={<main className="manager-shell"><section className="manager-state" role="status">Đang mở đơn hàng…</section></main>}>
      <CustomerOrderDetails />
    </Suspense>
  );
}
