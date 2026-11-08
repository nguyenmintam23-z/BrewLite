"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import CustomerNav from "../customer-nav";
import {
  CustomerApiError,
  customerRequest,
  customerStatusLabel,
  formatCustomerMoney,
  getCustomerErrorMessage,
  isRecordValue,
} from "../customer-api";
import {
  CustomerCartItem,
  customerCartEventName,
  customerCartItemPrice,
  readCustomerCart,
  writeCustomerCart,
} from "../cart-store";

type CreatedOrder = {
  orderId: string;
  status: string;
  totalAmount: string;
  paymentId: string;
  paymentStatus: string;
};

function parseCreatedOrder(value: unknown): CreatedOrder {
  if (
    !isRecordValue(value) ||
    typeof value.orderId !== "string" ||
    typeof value.status !== "string" ||
    typeof value.totalAmount !== "string" ||
    typeof value.paymentId !== "string" ||
    typeof value.paymentStatus !== "string"
  ) {
    throw new Error("Dữ liệu đơn hàng từ API không đúng định dạng.");
  }
  return {
    orderId: value.orderId,
    status: value.status,
    totalAmount: value.totalAmount,
    paymentId: value.paymentId,
    paymentStatus: value.paymentStatus,
  };
}

export default function CustomerCartPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CustomerCartItem[]>([]);
  const [ready, setReady] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"CARD" | "WALLET">("CARD");
  const [submitting, setSubmitting] = useState(false);
  const [paymentBusy, setPaymentBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [createdOrder, setCreatedOrder] = useState<CreatedOrder | null>(null);

  useEffect(() => {
    const syncCart = () => {
      setCart(readCustomerCart());
      setReady(true);
    };
    syncCart();
    window.addEventListener(customerCartEventName(), syncCart);
    return () => window.removeEventListener(customerCartEventName(), syncCart);
  }, []);

  const total = useMemo(
    () => cart.reduce((sum, item) => sum + customerCartItemPrice(item) * item.quantity, 0),
    [cart],
  );

  function updateItem(item: CustomerCartItem, quantity: number) {
    const next = quantity < 1
      ? cart.filter((current) => current.key !== item.key)
      : cart.map((current) =>
          current.key === item.key
            ? { ...current, quantity: Math.min(quantity, 99) }
            : current,
        );
    writeCustomerCart(next);
    setCart(next);
  }

  async function createOrder() {
    setError("");
    setNotice("");
    const token = window.sessionStorage.getItem("brewlite.accessToken");
    const role = window.sessionStorage.getItem("brewlite.role");
    if (!token || role !== "CUSTOMER") {
      router.push("/customer/login?reason=required");
      return;
    }
    if (cart.length === 0) return;

    setSubmitting(true);
    try {
      const result = parseCreatedOrder(
        await customerRequest(
          "/orders",
          {
            method: "POST",
            body: JSON.stringify({
              items: cart.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
                optionIds: item.optionIds,
              })),
              paymentMethod,
            }),
          },
          true,
        ),
      );
      setCreatedOrder(result);
      writeCustomerCart([]);
      setCart([]);
      setNotice("Đơn đã được tạo. Hãy chọn kết quả thanh toán mô phỏng bên dưới.");
    } catch (cause: unknown) {
      setError(getCustomerErrorMessage(cause));
      if (cause instanceof CustomerApiError && (cause.status === 401 || cause.status === 403)) {
        window.sessionStorage.removeItem("brewlite.accessToken");
        window.sessionStorage.removeItem("brewlite.role");
        window.sessionStorage.removeItem("brewlite.customerName");
        router.replace("/customer/login?reason=session");
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function setPaymentResult(success: boolean) {
    if (!createdOrder) return;
    setError("");
    setPaymentBusy(true);
    try {
      await customerRequest(
        `/payments/${encodeURIComponent(createdOrder.paymentId)}/mock-result?success=${success}`,
        { method: "POST" },
        true,
      );
      setNotice(
        success
          ? "Thanh toán mô phỏng thành công. Đơn hàng đã được xác nhận."
          : "Thanh toán mô phỏng thất bại. Đơn vẫn chờ xử lý; bạn có thể xem hoặc hủy đơn.",
      );
      setCreatedOrder({
        ...createdOrder,
        paymentStatus: success ? "SUCCEEDED" : "FAILED",
        status: success ? "CONFIRMED" : createdOrder.status,
      });
    } catch (cause: unknown) {
      setError(getCustomerErrorMessage(cause));
      if (cause instanceof CustomerApiError && (cause.status === 401 || cause.status === 403)) {
        window.sessionStorage.removeItem("brewlite.accessToken");
        window.sessionStorage.removeItem("brewlite.role");
        window.sessionStorage.removeItem("brewlite.customerName");
        router.replace("/customer/login?reason=session");
      }
    } finally {
      setPaymentBusy(false);
    }
  }

  return (
    <main className="manager-shell">
      <div className="manager-container customer-cart-container">
        <CustomerNav />
        <header className="manager-heading customer-heading">
          <p className="eyebrow">GIỎ HÀNG</p>
          <h1>Món bạn đã chọn</h1>
          <p className="subtitle">Giá hiển thị là tạm tính; máy chủ sẽ tính lại khi tạo đơn.</p>
        </header>

        {!ready ? (
          <section className="manager-state" role="status"><span className="loading-indicator" aria-hidden="true" /><p>Đang tải giỏ hàng…</p></section>
        ) : createdOrder ? (
          <section className="manager-card customer-checkout-result">
            <p className="eyebrow">ĐƠN HÀNG ĐÃ TẠO</p>
            <h2>Mã đơn</h2>
            <code>{createdOrder.orderId}</code>
            <div className="customer-order-summary">
              <span>Trạng thái đơn</span><strong>{customerStatusLabel(createdOrder.status)}</strong>
              <span>Tổng tiền theo máy chủ</span><strong>{formatCustomerMoney(createdOrder.totalAmount)}</strong>
              <span>Thanh toán</span><strong>{customerStatusLabel(createdOrder.paymentStatus)}</strong>
            </div>
            <p className="customer-simulation-note">Đây là thanh toán mô phỏng, không có giao dịch tiền thật.</p>
            {createdOrder.paymentStatus === "PENDING" && (
              <div className="customer-payment-actions">
                <button className="button" disabled={paymentBusy} onClick={() => void setPaymentResult(true)} type="button">
                  {paymentBusy ? "Đang xử lý…" : "Mô phỏng thanh toán thành công"}
                </button>
                <button className="button-secondary" disabled={paymentBusy} onClick={() => void setPaymentResult(false)} type="button">
                  Mô phỏng thất bại
                </button>
              </div>
            )}
            {notice && <p className="feedback success" role="status">{notice}</p>}
            {error && <p className="feedback error" role="alert">{error}</p>}
            <Link className="button customer-go-orders" href={`/customer/orders/${createdOrder.orderId}`}>Theo dõi đơn hàng</Link>
          </section>
        ) : cart.length === 0 ? (
          <section className="manager-state">
            <h2>Giỏ hàng đang trống</h2>
            <p>Hãy chọn đồ uống trong thực đơn để bắt đầu.</p>
            <Link className="button manager-state-action" href="/customer/menu">Xem thực đơn</Link>
          </section>
        ) : (
          <div className="customer-cart-layout">
            <section className="customer-cart-items" aria-label="Các món trong giỏ">
              {cart.map((item) => {
                const options = Object.entries(item.selectedOptions);
                return (
                  <article className="manager-card customer-cart-item" key={item.key}>
                    <div className="customer-cart-item-main">
                      <div className="customer-cart-mark" aria-hidden="true">☕</div>
                      <div>
                        <h2>{item.productName}</h2>
                        {options.map(([type, value]) => (
                          <p className="customer-cart-option" key={type}>
                            {customerStatusLabel(type)}: {Array.isArray(value) ? value.join(", ") : value}
                          </p>
                        ))}
                        <p className="customer-cart-option">Đơn giá tạm tính: {formatCustomerMoney(customerCartItemPrice(item))}</p>
                      </div>
                    </div>
                    <div className="customer-cart-item-actions">
                      <label className="field">
                        <span>Số lượng</span>
                        <input aria-label={`Số lượng ${item.productName}`} type="number" min="1" max="99" value={item.quantity} onChange={(event) => updateItem(item, Number(event.target.value) || 0)} />
                      </label>
                      <strong>{formatCustomerMoney(customerCartItemPrice(item) * item.quantity)}</strong>
                      <button className="text-button customer-remove-button" type="button" onClick={() => updateItem(item, 0)}>Xóa món</button>
                    </div>
                  </article>
                );
              })}
            </section>
            <aside className="manager-card customer-cart-checkout">
              <h2>Tóm tắt đơn</h2>
              <div className="customer-checkout-line"><span>Tạm tính</span><strong>{formatCustomerMoney(total)}</strong></div>
              <label className="field">
                <span>Phương thức thanh toán mô phỏng</span>
                <select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value as "CARD" | "WALLET")}>
                  <option value="CARD">Thẻ mô phỏng</option>
                  <option value="WALLET">Ví mô phỏng</option>
                </select>
              </label>
              <p className="customer-simulation-note">Chưa kết nối cổng thanh toán thật. Giá cuối cùng do backend xác định.</p>
              {error && <p className="feedback error" role="alert">{error}</p>}
              {notice && <p className="feedback success" role="status">{notice}</p>}
              <button className="button customer-checkout-button" disabled={submitting || cart.length === 0} onClick={() => void createOrder()} type="button">
                {submitting ? "Đang tạo đơn…" : "Tạo đơn hàng"}
              </button>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}
