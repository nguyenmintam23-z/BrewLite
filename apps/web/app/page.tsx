"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type Role = "CUSTOMER" | "STAFF" | "MANAGER";
type Screen = "login" | "register" | "otp" | "forgot-phone" | "forgot-otp" | "forgot-password" | "welcome";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
const phonePattern = /^0[0-9]{9}$/;
const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

async function postJson(path: string, payload: Record<string, string>) {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error("Không kết nối được máy chủ. Hãy kiểm tra backend NestJS ở cổng 3000.");
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = Array.isArray(data.message) ? data.message.join(". ") : data.message;
    throw new Error(message || `Yêu cầu thất bại (${response.status}).`);
  }
  return data;
}

export default function Home() {
  const router = useRouter();
  const [screen, setScreen] = useState<Screen>("login");
  const [role, setRole] = useState<Role>("CUSTOMER");
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [signedInName, setSignedInName] = useState("");
  const [signedInRole, setSignedInRole] = useState<Role>("CUSTOMER");
  const [orderId, setOrderId] = useState("");

  function resetMessages() {
    setError("");
    setNotice("");
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    resetMessages();
    setBusy(true);
    try {
      const isCustomer = role === "CUSTOMER";
      const data = await postJson(
        isCustomer ? "/auth/customers/login" : "/auth/staff/login",
        isCustomer
          ? { phone: account.trim(), password }
          : { username: role === "STAFF" ? "staff" : "manager", password },
      );
      if (data.role !== role) {
        throw new Error("Vai trò tài khoản không khớp. Hãy chọn đúng loại tài khoản.");
      }
      sessionStorage.setItem("brewlite.accessToken", data.accessToken);
      sessionStorage.setItem("brewlite.role", data.role);
      if (data.role === "STAFF") {
        router.replace("/staff/orders");
        return;
      }
      if (data.role === "CUSTOMER") {
        router.replace("/customer/menu");
        return;
      }
      setSignedInName(data.displayName || account || "BrewLite");
      setSignedInRole(data.role);
      setScreen("welcome");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Đăng nhập chưa thành công.");
    } finally {
      setBusy(false);
    }
  }

  async function handleRequestOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    resetMessages();
    if (!phonePattern.test(phone.trim())) {
      setError("Số điện thoại phải gồm 10 chữ số, bắt đầu bằng 03, 05, 07, 08 hoặc 09.");
      return;
    }
    if (!passwordPattern.test(password)) {
      setError("Mật khẩu cần ít nhất 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt.");
      return;
    }

    setBusy(true);
    try {
      const data = await postJson("/auth/customers/register/request-otp", {
        displayName: displayName.trim(),
        phone: phone.trim(),
        password,
      });
      setNotice(data.message || "Đã tạo yêu cầu OTP. Xem mã trong terminal NestJS để kiểm thử.");
      setScreen("otp");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không gửi được yêu cầu OTP.");
    } finally {
      setBusy(false);
    }
  }

  async function handleVerifyOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    resetMessages();
    if (!/^\d{6}$/.test(otp.trim())) {
      setError("OTP phải gồm đúng 6 chữ số.");
      return;
    }
    setBusy(true);
    try {
      const data = await postJson("/auth/customers/register/verify-otp", {
        phone: phone.trim(),
        otp: otp.trim(),
      });
      setScreen("login");
      setRole("CUSTOMER");
      setAccount(phone.trim());
      setPassword("");
      setOtp("");
      setNotice(data.message || "Xác minh thành công. Hãy đăng nhập bằng tài khoản vừa tạo.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không xác minh được OTP.");
    } finally {
      setBusy(false);
    }
  }

  async function handleRequestPasswordReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    resetMessages();
    if (!phonePattern.test(phone.trim())) {
      setError("Số điện thoại phải gồm 10 chữ số, bắt đầu bằng 03, 05, 07, 08 hoặc 09.");
      return;
    }

    setBusy(true);
    try {
      const data = await postJson("/auth/customers/forgot-password/request-otp", {
        phone: phone.trim(),
      });
      setNotice(data.message || "Nếu số điện thoại có tài khoản, mã OTP sẽ được gửi đến số đó.");
      setScreen("forgot-otp");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không gửi được yêu cầu OTP.");
    } finally {
      setBusy(false);
    }
  }

  async function handleVerifyPasswordResetOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    resetMessages();
    if (!/^\d{6}$/.test(otp.trim())) {
      setError("OTP phải gồm đúng 6 chữ số.");
      return;
    }

    setBusy(true);
    try {
      const data = await postJson("/auth/customers/forgot-password/verify-otp", {
        phone: phone.trim(),
        otp: otp.trim(),
      });
      setResetToken(data.resetToken);
      setScreen("forgot-password");
      setNotice("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không xác minh được OTP.");
    } finally {
      setBusy(false);
    }
  }

  async function handleResetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    resetMessages();
    if (!passwordPattern.test(password)) {
      setError("Mật khẩu cần ít nhất 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    setBusy(true);
    try {
      const data = await postJson("/auth/customers/forgot-password/reset", {
        phone: phone.trim(),
        resetToken,
        password,
      });
      setScreen("login");
      setRole("CUSTOMER");
      setAccount(phone.trim());
      setPassword("");
      setConfirmPassword("");
      setOtp("");
      setResetToken("");
      setNotice(data.message || "Đổi mật khẩu thành công. Hãy đăng nhập bằng mật khẩu mới.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không đổi được mật khẩu.");
    } finally {
      setBusy(false);
    }
  }

  function logout() {
    sessionStorage.removeItem("brewlite.accessToken");
    sessionStorage.removeItem("brewlite.role");
    setScreen("login");
    setPassword("");
    setNotice("Bạn đã đăng xuất.");
  }

  function openOrderDetails(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const id = orderId.trim();
    if (id) {
      router.push(`/manager/orders/${encodeURIComponent(id)}`);
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-card" aria-live="polite">
        <div className="topline">
          <a className="home-link" href="#" onClick={(event) => { event.preventDefault(); setScreen("login"); resetMessages(); }}>
            <span aria-hidden="true">←</span> Trang chủ
          </a>
          <span className="sprint-tag">BrewLite</span>
        </div>

        <header className="brand">
          <div className="brand-icon" aria-hidden="true">🧋</div>
          <p className="eyebrow">TIỆM ĐỒ UỐNG ONLINE</p>
          <h1>{screen === "register" ? "Tạo tài khoản" : screen === "otp" || screen === "forgot-otp" ? "Xác nhận OTP" : screen === "forgot-phone" ? "Quên mật khẩu" : screen === "forgot-password" ? "Tạo mật khẩu mới" : screen === "welcome" ? "Chào mừng!" : "Đăng nhập"}</h1>
          <p className="subtitle">
            {screen === "register" ? "Tạo tài khoản để bắt đầu đặt món yêu thích." : screen === "otp" || screen === "forgot-otp" ? `Nhập mã 6 chữ số dành cho ${phone}.` : screen === "forgot-phone" ? "Nhập số điện thoại đã đăng ký để nhận mã xác minh." : screen === "forgot-password" ? "Chọn mật khẩu mới để bảo vệ tài khoản của bạn." : screen === "welcome" ? "Bạn đã đăng nhập vào BrewLite." : "Chào mừng bạn quay lại với BrewLite."}
          </p>
        </header>

        {screen === "welcome" ? (
          <div className="welcome-panel">
            <div className="welcome-intro">
              <span className="welcome-mark" aria-hidden="true">✓</span>
              <div>
                <h2>{signedInName}</h2>
                <p>Đăng nhập với vai trò <strong>{signedInRole === "CUSTOMER" ? "Khách hàng" : signedInRole === "STAFF" ? "Nhân viên" : "Quản lý"}</strong>.</p>
              </div>
            </div>
            {signedInRole === "MANAGER" ? (
              <>
                <div className="manager-shortcuts">
                  <button className="button" type="button" onClick={() => router.push("/manager/orders")}>Quản lý đơn hàng</button>
                  <button className="button-secondary" type="button" onClick={() => router.push("/manager/products")}>Quản lý đồ uống</button>
                  <button className="button-secondary" type="button" onClick={() => router.push("/manager/reports")}>Báo cáo doanh thu</button>
                </div>
                <form className="manager-order-link" onSubmit={openOrderDetails}>
                  <label className="field" htmlFor="manager-order-id">
                    <span>Mã đơn hàng cần xem</span>
                    <input
                      id="manager-order-id"
                      required
                      value={orderId}
                      onChange={(event) => setOrderId(event.target.value)}
                      placeholder="Nhập mã đơn hàng"
                    />
                  </label>
                  <button className="button" type="submit">Xem chi tiết đơn</button>
                </form>
              </>
            ) : (
              <p className="muted">Phiên đăng nhập đã sẵn sàng.</p>
            )}
            <button className="button button-secondary" type="button" onClick={logout}>Đăng xuất</button>
          </div>
        ) : screen === "login" ? (
          <>
            <div className="role-switch" role="group" aria-label="Chọn loại tài khoản">
              {(["CUSTOMER", "STAFF", "MANAGER"] as Role[]).map((item) => (
                <button key={item} type="button" className={role === item ? "role-option active" : "role-option"} onClick={() => { setRole(item); resetMessages(); }}>
                  {item === "CUSTOMER" ? "Khách hàng" : item === "STAFF" ? "Nhân viên" : "Quản lý"}
                </button>
              ))}
            </div>
            <form className="form" onSubmit={handleLogin}>
              <label className="field">
                <span>{role === "CUSTOMER" ? "Số điện thoại" : "Tên đăng nhập"}</span>
                <input autoComplete="username" required value={role === "CUSTOMER" ? account : role === "STAFF" ? "staff" : "manager"} onChange={(event) => setAccount(event.target.value)} placeholder={role === "CUSTOMER" ? "Ví dụ: 0912345678" : role === "STAFF" ? "staff" : "manager"} readOnly={role !== "CUSTOMER"} />
              </label>
              <label className="field">
                <span>Mật khẩu</span>
                <input type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Nhập mật khẩu" />
              </label>
              <button className="button" type="submit" disabled={busy}>{busy ? "Đang đăng nhập…" : "Đăng nhập"}</button>
            </form>
            {role === "CUSTOMER" && <p className="switch-copy"><button className="text-button" type="button" onClick={() => { setPhone(account); setOtp(""); setPassword(""); setScreen("forgot-phone"); resetMessages(); }}>Quên mật khẩu?</button></p>}
            {role === "CUSTOMER" && <p className="switch-copy">Chưa có tài khoản? <button className="text-button" type="button" onClick={() => { setScreen("register"); setPassword(""); resetMessages(); }}>Đăng ký ngay</button></p>}
          </>
        ) : screen === "register" ? (
          <form className="form" onSubmit={handleRequestOtp}>
            <label className="field"><span>Họ tên hiển thị</span><input autoComplete="name" required maxLength={80} value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="Nhập họ tên" /></label>
            <label className="field"><span>Số điện thoại</span><input type="tel" autoComplete="tel" required value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Ví dụ: 0912345678" /></label>
            <label className="field"><span>Mật khẩu</span><input type="password" autoComplete="new-password" required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Ít nhất 8 ký tự" /></label>
            <p className="hint">Tối thiểu 8 ký tự, có chữ hoa, chữ thường, số và ký tự đặc biệt.</p>
            <button className="button" type="submit" disabled={busy}>{busy ? "Đang gửi…" : "Gửi mã OTP"}</button>
            <p className="switch-copy">Đã có tài khoản? <button className="text-button" type="button" onClick={() => { setScreen("login"); resetMessages(); }}>Đăng nhập</button></p>
          </form>
        ) : screen === "otp" ? (
          <form className="form" onSubmit={handleVerifyOtp}>
            <label className="field"><span>Mã OTP</span><input inputMode="numeric" autoComplete="one-time-code" required maxLength={6} value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="Nhập 6 chữ số" /></label>
            <p className="otp-note">Đồ án đang dùng OTP thử nghiệm. Lấy mã trong terminal đang chạy NestJS; hệ thống chưa gửi SMS.</p>
            <button className="button" type="submit" disabled={busy}>{busy ? "Đang xác nhận…" : "Xác nhận đăng ký"}</button>
            <p className="switch-copy"><button className="text-button" type="button" onClick={() => { setScreen("register"); setOtp(""); resetMessages(); }}>Quay lại đăng ký</button></p>
          </form>
        ) : screen === "forgot-phone" ? (
          <form className="form" onSubmit={handleRequestPasswordReset}>
            <label className="field"><span>Số điện thoại</span><input type="tel" autoComplete="tel" required value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Ví dụ: 0912345678" /></label>
            <button className="button" type="submit" disabled={busy}>{busy ? "Đang gửi mã…" : "Gửi mã OTP"}</button>
            <p className="switch-copy"><button className="text-button" type="button" onClick={() => { setScreen("login"); resetMessages(); }}>Quay lại đăng nhập</button></p>
          </form>
        ) : screen === "forgot-otp" ? (
          <form className="form" onSubmit={handleVerifyPasswordResetOtp}>
            <label className="field"><span>Mã OTP</span><input inputMode="numeric" autoComplete="one-time-code" required maxLength={6} value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="Nhập 6 chữ số" /></label>
            <p className="otp-note">Mã OTP có hiệu lực trong 5 phút. Trong môi trường phát triển, mã được in ở terminal NestJS.</p>
            <button className="button" type="submit" disabled={busy}>{busy ? "Đang xác minh…" : "Xác nhận OTP"}</button>
            <p className="switch-copy"><button className="text-button" type="button" onClick={() => { setScreen("forgot-phone"); setOtp(""); resetMessages(); }}>Đổi số điện thoại</button></p>
          </form>
        ) : screen === "forgot-password" ? (
          <form className="form" onSubmit={handleResetPassword}>
            <label className="field"><span>Mật khẩu mới</span><input type="password" autoComplete="new-password" required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Nhập mật khẩu mới" /></label>
            <label className="field"><span>Xác nhận mật khẩu</span><input type="password" autoComplete="new-password" required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Nhập lại mật khẩu mới" /></label>
            <p className="hint">Tối thiểu 8 ký tự, có chữ hoa, chữ thường, số và ký tự đặc biệt.</p>
            <button className="button" type="submit" disabled={busy}>{busy ? "Đang cập nhật…" : "Xác nhận đổi mật khẩu"}</button>
          </form>
        ): null}

        {notice && <p className="feedback success" role="status">{notice}</p>}
        {error && <p className="feedback error" role="alert">{error}</p>}
        <footer className="footer">© 2026 BrewLite <span>•</span> Cà phê ngon, ngày vui</footer>
      </section>
    </main>
  );
}
