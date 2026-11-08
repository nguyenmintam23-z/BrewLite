"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSyncExternalStore } from "react";

const AUTH_CHANGE_EVENT = "brewlite-customer-auth-change";

function subscribeToAuthChanges(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(AUTH_CHANGE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(AUTH_CHANGE_EVENT, callback);
  };
}

function getSignedInSnapshot() {
  return (
    window.sessionStorage.getItem("brewlite.role") === "CUSTOMER" &&
    Boolean(window.sessionStorage.getItem("brewlite.accessToken"))
  );
}

export default function CustomerNav() {
  const router = useRouter();
  const signedIn = useSyncExternalStore(
    subscribeToAuthChanges,
    getSignedInSnapshot,
    () => false,
  );

  function signOut() {
    window.sessionStorage.removeItem("brewlite.accessToken");
    window.sessionStorage.removeItem("brewlite.role");
    window.sessionStorage.removeItem("brewlite.customerName");
    window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
    router.replace("/customer/login");
  }

  return (
    <nav className="manager-topline customer-topline" aria-label="Điều hướng khách hàng">
      <Link className="home-link" href="/customer/menu">
        <span aria-hidden="true">🧋</span> BrewLite
      </Link>
      <div className="manager-nav-links">
        <Link href="/customer/menu">Thực đơn</Link>
        <Link href="/customer/cart">Giỏ hàng</Link>
        <Link href="/customer/orders">Đơn hàng của tôi</Link>
      </div>
      {signedIn ? (
        <button className="text-button customer-logout" type="button" onClick={signOut}>
          Đăng xuất
        </button>
      ) : (
        <Link className="text-button customer-logout" href="/customer/login">
          Đăng nhập
        </Link>
      )}
    </nav>
  );
}
