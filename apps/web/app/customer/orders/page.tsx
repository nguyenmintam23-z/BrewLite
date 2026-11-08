"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import CustomerNav from "../customer-nav";
import {
  CustomerApiError,
  customerRequest,
  customerStatusLabel,
  formatCustomerDate,
  formatCustomerMoney,
  getCustomerErrorMessage,
  isRecordValue,
} from "../customer-api";

type CustomerOrder = {
  id: string;
  status: string;
  totalAmount: string;
  createdAt: string;
  paymentStatus: string | null;
  items: Array<{ productName: string; quantity: number }>;
};

function parseOrders(value: unknown): CustomerOrder[] {
  if (!Array.isArray(value)) throw new Error("Dữ liệu đơn hàng từ API không đúng định dạng.");
  return value.map((order) => {
    if (
      !isRecordValue(order) ||
      typeof order.id !== "string" ||
      typeof order.status !== "string" ||
      typeof order.totalAmount !== "string" ||
      typeof order.createdAt !== "string" ||
      !(typeof order.paymentStatus === "string" || order.paymentStatus === null) ||
      !Array.isArray(order.items)
    ) {
      throw new Error("Thông tin đơn hàng từ API không đúng định dạng.");
    }
    const items = order.items.map((item) => {
      if (!isRecordValue(item) || typeof item.productName !== "string" || typeof item.quantity !== "number") {
        throw new Error("Chi tiết món hàng từ API không đúng định dạng.");
      }
      return { productName: item.productName, quantity: item.quantity };
    });
    return {
      id: order.id,
      status: order.status,
      totalAmount: order.totalAmount,
      createdAt: order.createdAt,
      paymentStatus: order.paymentStatus,
      items,
    };
  });
}

export default function CustomerOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let active = true;
    void customerRequest("/orders", {}, true)
      .then(parseOrders)
      .then((result) => {
        if (active) setOrders(result);
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
  }, [retry, router]);

  return (
    <main className="manager-shell">
      <div className="manager-container customer-orders-container">
        <CustomerNav />
        <header className="manager-heading customer-heading">
          <p className="eyebrow">LỊCH SỬ MUA HÀNG</p>
          <h1>Đơn hàng của tôi</h1>
          <p className="subtitle">Chỉ hiển thị các đơn hàng thuộc tài khoản đang đăng nhập.</p>
        </header>
        {loading ? (
          <section className="manager-state" role="status"><span className="loading-indicator" aria-hidden="true" /><p>Đang tải đơn hàng…</p></section>
        ) : error ? (
          <section className="manager-state manager-state-error" role="alert">
            <h2>Không tải được đơn hàng</h2><p>{error}</p>
            <button className="button manager-state-action" type="button" onClick={() => { setError(""); setLoading(true); setRetry((value) => value + 1); }}>Thử lại</button>
          </section>
        ) : orders.length === 0 ? (
          <section className="manager-state"><h2>Bạn chưa có đơn hàng</h2><p>Các đơn hàng đã đặt sẽ hiển thị tại đây.</p><Link className="button manager-state-action" href="/customer/menu">Xem thực đơn</Link></section>
        ) : (
          <section className="customer-order-list" aria-label="Lịch sử đơn hàng">
            {orders.map((order) => (
              <article className="manager-card customer-order-card" key={order.id}>
                <div className="customer-order-card-top">
                  <div><p className="eyebrow">MÃ ĐƠN</p><code>{order.id}</code></div>
                  <span className={`customer-order-status status-${order.status.toLowerCase()}`}>{customerStatusLabel(order.status)}</span>
                </div>
                <p className="customer-order-date">{formatCustomerDate(order.createdAt)}</p>
                <p className="customer-order-items">{order.items.map((item) => `${item.productName} × ${item.quantity}`).join(" · ")}</p>
                <div className="customer-order-card-bottom">
                  <span>Thanh toán: {customerStatusLabel(order.paymentStatus ?? "PENDING")}</span>
                  <strong>{formatCustomerMoney(order.totalAmount)}</strong>
                </div>
                <Link className="button-secondary customer-order-open" href={`/customer/orders/${order.id}`}>Xem chi tiết</Link>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
