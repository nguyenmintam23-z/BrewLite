"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import ManagerNav from "../manager-nav";
import {
  formatDateTime,
  formatMoney,
  getErrorMessage,
  isRecordValue,
  managerRequest,
  orderStatusLabel,
} from "../manager-api";

type ManagerOrder = {
  id: string;
  status: string;
  totalAmount: string;
  createdAt: string;
  paymentStatus: string | null;
  customer: { id: string; displayName: string };
};

const orderStatuses = [
  "PENDING_PAYMENT",
  "CONFIRMED",
  "PREPARING",
  "COMPLETED",
  "CANCELLED",
];

function parseOrders(value: unknown): ManagerOrder[] {
  if (!Array.isArray(value)) {
    throw new Error("Dữ liệu danh sách đơn hàng từ API không đúng định dạng.");
  }

  return value.map((order) => {
    if (
      !isRecordValue(order) ||
      typeof order.id !== "string" ||
      typeof order.status !== "string" ||
      typeof order.totalAmount !== "string" ||
      typeof order.createdAt !== "string" ||
      !(typeof order.paymentStatus === "string" || order.paymentStatus === null) ||
      !isRecordValue(order.customer) ||
      typeof order.customer.id !== "string" ||
      typeof order.customer.displayName !== "string"
    ) {
      throw new Error("Dữ liệu đơn hàng từ API không đúng định dạng.");
    }

    return {
      id: order.id,
      status: order.status,
      totalAmount: order.totalAmount,
      createdAt: order.createdAt,
      paymentStatus: order.paymentStatus,
      customer: {
        id: order.customer.id,
        displayName: order.customer.displayName,
      },
    };
  });
}

function nextStatuses(status: string) {
  if (status === "CONFIRMED") return ["PREPARING", "CANCELLED"];
  if (status === "PREPARING") return ["COMPLETED"];
  if (status === "PENDING_PAYMENT") return ["CANCELLED"];
  return [];
}

export default function ManagerOrdersPage() {
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [orders, setOrders] = useState<ManagerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [retry, setRetry] = useState(0);
  const [updating, setUpdating] = useState("");

  const fetchOrders = useCallback(async () => {
    const query = statusFilter
      ? `?status=${encodeURIComponent(statusFilter)}`
      : "";
    return parseOrders(await managerRequest(`/manager/orders${query}`));
  }, [statusFilter]);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setOrders(await fetchOrders());
    } catch (cause) {
      setError(getErrorMessage(cause));
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [fetchOrders]);

  useEffect(() => {
    let active = true;
    void fetchOrders()
      .then((result) => {
        if (active) setOrders(result);
      })
      .catch((cause: unknown) => {
        if (active) {
          setError(getErrorMessage(cause));
          setOrders([]);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [fetchOrders, retry]);

  const visibleOrders = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return needle
      ? orders.filter((order) => order.id.toLowerCase().includes(needle))
      : orders;
  }, [orders, search]);

  function retryOrders() {
    setError("");
    setLoading(true);
    setRetry((value) => value + 1);
  }

  function filterByStatus(status: string) {
    setError("");
    setLoading(true);
    setStatusFilter(status);
  }

  async function updateStatus(order: ManagerOrder, nextStatus: string) {
    if (
      nextStatus === "CANCELLED" &&
      !window.confirm(`Xác nhận hủy đơn hàng ${order.id}?`)
    ) {
      return;
    }

    setUpdating(order.id);
    setNotice("");
    setError("");
    try {
      await managerRequest(`/manager/orders/${order.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus }),
      });
      setNotice(`Đã cập nhật trạng thái đơn ${order.id}.`);
      await loadOrders();
    } catch (cause) {
      setError(getErrorMessage(cause));
    } finally {
      setUpdating("");
    }
  }

  return (
    <main className="manager-shell">
      <div className="manager-container manager-container-wide">
        <ManagerNav />
        <header className="manager-heading">
          <p className="eyebrow">QUẢN LÝ CỬA HÀNG</p>
          <h1>Đơn hàng</h1>
          <p className="subtitle">Theo dõi thanh toán và xử lý đơn theo đúng quy trình.</p>
        </header>

        <section className="manager-card order-list-card">
          <div className="manager-filters">
            <label className="field">
              <span>Lọc trạng thái</span>
              <select
                value={statusFilter}
                onChange={(event) => filterByStatus(event.target.value)}
              >
                <option value="">Tất cả trạng thái</option>
                {orderStatuses.map((status) => (
                  <option value={status} key={status}>
                    {orderStatusLabel(status)}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Tìm mã đơn</span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Nhập mã đơn hàng"
              />
            </label>
            <button
              className="button-secondary refresh-button"
              type="button"
              onClick={retryOrders}
              disabled={loading}
            >
              Tải lại
            </button>
          </div>

          {notice && <p className="feedback success" role="status">{notice}</p>}
          {error && (
            <div className="manager-inline-error" role="alert">
              <p>{error}</p>
              <button
                className="button-secondary"
                type="button"
                onClick={retryOrders}
              >
                Thử lại
              </button>
            </div>
          )}
          {loading ? (
            <div className="manager-inline-state" role="status">
              <span className="loading-indicator" aria-hidden="true" />
              Đang tải danh sách đơn hàng…
            </div>
          ) : !error && visibleOrders.length === 0 ? (
            <p className="empty-message">
              {orders.length === 0
                ? "Chưa có đơn hàng."
                : "Không tìm thấy đơn hàng phù hợp."}
            </p>
          ) : (
            !error && (
              <div className="manager-table-wrap">
                <table className="manager-table">
                  <thead>
                    <tr>
                      <th>Mã đơn</th>
                      <th>Khách hàng</th>
                      <th>Ngày tạo</th>
                      <th>Tổng tiền</th>
                      <th>Đơn hàng</th>
                      <th>Thanh toán</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleOrders.map((order) => (
                      <tr key={order.id}>
                        <td className="table-order-id">{order.id}</td>
                        <td>{order.customer.displayName}</td>
                        <td>{formatDateTime(order.createdAt)}</td>
                        <td>{formatMoney(order.totalAmount)}</td>
                        <td>
                          <span className={`status-pill status-${order.status.toLowerCase()}`}>
                            {orderStatusLabel(order.status)}
                          </span>
                        </td>
                        <td>
                          <span className={`status-pill ${order.paymentStatus ? `status-${order.paymentStatus.toLowerCase()}` : ""}`}>
                            {order.paymentStatus
                              ? orderStatusLabel(order.paymentStatus)
                              : "Chưa thanh toán"}
                          </span>
                        </td>
                        <td>
                          <div className="table-actions">
                            <Link
                              className="table-link"
                              href={`/manager/orders/${encodeURIComponent(order.id)}`}
                            >
                              Chi tiết
                            </Link>
                            {nextStatuses(order.status).length > 0 && (
                              <select
                                aria-label={`Cập nhật trạng thái ${order.id}`}
                                value=""
                                disabled={updating === order.id}
                                onChange={(event) => {
                                  const nextStatus = event.target.value;
                                  if (nextStatus) void updateStatus(order, nextStatus);
                                }}
                              >
                                <option value="">Cập nhật…</option>
                                {nextStatuses(order.status).map((nextStatus) => (
                                  <option value={nextStatus} key={nextStatus}>
                                    {nextStatus === "CANCELLED"
                                      ? "Hủy đơn"
                                      : orderStatusLabel(nextStatus)}
                                  </option>
                                ))}
                              </select>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </section>
      </div>
    </main>
  );
}
