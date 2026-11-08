import { Suspense } from "react";
import CustomerLoginForm from "./customer-login-form";

export default function CustomerLoginPage() {
  return (
    <Suspense
      fallback={
        <main className="auth-shell">
          <section className="auth-card">
            <p className="manager-inline-state" role="status">
              Đang mở đăng nhập khách hàng…
            </p>
          </section>
        </main>
      }
    >
      <CustomerLoginForm />
    </Suspense>
  );
}
