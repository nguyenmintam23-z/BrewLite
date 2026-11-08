"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  formatStaffDate,
  formatStaffMoney,
  getErrorMessage,
  isRecordValue,
  staffRequest,
  staffStatusLabel,
  StaffApiError,
} from "../staff-api";

type StaffOrderItem = {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: string;
  selectedOptions: Record<string, string | string[]>;
};

type StaffOrder = {
  id: string;
  status: string;
  totalAmount: string;
  createdAt: string;
  customer: { displayName: string } | null;
  items: StaffOrderItem[];
};

type StaffPayment = {
  id: string;
  method: string;
  status: string;
  amount: string;
  createdAt: string;
};

type StaffOrderDetail = StaffOrder & { payments: StaffPayment[] };

const orderStatuses = [
  "PENDING_PAYMENT",
  "CONFIRMED",
  "PREPARING",
  "COMPLETED",
  "CANCELLED",
];

function parseCustomer(value: unknown): StaffOrder["customer"] {
  if (value === null) return null;
  if (!isRecordValue(value) || typeof value.displayName !== "string") {
    throw new Error("Dữ liệu khách hàng trong đơn không đúng định dạng.");
  }
  return { displayName: value.displayName };
}

function parseOrderItem(value: unknown): StaffOrderItem {
  if (
    !isRecordValue(value) ||
    typeof value.productId !== "string" ||
    typeof value.productName !== "string" ||
    typeof value.quantity !== "number" ||
    typeof value.unitPrice !== "string" ||
    !isRecordValue(value.selectedOptions)
  ) {
    throw new Error("Dữ liệu món trong đơn hàng không đúng định dạng.");
  }

  const selectedOptions: Record<string, string | string[]> = {};
  for (const [key, option] of Object.entries(value.selectedOptions)) {
    if (typeof option === "string") {
      selectedOptions[key] = option;
    } else if (
      Array.isArray(option) &&
      option.every((entry) => typeof entry === "string")
    ) {
      selectedOptions[key] = option;
    } else {
      throw new Error("Tùy chọn của món trong đơn không đúng định dạng.");
    }
  }

  return {
    productId: value.productId,
    productName: value.productName,
    quantity: value.quantity,
    unitPrice: value.unitPrice,
    selectedOptions,
  };
}

function parseOrder(value: unknown): StaffOrder {
  if (
    !isRecordValue(value) ||
    typeof value.id !== "string" ||
    typeof value.status !== "string" ||
    typeof value.totalAmount !== "string" ||
    typeof value.createdAt !== "string" ||
    !Array.isArray(value.items)
  ) {
    throw new Error("Dữ liệu đơn hàng từ API không đúng định dạng.");
  }

  return {
    id: value.id,
    status: value.status,
    totalAmount: value.totalAmount,
    createdAt: value.createdAt,
    customer: parseCustomer(value.customer),
    items: value.items.map(parseOrderItem),
  };
}

function parseOrderList(value: unknown): StaffOrder[] {
  if (!Array.isArray(value)) {
    throw new Error("Dữ liệu danh sách đơn hàng không đúng định dạng.");
  }
  return value.map(parseOrder);
}

function parsePayment(value: unknown): StaffPayment {
  if (
    !isRecordValue(value) ||
    typeof value.id !== "string" ||
    typeof value.method !== "string" ||
    typeof value.status !== "string" ||
    typeof value.amount !== "string" ||
    typeof value.createdAt !== "string"
  ) {
    throw new Error("Dữ liệu thanh toán từ API không đúng định dạng.");
  }
  return {
    id: value.id,
    method: value.method,
    status: value.status,
    amount: value.amount,
    createdAt: value.createdAt,
  };
}

function parseDetail(value: unknown): StaffOrderDetail {
  if (!isRecordValue(value) || !Array.isArray(value.payments)) {
    throw new Error("Dữ liệu thanh toán từ API không đúng định dạng.");
  }
  return { ...parseOrder(value), payments: value.payments.map(parsePayment) };
}

function parseStatusUpdate(
  value: unknown,
  expectedOrderId: string,
): { orderId: string; orderStatus: string } {
  if (
    !isRecordValue(value) ||
    value.orderId !== expectedOrderId ||
    typeof value.orderStatus !== "string" ||
    !orderStatuses.includes(value.orderStatus)
  ) {
    throw new Error("Phản hồi cập nhật trạng thái từ API không hợp lệ.");
  }
  return { orderId: value.orderId, orderStatus: value.orderStatus };
}

function nextActions(status: string) {
  if (status === "CONFIRMED") {
    return [
      { status: "PREPARING", label: "Bắt đầu chuẩn bị" },
      { status: "CANCELLED", label: "Hủy đơn" },
    ];
  }
  if (status === "PREPARING") {
    return [{ status: "COMPLETED", label: "Hoàn tất đơn" }];
  }
  if (status === "PENDING_PAYMENT") {
    return [{ status: "CANCELLED", label: "Hủy đơn" }];
  }
  return [];
}

export default function StaffOrdersPage() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState("");
  const [retry, setRetry] = useState(0);
  const [orders, setOrders] = useState<StaffOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<StaffOrderDetail | null>(
    null,
  );
  const [selectedLoading, setSelectedLoading] = useState(false);
  const [selectedError, setSelectedError] = useState("");
  const [updating, setUpdating] = useState(false);
  const selectedRequest = useRef(0);

  const fetchOrders = useCallback(async () => {
    const query = statusFilter
      ? `?status=${encodeURIComponent(statusFilter)}`
      : "";
    return parseOrderList(await staffRequest(`/staff/orders${query}`));
  }, [statusFilter]);

  const redirectForAuthError = useCallback((cause: unknown) => {
    if (!(cause instanceof StaffApiError) || !cause.status) return false;
    if (cause.status === 401 || cause.status === 403) {
      window.sessionStorage.removeItem("brewlite.accessToken");
      window.sessionStorage.removeItem("brewlite.role");
      router.replace(
        `/staff/login?reason=${cause.status === 401 ? "session" : "role"}`,
      );
      return true;
    }
    return false;
  }, [router]);

  useEffect(() => {
    let active = true;
    const token = window.sessionStorage.getItem("brewlite.accessToken");
    const role = window.sessionStorage.getItem("brewlite.role");
    if (!token || role !== "STAFF") {
      router.replace(
        `/staff/login?reason=${token ? "role" : "required"}`,
      );
      return () => {
        active = false;
      };
    }

    void fetchOrders()
      .then((result) => {
        if (active) setOrders(result);
      })
      .catch((cause: unknown) => {
        if (active && !redirectForAuthError(cause)) {
          setOrders([]);
          setError(getErrorMessage(cause));
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [fetchOrders, redirectForAuthError, retry, router]);

  async function openOrder(orderId: string) {
    const requestId = ++selectedRequest.current;
    setSelectedOrder(null);
    setSelectedLoading(true);
    setSelectedError("");
    try {
      const order = parseDetail(
        await staffRequest(`/staff/orders/${orderId}`),
      );
      if (requestId === selectedRequest.current) setSelectedOrder(order);
    } catch (cause) {
      if (
        requestId === selectedRequest.current &&
        !redirectForAuthError(cause)
      ) {
        setSelectedError(getErrorMessage(cause));
      }
    } finally {
      if (requestId === selectedRequest.current) setSelectedLoading(false);
    }
  }

  async function updateStatus(status: string) {
    if (!selectedOrder) return;
    if (
      status === "CANCELLED" &&
      !window.confirm(`Xác nhận hủy đơn hàng ${selectedOrder.id}?`)
    ) {
      return;
    }

    setUpdating(true);
    setError("");
    setSelectedError("");
    setNotice("");
    try {
      const result = parseStatusUpdate(
        await staffRequest(`/staff/orders/${selectedOrder.id}/status`, {
          method: "PATCH",
          body: JSON.stringify({ status }),
        }),
        selectedOrder.id,
      );
      setSelectedOrder((current) =>
        current ? { ...current, status: result.orderStatus } : current,
      );
      setNotice(`Đã cập nhật đơn ${result.orderId}: ${staffStatusLabel(result.orderStatus)}.`);

      const [updatedOrders, updatedDetail] = await Promise.all([
        fetchOrders(),
        staffRequest(`/staff/orders/${result.orderId}`).then(parseDetail),
      ]);
      setOrders(updatedOrders);
      setSelectedOrder(updatedDetail);
    } catch (cause) {
      if (!redirectForAuthError(cause)) {
        setError(getErrorMessage(cause));
      }
    } finally {
      setUpdating(false);
    }
  }

  function reloadOrders() {
    setError("");
    setLoading(true);
    setRetry((value) => value + 1);
  }

  function changeFilter(status: string) {
    setStatusFilter(status);
    setSelectedOrder(null);
    setSelectedError("");
    setLoading(true);
    setError("");
  }

  function logout() {
    window.sessionStorage.removeItem("brewlite.accessToken");
    window.sessionStorage.removeItem("brewlite.role");
    router.replace("/staff/login");
  }

  return (
    <main className="manager-shell">
      <div className="manager-container manager-container-wide">
        <nav className="manager-topline" aria-label="Điều hướng nhân viên">
          <Link className="home-link" href="/">Trang chủ</Link>
          <span className="sprint-tag">BrewLite · Nhân viên quầy</span>
          <button className="text-button staff-logout" type="button" onClick={logout}>
            Đăng xuất
          </button>
        </nav>
        <header className="manager-heading">
          <p className="eyebrow">KHU VỰC NHÂN VIÊN QUẦY</p>
          <h1>Đơn hàng cần xử lý</h1>
          <p className="subtitle">
            Theo dõi đơn và cập nhật tiến độ phục vụ theo đúng quy trình.
          </p>
        </header>

        <section className="manager-card staff-orders-card">
          <div className="staff-order-toolbar">
            <label className="field">
              <span>Lọc trạng thái đơn</span>
              <select
                value={statusFilter}
                disabled={updating}
                onChange={(event) => changeFilter(event.target.value)}
              >
                <option value="">Đang cần xử lý</option>
                {orderStatuses.map((status) => (
                  <option value={status} key={status}>
                    {staffStatusLabel(status)}
                  </option>
                ))}
              </select>
            </label>
            <button
              className="button-secondary refresh-button"
              type="button"
              onClick={reloadOrders}
              disabled={loading || updating}
            >
              Tải lại danh sách
            </button>
          </div>
          {notice && <p className="feedback success staff-feedback" role="status">{notice}</p>}
          {error && <div className="manager-inline-error" role="alert"><p>{error}</p></div>}

          <div className="staff-order-layout">
            <section className="staff-order-list" aria-label="Danh sách đơn hàng">
              {loading ? (
                <div className="manager-inline-state" role="status">
                  <span className="loading-indicator" aria-hidden="true" />
                  Đang tải danh sách đơn…
                </div>
              ) : error ? (
                <div className="manager-state manager-state-error staff-list-state" role="alert">
                  <h2>Không tải được danh sách</h2>
                  <p>{error}</p>
                  <button className="button manager-state-action" type="button" onClick={reloadOrders}>Thử lại</button>
                </div>
              ) : orders.length === 0 ? (
                <div className="staff-empty">
                  <h2>Không có đơn hàng</h2>
                  <p>Hiện chưa có đơn phù hợp với bộ lọc đã chọn.</p>
                </div>
              ) : (
                orders.map((order) => (
                  <button
                    className={`staff-order-row${selectedOrder?.id === order.id ? " selected" : ""}`}
                    type="button"
                    key={order.id}
                    disabled={updating}
                    onClick={() => void openOrder(order.id)}
                  >
                    <span className="staff-order-row-head">
                      <strong>{order.id}</strong>
                      <span className={`status-pill status-${order.status.toLowerCase()}`}>
                        {staffStatusLabel(order.status)}
                      </span>
                    </span>
                    <span className="staff-order-row-meta">
                      {order.customer?.displayName ?? "Khách hàng"} · {formatStaffDate(order.createdAt)}
                    </span>
                    <span className="staff-order-row-total">
                      <span>{order.items.length} món · {order.items.reduce((sum, item) => sum + item.quantity, 0)} phần</span>
                      <strong>{formatStaffMoney(order.totalAmount)}</strong>
                    </span>
                  </button>
                ))
              )}
            </section>

            <section className="staff-order-detail" aria-live="polite">
              {selectedLoading ? (
                <div className="manager-inline-state" role="status">
                  <span className="loading-indicator" aria-hidden="true" />
                  Đang tải chi tiết đơn…
                </div>
              ) : selectedError ? (
                <div className="manager-inline-error" role="alert"><p>{selectedError}</p></div>
              ) : selectedOrder ? (
                <>
                  <div className="staff-detail-header">
                    <div>
                      <p className="detail-label">CHI TIẾT ĐƠN</p>
                      <h2 className="order-id">{selectedOrder.id}</h2>
                    </div>
                    <span className={`status-pill status-${selectedOrder.status.toLowerCase()}`}>
                      {staffStatusLabel(selectedOrder.status)}
                    </span>
                  </div>
                  <dl className="staff-order-meta">
                    <div><dt>Khách hàng</dt><dd>{selectedOrder.customer?.displayName ?? "Khách hàng"}</dd></div>
                    <div><dt>Thời gian</dt><dd>{formatStaffDate(selectedOrder.createdAt)}</dd></div>
                    <div><dt>Tổng tiền</dt><dd>{formatStaffMoney(selectedOrder.totalAmount)}</dd></div>
                  </dl>
                  <h3 className="staff-section-title">Món trong đơn</h3>
                  {selectedOrder.items.length === 0 ? (
                    <p className="empty-message">Đơn hàng chưa có món.</p>
                  ) : (
                    <ul className="staff-detail-items">
                      {selectedOrder.items.map((item, index) => (
                        <li key={`${item.productId}-${index}`}>
                          <div className="staff-item-main">
                            <strong>{item.productName}</strong>
                            <span>{item.quantity} × {formatStaffMoney(item.unitPrice)}</span>
                          </div>
                          {Object.entries(item.selectedOptions).length > 0 && (
                            <ul className="staff-option-list">
                              {Object.entries(item.selectedOptions).map(([key, value]) => (
                                <li key={key}>
                                  <span>{staffStatusLabel(key)}</span>
                                  <span>{Array.isArray(value) ? value.join(", ") : value}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                  <h3 className="staff-section-title">Thanh toán</h3>
                  {selectedOrder.payments.length === 0 ? (
                    <p className="empty-message">Đơn chưa có giao dịch thanh toán.</p>
                  ) : (
                    <ul className="staff-payment-list">
                      {selectedOrder.payments.map((payment) => (
                        <li key={payment.id}>
                          <span>{staffStatusLabel(payment.method)} · {formatStaffDate(payment.createdAt)}</span>
                          <strong className={`status-pill status-${payment.status.toLowerCase()}`}>
                            {staffStatusLabel(payment.status)}
                          </strong>
                          <span>{formatStaffMoney(payment.amount)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {nextActions(selectedOrder.status).length > 0 && (
                    <div className="staff-status-actions">
                      {nextActions(selectedOrder.status).map((action) => (
                        <button
                          className={action.status === "CANCELLED" ? "button-secondary staff-cancel-button" : "button"}
                          type="button"
                          key={action.status}
                          disabled={updating}
                          onClick={() => void updateStatus(action.status)}
                        >
                          {updating ? "Đang cập nhật…" : action.label}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="staff-detail-placeholder">
                  <div className="state-icon" aria-hidden="true">☕</div>
                  <h2>Chọn một đơn hàng</h2>
                  <p>Chi tiết món, tùy chọn, thanh toán và thao tác sẽ hiển thị tại đây.</p>
                </div>
              )}
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
