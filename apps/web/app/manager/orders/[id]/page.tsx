import { Suspense } from "react";
import OrderDetail from "./order-detail";

export default function ManagerOrderPage() {
  return (
    <Suspense
      fallback={
        <main className="manager-shell">
          <div className="manager-container">
            <section className="manager-state" role="status">
              <span className="loading-indicator" aria-hidden="true" />
              <p>Đang mở chi tiết đơn hàng…</p>
            </section>
          </div>
        </main>
      }
    >
      <OrderDetail />
    </Suspense>
  );
}
