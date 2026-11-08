"use client";

import { FormEvent, useState } from "react";
import ManagerNav from "../manager-nav";
import {
  formatMoney,
  getErrorMessage,
  isRecordValue,
  managerRequest,
} from "../manager-api";

type SalesReport = {
  from: string;
  to: string;
  revenue: string;
  totalOrderCount: number;
  paidOrderCount: number;
  pendingPaymentOrderCount: number;
  failedPaymentOrderCount: number;
  unpaidOrderCount: number;
};

function parseReport(value: unknown): SalesReport {
  if (
    !isRecordValue(value) ||
    typeof value.from !== "string" ||
    typeof value.to !== "string" ||
    typeof value.revenue !== "string" ||
    typeof value.totalOrderCount !== "number" ||
    typeof value.paidOrderCount !== "number" ||
    typeof value.pendingPaymentOrderCount !== "number" ||
    typeof value.failedPaymentOrderCount !== "number" ||
    typeof value.unpaidOrderCount !== "number"
  ) {
    throw new Error("Dữ liệu báo cáo từ API không đúng định dạng.");
  }

  return {
    from: value.from,
    to: value.to,
    revenue: value.revenue,
    totalOrderCount: value.totalOrderCount,
    paidOrderCount: value.paidOrderCount,
    pendingPaymentOrderCount: value.pendingPaymentOrderCount,
    failedPaymentOrderCount: value.failedPaymentOrderCount,
    unpaidOrderCount: value.unpaidOrderCount,
  };
}

export default function ManagerReportsPage() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [report, setReport] = useState<SalesReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!from || !to || from > to) {
      setError("Chọn ngày bắt đầu và ngày kết thúc hợp lệ; ngày bắt đầu không được sau ngày kết thúc.");
      return;
    }

    setLoading(true);
    setReport(null);
    try {
      const query = new URLSearchParams({ from, to });
      setReport(
        parseReport(await managerRequest(`/manager/reports/sales?${query}`)),
      );
    } catch (cause) {
      setError(getErrorMessage(cause));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="manager-shell">
      <div className="manager-container">
        <ManagerNav />
        <header className="manager-heading">
          <p className="eyebrow">QUẢN LÝ CỬA HÀNG</p>
          <h1>Báo cáo doanh thu</h1>
          <p className="subtitle">Doanh thu chỉ tính các đơn có thanh toán thành công.</p>
        </header>

        <section className="manager-card report-filter-card">
          <form className="report-filter-form" onSubmit={loadReport}>
            <label className="field">
              <span>Từ ngày</span>
              <input type="date" required value={from} onChange={(event) => setFrom(event.target.value)} />
            </label>
            <label className="field">
              <span>Đến ngày</span>
              <input type="date" required value={to} onChange={(event) => setTo(event.target.value)} />
            </label>
            <button className="button report-submit" type="submit" disabled={loading}>
              {loading ? "Đang tải…" : "Xem báo cáo"}
            </button>
          </form>
        </section>

        {error && <div className="manager-inline-error report-message" role="alert"><p>{error}</p></div>}
        {loading ? (
          <section className="manager-state" role="status"><span className="loading-indicator" aria-hidden="true" /><p>Đang tải báo cáo…</p></section>
        ) : report ? (
          <>
            <p className="report-period">Kỳ báo cáo: {report.from} đến {report.to} (bao gồm cả hai ngày)</p>
            <section className="report-metrics">
              <article className="report-metric report-revenue"><p>DOANH THU ĐÃ THU</p><strong>{formatMoney(report.revenue)}</strong><span>Đơn thanh toán thành công</span></article>
              <article className="report-metric"><p>TỔNG SỐ ĐƠN</p><strong>{report.totalOrderCount}</strong><span>Đơn được tạo trong kỳ</span></article>
              <article className="report-metric"><p>ĐÃ THANH TOÁN</p><strong>{report.paidOrderCount}</strong><span>Payment SUCCEEDED</span></article>
              <article className="report-metric report-pending"><p>ĐANG CHỜ</p><strong>{report.pendingPaymentOrderCount}</strong><span>Payment PENDING</span></article>
              <article className="report-metric report-failed"><p>THANH TOÁN THẤT BẠI</p><strong>{report.failedPaymentOrderCount}</strong><span>Không tính vào doanh thu</span></article>
              <article className="report-metric"><p>CHƯA CÓ THANH TOÁN</p><strong>{report.unpaidOrderCount}</strong><span>Không tính vào doanh thu</span></article>
            </section>
            {report.totalOrderCount === 0 && <p className="empty-message report-empty">Không có đơn hàng trong khoảng thời gian này.</p>}
          </>
        ) : (
          <section className="manager-state report-empty-state">
            <div className="state-icon" aria-hidden="true">₫</div>
            <h2>Chọn khoảng thời gian</h2>
            <p>Báo cáo sẽ lấy dữ liệu đơn hàng thực tế từ API sau khi bạn chọn ngày.</p>
          </section>
        )}
      </div>
    </main>
  );
}
