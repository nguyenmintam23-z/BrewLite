"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CUSTOMER_API_URL,
  getCustomerErrorMessage,
  isRecordValue,
} from "../customer-api";

export default function CustomerLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(() => {
    const reason = searchParams.get("reason");
    if (reason === "required") return "Đăng nhập tài khoản khách hàng để tiếp tục.";
    if (reason === "role") return "Tài khoản hiện tại không có quyền khách hàng.";
    if (reason === "session") return "Phiên đăng nhập hết hạn hoặc không hợp lệ. Hãy đăng nhập lại.";
    return "";
  });
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!/^0\d{9}$/.test(phone.trim())) {
      setError("Số điện thoại phải bắt đầu bằng 0 và gồm đúng 10 chữ số.");
      return;
    }

    setBusy(true);
    try {
      let response: Response;
      try {
        response = await fetch(`${CUSTOMER_API_URL}/auth/customers/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: phone.trim(), password }),
        });
      } catch {
        throw new Error(
          "Không kết nối được API. Hãy kiểm tra backend và cấu hình địa chỉ API.",
        );
      }

      const payload: unknown = await response.json().catch(() => undefined);
      if (!response.ok) {
        const apiMessage = isRecordValue(payload) ? payload.message : undefined;
        throw new Error(
          Array.isArray(apiMessage)
            ? apiMessage.join(". ")
            : typeof apiMessage === "string"
              ? apiMessage
              : "Số điện thoại hoặc mật khẩu không đúng.",
        );
      }
      if (
        !isRecordValue(payload) ||
        typeof payload.accessToken !== "string" ||
        payload.role !== "CUSTOMER"
      ) {
        throw new Error("API không trả về phiên đăng nhập khách hàng hợp lệ.");
      }

      window.sessionStorage.setItem("brewlite.accessToken", payload.accessToken);
      window.sessionStorage.setItem("brewlite.role", "CUSTOMER");
      window.sessionStorage.setItem(
        "brewlite.customerName",
        typeof payload.displayName === "string" ? payload.displayName : "",
      );
      router.replace("/customer/menu");
    } catch (cause) {
      setError(getCustomerErrorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-card" aria-live="polite">
        <div className="topline">
          <Link className="home-link" href="/">
            <span aria-hidden="true">←</span> Trang chủ
          </Link>
          <span className="sprint-tag">BrewLite</span>
        </div>
        <header className="brand">
          <div className="brand-icon" aria-hidden="true">🧋</div>
          <p className="eyebrow">TÀI KHOẢN KHÁCH HÀNG</p>
          <h1>Đăng nhập</h1>
          <p className="subtitle">Đăng nhập để đặt món và theo dõi đơn hàng.</p>
        </header>
        <form className="form" onSubmit={submit}>
          <label className="field">
            <span>Số điện thoại</span>
            <input
              type="tel"
              autoComplete="tel"
              required
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="Ví dụ: 0912345678"
            />
          </label>
          <label className="field">
            <span>Mật khẩu</span>
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Nhập mật khẩu"
            />
          </label>
          {error && <p className="feedback error" role="alert">{error}</p>}
          <button className="button" type="submit" disabled={busy}>
            {busy ? "Đang đăng nhập…" : "Đăng nhập"}
          </button>
        </form>
        <p className="switch-copy">
          Chưa có tài khoản? <Link href="/">Đăng ký tại trang chủ</Link>
        </p>
      </section>
    </main>
  );
}
