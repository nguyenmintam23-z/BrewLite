import { Suspense } from "react";
import StaffLoginForm from "./login-form";

export default function StaffLoginPage() {
  return (
    <Suspense
      fallback={
        <main className="auth-shell">
          <section className="auth-card">
            <p className="manager-inline-state" role="status">
              Đang mở đăng nhập nhân viên…
            </p>
          </section>
        </main>
      }
    >
      <StaffLoginForm />
    </Suspense>
  );
}
