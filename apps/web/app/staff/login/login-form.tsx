"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  getErrorMessage,
  isRecordValue,
  STAFF_API_URL,
} from "../staff-api";

export default function StaffLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [error, setError] = useState(() => {
    const reason = searchParams.get("reason");
    if (reason === "required") return "Đăng nhập bằng tài khoản nhân viên để tiếp tục.";
    if (reason === "role") return "Tài khoản hiện tại không có quyền nhân viên quầy.";
    if (reason === "session") return "Phiên đăng nhập hết hạn hoặc không còn hợp lệ. Hãy đăng nhập lại.";
    return "";
  });
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");

    try {
      let response: Response;
      try {
        response = await fetch(`${STAFF_API_URL}/auth/staff/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: "staff", password }),
        });
      } catch {
        throw new Error(
          "Không kết nối được API. Hãy kiểm tra backend và cấu hình địa chỉ API.",
        );
      }

      const payload: unknown = await response.json().catch(() => undefined);
      if (!response.ok) {
        const apiMessage =
          isRecordValue(payload) ? payload.message : undefined;
        const message = Array.isArray(apiMessage)
          ? apiMessage.join(". ")
          : typeof apiMessage === "string"
            ? apiMessage
            : "Đăng nhập không thành công. Hãy kiểm tra thông tin tài khoản.";
        throw new Error(message);
      }
      if (
        !isRecordValue(payload) ||
        typeof payload.accessToken !== "string" ||
        payload.role !== "STAFF"
      ) {
        throw new Error(
          "API không trả về phiên đăng nhập hợp lệ cho nhân viên.",
        );
      }

      window.sessionStorage.setItem(
        "brewlite.accessToken",
        payload.accessToken,
      );
      window.sessionStorage.setItem("brewlite.role", "STAFF");
      router.replace("/staff/orders");
    } catch (cause) {
      setError(getErrorMessage(cause));
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
          <span className="sprint-tag">BrewLite · Nhân viên</span>
        </div>
        <header className="brand">
          <div className="brand-icon" aria-hidden="true">🧋</div>
          <p className="eyebrow">KHU VỰC NHÂN VIÊN QUẦY</p>
          <h1>Đăng nhập nhân viên</h1>
          <p className="subtitle">
            Dùng tài khoản nội bộ do quản lý cấp để xử lý đơn hàng.
          </p>
        </header>

        <form className="form" onSubmit={submit}>
          <label className="field">
            <span>Tên đăng nhập</span>
            <input value="staff" readOnly autoComplete="username" />
          </label>
          <label className="field">
            <span>Mật khẩu</span>
            <input
              type="password"
              required
              autoComplete="current-password"
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
        <p className="footer">
          Quyền truy cập được xác thực và kiểm tra ở máy chủ.
        </p>
      </section>
    </main>
  );
}
